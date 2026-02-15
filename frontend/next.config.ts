import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,

  // Environment-aware output mode
  output: isGitHubPages ? "export" : "standalone",

  // GitHub Pages specific config
  ...(isGitHubPages && {
    trailingSlash: true,
    basePath: "/Pulse",
    assetPrefix: "/Pulse",
  }),

  images: {
    unoptimized: isGitHubPages,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "Pulse",
  },

  turbopack: {
    root: __dirname,
    resolveAlias: {
      "@": "./src",
    },
  },
};

export default nextConfig;
