"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { tradeItems } from "@/lib/constants";
import { useTheme } from "@/contexts/theme-context";
import { useUserStore } from "@/store/user";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import AccountManager from "../abi/vanna/out/out/AccountManager.sol/AccountManager.json";
import Registry from "../abi/vanna/out/out/Registry.sol/Registry.json";
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
import { LoginModal } from "./auth/login-modal";
import { UserMenu } from "./auth/user-menu";

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
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  // Detect OAuth redirect — DON'T clean URL yet, Privy needs those params
  const [oauthReturnProvider] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("privy_oauth_state")) {
        return params.get("privy_oauth_provider") || "google";
      }
    }
    return null;
  });
  const isOAuthReturn = oauthReturnProvider !== null;
  const [loginModalOpen, setLoginModalOpen] = useState(isOAuthReturn);
  const hasMarginAccount = useMarginAccountInfoStore(
    (state) => state.hasMarginAccount
  );
  const setHasMarginAccount = useMarginAccountInfoStore((state) => state.set);

  // Privy hooks
  const { ready, authenticated, logout, user } = usePrivy();
  const { wallets } = useWallets();

  // Wagmi hooks (still work under Privy's WagmiProvider)
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Clean OAuth params from URL AFTER Privy completes authentication
  // Privy needs the URL params until authenticated — cleaning too early breaks the flow
  useEffect(() => {
    if (!isOAuthReturn) return;
    if (!authenticated) return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("privy_oauth_state")) {
      url.searchParams.delete("privy_oauth_state");
      url.searchParams.delete("privy_oauth_provider");
      url.searchParams.delete("privy_oauth_code");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [isOAuthReturn, authenticated]);

  // Sync wallet address and Privy user data to user store
  useEffect(() => {
    if (isConnected && address) {
      setUserAddress({ address });
    } else if (authenticated && wallets.length > 0) {
      // Embedded wallet may not sync to wagmi immediately
      setUserAddress({ address: wallets[0].address });
    } else {
      setUserAddress({ address: null });
    }
  }, [isConnected, address, authenticated, wallets, setUserAddress]);

  // Sync Privy user info to store
  useEffect(() => {
    if (authenticated && user) {
      const authMethod = user.email
        ? "email"
        : user.google
        ? "google"
        : user.twitter
        ? "twitter"
        : user.apple
        ? "apple"
        : "wallet";
      setUserAddress({
        privyUserId: user.id,
        authMethod,
        email: user.email?.address || user.google?.email || null,
      });
    } else {
      setUserAddress({
        privyUserId: null,
        authMethod: null,
        email: null,
      });
    }
  }, [authenticated, user, setUserAddress]);

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
          {
            opacity: 1,
            y: 0,
            duration: 0.2,
            stagger: 0.03,
            ease: "power2.out",
            delay: 0.1,
          }
        );
      }
    } else {
      if (dropdownItemsRef.current.length > 0) {
        gsap.to(dropdownItemsRef.current, {
          opacity: 0,
          duration: 0.15,
          ease: "power2.in",
        });
      }
      gsap.to(dropdownRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        delay: 0.05,
      });
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
    (item: { title: string; link: string }) =>
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleNavItemClickWithLink(item);
      }
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

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
                  isActive
                    ? "bg-[#FFE6F2] text-[#FF007A]"
                    : isDark
                    ? "text-white"
                    : ""
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
                    tradeItems.some(
                      (tradeItem) => pathname === tradeItem.link
                    )
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
                    isActive
                      ? "bg-[#FFE6F2] text-[#FF007A]"
                      : isDark
                      ? "text-white"
                      : ""
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
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                    },
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
                  isActive
                    ? "bg-[#FFE6F2] text-[#FF007A]"
                    : isDark
                    ? "text-white"
                    : ""
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

        {/* Right section: Theme toggle and Auth */}
        <motion.div
          className="flex gap-[8px] items-center"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          {/* Deposit button (only when connected) */}
          {authenticated && address && (
            <Button
              size="small"
              type="navbar"
              disabled={false}
              onClick={() => setDepositModalOpen(true)}
              text="DEPOSIT"
              ariaLabel="Deposit to your account"
            />
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
              {isDark ? <SunIcon /> : <MoonIcon />}
            </motion.div>
          </button>

          {/* Auth: Login button or User Menu */}
          {!ready ? (
            <div
              className={`py-[12px] px-[24px] rounded-[8px] ${
                isDark ? "bg-[#222222]" : "bg-[#F4F4F4]"
              }`}
            >
              <div className="w-16 h-4 animate-pulse rounded bg-current opacity-10" />
            </div>
          ) : !authenticated ? (
            <Button
              size="small"
              type="gradient"
              disabled={false}
              onClick={() => setLoginModalOpen(true)}
              text="Login"
              ariaLabel="Login to your account"
            />
          ) : wallets.length === 0 ? (
            /* Wallet being created — show loading pill */
            <div
              className={`flex items-center gap-2 py-[10px] px-[16px] rounded-xl ${
                isDark
                  ? "bg-[#1C1C1C] border border-[#2A2A2A] text-[#777777]"
                  : "bg-[#F7F7F7] border border-[#DFDFDF] text-[#949494]"
              }`}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-transparent animate-spin"
                style={{
                  borderTopColor: "#703AE6",
                  borderRightColor: "#FC5457",
                }}
              />
              <span className="text-[13px] font-medium">Setting up...</span>
            </div>
          ) : (
            <UserMenu />
          )}
        </motion.div>
      </motion.div>

      {/* Trade Dropdown */}
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
                  isActive
                    ? "bg-[#FFE6F2] text-[#FF007A]"
                    : isDark
                    ? "text-white"
                    : ""
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

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        isOAuthReturn={isOAuthReturn}
        oauthProvider={oauthReturnProvider}
      />

      {/* Deposit Modal */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />
    </div>
  );
};
