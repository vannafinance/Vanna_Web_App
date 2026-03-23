"use client";

import Image from "next/image";

type PositionSide = "long" | "short";

type PositionPnlCardProps = {
  pair: string;
  marketType?: string;
  side: PositionSide;
  leverage: string;
  pnlAmount: number;
  pnlPercentage: number;
  entryPrice: number;
  currentPrice: number;
  timestamp?: string;
  referralCode?: string;
  showLeverage?: boolean;
  showPnlAmount?: boolean;
  showPrices?: boolean;
};

const formatNumber = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function PositionPnlCard({
  pair,
  marketType = "Perpetual",
  side,
  leverage,
  pnlAmount,
  pnlPercentage,
  entryPrice,
  currentPrice,
  timestamp,
  referralCode = "W28LSP7U",
  showLeverage = true,
  showPnlAmount = true,
  showPrices = true,
}: PositionPnlCardProps) {
  const isProfit = pnlAmount >= 0;

  const accentColor = isProfit ? "#32E2EE" : "#FC5457";
  const sideLabelColor = side === "long" ? "#32E2EE" : "#FC5457";

  return (
    <div
      className="relative w-full max-w-[560px] overflow-hidden rounded-[24px]
                 border border-[#404040]
                 px-4 sm:px-7 pt-5 sm:pt-6 pb-4 sm:pb-5 text-white
                 "
      style={{
        background: isProfit
          ? "linear-gradient(135deg, rgba(17,17,17,1) 0%, rgba(20,25,30,1) 50%, rgba(17,17,17,1) 100%)"
          : "linear-gradient(135deg, rgba(17,17,17,1) 0%, rgba(25,15,15,1) 50%, rgba(17,17,17,1) 100%)",
      }}
    >
      {/* Arrow area circular/oval glow (blended, no hard edges) */}
      <div
        className="pointer-events-none absolute inset-y-6 right-6 z-1"
        style={{
          width: "48%",
          height: "78%",
          borderRadius: 9999,
          filter: "blur(18px)",
          opacity: 0.95,
          background: isProfit
            ? `radial-gradient(
                ellipse at 55% 50%,
                rgba(50,226,238,0.22) 0%,
                rgba(50,226,238,0.14) 18%,
                rgba(50,226,238,0.08) 34%,
                rgba(50,226,238,0.03) 48%,
                rgba(50,226,238,0) 62%
              )`
            : `radial-gradient(
                ellipse at 55% 50%,
                rgba(252,84,87,0.22) 0%,
                rgba(252,84,87,0.14) 18%,
                rgba(252,84,87,0.08) 34%,
                rgba(252,84,87,0.03) 48%,
                rgba(252,84,87,0) 62%
              )`,
        }}
      />
      <div className="relative z-5 flex items-start justify-between">
        <Image src="/perp/vanna.png" alt="Vanna" width={100} height={40} />
        {timestamp && (
          <span className="text-[11px] text-[#CFCFCF]">{timestamp}</span>
        )}
      </div>

      <div className="relative z-5 mt-3 sm:mt-5 flex items-center gap-2 sm:gap-3 flex-wrap text-[10px] sm:text-[11px] text-[#D0D0D0]">
        <span>{pair}</span>
        <span className="h-1 w-1 rounded-full bg-[#555]" />
        <span>{marketType}</span>
        <span className="h-1 w-1 rounded-full bg-[#555]" />
        <span style={{ color: sideLabelColor }} className="capitalize">
          {side}
        </span>
        {showLeverage && (
          <>
            <span className="h-1 w-1 rounded-full bg-[#555]" />
            <span>{leverage}</span>
          </>
        )}
      </div>

      <div className="relative z-5 mt-4 sm:mt-6">
        {showPnlAmount && (
          <p
            className="text-[11px] sm:text-[12px] leading-[18px] font-medium"
            style={{ color: isProfit ? "#32E2EE" : "#FFC6C7" }}
          >
            {pnlAmount >= 0 ? "+" : "-"}
            {formatNumber(Math.abs(pnlAmount))} USDT
          </p>
        )}
        <p
          className={`${showPnlAmount ? "mt-1" : ""} text-[32px] sm:text-[44px] font-semibold leading-none`}
          style={{ color: accentColor }}
        >
          {pnlPercentage >= 0 ? "+" : "-"}
          {formatNumber(Math.abs(pnlPercentage))}%
        </p>
      </div>

      {showPrices && (
        <div className="relative z-5 mt-4 sm:mt-6 grid grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-3 text-[11px] sm:text-[12px] leading-[18px] max-w-[300px]">
          <div>
            <p className="text-[#9A9A9A]">Entry Price</p>
            <p className="text-[14px] sm:text-[16px] font-semibold">
              {formatNumber(entryPrice)}
            </p>
          </div>
          <div>
            <p className="text-[#9A9A9A]">Current Price</p>
            <p className="text-[14px] sm:text-[16px] font-semibold">
              {formatNumber(currentPrice)}
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-y-6 right-6 z-3 flex items-center">
        <Image
          src={
            isProfit
              ? "/perp/position-in-profit.png"
              : "/perp/position-in-loss.png"
          }
          alt="Position"
          width={520}
          height={620}
          className="h-[82%] w-auto object-contain "
        />
      </div>

      <div
        className="relative z-5 mt-4 sm:mt-6 flex items-center gap-3 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] "
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(29,29,29,0.1))",
        }}
      >
        <div className="h-10 w-10 p-1 rounded-md bg-white overflow-hidden">
          <Image
            src="/perp/referral-qr-placeholder.png"
            alt="QR"
            width={40}
            height={40}
          />
        </div>
        <div>
          <p className="text-white text-[12px] leading-[18px] font-semibold">
            Referral Code: {referralCode}
          </p>
          <p className="text-[10px] leading-[15px] text-white">
            Scan and sign up on Vanna to get 6200 USDT now.
          </p>
        </div>
      </div>
    </div>
  );
}
