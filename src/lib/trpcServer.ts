import { initTRPC } from "@trpc/server";

const t = initTRPC.create({
  // Add development logging
  isDev: process.env.NODE_ENV === "development",
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Log errors in development
        ...(process.env.NODE_ENV === "development" && {
          stack: error.stack,
        }),
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createTRPCRouter = t.router;
