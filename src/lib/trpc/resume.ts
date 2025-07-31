import { z } from "zod";
import { router, protectedProcedure, Context } from "../trpcServer";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";

export const resumeRouter = router({
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }
      return prisma.resume.findUnique({
        where: {
          id: input.id,
          deleted_at: null,
          user: { email: ctx.user!.primaryEmail },
        },
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        content: z.string().optional(),
        name: z.string().optional(),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: { content?: string; name?: string };
      }) => {
        if (!ctx.user?.primaryEmail) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to access this resource",
          });
        }

        return prisma.resume.create({
          data: {
            content: input.content,
            name: input.name,
            user: {
              connect: {
                email: ctx.user!.primaryEmail,
              },
            },
          },
        });
      }
    ),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        link: z.string().url().optional(),
        content: z.string().optional(),
        name: z.string().optional(),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: { id: string; link?: string; content?: string; name?: string };
      }) => {
        if (!ctx.user?.primaryEmail) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to access this resource",
          });
        }
        return prisma.resume.update({
          where: { id: input.id },
          data: {
            link: input.link,
            content: input.content,
            name: input.name,
          },
        });
      }
    ),
  list: protectedProcedure
    .input(
      z.object({
        where: z.object({
          pinned: z.boolean().optional(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }
      return prisma.resume.findMany({
        where: {
          user: {
            email: ctx.user!.primaryEmail,
          },
          deleted_at: null,
          ...input.where,
        },
        orderBy: {
          created_at: "desc",
        },
      });
    }),

  getAllResumeNames: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.primaryEmail) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }
    return prisma.resume.findMany({
      where: {
        user: {
          email: ctx.user!.primaryEmail,
        },
        deleted_at: null,
      },
      select: {
        name: true,
        id: true,
        pinned: true,
      },
      orderBy: [
        {
          pinned: "desc", // Pinned items first
        },
        {
          updated_at: "desc",
        },
      ],
    });
  }),
  togglePin: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.primaryEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }

      // Get current pinned status
      const resume = await prisma.resume.findUnique({
        where: {
          id: input.id,
          user: { email: ctx.user!.primaryEmail },
          deleted_at: null,
        },
        select: { pinned: true },
      });

      if (!resume) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      // Toggle the pinned status
      return prisma.resume.update({
        where: { id: input.id },
        data: { pinned: !resume.pinned },
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

      // Check if resume exists and belongs to user
      const resume = await prisma.resume.findUnique({
        where: {
          id: input.id,
          user: { email: ctx.user!.primaryEmail },
        },
      });

      if (!resume) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      // Delete the resume
      return prisma.resume.update({
        where: { id: input.id },
        data: {
          deleted_at: new Date(),
        },
      });
    }),
  getDefaultOrCreate: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.primaryEmail) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }
    const resumes = await prisma.resume.findMany({
      where: {
        user: {
          email: ctx.user!.primaryEmail,
        },
        deleted_at: null,
      },
      orderBy: {
        updated_at: "desc",
      },
    });
    if (resumes.length === 0) {
      return prisma.resume.create({
        data: {
          name: "Default",
          user: {
            connect: {
              email: ctx.user!.primaryEmail,
            },
          },
        },
      });
    }
    // Return the first (most recent) resume if any exist
    return resumes[0];
  }),
});
