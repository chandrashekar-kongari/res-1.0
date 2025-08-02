import { CustomerPortal } from "@polar-sh/nextjs";
import { stackServerApp } from "@/stack";
import { prisma } from "@/lib/db";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  getCustomerId: async (req) => {
    const stackUser = await stackServerApp.getUser({
      tokenStore: "nextjs-cookie",
    });
    if (!stackUser?.primaryEmail) {
      return "";
    }

    const user = await prisma.user.findUnique({
      where: {
        email: stackUser.primaryEmail,
      },
    });

    return user?.customer_id ?? "";
  },
  server: "sandbox", // Use sandbox if you're testing Polar - pass 'production' otherwise
});
