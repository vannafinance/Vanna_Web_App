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
        {/* Trigger button */}
        <button
          type="button"
          className={`rounded-[12px] py-[8px] pr-[10px] pl-[14px] font-semibold text-[13px]
            flex gap-[8px] items-center cursor-pointer border transition-colors
            ${isDark
              ? "bg-[#1E1E1E] border-[#2C2C2C] text-white hover:border-[#444]"
              : "bg-[#F7F7F7] border-[#E5E7EB] text-[#1F1F1F] hover:border-[#D1D5DB]"
            }
          `}
          aria-expanded={isHover}
          aria-haspopup="listbox"
        >
          {isSupportedChain ? (
            <>
              <Image
                src={supportedNetwork.icon}
                alt={supportedNetwork.name}
                width={18}
                height={18}
                className="rounded-full"
              />
              <span className="hidden sm:inline">{supportedNetwork.name}</span>
            </>
          ) : (
            <span className="text-[#FC5457]">Wrong Network</span>
          )}
          <motion.svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            animate={{ rotate: isHover ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className={isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"}
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {isHover && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={`absolute right-0 z-50 p-1.5 top-full mt-2 rounded-[14px] border shadow-xl
                ${isDark
                  ? "bg-[#1E1E1E] border-[#2C2C2C] shadow-black/40"
                  : "bg-white border-[#E5E7EB] shadow-black/10"
                }
              `}
              style={{ width: "max-content", minWidth: "100%" }}
              role="listbox"
              aria-label="Network selection"
            >
              {networkOptions.map((item) => {
                const isActive = supportedNetwork?.id === item.id;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNetworkSelect(item)}
                    className={`flex gap-[10px] items-center font-medium rounded-[10px]
                      text-[13px] cursor-pointer px-[12px] py-[10px] w-full text-left transition-colors
                      ${isActive
                        ? isDark
                          ? "bg-[#703AE6]/10 text-[#703AE6]"
                          : "bg-[#F1EBFD] text-[#703AE6]"
                        : isDark
                          ? "text-[#D1D5DB] hover:bg-[#2C2C2C]"
                          : "text-[#1F1F1F] hover:bg-[#F7F7F7]"
                      }
                    `}
                    role="option"
                    aria-selected={isActive}
                  >
                    <Image
                      src={item.icon}
                      width={20}
                      height={20}
                      alt=""
                      aria-hidden="true"
                      className="rounded-full"
                    />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#703AE6]" />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {pendingNetwork && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`w-[380px] rounded-2xl p-6 shadow-2xl border
                ${isDark
                  ? "bg-[#1E1E1E] border-[#2C2C2C] text-white"
                  : "bg-white border-[#E5E7EB]"
                }
              `}
            >
              <h3 className="text-lg font-semibold">Switch Network</h3>
              <p className={`text-sm mt-2 ${isDark ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                Confirm switching your wallet to:
              </p>

              <div className={`flex items-center gap-3 mt-4 p-3.5 rounded-xl border
                ${isDark ? "border-[#2C2C2C] bg-[#141419]" : "border-[#E5E7EB] bg-[#F7F7F7]"}
              `}>
                <Image
                  src={pendingNetwork.icon}
                  width={28}
                  height={28}
                  alt=""
                  className="rounded-full"
                />
                <span className="font-semibold text-[15px]">
                  {pendingNetwork.name}
                </span>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-colors
                    ${isDark
                      ? "border-[#2C2C2C] text-[#9CA3AF] hover:text-white hover:border-[#444]"
                      : "border-[#E5E7EB] text-[#6B7280] hover:text-[#1F1F1F] hover:border-[#D1D5DB]"
                    }
                  `}
                  onClick={() => setPendingNetwork(null)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors"
                  style={{ background: 'linear-gradient(135deg, #FC5457 10%, #703AE6 80%)' }}
                  onClick={async () => {
                    try {
                      await switchChain({ chainId: pendingNetwork.chainId });
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
