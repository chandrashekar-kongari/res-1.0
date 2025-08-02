import { prisma } from "@/lib/db";
import { findUserByCustomerId, updateUserSubscriptionStatus } from "./utils";

// Type definitions for Polar webhook data
interface PolarSubscription {
  id: string;
  customer_id?: string;
  customer?: {
    id: string;
    email: string;
  };
  status: string;
  product?: {
    id: string;
    name: string;
  };
  price?: {
    amount: number;
    currency: string;
  };
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

interface PolarOrder {
  id: string;
  customer_id?: string;
  customer?: {
    id: string;
    email: string;
  };
  subscription_id?: string;
  status: string;
  amount: number;
  currency: string;
  billing_reason?: string;
  created_at: string;
  updated_at: string;
}

interface PolarCustomer {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

interface PolarCheckout {
  id: string;
  status: string;
  customer_id?: string;
  created_at: string;
  updated_at: string;
}

// Helper function to extract customer ID from webhook data
function extractCustomerId(data: {
  customer_id?: string;
  customer?: { id: string };
}): string | null {
  return data.customer_id || data.customer?.id || null;
}

// Subscription Event Handlers

export async function handleSubscriptionCreated(
  subscription: PolarSubscription,
  webhookEventId: string
) {
  console.log(
    `Processing subscription.created for subscription ${subscription.id}`
  );

  const customerId = extractCustomerId(subscription);
  if (!customerId) {
    console.error("No customer_id found in subscription data");
    console.error("Subscription data:", JSON.stringify(subscription, null, 2));
    return;
  }

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.error(`User not found for customer_id: ${customerId}`);
    const availableUsers = await prisma.user.findMany({
      where: { customer_id: { not: null } },
      select: { id: true, email: true, customer_id: true },
    });
    console.error("Available users with customer_id:", availableUsers);
    return;
  }

  // Create or update subscription record
  await prisma.subscription.upsert({
    where: { polar_subscription_id: subscription.id },
    update: {
      status: subscription.status,
      product_id: subscription.product?.id,
      product_name: subscription.product?.name,
      price_amount: subscription.price?.amount,
      price_currency: subscription.price?.currency,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start)
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at)
        : null,
    },
    create: {
      polar_subscription_id: subscription.id,
      polar_customer_id: user.customer_id!,
      user_id: user.id,
      status: subscription.status,
      product_id: subscription.product?.id,
      product_name: subscription.product?.name,
      price_amount: subscription.price?.amount,
      price_currency: subscription.price?.currency,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start)
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at)
        : null,
    },
  });

  // Update user subscription status
  await updateUserSubscriptionStatus(
    user.id,
    subscription.status,
    subscription.id
  );

  // Link webhook event to user
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { user_id: user.id },
  });
}

export async function handleSubscriptionUpdated(
  subscription: PolarSubscription,
  webhookEventId: string
) {
  console.log(
    `Processing subscription.updated for subscription ${subscription.id}`
  );

  const customerId = extractCustomerId(subscription);
  if (!customerId) {
    console.error("No customer_id found in subscription data");
    console.error("Subscription data:", JSON.stringify(subscription, null, 2));
    return;
  }

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.error(`User not found for customer_id: ${customerId}`);
    return;
  }

  // Update subscription record
  await prisma.subscription.upsert({
    where: { polar_subscription_id: subscription.id },
    update: {
      status: subscription.status,
      product_id: subscription.product?.id,
      product_name: subscription.product?.name,
      price_amount: subscription.price?.amount,
      price_currency: subscription.price?.currency,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start)
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at)
        : null,
    },
    create: {
      polar_subscription_id: subscription.id,
      polar_customer_id: user.customer_id!,
      user_id: user.id,
      status: subscription.status,
      product_id: subscription.product?.id,
      product_name: subscription.product?.name,
      price_amount: subscription.price?.amount,
      price_currency: subscription.price?.currency,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start)
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at)
        : null,
    },
  });

  // Update user subscription status
  await updateUserSubscriptionStatus(
    user.id,
    subscription.status,
    subscription.id
  );

  // Link webhook event to user
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { user_id: user.id },
  });
}

export async function handleSubscriptionActive(
  subscription: PolarSubscription,
  webhookEventId: string
) {
  console.log(
    `Processing subscription.active for subscription ${subscription.id}`
  );

  const customerId = extractCustomerId(subscription);
  if (!customerId) {
    console.error("No customer_id found in subscription data");
    console.error("Subscription data:", JSON.stringify(subscription, null, 2));
    return;
  }

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.error(`User not found for customer_id: ${customerId}`);
    return;
  }

  // Update subscription status
  await prisma.subscription.upsert({
    where: { polar_subscription_id: subscription.id },
    update: { status: "active" },
    create: {
      polar_subscription_id: subscription.id,
      polar_customer_id: user.customer_id!,
      user_id: user.id,
      status: "active",
      product_id: subscription.product?.id,
      product_name: subscription.product?.name,
      price_amount: subscription.price?.amount,
      price_currency: subscription.price?.currency,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start)
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at)
        : null,
    },
  });

  // Update user subscription status
  await updateUserSubscriptionStatus(user.id, "active", subscription.id);

  // Link webhook event to user
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { user_id: user.id },
  });
}

