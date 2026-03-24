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
    <div className="py-[80px] px-[40px] w-full h-fit">
      <TransactionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
      <Modal open={accountModalTab !== null} onClose={closeAccountModal}>
        {accountModalTab && (
          <AccountModal
            onClose={closeAccountModal}
            defaultTab={accountModalTab}
          />
        )}
      </Modal>
      <div className="flex flex-col gap-[40px] w-full h-fit">
        <div className="flex flex-col gap-[20px] w-full h-fit">
          <div className="flex justify-between w-full items-center">
            <div className="text-[24px] font-bold">Portfolio</div>
            <div className="flex gap-[8px]">
              <Button
                width="w-[79px]"
                text="Deposit"
                size="small"
                type="solid"
                disabled={false}
                onClick={() => openAccountModal("deposit")}
              />
              <Button
                width="w-[79px]"
                text="Withdraw"
                size="small"
                type="solid"
                disabled={false}
                onClick={() => openAccountModal("withdraw")}
              />
              <Button
                width="w-[79px]"
                text="Transfer"
                size="small"
                type="solid"
                disabled={false}
                onClick={() => openAccountModal("transfer")}
              />
              <Button
                width="w-[79px]"
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
