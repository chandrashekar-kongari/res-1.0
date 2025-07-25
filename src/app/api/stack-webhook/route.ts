import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    console.log("Webhook event received:", event);

    if (event.type === "user.created") {
      const user = event.data;
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.primary_email, // <-- use primary_email
          name: user.display_name, // <-- use display_name
        },
      });
    }

    return new Response("ok");
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
