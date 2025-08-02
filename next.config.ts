import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@opentelemetry/api",
      "@ai-sdk/anthropic",
      "ai",
      "puppeteer",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        "@opentelemetry/api": "commonjs @opentelemetry/api",
        puppeteer: "commonjs puppeteer",
      });
    }
    return config;
  },
};

export default nextConfig;
