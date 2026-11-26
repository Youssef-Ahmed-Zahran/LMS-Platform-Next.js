import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

/**
 * POST /api/webhook/stripe
 *
 * Verifies the Stripe signature, then handles:
 *  - checkout.session.completed  → activates enrollment
 *  - checkout.session.expired    → cancels pending enrollment
 *  - charge.refunded             → cancels active enrollment
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 },
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  // ── Verify the event signature ──────────────────────────────────────────
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  // ── Route event types ───────────────────────────────────────────────────
  try {
    switch (event.type) {
      // ── Successful payment ────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const { courseId, userId, enrollmentId } = session.metadata ?? {};

        if (!courseId || !userId || !enrollmentId) {
          console.error(
            "[Stripe Webhook] Missing metadata on session:",
            session.id,
          );
          break;
        }

        await prisma.enrollment.update({
          where: { id: enrollmentId },
          data: { status: "ACTIVE" },
        });

        console.log(
          `[Stripe Webhook] Enrollment activated: ${enrollmentId} (user=${userId}, course=${courseId})`,
        );
        break;
      }

      // ── Checkout session expired without payment ───────────────────────
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { enrollmentId } = session.metadata ?? {};

        if (enrollmentId) {
          await prisma.enrollment.updateMany({
            where: { id: enrollmentId, status: "PENDING" },
            data: { status: "CANCELLED" },
          });
          console.log(
            `[Stripe Webhook] Enrollment cancelled (expired): ${enrollmentId}`,
          );
        }
        break;
      }

      // ── Refund issued ─────────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        // Retrieve the checkout session linked to this payment intent
        if (!charge.payment_intent) break;

        const sessions = await stripe.checkout.sessions.list({
          payment_intent: charge.payment_intent as string,
          limit: 1,
        });

        const checkoutSession = sessions.data[0];
        const { enrollmentId } = checkoutSession?.metadata ?? {};

        if (enrollmentId) {
          await prisma.enrollment.updateMany({
            where: { id: enrollmentId, status: "ACTIVE" },
            data: { status: "CANCELLED" },
          });
          console.log(
            `[Stripe Webhook] Enrollment cancelled (refund): ${enrollmentId}`,
          );
        }
        break;
      }

      default:
        // Unhandled event types are silently ignored
        break;
    }
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
