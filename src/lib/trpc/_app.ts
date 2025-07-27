import { createTRPCRouter } from "@/lib/trpcServer";
import { resumeRouter } from "@/lib/trpc/resume";
import { userRouter } from "@/lib/trpc/user";
import { threadRouter } from "./thread";
import { messageRouter } from "./message";

export const appRouter = createTRPCRouter({
  resume: resumeRouter,
  user: userRouter,
  thread: threadRouter,
  message: messageRouter,
});

export type AppRouter = typeof appRouter;
