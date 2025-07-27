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
});
