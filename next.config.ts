import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  transpilePackages: [
    "@privy-io/react-auth",
    "@privy-io/wagmi",
    "@privy-io/js-sdk-core",
    "@privy-io/chains",
  ],
  // Empty turbopack config so dev mode still works
  turbopack: {},
  // Webpack config for production builds (--webpack flag)
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      "@react-native-async-storage/async-storage": false,
    };

    config.module.rules.push({
      test: /\.(md|zip|sh|yml)$/,
      include: /node_modules/,
      type: "javascript/auto",
      use: [],
    });

    return config;
  },
  images: {
    unoptimized: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    "thread-stream",
    "pino",
    "pino-pretty",
  ],
};

export default nextConfig;
