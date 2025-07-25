import "server-only";

import { appRouter } from "@/lib/trpc/_app";
import { stackServerApp } from "@/stack";
import type { Context } from "@/lib/trpcServer";

/**
 * Server-side tRPC caller that automatically injects the current user context
 * Use this in server components instead of the client-side trpc
 */
export const serverTrpc = async () => {
  // Get the current user from Stack
  const user = await stackServerApp.getUser({ tokenStore: "nextjs-cookie" });

  // Create the context with the user
  const context: Context = { user };

  // Create and return the tRPC caller with the context
  return appRouter.createCaller(context);
};

// Helper type for the server tRPC caller
export type ServerTrpc = Awaited<ReturnType<typeof serverTrpc>>;
