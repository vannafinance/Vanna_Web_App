"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import config from "@/lib/wagmi-config";
import { privyConfig } from "@/lib/privy-config";
import { NexusProvider } from "@/lib/nexus/provider";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <NexusProvider>{children}</NexusProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
