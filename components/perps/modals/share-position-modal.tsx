"use client";

import { useMemo, useState, useRef } from "react";
import Image from "next/image";
import html2canvas from "html2canvas";
import PositionPnlCard from "../position-pnl-card";
import { Modal } from "../../ui/modal";
import { Checkbox } from "../../ui/Checkbox";
import { useTheme } from "@/contexts/theme-context";

type SharePositionModalProps = {
  open: boolean;
  onClose: () => void;
  card: {
    pair: string;
    marketType?: string;
    side: "long" | "short";
    leverage: string;
    pnlAmount: number;
    pnlPercentage: number;
    entryPrice: number;
    currentPrice: number;
    timestamp?: string;
    referralCode?: string;
  };
};

export const SharePositionModal = ({
  open,
  onClose,
  card,
}: SharePositionModalProps) => {
  const { isDark } = useTheme();
  const [showLeverage, setShowLeverage] = useState(true);
  const [showPnlAmount, setShowPnlAmount] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;

    setIsDownloading(true);
    try {
      // Wait a bit to ensure all images are loaded
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Failed to create blob");
          setIsDownloading(false);
          return;
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `position-pnl-${card.pair}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsDownloading(false);
      }, "image/png");
    } catch (error) {
      console.error("Error downloading image:", error);
      setIsDownloading(false);
    }
  };

  const shareItems = useMemo(
    () => [
      { key: "copy", label: "Copy link", icon: "/perp/copy-link.svg" },
      { key: "download", label: "Download", icon: "/perp/download.svg" },
      { key: "x", label: "X", icon: "/perp/twitter.svg" },
      { key: "telegram", label: "Telegram", icon: "/perp/telegram.svg" },
      { key: "reddit", label: "Reddit", icon: "/perp/reddit.svg" },
      { key: "facebook", label: "Facebook", icon: "/perp/facebook.svg" },
    ],
    [],
  );

  const textPrimary = isDark ? "text-[#FFFFFF]" : "text-[#111111]";

  return (
    <Modal open={open} onClose={onClose}>
      <div className={`w-[700px] max-w-[92vw] rounded-[20px] ${isDark ? "bg-[#222222]" : "bg-white"} px-4 py-3`}>
        {/* header */}
        <div className="flex items-start justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full  cursor-pointer flex items-center justify-center hover:bg-black/5 transition"
            aria-label="Close"
          >
            <span className={`text-[20px] leading-none ${isDark ? "text-[#A7A7A7]" : "text-[#6F6F6F]"}`}>×</span>
          </button>
        </div>

        {/* preview */}
        <div className="mt-2 flex justify-center">
          <div ref={cardRef} className="w-full flex justify-center">
            <PositionPnlCard
              {...card}
              showLeverage={showLeverage}
              showPnlAmount={showPnlAmount}
              showPrices={showPrices}
            />
          </div>
        </div>

        {/* options */}
        <div className={`mt-4 sm:mt-2 mx-2 sm:mx-0 rounded-xl sm:rounded-none p-3 sm:p-0 sm:pl-15 flex flex-col items-start ${isDark ? "bg-[#1A1A1A] sm:bg-transparent" : "bg-[#F5F5F5] sm:bg-transparent"}`}>
          <p className={`text-[13px] sm:text-[14px] font-semibold ${textPrimary}`}>
            You can choose whether to share the following information or not
          </p>
          <div className={`mt-2.5 sm:mt-3 flex flex-wrap items-center gap-5 sm:gap-8 text-[13px] ${textPrimary}`}>
            <Checkbox
              label="Leverage"
              checked={showLeverage}
              onChange={(e) => setShowLeverage(e.target.checked)}
            />
            <Checkbox
              label="PnL amount"
              checked={showPnlAmount}
              onChange={(e) => setShowPnlAmount(e.target.checked)}
            />
            <Checkbox
              label="Price"
              checked={showPrices}
              onChange={(e) => setShowPrices(e.target.checked)}
            />
          </div>
        </div>

        {/* share grid */}
        <div className="mt-4 sm:mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-2 gap-y-4 sm:gap-x-5 sm:gap-y-3 px-2 sm:px-10.5 pb-4">
          {shareItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className="cursor-pointer group flex flex-col items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (item.key === "download") {
                  handleDownload();
                }
                // Other share options can be implemented here
              }}
              disabled={item.key === "download" && isDownloading}
            >
              <div className="h-10 w-10 rounded-full overflow-hidden">
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={44}
                  height={44}
                  className={`w-full h-full object-cover ${isDark && (item.key === "copy" || item.key === "download") ? "brightness-0 invert" : ""}`}
                />
              </div>
              <span className={`text-[11px] sm:text-[12px] leading-[16px] sm:leading-[18px] font-medium ${textPrimary}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};
