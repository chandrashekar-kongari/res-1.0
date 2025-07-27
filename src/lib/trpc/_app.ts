import { router } from "../trpcServer";
import { resumeRouter } from "./resume";
import { threadRouter } from "./thread";
import { messageRouter } from "./message";
import { userRouter } from "./user";

export const appRouter = router({
  resume: resumeRouter,
  thread: threadRouter,
  message: messageRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
