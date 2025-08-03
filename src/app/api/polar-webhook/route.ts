import { NextRequest, NextResponse } from "next/server";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { prisma } from "@/lib/db";

// Webhook event handlers
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionActive,
  handleSubscriptionCanceled,
  handleSubscriptionUncanceled,
  handleSubscriptionRevoked,
  handleOrderCreated,
  handleOrderPaid,
  handleOrderRefunded,
  handleCustomerCreated,
  handleCustomerUpdated,
} from "./handlers";

// Import additional handlers
import {
  handleOrderUpdated,
  handleCustomerStateChanged,
  handleCheckoutUpdated,
} from "./handlers";

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature validation
    const body = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    // Validate webhook signature using Polar SDK
    const event = validateEvent(
      body,
      headers,
      process.env.POLAR_WEBHOOK_SECRET!
    );

    // Store webhook event for tracking
    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        event_type: event.type,
        data: event as any,
        processed: false,
      },
    });

    try {
      // Route to appropriate handler based on event type
      switch (event.type) {
        // Subscription events
        case "subscription.created":
          await handleSubscriptionCreated(event.data as any, webhookEvent.id);
          break;

        case "subscription.updated":
          await handleSubscriptionUpdated(event.data as any, webhookEvent.id);
          break;

        case "subscription.active":
          await handleSubscriptionActive(event.data as any, webhookEvent.id);
          break;

        case "subscription.canceled":
          await handleSubscriptionCanceled(event.data as any, webhookEvent.id);
          break;

        case "subscription.uncanceled":
          await handleSubscriptionUncanceled(
            event.data as any,
            webhookEvent.id
          );
          break;

        case "subscription.revoked":
          await handleSubscriptionRevoked(event.data as any, webhookEvent.id);
          break;

        // Order events
        case "order.created":
          await handleOrderCreated(event.data as any, webhookEvent.id);
          break;

        case "order.paid":
          await handleOrderPaid(event.data as any, webhookEvent.id);
          break;

        case "order.refunded":
          await handleOrderRefunded(event.data as any, webhookEvent.id);
          break;

        case "order.updated":
          await handleOrderUpdated(event.data as any, webhookEvent.id);
          break;

        // Customer events - Handle this FIRST to link customers to users
        case "customer.created":
          await handleCustomerCreated(event.data as any, webhookEvent.id);
          break;

        case "customer.updated":
          await handleCustomerUpdated(event.data as any, webhookEvent.id);
          break;

        case "customer.state_changed":
          await handleCustomerStateChanged(event.data as any, webhookEvent.id);
          break;

        // Checkout events
        case "checkout.updated":
          await handleCheckoutUpdated(event.data as any, webhookEvent.id);
          break;

        default:
      }

      // Mark webhook as processed
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { processed: true },
      });

      return NextResponse.json({ success: true }, { status: 202 });
    } catch (processingError) {
      // Update webhook event with error
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          error_message:
            processingError instanceof Error
              ? processingError.message
              : "Unknown error",
          retry_count: { increment: 1 },
        },
      });

      // Return 202 to prevent Polar from retrying immediately
      // We'll handle retries internally if needed
      return NextResponse.json(
        {
          success: false,
          error: "Processing error",
        },
        { status: 202 }
      );
    }
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      console.error("Webhook signature verification failed:", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
