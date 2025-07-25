import { initTRPC, TRPCError } from "@trpc/server";
import type { ServerUser } from "@stackframe/stack";

// Define the context type
export type Context = {
  user: ServerUser | null;
};

const t = initTRPC.context<Context>().create({
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

// Create an authenticated procedure that requires a user
export const protectedProcedure = t.procedure.use(
  async ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }
    // Refine the context type so that user is non-null after this middleware
    return next({
      ctx: {
        ...ctx,
        user: ctx.user as NonNullable<typeof ctx.user>,
      },
    });
  }
);
