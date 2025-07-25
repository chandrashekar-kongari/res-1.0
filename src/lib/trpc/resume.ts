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
        where: { id: input.id, user: { email: ctx.user!.primaryEmail } },
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        link: z.string().url().optional(),
        content: z.string().optional(),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: { link?: string; content?: string; name?: string };
      }) => {
        if (!ctx.user?.primaryEmail) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to access this resource",
          });
        }
        return prisma.resume.create({
          data: {
            link: input.link,
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
  list: protectedProcedure.query(async ({ ctx }) => {
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
      },
      orderBy: {
        created_at: "desc",
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
      },
      orderBy: {
        created_at: "desc",
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
