"use client";

import { networkOptions } from "@/lib/web3Constants";
import { useBalanceStore } from "@/store/balance-store";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSwitchChain, useChainId, useAccount, usePublicClient } from "wagmi";
import { PublicClient } from 'viem';
import { useFetchAccountCheck } from "@/lib/utils/margin/marginFetchers";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { useTheme } from "@/contexts/theme-context";

export const NetworkDropdown = () => {
  const { isDark } = useTheme();
  // Dropdown visibility state
  const [isHover, setIsHover] = useState(false);
  const chainId = useChainId();

  const { switchChain } = useSwitchChain()

  const { reset, refreshBalances } = useBalanceStore();
  const setHasMarginAccount = useMarginAccountInfoStore((state) => state.set);


  const { address, isConnected } = useAccount()

  const publicClient = usePublicClient()

  const fetchAccountCheck = useFetchAccountCheck(chainId, address, publicClient);


  // Handler for mouse enter
  const handleMouseEnter = () => {
    setIsHover(true);
  };

  // Handler for mouse leave
  const handleMouseLeave = () => {
    setIsHover(false);
  };

  // Handler for network select
  const handleNetworkSelect = (item: typeof networkOptions[number]) => {


    return async () => {


      if (item.chainId !== chainId) {
        try {
          await switchChain({ chainId: item.chainId })
        }
        catch (err) {
          console.warn("Chain switch rejected or failed", err);

        }
      }


    }


  };

  useEffect(() => {
    if (!chainId || !address || !publicClient) return;

    let cancelled = false;

    (async () => {
      // 1. fetch margin account(s) for current network
      const accs = await fetchAccountCheck();
      const marginAccount = accs?.[0];
      
      if (marginAccount) {
        setHasMarginAccount({ hasMarginAccount: true });
      } else {
        setHasMarginAccount({ hasMarginAccount: false });
      }

      // 2. clear stale balances
      reset();

      // 3. refresh balances 
      await refreshBalances({
        chainId,
        publicClient,
        address,
        marginAccount,
      });

      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [chainId, address, publicClient]);


  //If the user directly opens with wallet6 already on base/Arbitrum it will show wrtong selection 
  // handle that selection from derive state 


  const selectedNetwork = networkOptions.find((n) => n.chainId === chainId)
    ?? networkOptions[0];


  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block "
    >
      {/* Dropdown trigger button */}
      <button
        type="button"
        className={`rounded-[8px] py-[12px] pr-[12px] pl-[20px] font-semibold text-[14px] cursor-pointer flex gap-2 justify-center items-center ${
          isDark ? "bg-[#222222] text-white" : "bg-[#F5F5F5]"
        }`}
        aria-label={`Selected network: ${selectedNetwork.name}. Click to change network`}
        aria-expanded={isHover}
        aria-haspopup="listbox"
      >
        Network <Image src={selectedNetwork.icon} alt={selectedNetwork.id} width={20} height={20} />

        {/* Dropdown arrow icon */}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-5"
          aria-hidden="true"
          animate={{ rotate: isHover ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </motion.svg>
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isHover && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute left-0 z-50 p-2 top-full mt-2 shadow-lg rounded-[6px] ${
              isDark ? "bg-[#222222]" : "bg-white"
            }`}
            style={{ width: 'max-content', minWidth: '100%' }}
            role="listbox"
            aria-label="Network selection"
          >
            {/* Map through network options */}
            {networkOptions.map((item, idx) => {
              return (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  className={`flex gap-[10px] items-center font-medium rounded-[6px] text-[14px] cursor-pointer p-[12px] w-full text-left ${
                    isDark 
                      ? "text-white hover:bg-[#333333]" 
                      : "hover:bg-[#F2EBFE]"
                  }`}
                  key={item.id}
                  role="option"
                  aria-selected={selectedNetwork.id === item.id}
                  onClick={handleNetworkSelect(item)}
                  aria-label={`Select ${item.name} network`}
                >
                  <Image src={item.icon} width={20} height={20} alt="" aria-hidden="true" />
                  {item.name}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
