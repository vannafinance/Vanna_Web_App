"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import PositionPnlCard from "../position-pnl-card";
import { Modal } from "../../ui/modal";
import { Checkbox } from "../../ui/Checkbox";

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

export const SharePositionModal = ({ open, onClose, card }: SharePositionModalProps) => {
  const [showLeverage, setShowLeverage] = useState(true);
  const [showPnlAmount, setShowPnlAmount] = useState(true);
  const [showPrices, setShowPrices] = useState(true);

  const shareItems = useMemo(
    () => [
      { key: "copy", label: "Copy link", icon: "/icons/share-icon.svg" },
      { key: "download", label: "Download", icon: "/icons/camera.svg" },
      { key: "x", label: "Twitter", textIcon: "X" },
      { key: "telegram", label: "Telegram", textIcon: "TG" },
      { key: "reddit", label: "Reddit", textIcon: "R" },
      { key: "facebook", label: "Facebook", textIcon: "f" },
    ],
    [],
  );

  return (
    <Modal open={open} onClose={onClose}>
      <div className="w-[700px] max-w-[92vw] rounded-[20px] bg-white px-4 py-3">
        {/* header */}
        <div className="flex items-start justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full  cursor-pointer flex items-center justify-center hover:bg-black/5 transition"
            aria-label="Close"
          >
            <span className="text-[20px] leading-none text-[#6F6F6F]">×</span>
          </button>
        </div>

        {/* preview */}
        <div className="mt-2 flex justify-center">
          <div className="w-full flex justify-center">
            <PositionPnlCard
              {...card}
              showLeverage={showLeverage}
              showPnlAmount={showPnlAmount}
              showPrices={showPrices}
            />
          </div>
        </div>

        {/* options */}
        <div className="mt-2 w-full flex flex-col items-start justify-center pl-15 ">
          <p className="text-[14px] font-semibold text-[#111111]">
            You can choose whether to share the following information
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-8 text-[13px] text-[#111111]">
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
        <div className="mt-2 grid grid-cols-4 gap-x-5 gap-y-3 md:grid-cols-6 px-10.5 pb-4">
          {shareItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className="cursor-pointer group flex flex-col items-center gap-2"
              onClick={() => {
                // UI-only for now; hook up actual share/copy/download when needed.
              }}
            >
              <div className="h-11 w-11 rounded-full bg-[#F3F3F3] flex items-center justify-center group-hover:bg-[#EAEAEA] transition">
                {item.icon ? (
                  <Image src={item.icon} alt={item.label} width={18} height={18} />
                ) : (
                  <span className="text-[14px] font-semibold text-[#111111]">
                    {item.textIcon}
                  </span>
                )}
              </div>
              <span className="text-[12px] text-[#111111]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

