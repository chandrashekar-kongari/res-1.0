import { z } from "zod";
import { router, publicProcedure } from "../trpcServer";
import { prisma } from "../db";

export const resumeRouter = router({
  create: publicProcedure
    .input(
      z.object({
        link: z.string().url().optional(),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.resume.create({
        data: {
          link: input.link,
          content: input.content,
        },
      });
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        link: z.string().url().optional(),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.resume.update({
        where: { id: input.id },
        data: {
          link: input.link,
          content: input.content,
        },
      });
    }),
  list: publicProcedure.query(async () => {
    return prisma.resume.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
});
