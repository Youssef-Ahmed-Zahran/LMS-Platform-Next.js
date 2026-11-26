"use server";

import { tryCatch } from "@/hooks/try-catch";
import { requireAdminAction } from "@/app/data/admin/require-admin";
import arcjet, { request, slidingWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { CourseSchema, CourseSchemaInput } from "@/schemas/zodSchemas";
import { ApiResponse } from "@/types";
import { revalidatePath, updateTag } from "next/cache";

// Configure Arcjet protection rules for course creation:
// 1. Base shield (DDoS / attacks) from lib/arcjet.ts
// 2. Sliding window rate limit: max 5 course creations per minute per admin
const createCourseArcjet = arcjet.withRule(
  slidingWindow({
    mode: "LIVE",
    interval: "1m",
    max: 5,
  })
);

export async function CreateCourse(
  data: CourseSchemaInput
): Promise<ApiResponse<{ id: string; slug: string }>> {
  // 1. Admin-only guard (authentication + role check)
  const adminCheck = await requireAdminAction();
  if (!adminCheck.authorized) {
    return adminCheck.error;
  }

  const { session } = adminCheck;

  // 2. Arcjet Security Protection
  const req = await request();
  const decision = await createCourseArcjet.protect(req, {
    fingerprint: session.user.id,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Too many course creation attempts. Please slow down and try again later.",
      };
    }
    if (decision.reason.isBot()) {
      return {
        status: "error",
        message: "Automated bot traffic is not allowed.",
      };
    }
    return {
      status: "error",
      message: "Request denied by security shield.",
    };
  }

  // 3. Validate input with Zod
  const validation = CourseSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.issues[0]?.message || "Invalid course data provided.",
      error: validation.error.format(),
    };
  }

  // 4. Verify slug uniqueness
  const { data: existingCourse, error: slugCheckError } = await tryCatch(
    prisma.course.findUnique({
      where: { slug: validation.data.slug },
      select: { id: true },
    })
  );

  if (slugCheckError) {
    return {
      status: "error",
      message: "Database error while verifying course slug.",
      error: slugCheckError,
    };
  }

  if (existingCourse) {
    return {
      status: "error",
      message: "A course with this slug already exists. Please choose a different slug.",
    };
  }

  // 5. Create a Stripe Product + Price so we have a stable stripePriceId
  const { data: stripeProduct, error: stripeProductError } = await tryCatch(
    stripe.products.create({
      name: validation.data.title,
      description: validation.data.smallDescription,
      metadata: { slug: validation.data.slug },
    })
  );

  if (stripeProductError || !stripeProduct) {
    return {
      status: "error",
      message: "Failed to create Stripe product. Please try again.",
      error: stripeProductError,
    };
  }

  const { data: stripePrice, error: stripePriceError } = await tryCatch(
    stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(validation.data.price * 100), // in cents
      currency: "usd",
    })
  );

  if (stripePriceError || !stripePrice) {
    // Clean up the orphaned product before bailing
    await stripe.products.update(stripeProduct.id, { active: false });
    return {
      status: "error",
      message: "Failed to create Stripe price. Please try again.",
      error: stripePriceError,
    };
  }

  // 6. Create the course in the database with the Stripe Price ID
  const { data: course, error: createError } = await tryCatch(
    prisma.course.create({
      data: {
        title: validation.data.title,
        description: validation.data.description,
        fileKey: validation.data.fileKey,
        price: validation.data.price,
        duration: validation.data.duration,
        level: validation.data.level,
        category: validation.data.category,
        smallDescription: validation.data.smallDescription,
        slug: validation.data.slug,
        status: validation.data.status,
        userId: session.user.id,
        stripePriceId: stripePrice.id,
      },
      select: {
        id: true,
        slug: true,
      },
    })
  );

  if (createError || !course) {
    // Clean up Stripe objects so they don't become orphans
    await stripe.prices.update(stripePrice.id, { active: false });
    await stripe.products.update(stripeProduct.id, { active: false });
    return {
      status: "error",
      message: "Failed to create course. Please try again.",
      error: createError,
    };
  }

  updateTag(`courses-list:${session.user.id}`);
  updateTag("public-courses-list");
  updateTag(`public-course:${course.slug}`);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");

  return {
    status: "success",
    message: "Course created successfully!",
    data: course,
  };
}
