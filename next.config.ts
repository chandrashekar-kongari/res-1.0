import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@opentelemetry/api",
      "@ai-sdk/anthropic",
      "ai",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        "@opentelemetry/api": "commonjs @opentelemetry/api",
      });
    }
    return config;
  },
};

export default nextConfig;
