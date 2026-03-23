"use client";

import { PortfolioSection } from "@/components/portfolio/portfolio-section";
import { Button } from "@/components/ui/button";

export default function PortfolioPage() {
  return (
    <div className="py-[80px] px-[40px] w-full h-fit">
      <div className="flex flex-col gap-[40px] w-full h-fit">
        <div className="flex flex-col gap-[20px] w-full h-fit">
          <div className="flex justify-between w-full items-center">
            <div className="text-[24px] font-bold">Portfolio</div>
            <div className="flex gap-[8px]">
              <Button width="w-[79px]" text="Deposit" size="small" type="solid" disabled={false} />
              <Button width="w-[79px]" text="Withdraw" size="small" type="solid" disabled={false} />
              <Button width="w-[79px]" text="Transfer" size="small" type="solid" disabled={false} />
              <Button width="w-[79px]" text="History" size="small" type="solid" disabled={false} />
            </div>
          </div>

          <PortfolioSection />
        </div>
      </div>
    </div>
  );
}
