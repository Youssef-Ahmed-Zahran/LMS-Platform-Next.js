"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import arcjet, { fixedWindow, request } from "@/lib/arcjet";
import { redirect } from "next/navigation";

// ── Arcjet: max 5 checkout attempts per 60 s per fingerprint ─────────────
const checkoutArcjet = arcjet.withRule(
  fixedWindow({ mode: "LIVE", window: "60s", max: 5 }),
);

// ── Fetch a single published course by its slug ───────────────────────────
async function getCourseForCheckout(slug: string) {
  return prisma.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, title: true, price: true, slug: true, stripePriceId: true },
  });
}

// ── Main Server Action ─────────────────────────────────────────────────────
export async function enrollInCourseAction(courseId: string, slug: string) {
  // 1. Auth guard — redirects to /login if not authenticated
  const user = await requireUser();

  // 2. Arcjet rate-limit
  const req = await request();
  const decision = await checkoutArcjet.protect(req, {
    fingerprint: user.id,
  });

  if (decision.isDenied()) {
    throw new Error("Too many requests. Please try again later.");
  }

  // 3. Validate the course exists
  const course = await getCourseForCheckout(slug);
  if (!course) {
    throw new Error("Course not found or not published.");
  }

  // 4. Guard: prevent double-enrollment
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId: course.id, status: "ACTIVE" },
  });
  if (existingEnrollment) {
    redirect(`/dashboard/courses/${slug}`);
  }

  // 5. Resolve or create Stripe customer ─────────────────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true, email: true, name: true },
  });

  if (!dbUser) throw new Error("User record not found.");

  let stripeCustomerId = dbUser.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      name: dbUser.name ?? undefined,
      metadata: { userId: user.id },
    });

    stripeCustomerId = customer.id;

    // Persist the new customer id
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
  }

  // 6. Create a PENDING enrollment row (Prisma transaction) ───────────────
  const enrollment = await prisma.$transaction(async (tx) => {
    // Idempotency: if a PENDING row already exists, reuse it
    const existing = await tx.enrollment.findFirst({
      where: { userId: user.id, courseId: course.id, status: "PENDING" },
    });
    if (existing) return existing;

    return tx.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        amount: Math.round(course.price * 100), // store in cents
        status: "PENDING",
      },
    });
  });

  // 7. Create Stripe Checkout Session ────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Use the pre-created Stripe Price attached to the course (set at course creation).
  // Fall back to price_data only if stripePriceId is somehow missing (e.g. legacy rows).
  const lineItem = course.stripePriceId
    ? { price: course.stripePriceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(course.price * 100),
          product_data: {
            name: course.title,
            description: `Enroll in ${course.title}`,
          },
        },
      };

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "payment",
    line_items: [lineItem],
    metadata: {
      courseId: course.id,
      userId: user.id,
      enrollmentId: enrollment.id,
    },
    success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/payment/cancel`,
  });

  if (!session.url) {
    throw new Error("Failed to create Stripe checkout session.");
  }

  redirect(session.url);
}
