import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lms-platform-joo-j.t3.storage.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.t3.storage.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lms-platform-joo-j.t3.tigrisfiles.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.t3.tigrisfiles.io",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
