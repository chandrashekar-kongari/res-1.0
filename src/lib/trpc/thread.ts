import { z } from "zod";
import { router, protectedProcedure, Context } from "../trpcServer";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";

export const threadRouter = router({
  getLatest: protectedProcedure.query(async ({ ctx, input }) => {
    if (!ctx.user?.primaryEmail) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }
    const thread = await prisma.thread.findFirst({
      where: {
        user: { email: ctx.user!.primaryEmail },
        deleted_at: null,
      },
      orderBy: {
        last_accessed_at: "desc",
      },
    });
    if (!thread) {
      return prisma.thread.create({
        data: {
          user: {
            connect: {
              email: ctx.user!.primaryEmail,
            },
          },
          title: "New Chat Thread",
          last_accessed_at: new Date(),
        },
      });
    }
    return thread;
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }
      return prisma.thread.findUnique({
        where: {
          id: input.id,
          deleted_at: null,
          user: { email: ctx.user!.primaryEmail },
        },
        include: {
          messages: true,
        },
      });
    }),

  create: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user?.primaryEmail) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    return prisma.thread.create({
      data: {
        user: {
          connect: {
            email: ctx.user!.primaryEmail,
          },
        },
        title: "New Chat Thread",
        last_accessed_at: new Date(),
      },
    });
  }),

  list: protectedProcedure
    .input(
      z.object({
        resumeId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }
      return prisma.thread.findMany({
        where: {
          user: {
            email: ctx.user!.primaryEmail,
          },
          deleted_at: null,
        },
        include: {
          messages: {
            orderBy: {
              created_at: "asc",
            },
          },
        },
        orderBy: {
          last_accessed_at: "desc",
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }

      const thread = await prisma.thread.findUnique({
        where: {
          id: input.id,
          user: { email: ctx.user!.primaryEmail },
        },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }

      return prisma.thread.update({
        where: { id: input.id },
        data: {
          deleted_at: new Date(),
        },
      });
    }),

  updateLastAccessed: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }

      return prisma.thread.update({
        where: { id: input.id },
        data: {
          last_accessed_at: new Date(),
        },
      });
    }),
});
