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
};

export default nextConfig;
