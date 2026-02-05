import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "export",
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/StyrCan' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/StyrCan/' : '',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
