"use client";

import { redirect, usePathname } from "next/navigation";
import { Button } from "./button";
import Image from "next/image";
import { motion } from "framer-motion";

interface Navbar {
  items: {
    title: string;
    link: string;
  }[];
}

export const Navbar = (props: Navbar) => {
  const pathname = usePathname();

  return (
    <motion.div
      className="p-4 w-full flex justify-between"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        className="cursor-pointer"
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
        <Image alt="Vanna" width={153.4} height={48} src={"/logos/vanna.png"} />
      </motion.div>
      <div className="flex gap-16 items-center ">
        {props.items.map((item, idx) => {
          const isActive = pathname === item.link;
          return (
            <motion.div
              key={idx}
              onClick={() => {
                redirect(item.link);
              }}
              className={`font-medium group flex gap-2 items-center hover:text-[#FF007A] cursor-pointer transition-colors ${
                isActive ? "text-[#FF007A]" : ""
              }`}
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
                <svg
                  width="8"
                  height="13"
                  viewBox="0 0 8 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
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
              )}
              {item.title}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="flex gap-6"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      >
        <motion.div
          className="p-2 flex flex-col justify-center items-center cursor-pointer"
          whileHover={{
            scale: 1.1,
            rotate: 180,
            transition: { type: "spring", stiffness: 200, damping: 10 },
          }}
          whileTap={{ scale: 0.9 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#FF007A"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="#FF007A"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
            />
          </svg>
        </motion.div>
        <motion.div
          className="flex flex-col justify-center items-center"
          whileHover={{
            scale: 1.05,
            transition: { type: "spring", stiffness: 300, damping: 20 },
          }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="small"
            type="gradient"
            disabled={false}
            text="Login"
          ></Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
