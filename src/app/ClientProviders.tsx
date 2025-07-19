"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import { httpBatchLink, loggerLink } from "@trpc/client";
import React from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Enable logging in development
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    // Add logger link for development
    ...(process.env.NODE_ENV === "development"
      ? [
          loggerLink({
            enabled: (opts) =>
              process.env.NODE_ENV === "development" ||
              (opts.direction === "down" && opts.result instanceof Error),
          }),
        ]
      : []),
    httpBatchLink({
      url: "/api/trpc",
    }),
  ],
});

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