export async function handleSubscriptionCanceled(
  subscription: PolarSubscription,
  webhookEventId: string
) {
  console.log(
    `Processing subscription.canceled for subscription ${subscription.id}`
  );

  const customerId = extractCustomerId(subscription);
  if (!customerId) {
    console.error("No customer_id found in subscription data");
    return;
  }

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.error(`User not found for customer_id: ${customerId}`);
    return;
  }

  // Update subscription status
  await prisma.subscription.upsert({
    where: { polar_subscription_id: subscription.id },
    update: {
      status: "canceled",
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at)
        : new Date(),
    },
    create: {
      polar_subscription_id: subscription.id,
      polar_customer_id: user.customer_id!,
      user_id: user.id,
      status: "canceled",
      product_id: subscription.product?.id,
      product_name: subscription.product?.name,
      price_amount: subscription.price?.amount,
      price_currency: subscription.price?.currency,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start)
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at)
        : new Date(),
    },
  });

  // Update user subscription status
  await updateUserSubscriptionStatus(user.id, "canceled", subscription.id);

  // Link webhook event to user
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { user_id: user.id },
  });
}

export async function handleSubscriptionUncanceled(
  subscription: PolarSubscription,
  webhookEventId: string
) {
  console.log(
    `Processing subscription.uncanceled for subscription ${subscription.id}`
  );

  const customerId = extractCustomerId(subscription);
  if (!customerId) {
    console.error("No customer_id found in subscription data");
    return;
  }

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.error(`User not found for customer_id: ${customerId}`);
    return;
  }

  // Update subscription status
  await prisma.subscription.upsert({
    where: { polar_subscription_id: subscription.id },
    update: {
      status: "active",
      canceled_at: null,
      cancel_at_period_end: false,
    },
    create: {
      polar_subscription_id: subscription.id,
      polar_customer_id: user.customer_id!,
      user_id: user.id,
      status: "active",
      product_id: subscription.product?.id,
      product_name: subscription.product?.name,
      price_amount: subscription.price?.amount,
      price_currency: subscription.price?.currency,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start)
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null,
      cancel_at_period_end: false,
      canceled_at: null,
    },
  });

  // Update user subscription status
  await updateUserSubscriptionStatus(user.id, "active", subscription.id);

  // Link webhook event to user
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { user_id: user.id },
  });
}

export async function handleSubscriptionRevoked(
  subscription: PolarSubscription,
  webhookEventId: string
) {
  console.log(
    `Processing subscription.revoked for subscription ${subscription.id}`
  );

  const customerId = extractCustomerId(subscription);
  if (!customerId) {
    console.error("No customer_id found in subscription data");
    return;
  }

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.error(`User not found for customer_id: ${customerId}`);
    return;
  }

  // Update subscription status
  await prisma.subscription.upsert({
    where: { polar_subscription_id: subscription.id },
    update: { status: "revoked" },
    create: {
      polar_subscription_id: subscription.id,
      polar_customer_id: user.customer_id!,
      user_id: user.id,
      status: "revoked",
      product_id: subscription.product?.id,
      product_name: subscription.product?.name,
      price_amount: subscription.price?.amount,
      price_currency: subscription.price?.currency,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start)
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at)
        : null,
    },
  });

  // Update user subscription status
  await updateUserSubscriptionStatus(user.id, "revoked", subscription.id);

  // Link webhook event to user
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { user_id: user.id },
  });
}

// Order Event Handlers

export async function handleOrderCreated(
  order: PolarOrder,
  webhookEventId: string
) {
  console.log(`Processing order.created for order ${order.id}`);

  const customerId = extractCustomerId(order);
  if (!customerId) {
    console.error("No customer_id found in order data");
    console.error("Order data:", JSON.stringify(order, null, 2));
    return;
  }

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.error(`User not found for customer_id: ${customerId}`);
    return;
  }

  // Find associated subscription if exists
  let subscription = null;
  if (order.subscription_id) {
    subscription = await prisma.subscription.findFirst({
      where: { polar_subscription_id: order.subscription_id },
    });
  }

  // Create or update order record
  await prisma.order.upsert({
    where: { polar_order_id: order.id },
    update: {
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      billing_reason: order.billing_reason,
    },
    create: {
      polar_order_id: order.id,
      polar_customer_id: user.customer_id!,
      subscription_id: subscription?.id,
      user_id: user.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      billing_reason: order.billing_reason,
    },
  });

  // Link webhook event to user
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { user_id: user.id },
  });

  // Handle subscription renewal
  if (order.billing_reason === "subscription_cycle") {
    console.log(`Subscription renewal detected for user ${user.id}`);
    // You can add additional renewal logic here
  }
}

