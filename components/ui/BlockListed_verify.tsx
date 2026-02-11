import { arbAddressList } from "@/lib/web3Constants";
import { erc20Abi, parseUnits } from "viem";
import { useEffect, useState } from "react";
import { usePublicClient, useAccount } from "wagmi";

const USDC_ARBITRUM = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const VAULT = arbAddressList.vUSDCContractAddress;

export function CheckUSDCCompliance() {
  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();

  const [isVaultBlacklisted, setIsVaultBlacklisted] = useState<boolean | null>(null);
  const [isUserBlacklisted, setIsUserBlacklisted] = useState<boolean | null>(null);
  const [isPaused, setIsPaused] = useState<boolean | null>(null);
  const [canTransfer, setCanTransfer] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicClient || !userAddress) return;

    async function verifyAll() {
      try {
        setError(null);

        const complianceAbi = [
          ...erc20Abi,
          {
            name: "isBlacklisted",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "bool" }],
          },
          {
            name: "paused",
            type: "function",
            stateMutability: "view",
            inputs: [],
            outputs: [{ name: "", type: "bool" }],
          },
        ];

        const [vaultBL, userBL, paused] = await Promise.all([
          publicClient.readContract({
            address: USDC_ARBITRUM,
            abi: complianceAbi,
            functionName: "isBlacklisted",
            args: [VAULT],
          }),
          publicClient.readContract({
            address: USDC_ARBITRUM,
            abi: complianceAbi,
            functionName: "isBlacklisted",
            args: [userAddress],
          }),
          publicClient.readContract({
            address: USDC_ARBITRUM,
            abi: complianceAbi,
            functionName: "paused",
          }),
        ]);

        setIsVaultBlacklisted(vaultBL);
        setIsUserBlacklisted(userBL);
        setIsPaused(paused);

        // simulate a small transfer (1 USDC)
        try {
          await publicClient.simulateContract({
            address: USDC_ARBITRUM,
            abi: erc20Abi,
            functionName: "transferFrom",
            args: [userAddress, VAULT, parseUnits("1", 6)],
            account: userAddress,
          });

          setCanTransfer(true);
        } catch (simErr: any) {
          setCanTransfer(false);
          setError(simErr?.shortMessage || "transferFrom simulation reverted");
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.shortMessage || "Verification failed");
      }
    }

    verifyAll();
  }, [publicClient, userAddress]);

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <h3>USDC Compliance Check (Arbitrum)</h3>

      <p>Vault blacklisted: {isVaultBlacklisted === null ? "Checking..." : isVaultBlacklisted ? "Yes ❌" : "No ✅"}</p>
      <p>User blacklisted: {isUserBlacklisted === null ? "Checking..." : isUserBlacklisted ? "Yes ❌" : "No ✅"}</p>
      <p>USDC paused: {isPaused === null ? "Checking..." : isPaused ? "Yes ❌" : "No ✅"}</p>
      <p>transferFrom simulation: {canTransfer === null ? "Checking..." : canTransfer ? "OK ✅" : "Reverted ❌"}</p>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error}
        </p>
      )}
    </div>
  );
}
