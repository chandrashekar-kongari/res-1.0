import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpcServer";
import { prisma } from "../db";

export const resumeRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        link: z.string().url().optional(),
        content: z.string().optional(),
      })
    )
    .mutation(
      async ({ input }: { input: { link?: string; content?: string } }) => {
        return prisma.resume.create({
          data: {
            link: input.link,
            content: input.content,
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
        input,
      }: {
        input: { id: string; link?: string; content?: string };
      }) => {
        return prisma.resume.update({
          where: { id: input.id },
          data: {
            link: input.link,
            content: input.content,
          },
        });
      }
    ),
  list: publicProcedure.query(async () => {
    return prisma.resume.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
});
