"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { tradeItems } from "@/lib/constants";
import { useTheme } from "@/contexts/theme-context";
import { useUserStore } from "@/store/user";
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useClient, useDisconnect, useEnsAvatar, useEnsName, usePublicClient, useReadContract, useSimulateContract, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import AccountManager from "../abi/vanna/out/out/AccountManager.sol/AccountManager.json";
import Registry from "../abi/vanna/out/out/Registry.sol/Registry.json" ;
import {
  arbAddressList,
  baseAddressList,
  opAddressList,
} from ".././lib/web3Constants";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { toast } from "sonner";
import { SunIcon, MoonIcon } from "@/components/icons";
import { gsap } from "gsap";
import { DepositModal } from "./ui/deposit-modal";
import { NetworkDropdown } from "./network-dropdown";


interface Navbar {
  items: {
    title: string;
    link: string;
    group: string;
  }[];
}


export const Navbar = (props: Navbar) => {

  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const setUserAddress = useUserStore((state) => state.set);
  const userAddress = useUserStore((state) => state.address);
  const [open, setOpen] = useState(false)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const hasMarginAccount = useMarginAccountInfoStore((state) => state.hasMarginAccount);
  const setHasMarginAccount = useMarginAccountInfoStore((state) => state.set);

  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const { openConnectModal } = useConnectModal();


  const { data: ensName } = useEnsName({
    address,
    query: { enabled: !!address }
  })


  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ?? undefined,
    query: { enabled: !!ensName },
  });

  useEffect(() => {
    if (isConnected && address) {
      setUserAddress({ address });
    } else {
      setUserAddress({ address: null });
    }
  }, [isConnected, address, setUserAddress]);

  const groupedItems = {
    primary: props.items.filter((item) => item.group === "primary"),
    bordered: props.items.filter((item) => item.group === "bordered"),
    secondary: props.items.filter((item) => item.group === "secondary"),
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownItemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // GSAP animation for dropdown
  useEffect(() => {
    if (!dropdownRef.current) return;

    if (isDropdownOpen) {
      gsap.fromTo(
        dropdownRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" }
      );

      if (dropdownItemsRef.current.length > 0) {
        gsap.fromTo(
          dropdownItemsRef.current,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.2, stagger: 0.03, ease: "power2.out", delay: 0.1 }
        );
      }
    } else {
      if (dropdownItemsRef.current.length > 0) {
        gsap.to(dropdownItemsRef.current, { opacity: 0, duration: 0.15, ease: "power2.in" });
      }
      gsap.to(dropdownRef.current, { height: 0, opacity: 0, duration: 0.25, ease: "power2.in", delay: 0.05 });
    }
  }, [isDropdownOpen]);

  // Handler for nav item click with link
  const handleNavItemClickWithLink = (item: {
    title: string;
    link: string;
  }) => {
    if (item.title === "Trade") {
      return;
    }
    router.push(item.link);
  };

  const handleMouseEnter = (item: { title: string; link: string }) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (item.title === "Trade") {
      setIsDropdownOpen(true);
    }
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150);
  };

  const handleDropdownMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleDropdownMouseLeave = () => {
    setIsDropdownOpen(false);
  };

  // Keyboard support for nav items
  const handleNavKeyDown =
    (item: { title: string; link: string }) => (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleNavItemClickWithLink(item);
      }
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };


    const notify=()=>toast("Working 🏇🏾")

  return (
    <div className={`${isDark ? "bg-[#111111]" : ""}`}>
      <motion.div
        className={`py-[12px] px-[40px] w-full h-fit flex justify-between items-center ${isDark ? "text-white" : ""}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo section */}
        <motion.a
          href="/"
          className="cursor-pointer"
          aria-label="Vanna home page"
          initial={{
            scale: 0,
            rotate: -180,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            rotate: 0,
            opacity: 1,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.8,
          }}
          whileHover={{
            scale: 1.05,
            rotate: [0, -5, 5, -5, 0],
            transition: {
              rotate: {
                duration: 0.5,
                ease: "easeInOut",
              },
              scale: {
                type: "spring",
                stiffness: 400,
                damping: 17,
              },
            },
          }}
          whileTap={{ scale: 0.95 }}
        >
          <Image
            alt="Vanna"
            width={153.4}
            height={48}
            src={isDark ? "/logos/vanna-white.png" : "/logos/vanna.png"}
          />
        </motion.a>

        {/* Navigation items */}
        <div className="flex gap-[20px] items-center ">
          {groupedItems.primary.map((item, idx) => {
            const isActive = pathname === item.link;
            return (
              <motion.div
                key={item.link}
                onClick={() => {
                  handleNavItemClickWithLink(item);
                }}
                onKeyDown={handleNavKeyDown(item)}
                role="button"
                tabIndex={0}
                className={`rounded-[8px] py-[8px] px-[16px] text-[14px] font-medium group flex gap-[4px] items-center hover:text-[#FF007A] cursor-pointer transition-colors ${
                  isActive ? "bg-[#FFE6F2] text-[#FF007A]" : isDark ? "text-white" : ""
                }`}
                aria-label={`Navigate to ${item.title}`}
                aria-current={isActive ? "page" : undefined}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: idx * 0.1,
                  ease: "easeOut",
                }}
                whileHover={{
                  scale: 0.95,
                  transition: { type: "spring", stiffness: 300, damping: 15 },
                }}
                whileTap={{ scale: 0.95 }}
              >
                {item.title}
              </motion.div>
            );
          })}
          <div className="rounded-[8px] border-[1px] p-[8px] flex gap-[8px]">
            {groupedItems.bordered.map((item, idx) => {
              const isActive =
                item.title === "Trade"
                  ? pathname === item.link ||
                  tradeItems.some((tradeItem) => pathname === tradeItem.link)
                  : pathname === item.link;
              return (
                <motion.div
                  key={item.link}
                  onHoverStart={() => handleMouseEnter(item)}
                  onHoverEnd={handleMouseLeave}
                  onClick={() => {
                    handleNavItemClickWithLink(item);
                  }}
                  onKeyDown={handleNavKeyDown(item)}
                  role="button"
                  tabIndex={0}
                  className={`rounded-[8px] py-[8px] px-[16px] text-[14px] font-medium group flex gap-[4px] items-center hover:text-[#FF007A] cursor-pointer transition-colors ${
                    isActive ? "bg-[#FFE6F2] text-[#FF007A]" : isDark ? "text-white" : ""
                  }`}
                  aria-haspopup={item.title === "Trade" ? "menu" : undefined}
                  aria-expanded={
                    item.title === "Trade" ? isDropdownOpen : undefined
                  }
                  aria-controls={
                    item.title === "Trade" ? "trade-menu" : undefined
                  }
                  aria-label={`Navigate to ${item.title}`}
                  aria-current={isActive ? "page" : undefined}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: idx * 0.1,
                    ease: "easeOut",
                  }}
                  whileHover={{
                    scale: 0.95,
                    transition: { type: "spring", stiffness: 300, damping: 15 },
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Margin icon (only for Margin item) */}
                  {item.title == "Margin" && (
                    <div className="w-[16px] h-[16px] flex flex-col justify-center items-center">
                      <svg
                        width="8"
                        height="13"
                        viewBox="0 0 8 13"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          opacity="0.3"
                          d="M7.33332 4L3.99999 0.666672L0.666656 4"
                          className={`transition-colors ${
                            isActive
                              ? "stroke-[#FF007A]"
                              : isDark
                              ? "stroke-white group-hover:stroke-[#FF007A]"
                              : "stroke-black group-hover:stroke-[#FF007A]"
                          }`}
                          strokeWidth="1.33333"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          opacity="0.6"
                          d="M7.33332 8L3.99999 4.66667L0.666656 8"
                          className={`transition-colors ${
                            isActive
                              ? "stroke-[#FF007A]"
                              : isDark
                              ? "stroke-white group-hover:stroke-[#FF007A]"
                              : "stroke-black group-hover:stroke-[#FF007A]"
                          }`}
                          strokeWidth="1.33333"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M7.33332 12L3.99999 8.66667L0.666656 12"
                          className={`transition-colors ${
                            isActive
                              ? "stroke-[#FF007A]"
                              : isDark
                              ? "stroke-white group-hover:stroke-[#FF007A]"
                              : "stroke-black group-hover:stroke-[#FF007A]"
                          }`}
                          strokeWidth="1.33333"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                  {item.title}
                  {item.title === "Trade" && (
                    <div className="w-[12px] h-[12px] flex flex-col justify-center items-center">
                      <svg
                        width="10"
                        height="6"
                        viewBox="0 0 18 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M17 9L9 1L0.999999 9"
                          stroke="#19191A"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={
                            isActive
                              ? "stroke-[#FF007A]"
                              : isDark
                              ? "stroke-white group-hover:stroke-[#FF007A]"
                              : "stroke-black group-hover:stroke-[#FF007A]"
                          }
                        />
                      </svg>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          {groupedItems.secondary.map((item, idx) => {
            const isActive = pathname === item.link;
            return (
              <motion.div
                key={item.link}
                onClick={() => {
                  handleNavItemClickWithLink(item);
                }}
                onKeyDown={handleNavKeyDown(item)}
                role="button"
                tabIndex={0}
                className={`rounded-[8px] py-[8px] px-[16px] text-[14px] font-medium group flex gap-[4px] items-center hover:text-[#FF007A] cursor-pointer transition-colors ${
                  isActive ? "bg-[#FFE6F2] text-[#FF007A]" : isDark ? "text-white" : ""
                }`}
                aria-label={`Navigate to ${item.title}`}
                aria-current={isActive ? "page" : undefined}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: idx * 0.1,
                  ease: "easeOut",
                }}
                whileHover={{
                  scale: 0.95,
                  transition: { type: "spring", stiffness: 300, damping: 15 },
                }}
                whileTap={{ scale: 0.95 }}
              >
                {item.title}
              </motion.div>
            );
          })}
        </div>

        {/* Right section: Theme toggle and Login button */}
        <motion.div
          className="flex gap-[8px] items-center"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          {/* Network Switcher */}
          {isConnected && <NetworkDropdown />}
          {address && (
            <Button
              size="small"
              type="navbar"
              disabled={false}
              onClick={() => setDepositModalOpen(true)}
              text="DEPOSIT"
              ariaLabel="Deposit to your account"
            ></Button>
          )}
          {/* Theme toggle button */}
          <button
            type="button"
            className="flex flex-col justify-center items-center rounded-[8px] py-[12px] px-[10px] h-[44px] border-[1px] cursor-pointer"
            onClick={toggleTheme}
            aria-label={
              isDark ? "Switch to light theme" : "Switch to dark theme"
            }
            aria-pressed={isDark}
          >
            <motion.div
              whileHover={{
                scale: 1.1,
                rotate: 180,
                transition: { type: "spring", stiffness: 200, damping: 10 },
              }}
              whileTap={{ scale: 0.9 }}
              className="w-[24px] h-[24px] flex flex-col justify-center items-center "
            >

              {isDark ? (
                <SunIcon />
              ) : (
                <MoonIcon />
              )}
            </motion.div>
          </button>
          {/* Login button */}
          {!isConnected ? (
            <>
              <Button
                size="small"
                type="gradient"
                disabled={false}
                onClick={async () => {
                  openConnectModal?.();
                }}
                text="Login"
                ariaLabel="Login to your account"
              ></Button>
            </>
          ) : (
            <div
              onClick={() => {
                disconnect()
                setUserAddress({ address: null })
              }}
              className={`cursor-pointer py-[12px] px-[24px] text-[16px] font-semibold rounded-[8px] h-full w-fit ${
                isDark ? "bg-[#222222] text-white" : "bg-[#F4F4F4]"
              }`}
            >
              {address!.slice(0, 6) + "..." + address!.slice(-4)}
            </div>
          )}
        </motion.div>
      </motion.div>
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          id="trade-menu"
          role="menu"
          aria-label="Trade menu"
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
          className={`w-full py-[8px] flex justify-center gap-[4px] overflow-hidden ${
            isDark
              ? "bg-[#111111] border-t-[1px] border-b-[1px]"
              : "border-t-[1px] border-[#F4F4F4] border-b-[1px] border-[#F4F4F4]"
          }`}
          style={{ height: 0, opacity: 0 }}
        >
          {tradeItems.map((item, idx) => {
            const isActive = pathname === item.link;
            return (
              <motion.div
                key={item.link}
                ref={(el) => {
                  if (el) dropdownItemsRef.current[idx] = el;
                }}
                role="menuitem"
                tabIndex={0}
                onClick={() => {
                  handleNavItemClickWithLink(item);
                }}
                onKeyDown={handleNavKeyDown(item)}
                className={`${
                  isActive ? "bg-[#FFE6F2] text-[#FF007A]" : isDark ? "text-white" : ""
                } cursor-pointer hover:text-[#FF007A] py-[8px] px-[16px] text-[14px] font-medium rounded-[8px]`}
                whileHover={{
                  scale: 0.95,
                  transition: { type: "spring", stiffness: 300, damping: 15 },
                }}
                whileTap={{ scale: 0.95 }}
              >
                {item.title}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Deposit Modal */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />
    </div>
  );
};
