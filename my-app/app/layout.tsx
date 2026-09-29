import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { Providers } from "@/components/providers";
import { stackServerApp } from "@/stack";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Resume editor",
  description:
    "Upload a resume PDF, accept line-by-line rewrites, and open roles from the latest jobs snapshot.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense fallback={null}>
          <StackProvider app={stackServerApp}>
            <StackTheme>
              <Providers>{children}</Providers>
            </StackTheme>
          </StackProvider>
        </Suspense>
      </body>
    </html>
  );
}
