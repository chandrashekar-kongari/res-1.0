import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "./trpc/_app";

export const trpc = createTRPCReact<AppRouter>();
