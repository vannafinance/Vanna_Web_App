"use client";

import { networkOptions } from "@/lib/web3Constants";
import { useBalanceStore } from "@/store/balance-store";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import {
  useSwitchChain,
  useChainId,
  useAccount,
  usePublicClient,
} from "wagmi";
import { useFetchAccountCheck } from "@/lib/utils/margin/marginFetchers";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { useTheme } from "@/contexts/theme-context";

export const NetworkDropdown = () => {
  const { isDark } = useTheme();

  const [isHover, setIsHover] = useState(false);
  const [pendingNetwork, setPendingNetwork] =
    useState<(typeof networkOptions)[number] | null>(null);

  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const { reset, refreshBalances } = useBalanceStore();
  const setHasMarginAccount = useMarginAccountInfoStore((s) => s.set);


  const supportedNetwork = useMemo(
    () => networkOptions.find((n) => n.chainId === chainId),
    [chainId]
  );

  const isSupportedChain = !!supportedNetwork;

  const fetchAccountCheck = useFetchAccountCheck(
    isSupportedChain ? chainId : undefined,
    address,
    publicClient
  );


  const handleNetworkSelect =
    (item: (typeof networkOptions)[number]) => () => {
      if (item.chainId === chainId) {
        setIsHover(false);
        return;
      }

      setPendingNetwork(item);
      setIsHover(false);
    };


  useEffect(() => {
    if (!isSupportedChain) {
      reset();
      setHasMarginAccount({ hasMarginAccount: false });
      return;
    }

    if (!chainId || !address || !publicClient) return;

    let cancelled = false;

    (async () => {
      const accs = await fetchAccountCheck();
      if (cancelled) return;

      const marginAccount = accs?.[0] ?? null;

      setHasMarginAccount({
        hasMarginAccount: !!marginAccount,
      });

      reset();

      await refreshBalances({
        chainId,
        publicClient,
        address,
        marginAccount,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [chainId, address, publicClient, isSupportedChain]);


  return (
    <>
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="relative inline-block"
      >
        {/* Trigger */}
        <button
          type="button"
          className={`rounded-[8px] py-[12px] pr-[12px] pl-[20px] font-semibold text-[14px]
            flex gap-2 items-center cursor-pointer
            ${isDark ? "bg-[#222222] text-white" : "bg-[#F5F5F5]"}
          `}
          aria-expanded={isHover}
          aria-haspopup="listbox"
        >
          {isSupportedChain ? (
            <>
              Network
              <Image
                src={supportedNetwork.icon}
                alt={supportedNetwork.id}
                width={20}
                height={20}
              />
            </>
          ) : (
            <>Unsupported Network</>
          )}

          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5"
            animate={{ rotate: isHover ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </motion.svg>
        </button>

        {/* Dropdown List */}
        <AnimatePresence>
          {isHover && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`absolute left-0 z-50 p-2 top-full mt-2 shadow-lg rounded-[6px]
                ${isDark ? "bg-[#222222]" : "bg-white"}
              `}
              style={{ width: "max-content", minWidth: "100%" }}
              role="listbox"
            >
              {networkOptions.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNetworkSelect(item)}
                  className={`flex gap-[10px] items-center font-medium rounded-[6px]
                    text-[14px] cursor-pointer p-[12px] w-full text-left
                    ${
                      isDark
                        ? "text-white hover:bg-[#333333]"
                        : "hover:bg-[#F2EBFE]"
                    }
                  `}
                  role="option"
                  aria-selected={supportedNetwork?.id === item.id}
                >
                  <Image
                    src={item.icon}
                    width={20}
                    height={20}
                    alt=""
                    aria-hidden="true"
                  />
                  {item.name}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      <AnimatePresence>
        {pendingNetwork && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`w-[380px] rounded-xl p-6 shadow-xl
                ${isDark ? "bg-[#1C1C1C] text-white" : "bg-white"}
              `}
            >
              <h3 className="text-lg font-semibold">Switch Network</h3>

              <p className="text-sm opacity-80 mt-2">
                Please confirm switching your wallet network to:
              </p>

              <div className="flex items-center gap-3 mt-4 p-3 rounded-lg border">
                <Image
                  src={pendingNetwork.icon}
                  width={24}
                  height={24}
                  alt=""
                />
                <span className="font-medium">
                  {pendingNetwork.name}
                </span>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 py-2 rounded-lg border"
                  onClick={() => setPendingNetwork(null)}
                >
                  Cancel
                </button>

                <button
                  className="flex-1 py-2 rounded-lg bg-[#7C35F8] text-white"
                  onClick={async () => {
                    try {
                      await switchChain({
                        chainId: pendingNetwork.chainId,
                      });
                    } catch (err) {
                      console.warn("Network switch failed", err);
                    } finally {
                      setPendingNetwork(null);
                    }
                  }}
                >
                  Switch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
