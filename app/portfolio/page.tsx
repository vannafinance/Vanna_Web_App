"use client";

import { useState } from "react";
import { PortfolioSection } from "@/components/portfolio/portfolio-section";
import { Button } from "@/components/ui/button";
import { TransactionHistoryModal } from "@/components/portfolio/transaction-history-modal";
import { Modal } from "@/components/ui/modal";
import { AccountModal } from "@/components/perps/modals/account-modal";

type AccountTab = "deposit" | "withdraw" | "transfer";

export default function PortfolioPage() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<AccountTab | null>(null);

  const openAccountModal = (tab: AccountTab) => setAccountModalTab(tab);
  const closeAccountModal = () => setAccountModalTab(null);

  return (
    <div className="py-6 px-4 sm:py-10 sm:px-6 lg:py-[80px] lg:px-[40px] w-full h-fit">
      <TransactionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
      <Modal open={accountModalTab !== null} onClose={closeAccountModal} bottomSheet>
        {accountModalTab && (
          <AccountModal
            onClose={closeAccountModal}
            defaultTab={accountModalTab}
          />
        )}
      </Modal>
      <div className="flex flex-col gap-6 sm:gap-8 lg:gap-[40px] w-full h-fit">
        <div className="flex flex-col gap-4 sm:gap-[20px] w-full h-fit">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between w-full sm:items-center">
            <div className="text-[20px] sm:text-[24px] font-bold">Portfolio</div>
            <div className="flex gap-[8px] w-full sm:w-auto">
              <Button
                width="flex-1 sm:flex-none sm:w-[79px]"
                text="Deposit"
                size="small"
                type="solid"
                disabled={false}
                onClick={() => openAccountModal("deposit")}
              />
              <Button
                width="flex-1 sm:flex-none sm:w-[79px]"
                text="Withdraw"
                size="small"
                type="solid"
                disabled={false}
                onClick={() => openAccountModal("withdraw")}
              />
              <Button
                width="flex-1 sm:flex-none sm:w-[79px]"
                text="Transfer"
                size="small"
                type="solid"
                disabled={false}
                onClick={() => openAccountModal("transfer")}
              />
              <Button
                width="flex-1 sm:flex-none sm:w-[79px]"
                text="History"
                size="small"
                type="solid"
                disabled={false}
                onClick={() => setIsHistoryOpen(true)}
              />
            </div>
          </div>

          <PortfolioSection />
        </div>
      </div>
    </div>
  );
}
