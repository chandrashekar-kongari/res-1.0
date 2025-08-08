import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Optional: Verify webhook signature for security
    // const signature = req.headers.get('stack-signature');
    // if (!verifySignature(signature, body)) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    const event = await req.json();

    if (event.type === "user.created") {
      const user = event.data;

      try {
        const createdUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.primary_email, // <-- use primary_email
            name: user.display_name, // <-- use display_name
            request_limit: 20,
            no_limit: false,
          },
        });
      } catch (userError) {
        // If user already exists, that's okay
        if (
          userError instanceof Error &&
          userError.message.includes("Unique constraint")
        ) {
        } else {
          throw userError;
        }
      }
    } else if (event.type === "user.updated") {
      const user = event.data;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.primary_email,
          name: user.display_name,
        },
      });
    } else if (event.type === "user.deleted") {
      const user = event.data;
      await prisma.user.delete({
        where: { id: user.id },
      });
    }

    return new Response("ok");
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
