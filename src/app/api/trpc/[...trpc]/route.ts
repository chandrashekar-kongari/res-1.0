import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/_app";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
    // Add development logging
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
    // Log successful requests in development
    responseMeta: () => {
      if (process.env.NODE_ENV === "development") {
        return {
          headers: {
            "Cache-Control": "no-cache",
          },
        };
      }
      return {};
    },
  });

export { handler as GET, handler as POST };