export async function handleOrderPaid(
  order: PolarOrder,
  webhookEventId: string
) {
  console.log(`Processing order.paid for order ${order.id}`);

  const customerId = extractCustomerId(order);
  if (!customerId) {
    console.error("No customer_id found in order data");
    return;
  }

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.error(`User not found for customer_id: ${customerId}`);
    return;
  }

  // Update order status
  await prisma.order.updateMany({
    where: { polar_order_id: order.id },
    data: { status: "paid" },
  });

  // Link webhook event to user
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { user_id: user.id },
  });
}

export async function handleOrderRefunded(
  order: PolarOrder,
  webhookEventId: string
) {
  console.log(`Processing order.refunded for order ${order.id}`);

  const customerId = extractCustomerId(order);
  if (!customerId) {
    console.error("No customer_id found in order data");
    return;
  }

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.error(`User not found for customer_id: ${customerId}`);
    return;
  }

  // Update order status
  await prisma.order.updateMany({
    where: { polar_order_id: order.id },
    data: { status: "refunded" },
  });

  // Link webhook event to user
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { user_id: user.id },
  });
}

export async function handleOrderUpdated(
  order: PolarOrder,
  webhookEventId: string
) {
  console.log(`Processing order.updated for order ${order.id}`);

  const customerId = extractCustomerId(order);
  if (!customerId) {
    console.error("No customer_id found in order data");
    return;
  }

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.error(`User not found for customer_id: ${customerId}`);
    return;
  }

  // Update order details if it exists
  const existingOrder = await prisma.order.findFirst({
    where: { polar_order_id: order.id },
  });

  if (existingOrder) {
    await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        billing_reason: order.billing_reason,
      },
    });
  } else {
    // If order doesn't exist, create it
    await handleOrderCreated(order, webhookEventId);
    return;
  }

  // Link webhook event to user
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { user_id: user.id },
  });
}

// Customer Event Handlers

export async function handleCustomerCreated(
  customer: PolarCustomer,
  webhookEventId: string
) {
  console.log(`Processing customer.created for customer ${customer.id}`);
  console.log(`Customer email: ${customer.email}`);

  // Try to find existing user by email and update customer_id
  if (customer.email) {
    const user = await prisma.user.findUnique({
      where: { email: customer.email },
    });

    if (user) {
      console.log(
        `Found user ${user.id} for email ${customer.email}, linking customer ${customer.id}`
      );

      await prisma.user.update({
        where: { id: user.id },
        data: { customer_id: customer.id },
      });

      console.log(
        `Successfully linked customer ${customer.id} to user ${user.id}`
      );

      // Link webhook event to user
      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: { user_id: user.id },
      });
    } else {
      console.log(`No user found with email ${customer.email}`);
    }
  } else {
    console.log("No email found in customer data");
  }
}

export async function handleCustomerUpdated(
  customer: PolarCustomer,
  webhookEventId: string
) {
  console.log(`Processing customer.updated for customer ${customer.id}`);

  const user = await findUserByCustomerId(customer.id);
  if (!user) {
    console.error(`User not found for customer_id: ${customer.id}`);
    return;
  }

  // Update user information if needed
  if (customer.name && customer.name !== user.name) {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: customer.name },
    });
  }

  // Link webhook event to user
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { user_id: user.id },
  });
}

export async function handleCustomerStateChanged(
  customer: PolarCustomer,
  webhookEventId: string
) {
  console.log(`Processing customer.state_changed for customer ${customer.id}`);

  const user = await findUserByCustomerId(customer.id);
  if (!user) {
    console.error(`User not found for customer_id: ${customer.id}`);
    return;
  }

  // Update user information if needed
  if (customer.name && customer.name !== user.name) {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: customer.name },
    });
  }

  // Link webhook event to user
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { user_id: user.id },
  });

  // Additional customer state change logic can be added here
  console.log(`Customer ${customer.id} state changed for user ${user.id}`);
}

// Checkout Event Handlers

export async function handleCheckoutUpdated(
  checkout: PolarCheckout,
  webhookEventId: string
) {
  console.log(`Processing checkout.updated for checkout ${checkout.id}`);

  // If checkout has a customer, link the webhook event
  if (checkout.customer_id) {
    const user = await findUserByCustomerId(checkout.customer_id);
    if (user) {
      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: { user_id: user.id },
      });
    }
  }

  // Additional checkout processing logic can be added here
  console.log(
    `Checkout ${checkout.id} updated with status: ${checkout.status}`
  );
}
