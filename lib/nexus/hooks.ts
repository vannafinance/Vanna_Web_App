"use client";

import { useState, useCallback, useRef } from "react";
import { NEXUS_EVENTS } from "@avail-project/nexus-core";
import { useNexus } from "./provider";
import { getReadableNexusError, isUserCancellation } from "./errors";
import { SUPPORTED_CHAIN_IDS } from "@/lib/chains/chains";

// ─── Types ─────────────────────────────────────────────

export interface NexusStep {
  name: string;
  isDone: boolean;
  explorerUrl?: string;
}

export type NexusFlowStatus =
  | "idle"
  | "simulating"
  | "confirming"
  | "executing"
  | "success"
  | "error";

export interface NexusFlowState {
  status: NexusFlowStatus;
  steps: NexusStep[];
  error: string | null;
  explorerUrl: string | null;
  txHash: string | null;
  startTime: number | null;
  isCancelled: boolean;
}

const INITIAL_STATE: NexusFlowState = {
  status: "idle",
  steps: [],
  error: null,
  explorerUrl: null,
  txHash: null,
  startTime: null,
  isCancelled: false,
};

// ─── Event handler builder ─────────────────────────────

function buildEventHandler(
  setSteps: React.Dispatch<React.SetStateAction<NexusStep[]>>
) {
  return (event: { name: string; args: any }) => {
    if (event.name === NEXUS_EVENTS.STEPS_LIST) {
      const stepsList = (event.args as any[]).map((s: any) => ({
        name: s.name || s.type || String(s),
        isDone: false,
      }));
      setSteps(stepsList);
    }
    if (
      event.name === NEXUS_EVENTS.STEP_COMPLETE ||
      event.name === NEXUS_EVENTS.SWAP_STEP_COMPLETE
    ) {
      const stepData = event.args as any;
      const stepName = stepData?.name || stepData?.type || String(stepData);
      setSteps((prev) =>
        prev.map((s) =>
          s.name === stepName
            ? { ...s, isDone: true, explorerUrl: stepData?.explorerUrl }
            : s
        )
      );
    }
  };
}

// ─── useBridgeAndExecute ───────────────────────────────
// For smart deposits: bridge from any supported chain → execute on destination

export function useBridgeAndExecute() {
  const { sdk, intentRef, allowanceRef } = useNexus();
  const [state, setState] = useState<NexusFlowState>(INITIAL_STATE);
  const [steps, setSteps] = useState<NexusStep[]>([]);
  const abortRef = useRef(false);

  const execute = useCallback(
    async (params: {
      token: string;
      amount: bigint;
      toChainId: number;
      executeTo: `0x${string}`;
      executeData?: `0x${string}`;
      executeValue?: bigint;
    }) => {
      if (!sdk) {
        setState({ ...INITIAL_STATE, status: "error", error: "SDK not initialized" });
        return null;
      }

      abortRef.current = false;
      setSteps([]);
      setState({
        ...INITIAL_STATE,
        status: "simulating",
        startTime: Date.now(),
      });

      // Declare outside try so catch can access it
      let autoApproveInterval: NodeJS.Timeout | number | undefined;

      try {
        // Auto-approve intent and allowance via polling — the SDK hooks fire
        // asynchronously so a one-shot timeout can miss them
        autoApproveInterval = setInterval(() => {
          if (intentRef.current) {
            intentRef.current.allow();
            intentRef.current = null;
          }
          if (allowanceRef.current) {
            const decisions = allowanceRef.current.sources.map(() => "max");
            allowanceRef.current.allow(decisions);
            allowanceRef.current = null;
          }
        }, 300);

        setState((prev) => ({ ...prev, status: "executing" }));

        const result = await sdk.bridgeAndExecute(
          {
            token: params.token,
            amount: params.amount,
            toChainId: params.toChainId,
            execute: {
              to: params.executeTo,
              data: params.executeData,
              value: params.executeValue,
            },
            sourceChains: SUPPORTED_CHAIN_IDS,
          },
          {
            onEvent: buildEventHandler(setSteps),
          }
        );

        if (autoApproveInterval) clearInterval(autoApproveInterval);

        setState((prev) => ({
          ...prev,
          status: "success",
          explorerUrl: result.executeExplorerUrl,
          txHash: result.executeTransactionHash,
        }));

        return result;
      } catch (err) {
        if (autoApproveInterval) clearInterval(autoApproveInterval);
        const cancelled = isUserCancellation(err);
        setState((prev) => ({
          ...prev,
          status: "error",
          error: cancelled ? "Transaction cancelled" : getReadableNexusError(err),
          isCancelled: cancelled,
        }));
        intentRef.current = null;
        allowanceRef.current = null;
        return null;
      }
    },
    [sdk, intentRef, allowanceRef]
  );

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    setSteps([]);
  }, []);

  return { ...state, steps, execute, reset };
}

