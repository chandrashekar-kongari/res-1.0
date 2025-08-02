import { prisma } from "@/lib/db";

// Helper function to find user by customer ID
export async function findUserByCustomerId(customerId: string) {
  return await prisma.user.findFirst({
    where: { customer_id: customerId },
  });
}

// Helper function to update user subscription status
export async function updateUserSubscriptionStatus(
  userId: string,
  status: string,
  subscriptionId?: string
) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      subscription_status: status,
      ...(subscriptionId && { subscription_id: subscriptionId }),
    },
  });
}
