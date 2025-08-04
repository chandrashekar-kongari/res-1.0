import { z } from "zod";
import { router, protectedProcedure, Context } from "../trpcServer";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.primaryEmail) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }
    return prisma.user.findUnique({
      where: {
        email: ctx.user!.primaryEmail,
      },
    });
  }),

  decrementRequestLimit: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user?.primaryEmail) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: ctx.user!.primaryEmail,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Only decrement if no_limit is false
    if (!user.no_limit) {
      await prisma.user.update({
        where: {
          email: ctx.user!.primaryEmail,
        },
        data: {
          request_limit: Math.max(0, user.request_limit - 1),
        },
      });
    }

    return { success: true };
  }),
});