// ─── useBridge ─────────────────────────────────────────
// For withdrawals: bridge tokens from protocol chain to user's destination

export function useBridge() {
  const { sdk, intentRef, allowanceRef } = useNexus();
  const [state, setState] = useState<NexusFlowState>(INITIAL_STATE);
  const [steps, setSteps] = useState<NexusStep[]>([]);

  const bridge = useCallback(
    async (params: {
      token: string;
      amount: bigint;
      toChainId: number;
      recipient?: `0x${string}`;
    }) => {
      if (!sdk) {
        setState({ ...INITIAL_STATE, status: "error", error: "SDK not initialized" });
        return null;
      }

      setSteps([]);
      setState({
        ...INITIAL_STATE,
        status: "executing",
        startTime: Date.now(),
      });

      try {
        // Auto-approve
        setTimeout(() => {
          if (intentRef.current) intentRef.current.allow();
          if (allowanceRef.current) {
            const decisions = allowanceRef.current.sources.map(() => "max");
            allowanceRef.current.allow(decisions);
          }
        }, 500);

        const result = await sdk.bridge(
          {
            token: params.token,
            amount: params.amount,
            toChainId: params.toChainId,
            recipient: params.recipient,
            sourceChains: SUPPORTED_CHAIN_IDS,
          },
          {
            onEvent: buildEventHandler(setSteps),
          }
        );

        setState((prev) => ({
          ...prev,
          status: "success",
          explorerUrl: result.explorerUrl,
        }));

        return result;
      } catch (err) {
        const cancelled = isUserCancellation(err);
        setState((prev) => ({
          ...prev,
          status: "error",
          error: cancelled ? "Transaction cancelled" : getReadableNexusError(err),
          isCancelled: cancelled,
        }));
        intentRef.current = null;
        allowanceRef.current = null;
        return null;
      }
    },
    [sdk, intentRef, allowanceRef]
  );

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    setSteps([]);
  }, []);

  return { ...state, steps, bridge, reset };
}

// ─── useSwapAndExecute ─────────────────────────────────
// For depositing: swap token on any chain → execute contract call on destination

