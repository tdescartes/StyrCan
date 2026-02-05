import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "export",
  trailingSlash: true,
  basePath: isProd ? "/StyrCan" : "",
  assetPrefix: isProd ? "/StyrCan" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
