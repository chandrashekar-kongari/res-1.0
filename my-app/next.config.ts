import type { NextConfig } from "next";

const backend = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // Next 16.3 skips next-server.js.nft.json when an adapter is present, and
  // Vercel's onBuildComplete still opens that file. Standalone is unused there.
  output: process.env.VERCEL ? undefined : "standalone",
  transpilePackages: ["@stackframe/stack"],
  async redirects() {
    return [
      {
        source: "/handler/login",
        destination: "/handler/sign-in",
        permanent: false,
      },
      {
        source: "/handler/signup",
        destination: "/handler/sign-up",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backend.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
