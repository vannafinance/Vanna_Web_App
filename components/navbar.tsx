"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { tradeItems } from "@/lib/constants";
import { useTheme } from "@/contexts/theme-context";
import { useUserStore } from "@/store/user";

interface Navbar {
  items: {
    title: string;
    link: string;
    group: string;
  }[];
}

export const Navbar = (props: Navbar) => {
  // Get current pathname for active link detection
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const setUserAddress = useUserStore((state) => state.set);
  const userAddress = useUserStore((state) => state.address);

  const groupedItems = {
    primary: props.items.filter((item) => item.group === "primary"),
    bordered: props.items.filter((item) => item.group === "bordered"),
    secondary: props.items.filter((item) => item.group === "secondary"),
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

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
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (item.title === "Trade") {
      setIsDropdownOpen(true);
    }
  };

  const handleMouseLeave = () => {
    // Delay closing to allow mouse to move to dropdown
    closeTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150);
  };

  const handleDropdownMouseEnter = () => {
    // Clear timeout when mouse enters dropdown
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative">
      <motion.div
        className="py-[12px] px-[16px] md:px-[24px] xl:px-[40px] w-full h-fit flex justify-between items-center"
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
            src={"/logos/vanna.png"}
          />
        </motion.a>

        {/* Navigation items — xl+ only */}
        <div className="hidden xl:flex gap-[20px] items-center">
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
                className={`rounded-[8px] py-[8px] px-[16px] text-[14px] font-medium group flex gap-[4px]  items-center hover:text-[#FF007A] cursor-pointer transition-colors ${
                  isActive ? "bg-[#FFE6F2] text-[#FF007A]" : ""
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
          <div className="rounded-[8px] border-[1px] border-[#E2E2E2] p-[8px] flex gap-[8px] ">
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
                  className={`rounded-[8px] py-[8px] px-[16px] text-[14px] font-medium group flex gap-[4px]  items-center hover:text-[#FF007A] cursor-pointer transition-colors ${
                    isActive ? "bg-[#FFE6F2] text-[#FF007A]" : ""
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
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          className={
                            isActive
                              ? "stroke-[#FF007A]"
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
                className={`rounded-[8px] py-[8px] px-[16px] text-[14px] font-medium group flex gap-[4px]  items-center hover:text-[#FF007A] cursor-pointer transition-colors ${
                  isActive ? "bg-[#FFE6F2] text-[#FF007A]" : ""
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

        {/* Right section — xl+: theme toggle, chain selector, deposit/login */}
        <motion.div
          className="hidden xl:flex gap-[8px] items-center"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          {userAddress && (
            <Button
              size="small"
              type="gradient"
              disabled={false}
              onClick={() => {
                // TODO: Implement deposit logic
              }}
              text="DEPOSIT"
              ariaLabel="Deposit to your account"
            ></Button>
          )}
          {/* Theme toggle button */}
          <button
            type="button"
            className="flex flex-col justify-center items-center  rounded-[8px] py-[12px] px-[10px]  h-[44px] border-[1px] border-[#E2E2E2]  cursor-pointer"
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="#FF007A"
                  width={16}
                  height={16}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364 6.364l-1.591 1.591M21 12h-2.25m-6.364 6.364l-1.591 1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#FF007A"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="#FF007A"
                  width={16}
                  height={16}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
              )}
            </motion.div>
          </button>
          {!userAddress ? (
            <Button
              size="small"
              type="gradient"
              disabled={false}
              onClick={() => {
                setUserAddress({
                  address: "0x1234567890123456789012345678901234567890",
                });
              }}
              text="Login"
              ariaLabel="Login to your account"
            ></Button>
          ) : (
            <div
              onClick={() => {
                setUserAddress({ address: null });
              }}
              className="cursor-pointer py-[12px] px-[24px] text-[16px] font-semibold bg-[#F4F4F4] rounded-[8px] h-full w-fit"
            >
              {userAddress.slice(0, 6) + "..." + userAddress.slice(-4)}
            </div>
          )}
        </motion.div>

        {/* Right section — below xl: deposit/login + hamburger */}
        <motion.div
          className="flex xl:hidden gap-[8px] items-center"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          {!userAddress ? (
            <Button
              size="small"
              type="gradient"
              disabled={false}
              onClick={() => {
                setUserAddress({
                  address: "0x1234567890123456789012345678901234567890",
                });
              }}
              text="LOGIN"
              ariaLabel="Login to your account"
            ></Button>
          ) : (
            <Button
              size="small"
              type="gradient"
              disabled={false}
              onClick={() => {
                // TODO: Implement deposit logic
              }}
              text="DEPOSIT"
              ariaLabel="Deposit to your account"
            ></Button>
          )}
          {/* Hamburger menu button */}
          <button
            type="button"
            className={`flex flex-col justify-center items-center gap-[5px] p-[10px] cursor-pointer ${isDark ? "text-white" : "text-[#111111]"}`}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`block w-[22px] h-[2px] rounded-full transition-all ${isDark ? "bg-white" : "bg-[#111111]"} ${isMobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block w-[22px] h-[2px] rounded-full transition-all ${isDark ? "bg-white" : "bg-[#111111]"} ${isMobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-[22px] h-[2px] rounded-full transition-all ${isDark ? "bg-white" : "bg-[#111111]"} ${isMobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>
        </motion.div>
      </motion.div>

      {/* Desktop trade dropdown — xl+ only */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            id="trade-menu"
            role="menu"
            aria-label="Trade menu"
            layout
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
            className="w-full absolute hidden xl:flex border-t-[1px] border-[#F4F4F4] border-b-[1px] border-[#F4F4F4] py-[8px] justify-center gap-[4px] "
          >
            {tradeItems.map((item, idx) => {
              const isActive = pathname === item.link;
              return (
                <motion.div
                  key={item.link}
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => {
                    handleNavItemClickWithLink(item);
                  }}
                  onKeyDown={handleNavKeyDown(item)}
                  className={`${
                    isActive ? "bg-[#FFE6F2] text-[#FF007A]" : ""
                  } cursor-pointer hover:text-[#FF007A] py-[8px] px-[16px] text-[14px] font-medium rounded-[8px] `}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{
                    duration: 0.15,
                    ease: "easeOut",
                    delay: idx * 0.02,
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu — below xl */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`xl:hidden overflow-hidden border-t ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E2E2E2]"}`}
          >
            <div className="flex flex-col px-[16px] py-[12px] gap-[4px]">
              {[...groupedItems.primary, ...groupedItems.bordered, ...groupedItems.secondary].map(
                (item) => {
                  const isActive =
                    item.title === "Trade"
                      ? pathname === item.link ||
                        tradeItems.some((tradeItem) => pathname === tradeItem.link)
                      : pathname === item.link;
                  return (
                    <motion.div
                      key={item.link}
                      onClick={() => {
                        handleNavItemClickWithLink(item);
                        if (item.title !== "Trade") setIsMobileMenuOpen(false);
                        if (item.title === "Trade") setIsDropdownOpen((prev) => !prev);
                      }}
                      className={`rounded-[8px] py-[10px] px-[16px] text-[14px] font-medium flex items-center gap-[8px] cursor-pointer transition-colors ${
                        isActive
                          ? "bg-[#FFE6F2] text-[#FF007A]"
                          : isDark
                            ? "text-white hover:bg-[#222222]"
                            : "text-[#111111] hover:bg-[#F7F7F7]"
                      }`}
                    >
                      {item.title == "Margin" && (
                        <div className="w-[16px] h-[16px] flex flex-col justify-center items-center">
                          <svg width="8" height="13" viewBox="0 0 8 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path opacity="0.3" d="M7.33332 4L3.99999 0.666672L0.666656 4" className={`transition-colors ${isActive ? "stroke-[#FF007A]" : isDark ? "stroke-white" : "stroke-black"}`} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                            <path opacity="0.6" d="M7.33332 8L3.99999 4.66667L0.666656 8" className={`transition-colors ${isActive ? "stroke-[#FF007A]" : isDark ? "stroke-white" : "stroke-black"}`} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7.33332 12L3.99999 8.66667L0.666656 12" className={`transition-colors ${isActive ? "stroke-[#FF007A]" : isDark ? "stroke-white" : "stroke-black"}`} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                      {item.title}
                      {item.title === "Trade" && (
                        <svg width="10" height="6" viewBox="0 0 18 10" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${isDropdownOpen ? "" : "rotate-180"}`}>
                          <path d="M17 9L9 1L0.999999 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </motion.div>
                  );
                },
              )}
              {/* Trade sub-items */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden pl-[24px] flex flex-col gap-[2px]"
                  >
                    {tradeItems.map((item) => {
                      const isActive = pathname === item.link;
                      return (
                        <div
                          key={item.link}
                          onClick={() => {
                            handleNavItemClickWithLink(item);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`rounded-[8px] py-[10px] px-[16px] text-[14px] font-medium cursor-pointer transition-colors ${
                            isActive
                              ? "bg-[#FFE6F2] text-[#FF007A]"
                              : isDark
                                ? "text-[#A7A7A7] hover:bg-[#222222]"
                                : "text-[#777777] hover:bg-[#F7F7F7]"
                          }`}
                        >
                          {item.title}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Theme toggle in mobile menu */}
              <div className={`flex items-center justify-between rounded-[8px] py-[10px] px-[16px] mt-[4px] ${isDark ? "text-white" : "text-[#111111]"}`}>
                <span className="text-[14px] font-medium">
                  {isDark ? "Dark mode" : "Light mode"}
                </span>
                <button
                  type="button"
                  className={`flex flex-col justify-center items-center rounded-[8px] py-[8px] px-[8px] border-[1px] cursor-pointer ${isDark ? "border-[#333333]" : "border-[#E2E2E2]"}`}
                  onClick={toggleTheme}
                  aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                >
                  {isDark ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#FF007A" width={16} height={16} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364 6.364l-1.591 1.591M21 12h-2.25m-6.364 6.364l-1.591 1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="#FF007A" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#FF007A" width={16} height={16} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
