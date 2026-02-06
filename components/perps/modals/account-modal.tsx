"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { BaseModalContent } from "../../ui/base-modal-content";
import { AnimatedTabs } from "../../ui/animated-tabs";
import { DepositTab, DepositTabRef } from "./account-deposit-tab";
import { WithdrawTab, WithdrawTabRef } from "./account-withdraw-tab";
import { TransferTab, TransferTabRef } from "./account-transfer-tab";

type AccountTab = "deposit" | "withdraw" | "transfer";

const ACCOUNT_TABS = [
  { id: "deposit", label: "Deposit" },
  { id: "withdraw", label: "Withdraw" },
  { id: "transfer", label: "Transfer" },
];

interface AccountModalProps {
  onClose: () => void;
  defaultTab?: AccountTab;
}

export const AccountModal = ({
  onClose,
  defaultTab = "deposit",
}: AccountModalProps) => {
  const [activeTab, setActiveTab] = useState<AccountTab>(defaultTab);
  const [isFormValid, setIsFormValid] = useState(false);

  // Refs for each tab
  const depositRef = useRef<DepositTabRef>(null);
  const withdrawRef = useRef<WithdrawTabRef>(null);
  const transferRef = useRef<TransferTabRef>(null);

  const handleValidChange = useCallback((isValid: boolean) => {
    setIsFormValid(isValid);
  }, []);

  const handleTabChange = (tab: AccountTab) => {
    setActiveTab(tab);
    setIsFormValid(false);
  };

  const getActiveTabRef = () => {
    switch (activeTab) {
      case "deposit":
        return depositRef.current;
      case "withdraw":
        return withdrawRef.current;
      case "transfer":
        return transferRef.current;
    }
  };

  const handleSubmit = () => {
    const tabRef = getActiveTabRef();
    if (tabRef) {
      const data = tabRef.getData();
      console.log({
        action: activeTab,
        ...data,
      });
    }
    onClose();
  };

  const getButtonText = () => {
    switch (activeTab) {
      case "deposit":
        return "Deposit";
      case "withdraw":
        return "Withdraw";
      case "transfer":
        return "Transfer";
    }
  };

  return (
    <BaseModalContent
      title="Account"
      width="400px"
      gap="gap-4"
      onClose={onClose}
      onConfirm={handleSubmit}
      confirmText={getButtonText()}
      confirmDisabled={!isFormValid}
    >
      {/* Tabs + History Icon Row */}
      <div className="flex items-center justify-between">
        <AnimatedTabs
          type="ghost-compact"
          tabs={ACCOUNT_TABS}
          activeTab={activeTab}
          onTabChange={(tabId) => handleTabChange(tabId as AccountTab)}
        />

        {/* History Icon */}
        <button
          type="button"
          className="cursor-pointer p-2 hover:bg-[#E2E2E2] rounded-lg transition-colors"
          aria-label="Transaction History"
        >
          <Image
            src="/icons/transaction-history-icon.svg"
            width={24}
            height={24}
            alt="Transaction History"
          />
        </button>
      </div>

      {activeTab === "deposit" && (
        <DepositTab ref={depositRef} onValidChange={handleValidChange} />
      )}
      {activeTab === "withdraw" && (
        <WithdrawTab ref={withdrawRef} onValidChange={handleValidChange} />
      )}
      {activeTab === "transfer" && (
        <TransferTab ref={transferRef} onValidChange={handleValidChange} />
      )}
    </BaseModalContent>
  );
};