export function useSwapAndExecute() {
  const { sdk, swapIntentRef, allowanceRef } = useNexus();
  const [state, setState] = useState<NexusFlowState>(INITIAL_STATE);
  const [steps, setSteps] = useState<NexusStep[]>([]);

  const execute = useCallback(
    async (params: {
      toChainId: number;
      toTokenAddress: `0x${string}`;
      toAmount: bigint;
      executeTo: `0x${string}`;
      executeData?: `0x${string}`;
      executeValue?: bigint;
      executeGas?: bigint;
      tokenApproval?: {
        token: `0x${string}`;
        amount: bigint;
        spender: `0x${string}`;
      };
    }) => {
      if (!sdk) {
        setState({ ...INITIAL_STATE, status: "error", error: "SDK not initialized" });
        return null;
      }

      setSteps([]);
      setState({
        ...INITIAL_STATE,
        status: "executing",
        startTime: Date.now(),
      });

      try {
        // Auto-approve swap intent
        setTimeout(() => {
          if (swapIntentRef.current) swapIntentRef.current.allow();
          if (allowanceRef.current) {
            const decisions = allowanceRef.current.sources.map(() => "max");
            allowanceRef.current.allow(decisions);
          }
        }, 500);

        const result = await sdk.swapAndExecute(
          {
            toChainId: params.toChainId,
            toTokenAddress: params.toTokenAddress,
            toAmount: params.toAmount,
            execute: {
              to: params.executeTo,
              data: params.executeData,
              value: params.executeValue,
              gas: params.executeGas || BigInt(300000),
              tokenApproval: params.tokenApproval,
            },
          },
          {
            onEvent: buildEventHandler(setSteps),
          }
        );

        setState((prev) => ({
          ...prev,
          status: "success",
        }));

        return result;
      } catch (err) {
        const cancelled = isUserCancellation(err);
        setState((prev) => ({
          ...prev,
          status: "error",
          error: cancelled ? "Transaction cancelled" : getReadableNexusError(err),
          isCancelled: cancelled,
        }));
        swapIntentRef.current = null;
        allowanceRef.current = null;
        return null;
      }
    },
    [sdk, swapIntentRef, allowanceRef]
  );

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    setSteps([]);
  }, []);

  return { ...state, steps, execute, reset };
}

// ─── useNexusBalanceBreakdown ──────────────────────────
// Get per-chain breakdown for a specific token

export function useNexusBalanceBreakdown(tokenSymbol: string) {
  const { bridgeBalances } = useNexus();

  // Debug: log all available symbols and the raw data for the requested token
  if (bridgeBalances.length > 0) {
    console.log(`[Nexus Breakdown] Looking for "${tokenSymbol}" in ${bridgeBalances.length} tokens:`,
      bridgeBalances.map(b => b.symbol));
  }

  const tokenBalance = bridgeBalances.find(
    (b) => b.symbol?.toUpperCase() === tokenSymbol.toUpperCase()
  );

  if (!tokenBalance) {
    return {
      total: 0,
      totalFormatted: "0",
      breakdown: [] as { chainId: number; chainName: string; balance: string; value: number }[],
    };
  }

  // Debug: log the raw token balance object to see actual structure
  console.log(`[Nexus Breakdown] Found "${tokenSymbol}":`, JSON.stringify(tokenBalance, null, 2));

  // SDK returns breakdown[].chain.id and breakdown[].chain.name (AssetBreakdown type)
  // Handle both possible structures for robustness
  const rawBreakdown = tokenBalance.breakdown || [];

  const breakdown = rawBreakdown
    .map((b: any) => {
      // Try SDK structure first (chain.id/chain.name), then flat (chainId/chainName)
      const chainId = b.chain?.id ?? b.chainId ?? b.chain_id ?? 0;
      const chainName = b.chain?.name ?? b.chainName ?? b.chain_name ?? "Unknown";
      return {
        chainId,
        chainName,
        balance: b.balance || "0",
        value: parseFloat(b.balance) || 0,
      };
    })
    .filter((b) => SUPPORTED_CHAIN_IDS.includes(b.chainId));

  console.log(`[Nexus Breakdown] Parsed ${rawBreakdown.length} raw → ${breakdown.length} supported chains:`,
    breakdown.map(b => `${b.chainName}(${b.chainId}): ${b.balance}`));

  const total = breakdown.reduce((sum, b) => sum + b.value, 0);

  return {
    total,
    totalFormatted: tokenBalance.balance || "0",
    breakdown,
  };
}

// ─── useNexusMaxBridge ─────────────────────────────────
// Calculate max bridgeable amount for a token to a destination chain

export function useNexusMaxBridge() {
  const { sdk } = useNexus();

  const calculateMax = useCallback(
    async (token: string, toChainId: number) => {
      if (!sdk) return null;
      try {
        const result = await sdk.calculateMaxForBridge({
          token,
          toChainId,
          sourceChains: SUPPORTED_CHAIN_IDS,
        });
        return result;
      } catch {
        return null;
      }
    },
    [sdk]
  );

  return { calculateMax };
}
