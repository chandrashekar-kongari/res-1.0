import { z } from "zod";
import { router, protectedProcedure, Context } from "../trpcServer";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";
import { message } from "@prisma/client";

const messageEventSchema = z.object({
  callId: z.string(),
  name: z.string(),
  status: z.boolean(),
  type: z.string().optional(),
  data: z.any().optional(),
  output: z
    .object({
      diffEditorHTML: z.any().optional(),
      newEditorHTML: z.any().optional(),
      oldEditorHTML: z.any().optional(),
      diffFromAssistant: z.any().optional(),
      diffEditorHTMLId: z.string().optional(),
    })
    .optional(),
  accepted: z.boolean().optional(),
  rejected: z.boolean().optional(),
  notFound: z.boolean().optional(),
});

export const messageRouter = router({
  upsert: protectedProcedure
    .input(z.object({ message: z.custom<message>(), threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }
      const {
        id,
        user_id,
        threadId: msgThreadId,
        ...messageData
      } = input.message;
      return prisma.message.upsert({
        where: { id: input.message.id },
        update: {
          ...messageData,
          events: input.message.events || undefined,
          user_id: ctx.user!.id,
          threadId: input.threadId,
        },
        create: {
          ...messageData,
          id: input.message.id,
          events: input.message.events || undefined,
          user_id: ctx.user!.id,
          threadId: input.threadId,
        },
      });
    }),
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }
      return prisma.message.findUnique({
        where: {
          id: input.id,
          user: { email: ctx.user!.primaryEmail },
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        newEditorHTML: z.string().optional(),
        diffEditorHTML: z.string().optional(),
        events: z.array(messageEventSchema).optional(),
        attachPartOfHTML: z.array(z.string()).optional(),
        isStreaming: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }

      return prisma.message.create({
        data: {
          id: `${input.role}-${Date.now()}`,
          role: input.role,
          content: input.content,
          newEditorHTML: input.newEditorHTML,
          diffEditorHTML: input.diffEditorHTML,
          events: input.events,
          attachPartOfHTML: input.attachPartOfHTML || [],
          isStreaming: input.isStreaming || false,
          thread: {
            connect: {
              id: input.threadId,
            },
          },
          user: {
            connect: {
              email: ctx.user!.primaryEmail,
            },
          },
        },
      });
    }),

  listByThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }
      return prisma.message.findMany({
        where: {
          threadId: input.threadId,
          user: { email: ctx.user!.primaryEmail },
          deleted_at: null,
        },
        select: {
          role: true,
          content: true,
          newEditorHTML: true,
          diffEditorHTML: true,
          events: true,
          attachPartOfHTML: true,
          isStreaming: true,
        },
        orderBy: {
          created_at: "asc",
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().optional(),
        newEditorHTML: z.string().optional(),
        diffEditorHTML: z.string().optional(),
        events: z.array(messageEventSchema).optional(),
        attachPartOfHTML: z.array(z.string()).optional(),
        isStreaming: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }

      return prisma.message.update({
        where: { id: input.id },
        data: {
          content: input.content,
          newEditorHTML: input.newEditorHTML,
          diffEditorHTML: input.diffEditorHTML,
          events: input.events,
          attachPartOfHTML: input.attachPartOfHTML,
          isStreaming: input.isStreaming,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }

      const message = await prisma.message.findUnique({
        where: {
          id: input.id,
          user: { email: ctx.user!.primaryEmail },
        },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      return prisma.message.update({
        where: { id: input.id },
        data: {
          deleted_at: new Date(),
        },
      });
    }),
});
