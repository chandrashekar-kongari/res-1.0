import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@opentelemetry/api",
    "@ai-sdk/anthropic",
    "ai",
    "puppeteer",
  ],
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
