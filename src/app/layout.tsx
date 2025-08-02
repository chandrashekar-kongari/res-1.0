import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/app/ClientProviders";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/stack";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Memic - AI-Powered Resume Builder | Create ATS-Friendly Resumes in Seconds",
  description:
    "Join thousands of professionals who've landed their dream jobs. Create ATS-friendly resumes in seconds with Memic's AI-powered resume builder.",
  keywords: [
    "resume builder",
    "ATS friendly resume",
    "AI resume",
    "job application",
    "professional resume",
    "resume maker",
  ],
  authors: [{ name: "Memic" }],
  creator: "Memic",
  publisher: "Memic",
  metadataBase: new URL("https://www.memic.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.memic.app",
    title: "Memic - AI-Powered Resume Builder",
    description:
      "Create ATS-friendly resumes in seconds. Join thousands of professionals who've landed their dream jobs with Memic.",
    siteName: "Memic",
    images: [
      {
        url: "/memic-logo-4.svg",
        width: 1200,
        height: 630,
        alt: "Memic - AI-Powered Resume Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Memic - AI-Powered Resume Builder",
    description:
      "Create ATS-friendly resumes in seconds. Join thousands of professionals who've landed their dream jobs.",
    images: ["/memic-logo-4.svg"],
    creator: "@memic_app",
  },
  icons: {
    icon: [
      { url: "/memic-logo-4.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/memic-logo-4.svg", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <ClientProviders>{children}</ClientProviders>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
