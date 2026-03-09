"use client";

import { NexusSDK, type EthereumProvider } from "@avail-project/nexus-core";

// Singleton SDK instance
let sdkInstance: NexusSDK | null = null;

export function getNexusSDK(): NexusSDK {
  if (!sdkInstance) {
    sdkInstance = new NexusSDK({ network: "mainnet", debug: false });
  }
  return sdkInstance;
}

export async function initializeNexusSDK(
  provider: EthereumProvider
): Promise<NexusSDK> {
  const sdk = getNexusSDK();
  if (sdk.isInitialized()) return sdk;

  if (!provider || typeof provider.request !== "function") {
    throw new Error("Invalid EIP-1193 provider");
  }

  await sdk.initialize(provider);
  return sdk;
}

export async function deinitializeNexusSDK(): Promise<void> {
  const sdk = getNexusSDK();
  if (sdk.isInitialized()) {
    await sdk.deinit();
  }
}

export type { EthereumProvider };
