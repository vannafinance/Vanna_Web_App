import { Button } from "../ui/button";

const supplyApyPopupItem = [
  {
    title: "Organic APY",
    description: "Yield from lending funds",
    oneDay: "0.60%",
    sevenDay: "0.54%",
  },
  {
    title: "WMON Incentive",
    description: "Calculated at the current rate",
    oneDay: "9.48%",
    sevenDay: "0.54%",
  },
];

interface SupplyApyPopupProps {
  onClose?: () => void;
}

export const SupplyApyPopup = ({ onClose }: SupplyApyPopupProps) => {
  return (
    <div className="shadow-md w-[349px] h-fit rounded-[12px] p-[16px] flex flex-col gap-[16px] bg-[#FFFFFF] ">
      <div className="w-full h-fit flex flex-col gap-[12px] ">
        <div className="w-full h-fit flex justify-between items-center border-[1px] border-[#E2E2E2] bg-[#F7F7F7] p-[12px] rounded-[8px]">
          <div className="text-[10px] font-medium w-full">APY TYPE</div>
          <div className="w-[137.5px] h-fit flex justify-between items-center ">
            <div className="text-[10px] font-medium w-full ">1D</div>
            <div className="text-[10px] font-medium w-full ">7D</div>
          </div>
        </div>
        <div className="w-full h-fit flex flex-col gap-[4px] ">
          {supplyApyPopupItem.map((item) => {
            return (
              <div
                key={item.title}
                className="w-full h-fit rounded-[8px] flex justify-between items-center py-[8px] px-[12px] bg-[#FBFBFB]"
              >
                <div className="w-full h-fit flex flex-col gap-[4px] ">
                  <div className="w-full text-[10px] font-semibold">
                    {item.title}
                  </div>
                  <div className="w-full text-[10px] font-medium text-[#5C5B5B] ">
                    {item.description}
                  </div>
                </div>
                <div className="flex justify-between items-center w-[137.5px] h-fit ">
                  <div className="text-[10px] font-semibold w-full ">
                    {item.oneDay}
                  </div>
                  <div className="text-[10px] font-semibold w-full ">
                    {item.sevenDay}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="w-[317px] h-px bg-[#E2E2E2]" />
        <div className="w-full h-fit flex justify-between items-center ">
          <div className="text-[10px] font-semibold w-full">Overall APY</div>
          <div className="flex justify-between items-center  w-[137.5px] h-fit ">
            <div className="text-[10px] font-semibold w-full ">10.08%</div>
            <div className="text-[10px] font-semibold w-full ">10.02%</div>
          </div>
        </div>
      </div>
      <Button
        text="Close"
        size="small"
        type="ghost"
        disabled={false}
        onClick={onClose || (() => {})}
      />
    </div>
  );
};
