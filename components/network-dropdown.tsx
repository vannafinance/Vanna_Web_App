"use client";

import { networkOptions } from "@/lib/web3Constants";
import { useBalanceStore } from "@/store/balance-store";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useFetchAccountCheck } from "@/lib/utils/margin/marginFetchers";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { useTheme } from "@/contexts/theme-context";
import { ChevronDownIcon } from "@/components/icons";
import { useRequiredNetwork } from "@/lib/hooks/useRequiredNetwork";

const BASE_NETWORK = networkOptions[0];

export const NetworkDropdown = () => {
  const { isDark } = useTheme();
  const [isHover, setIsHover] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { isWrongNetwork, switchToBase, isSwitching } = useRequiredNetwork();

  const { reset, refreshBalances } = useBalanceStore();
  const setHasMarginAccount = useMarginAccountInfoStore((s) => s.set);

  const fetchAccountCheck = useFetchAccountCheck(
    !isWrongNetwork ? chainId : undefined,
    address,
    publicClient
  );

  useEffect(() => {
    if (isWrongNetwork) {
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
      setHasMarginAccount({ hasMarginAccount: !!marginAccount });
      reset();
      await refreshBalances({ chainId, publicClient, address, marginAccount });
    })();

    return () => { cancelled = true; };
  }, [chainId, address, publicClient, isWrongNetwork]);

  // ── Wrong network: subtle warning icon with tooltip (Morpho-style) ──
  if (isWrongNetwork) {
    return (
      <div
        className="relative inline-flex items-center"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          type="button"
          onClick={switchToBase}
          disabled={isSwitching}
          className={`relative w-[40px] h-[40px] rounded-full flex items-center justify-center
            transition-all cursor-pointer
            ${isDark
              ? "bg-[#2A1A1A] hover:bg-[#3A2020] border border-red-500/30"
              : "bg-red-50 hover:bg-red-100 border border-red-200"
            }
            disabled:opacity-60
          `}
          aria-label="Wrong network — click to switch to Base"
        >
          {isSwitching ? (
            <svg className="animate-spin w-[18px] h-[18px] text-red-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-red-500">
              <path
                d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 003.64 21H20.36A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* Red dot indicator */}
          <span className="absolute -top-[2px] -right-[2px] w-[10px] h-[10px] bg-red-500 rounded-full border-2 border-white dark:border-[#111]" />
        </button>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className={`absolute top-full mt-2 right-0 z-50 px-3 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap shadow-lg
                ${isDark ? "bg-[#222] text-white border border-white/10" : "bg-[#1a1a1a] text-white"}
              `}
            >
              You are connected to the wrong network
              {/* Arrow */}
              <div className={`absolute -top-[5px] right-4 w-[10px] h-[10px] rotate-45
                ${isDark ? "bg-[#222] border-l border-t border-white/10" : "bg-[#1a1a1a]"}
              `} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Correct network (Base): standard dropdown ──
  return (
    <div
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      className="relative inline-block"
    >
      <button
        type="button"
        className={`rounded-[8px] py-[12px] pr-[12px] pl-[20px] font-semibold text-[14px]
          flex gap-2 items-center cursor-pointer
          ${isDark ? "bg-[#222222] text-white" : "bg-[#F5F5F5]"}
        `}
        aria-expanded={isHover}
        aria-haspopup="listbox"
      >
        Network
        <Image src={BASE_NETWORK.icon} alt="Base" width={20} height={20} />
        <motion.div
          aria-hidden="true"
          animate={{ rotate: isHover ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronDownIcon className="size-5" />
        </motion.div>
      </button>

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
            <div
              className={`flex gap-[10px] items-center font-medium rounded-[6px]
                text-[14px] p-[12px] w-full
                ${isDark ? "text-white bg-[#333333]" : "bg-[#F2EBFE]"}
              `}
              role="option"
              aria-selected="true"
            >
              <Image src={BASE_NETWORK.icon} width={20} height={20} alt="" aria-hidden="true" />
              {BASE_NETWORK.name}
              <span className="ml-auto text-[11px] text-green-500 font-medium">Active</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
