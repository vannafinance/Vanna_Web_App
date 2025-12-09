"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { DropdownOptionsType } from "@/lib/types";
import { DropdownOptions } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { depositPercentage, percentageColors } from "./collateral-box";
import { Dropdown } from "../ui/dropdown";
import { Popup } from "@/components/ui/popup";

export const RepayLoanTab = () => {
  // Repay form state
  // Repay loan statistics
  const [repayStats, setRepayStats] = useState({
    netOutstandingAmountToPay: 0,
    availableBalance: 0,
    frozenBalance: 0,
  });
  const [selectedRepayCurrency, setSelectedRepayCurrency] =
    useState<string>(DropdownOptions[0]);
  const [selectedRepayPercentage, setSelectedRepayPercentage] =
    useState<number>(10);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayAmountInUsd] = useState<number>(0);

  // Popup visibility states
  const [isPayNowPopupOpen, setIsPayNowPopupOpen] = useState(false);
  const [isFlashClosePopupOpen, setIsFlashClosePopupOpen] = useState(false);

  // Handler for percentage click
  const handlePercentageClick = (item: number) => {
    setSelectedRepayPercentage(item);
  };

  // Handler for input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepayAmount(Number(e.target.value));
  };

  // Handler for pay now click
  const handlePayNowClick = () => {
    setIsPayNowPopupOpen(true);
  };

  // Handler for flash close click
  const handleFlashCloseClick = () => {
    setIsFlashClosePopupOpen(true);
  };

  // Handler for closing pay now popup
  const handleClosePayNowPopup = () => {
    setIsPayNowPopupOpen(false);
  };

  // Handler for closing flash close popup
  const handleCloseFlashClosePopup = () => {
    setIsFlashClosePopupOpen(false);
  };

  // Check if buttons should be disabled (when input is 0 or empty)
  const isInputEmpty = repayAmount === 0 || repayAmount === null || repayAmount === undefined;

  return (
    <motion.div
      className="w-full flex flex-col gap-[36px] pt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <motion.div
        className="flex flex-col gap-[43px] h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Repay stats cards */}
        <motion.div
          className="flex justify-between gap-[12px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* Map through repay stats */}
          {Object.entries(repayStats).map(([key, value], index) => {
            return (
              <motion.div
                key={key}
                className="w-full flex flex-col justify-between h-[120px] rounded-[8px] border-[1px] border-[#E2E2E2] p-[16px] bg-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
              >
                <motion.div
                  className="text-[14px] font-medium text-[#9F9F9F] max-w-[158.33px] "
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.2 + index * 0.1,
                    ease: "easeOut",
                  }}
                >
                  {key === "netOutstandingAmountToPay"
                    ? "Net Outstanding Amount to Repay"
                    : key === "availableBalance"
                    ? "Available Balance"
                    : "Frozen Balance"}
                </motion.div>
                <motion.div
                  className="text-[24px] font-bold text-[#181822]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.25 + index * 0.1,
                    ease: "easeOut",
                  }}
                >
                  {value}
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Repay form */}
        <motion.div
          className="bg-white w-full border-[1px] border-[#E2E2E2] rounded-[16px] p-[20px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {/* Currency dropdown and percentage buttons */}
          <motion.div
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            {/* Currency selector */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="p-[10px]"
            >
              <Dropdown
                items={DropdownOptions}
                selectedOption={selectedRepayCurrency}
                setSelectedOption={setSelectedRepayCurrency}
              />
            </motion.div>

            {/* Percentage buttons */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
            >
              <div className="flex gap-[8px]" role="group" aria-label="Repay percentage">
                {depositPercentage.map((item: number, idx: number) => {
                  return (
                    <motion.button
                      type="button"
                      key={item}
                      onClick={() => handlePercentageClick(item)}
                      className={`h-[44px] w-[95px] text-center text-[14px] text-medium cursor-pointer ${
                        selectedRepayPercentage === item
                          ? `${percentageColors[item]} text-white`
                          : "bg-[#F4F4F4]"
                      } p-[10px] rounded-[12px]`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      aria-label={`Repay ${item} percent`}
                      aria-pressed={selectedRepayPercentage === item}
                    >
                      {item}%
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>

          {/* Amount input section */}
          <motion.div
            className="px-[10px] flex flex-col gap-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {/* Repay amount input */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.55, ease: "easeOut" }}
            >
              <label htmlFor="repay-amount-input" className="sr-only">
                Repay amount
              </label>
              <input
                id="repay-amount-input"
                onChange={handleInputChange}
                className="w-full text-[20px] focus:border-[0px] focus:outline-none font-medium transition-transform duration-200 focus:scale-[1.01]"
                type="text"
                placeholder="0.0"
                value={repayAmount}
              />
            </motion.div>

            {/* USD value display */}
            <motion.div
              className="text-[12px] font-medium text-[#76737B]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.65, ease: "easeOut" }}
              aria-live="polite"
            >
              {repayAmountInUsd} USD
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col gap-[16px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          {/* Pay Now button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.5,
            }}
            whileHover={isInputEmpty ? {} : { scale: 1.02 }}
            whileTap={isInputEmpty ? {} : { scale: 0.98 }}
          >
            <Button
              text="Pay Now"
              size="large"
              type="gradient"
              onClick={handlePayNowClick}
              disabled={isInputEmpty}
            />
          </motion.div>

          {/* Flash Close button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.6,
            }}
            whileHover={isInputEmpty ? {} : { scale: 1.02 }}
            whileTap={isInputEmpty ? {} : { scale: 0.98 }}
          >
            <Button
              text="Flash Close"
              size="large"
              type="ghost"
              onClick={handleFlashCloseClick}
              disabled={isInputEmpty}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Pay Now popup */}
      <AnimatePresence>
        {isPayNowPopupOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClosePayNowPopup}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Popup
                icon="/assets/exclamation.png"
                description="Are you sure you want to close this position? This action will lock in your current P&L and cannot be undone."
                buttonText="Close Position"
                buttonOnClick={handleClosePayNowPopup}
                closeButtonText="Cancel"
                closeButtonOnClick={handleClosePayNowPopup}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash Close popup */}
      <AnimatePresence>
        {isFlashClosePopupOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleCloseFlashClosePopup}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Popup
                icon="/assets/lightning.svg"
                description="Are you sure you want to flash close all positions? All open trades will be closed instantly, locking in current P&L, and this action cannot be undone."
                buttonText="Close all Position"
                buttonOnClick={handleCloseFlashClosePopup}
                closeButtonText="Cancel"
                closeButtonOnClick={handleCloseFlashClosePopup}
                iconBgColor="bg-[#F1EBFD]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
