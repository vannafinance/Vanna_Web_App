"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { tradeItems } from "@/lib/constants";
import { useTheme } from "@/contexts/theme-context";
import { useUserStore } from "@/store/user";
import { SunIcon, MoonIcon } from "@/components/icons";
import { gsap } from "gsap";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownItemsRef = useRef<HTMLDivElement[]>([]);

  // Cleanup timeout on unmount
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
      // Opening animation
      gsap.fromTo(
        dropdownRef.current,
        {
          height: 0,
          opacity: 0,
        },
        {
          height: "auto",
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        }
      );

      // Stagger animation for items
      if (dropdownItemsRef.current.length > 0) {
        gsap.fromTo(
          dropdownItemsRef.current,
          {
            opacity: 0,
            y: -10,
          },
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
      // Closing animation
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

        {/* Navigation items - hidden below lg, shown on lg+ */}
        <div className="hidden lg:flex gap-[20px] items-center">
          {groupedItems.primary.map((item, idx) => {
            // Check if current item is active
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
              // For Trade button, check if current path matches Trade link or any trade dropdown item
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
            // Check if current item is active
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
          {/* Deposit button - hidden below 550px, shown on 550px+ */}
          {userAddress && (
            <div className="hidden min-[550px]:block">
              <Button
                size="small"
                type="navbar"
                disabled={false}
                onClick={() => {
                  // TODO: Implement deposit logic
                }}
                text="DEPOSIT"
                ariaLabel="Deposit to your account"
              ></Button>
            </div>
          )}
          {/* Theme toggle button - hidden below lg, shown on lg+ */}
          <button
            type="button"
            className="hidden lg:flex flex-col justify-center items-center rounded-[8px] py-[12px] px-[10px] h-[44px] border-[1px] cursor-pointer"
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
              {/* Sun icon (dark mode) */}
              {isDark ? (
                <SunIcon />
              ) : (
                // Moon icon (light mode)
                <MoonIcon />
              )}
            </motion.div>
          </button>
          {/* Login button - hidden below lg, shown on lg+ */}
          {!userAddress ? (
            <div className="hidden lg:block">
              <Button
                size="small"
                type="navbar"
                disabled={false}
                onClick={() => {
                  setUserAddress({
                    address: "0x1234567890123456789012345678901234567890",
                  });
                }}
                text="Login"
                ariaLabel="Login to your account"
              ></Button>
            </div>
          ) : (
            <div
              onClick={() => {
                setUserAddress({ address: null });
              }}
              className={`hidden lg:block cursor-pointer py-[12px] px-[24px] text-[16px] font-semibold rounded-[8px] h-full w-fit ${
                isDark ? "bg-[#222222] text-white" : "bg-[#F4F4F4]"
              }`}
            >
              {userAddress.slice(0, 6) + "..." + userAddress.slice(-4)}
            </div>
          )}
          {/* Hamburger menu button - shown below lg, hidden on lg+ */}
          <motion.button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden flex flex-col justify-center items-center rounded-[8px] py-[12px] px-[10px] h-[44px] border-[1px] cursor-pointer"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-[24px] h-[24px] flex flex-col justify-center items-center gap-[4px]">
              <motion.span
                className={`w-full h-[2px] rounded-full ${
                  isDark ? "bg-white" : "bg-black"
                }`}
                animate={{
                  rotate: isMobileMenuOpen ? 45 : 0,
                  y: isMobileMenuOpen ? 6 : 0,
                }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className={`w-full h-[2px] rounded-full ${
                  isDark ? "bg-white" : "bg-black"
                }`}
                animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className={`w-full h-[2px] rounded-full ${
                  isDark ? "bg-white" : "bg-black"
                }`}
                animate={{
                  rotate: isMobileMenuOpen ? -45 : 0,
                  y: isMobileMenuOpen ? -6 : 0,
                }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Mobile Menu - Slide in from right */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Slide-in menu */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed top-0 right-0 h-full w-[320px] max-w-[85vw] z-50 lg:hidden overflow-y-auto ${
                isDark ? "bg-[#111111]" : "bg-white"
              } shadow-2xl`}
            >
              <div className="flex flex-col h-full">
                {/* Header with close button */}
                <div className="flex justify-between items-center p-[20px] border-b-[1px] border-[#333]">
                  <h2 className={`text-[18px] font-semibold ${isDark ? "text-white" : "text-black"}`}>
                    Menu
                  </h2>
                  <motion.button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`p-[8px] rounded-[8px] ${isDark ? "hover:bg-[#222222]" : "hover:bg-[#F4F4F4]"}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close menu"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={isDark ? "stroke-white" : "stroke-black"}
                    >
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.button>
                </div>

                {/* Menu Content */}
                <div className="flex-1 p-[20px] flex flex-col gap-[16px]">
                  {/* Primary nav items */}
                  {groupedItems.primary.map((item) => {
                    const isActive = pathname === item.link;
                    return (
                      <motion.button
                        key={item.link}
                        onClick={() => {
                          handleNavItemClickWithLink(item);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`text-left rounded-[8px] py-[12px] px-[16px] text-[14px] font-medium transition-colors ${
                          isActive
                            ? "bg-[#FFE6F2] text-[#FF007A]"
                            : isDark
                            ? "text-white hover:bg-[#222222]"
                            : "text-black hover:bg-[#F4F4F4]"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {item.title}
                      </motion.button>
                    );
                  })}

                  {/* Bordered nav items */}
                  {groupedItems.bordered.map((item) => {
                    const isActive =
                      item.title === "Trade"
                        ? pathname === item.link ||
                          tradeItems.some((tradeItem) => pathname === tradeItem.link)
                        : pathname === item.link;
                    return (
                      <motion.button
                        key={item.link}
                        onClick={() => {
                          handleNavItemClickWithLink(item);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`text-left rounded-[8px] py-[12px] px-[16px] text-[14px] font-medium transition-colors ${
                          isActive
                            ? "bg-[#FFE6F2] text-[#FF007A]"
                            : isDark
                            ? "text-white hover:bg-[#222222]"
                            : "text-black hover:bg-[#F4F4F4]"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {item.title}
                      </motion.button>
                    );
                  })}

                  {/* Secondary nav items */}
                  {groupedItems.secondary.map((item) => {
                    const isActive = pathname === item.link;
                    return (
                      <motion.button
                        key={item.link}
                        onClick={() => {
                          handleNavItemClickWithLink(item);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`text-left rounded-[8px] py-[12px] px-[16px] text-[14px] font-medium transition-colors ${
                          isActive
                            ? "bg-[#FFE6F2] text-[#FF007A]"
                            : isDark
                            ? "text-white hover:bg-[#222222]"
                            : "text-black hover:bg-[#F4F4F4]"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {item.title}
                      </motion.button>
                    );
                  })}

                  {/* Divider */}
                  <div className={`h-[1px] ${isDark ? "bg-[#333]" : "bg-[#E2E2E2]"}`} />

                  {/* Deposit button */}
                  {userAddress && (
                    <div className="w-full">
                      <Button
                        size="small"
                        type="navbar"
                        disabled={false}
                        onClick={() => {
                          // TODO: Implement deposit logic
                          setIsMobileMenuOpen(false);
                        }}
                        text="DEPOSIT"
                        ariaLabel="Deposit to your account"
                      ></Button>
                    </div>
                  )}

                  {/* Theme toggle */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`w-full flex items-center justify-between rounded-[8px] py-[12px] px-[16px] text-[14px] font-medium transition-colors ${
                      isDark
                        ? "text-white hover:bg-[#222222]"
                        : "text-black hover:bg-[#F4F4F4]"
                    }`}
                    aria-label={
                      isDark ? "Switch to light theme" : "Switch to dark theme"
                    }
                  >
                    <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    <div className="w-[24px] h-[24px] flex items-center justify-center">
                      {isDark ? <SunIcon /> : <MoonIcon />}
                    </div>
                  </button>

                  {/* Login button or Address */}
                  {!userAddress ? (
                    <div className="w-full">
                      <Button
                        size="small"
                        type="navbar"
                        disabled={false}
                        onClick={() => {
                          setUserAddress({
                            address: "0x1234567890123456789012345678901234567890",
                          });
                          setIsMobileMenuOpen(false);
                        }}
                        text="Login"
                        ariaLabel="Login to your account"
                      ></Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setUserAddress({ address: null });
                        setIsMobileMenuOpen(false);
                      }}
                      className={`cursor-pointer py-[12px] px-[24px] text-[16px] font-semibold rounded-[8px] text-center ${
                        isDark ? "bg-[#222222] text-white" : "bg-[#F4F4F4] text-black"
                      }`}
                    >
                      {userAddress.slice(0, 6) + "..." + userAddress.slice(-4)}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
    </div>
  );
};
