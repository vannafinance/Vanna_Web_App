import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  serverExternalPackages: [
    "pino",
    "pino-pretty",
    "thread-stream",
  ],
};

export default nextConfig;
