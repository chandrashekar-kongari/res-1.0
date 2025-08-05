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

    // Ensure user exists in database first
    const existingUser = await prisma.user.findUnique({
      where: { email: ctx.user!.primaryEmail },
    });

    if (!existingUser) {
      // Create user if it doesn't exist (fallback for webhook failures)
      await prisma.user.create({
        data: {
          id: ctx.user!.id,
          email: ctx.user!.primaryEmail,
          name: ctx.user?.displayName || null,
        },
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
          name: "Sample Resume",
          user: {
            connect: {
              email: ctx.user!.primaryEmail,
            },
          },
          content: `<p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><strong><span>experience</span></strong></p><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><span>ABC COMPANY New York </span><em><span>Team lead / Founding Software Engineer &nbsp;&nbsp; Jan 2022 - Present</span></em></p><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><span>Implemented </span><strong><span>cloud infrastructure as code</span></strong><span> on AWS using </span><strong><span>Terraform</span></strong><span>, deploying services including ECS, ELB, and ASG. Designed and implemented a scalable real-time </span><strong><span>chat service</span></strong><span> for the Metajungle platform leveraging </span><strong><span>WebSockets</span></strong><span>, </span><strong><span>Kafka queues</span></strong><span>, </span><strong><span>MongoDB change streams</span></strong><span>, and </span><strong><span>load balancers</span></strong><span> to ensure high availability and low latency communication. Built an advanced </span><strong><span>Retrieval-Augmented Generation (RAG)</span></strong><span> system to dynamically enrich NFT data with contextual information.</span></p><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"></p><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><strong><span>skills</span></strong></p><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><span>Distributed Systems, Node.js, React.js, Next.js, Typescript, Spring Boot, GraphQL, REST APIs, Design Patterns, Multi-Threading GoLang, HTML, JavaScript, Parquet, Tailwind CSS, AWS, CI/CD, Kafka, Docker, Kubernetes, Cloud Computing, Python, MongoDB Cassandra, SQL, SQLite, NoSQL, Redis, ETL, Airflow, Apache Spark, Hadoop, Presto, Hive, LangChain, Scala, RAG, Solidity</span></p><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"></p>`,
        },
      });
    }
    // Return the first (most recent) resume if any exist
    return resumes[0];
  }),
});
