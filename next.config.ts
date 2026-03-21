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
  turbopack: {
    resolveAlias: {
      // Stub out Node-only logging packages that break Turbopack client bundling
      "pino": { browser: "./node_modules/pino/pino.browser.js" },
      "thread-stream": false,
    },
  },
};

export default nextConfig;
