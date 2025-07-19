import { createTRPCRouter } from "@/lib/trpcServer";
import { resumeRouter } from "@/lib/trpc/resume";

export const appRouter = createTRPCRouter({
  resume: resumeRouter,
});

export type AppRouter = typeof appRouter;
