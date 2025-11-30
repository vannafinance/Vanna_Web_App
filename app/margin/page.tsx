"use client";

import { Carousel } from "@/components/ui/carousel";
import { NetworkDropdown } from "@/components/network-dropdown";
import {
  accountStatsItems,
  carouselItems,
  marginAccountInfoItems,
  marginAccountMoreDetailsItems,
  position,
} from "@/lib/constants";
import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { InfoCard } from "@/components/margin/info-card";
import { LeverageCollateral } from "@/components/margin/leverage-collateral";
import { Positionstable } from "@/components/margin/positions-table";
import { Position } from "@/lib/types";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";

const Margin = () => {
  // Store positions data
  const [positions, setpositions] = useState<Position[]>(position);

  // Account statistics state
  const [accountStats, setAccountStats] = useState({
    netHealthFactor: 567777,
    collateralLeftBeforeLiquidation: 173663,
    netAvailableCollateral: 1000,
    netAmountBorrowed: 770,
    netProfitAndLoss: 0,
  });

  // Get margin account info from global store using selector to prevent unnecessary re-renders
  const totalBorrowedValue = useMarginAccountInfoStore(
    (state) => state.totalBorrowedValue
  );
  const totalCollateralValue = useMarginAccountInfoStore(
    (state) => state.totalCollateralValue
  );
  const totalValue = useMarginAccountInfoStore((state) => state.totalValue);
  const avgHealthFactor = useMarginAccountInfoStore(
    (state) => state.avgHealthFactor
  );
  const timeToLiquidation = useMarginAccountInfoStore(
    (state) => state.timeToLiquidation
  );
  const borrowRate = useMarginAccountInfoStore((state) => state.borrowRate);
  const liquidationPremium = useMarginAccountInfoStore(
    (state) => state.liquidationPremium
  );
  const liquidationFee = useMarginAccountInfoStore(
    (state) => state.liquidationFee
  );
  const debtLimit = useMarginAccountInfoStore((state) => state.debtLimit);
  const minDebt = useMarginAccountInfoStore((state) => state.minDebt);
  const maxDebt = useMarginAccountInfoStore((state) => state.maxDebt);

  // Format data for InfoCard component
  const marginAccountInfo = {
    totalBorrowedValue,
    totalCollateralValue,
    totalValue,
    avgHealthFactor,
    timeToLiquidation,
    borrowRate,
    liquidationPremium,
    liquidationFee,
    debtLimit,
    minDebt,
    maxDebt,
  };

  return (
    <div className=" w-full">
      {/* Carousel section - displays promotional items */}
      <motion.div
        className="w-full pb-[30px] px-[80px] pt-[80px]"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
          delay: 0.2,
        }}
      >
        <Carousel items={carouselItems} autoplayInterval={5000} />
      </motion.div>

      {/* Account stats section - shows key metrics */}
      <motion.div
        className="pb-[30px] px-[80px] pt-[50px] w-full"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="border-[1px] border-[#E2E2E2] bg-[#F7F7F7] rounded-[24px] ">
          <div className="grid grid-cols-3 gap-[20px] p-[20px]">
            {/* Map through account stats items */}
            {accountStatsItems.map((item, idx) => {
              return (
                <motion.div
                  className=" rounded-[10px] col-span-1"
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.4,
                    delay: idx * 0.1,
                    ease: "easeOut",
                  }}
                >
                  <div className="p-[20px] min-h-[146px] flex items-start gap-[16px]">
                    <motion.div
                      className=" w-[52px] h-[52px] flex flex-col justify-center items-center p-[2.89px] bg-white rounded-[69.33px] flex-shrink-0"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.3,
                        delay: idx * 0.1 + 0.2,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      <Image
                        width={23.11}
                        height={23.11}
                        alt={item.id}
                        src={item.icon}
                      />
                    </motion.div>
                    <div className=" flex flex-col gap-[32px] flex-1">
                      <div className="flex flex-col justify-center  w-[284px] h-[50px] text-[20px]  font-semibold">
                        {item.name}
                      </div>
                      <motion.div
                        className="text-[32px] font-bold"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: idx * 0.1 + 0.3 }}
                      >
                        {item.id === "netHealthFactor" ? "" : "$"}
                        {accountStats[item.id as keyof typeof accountStats] ||
                          "0"}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Main leverage section */}
      <motion.div
        className="w-full pb-[30px] px-[80px] pt-[50px] flex flex-col gap-[48px]"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Section header with network dropdown */}
        <motion.div
          className="w-full flex gap-[20px] items-center"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="text-[34px] font-semibold">
            Leverage your Collateral
          </div>
          <div className="flex-shrink-0">
            <NetworkDropdown />
          </div>
        </motion.div>

        {/* Two column layout: Leverage form and Info card */}
        <div className="flex gap-[36px]">
          {/* Left: Leverage collateral form */}
          <LeverageCollateral />

          {/* Right: Margin account info card */}
          <motion.div
            className="flex flex-col gap-[20px] w-full h-full"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Info card header */}
            <motion.div
              className="flex gap-[10px]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Vanna logo icon */}
              <motion.div
                className="border-[1px] border-[#E2E2E2] flex flex-col justify-center items-center p-2 rounded-[11px] w-[62px] h-[62px]"
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              >
                <Image
                  alt={"vanna"}
                  src={"/logos/vanna-icon.png"}
                  width={34.82}
                  height={31.28}
                />
              </motion.div>
              <div>
                <div className="w-full text-[24px] font-bold ">
                  Margin Account Info
                </div>
                <div className="w-full text-[16px] font-medium text-[#A3A3A3]">
                  Stay updated details and status.
                </div>
              </div>
            </motion.div>

            {/* Info card with expandable sections */}
            <InfoCard
              data={marginAccountInfo}
              items={marginAccountInfoItems}
              showExpandable={true}
              expandableSections={[
                {
                  title: "MORE DETAILS",
                  items: marginAccountMoreDetailsItems,
                  defaultExpanded: true,
                  delay: 0.1,
                },
                {
                  title: "ORACLES AND LTS",
                  items: marginAccountMoreDetailsItems,
                  defaultExpanded: false,
                  delay: 0.2,
                },
              ]}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Positions table section */}
      {positions && (
        <motion.div
          className="pb-[30px] px-[80px] pt-[50px]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Positionstable positions={positions} />
        </motion.div>
      )}
    </div>
  );
};

export default Margin;
