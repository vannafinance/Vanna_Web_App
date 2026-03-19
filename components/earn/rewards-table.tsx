import { Button } from "../ui/button";
import { useTheme } from "@/contexts/theme-context";

const rewardsHeading = [
  "Reward Name",
  "Reward (Points)",
  "Rewards (USD)",
  "Claim all",
];

const rewardsData = [
  {
    id: 1,
        name: "2k Assets",
    points: "100",
    rewards: "100",
  },
  {
    id: 2,
    name: "2k Assets",
    points: "100",
    rewards: "100",
  },
  {
    id: 3,
    name: "5k Assets",
    points: "100",
    rewards: "100",
  },
  {
    id: 6,
    name: "10k Assets",
    points: "100",
    rewards: "100",
  }
];
export const RewardsTable = ({height = "330px"}: {height?: string}) => {
  const { isDark } = useTheme();
  const hasRewards = rewardsData.length > 0;
  
  return (
    <section 
      className={`w-full h-auto sm:h-[330px] rounded-[16px] border-[1px] p-3 sm:p-[16px] flex flex-col gap-[16px] ${
        isDark
          ? "bg-[#222222]"
          : "bg-[#F7F7F7]"
      }`}
      aria-label="Rewards Summary"
    >
      <h2 className={`w-full h-fit text-[14px] font-semibold ${
        isDark ? "text-white" : "text-black"
      }`}>
        Rewards
      </h2>
      
      {!hasRewards ? (
        <div className="w-full h-full flex items-center justify-center min-h-[200px]">
          <p className={`text-[14px] font-medium ${
            isDark ? "text-[#707070]" : "text-[#707070]"
          }`}>
            No rewards available
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[320px] sm:min-w-[400px] h-fit flex flex-col gap-[4px]" aria-label="Claimable Rewards">
          <thead>
            <tr className="w-full h-fit flex gap-[2px] rounded-[12px] items-center">
              {rewardsHeading.map((heading) => (
                <th
                  key={heading}
                  className={`w-full h-full p-1.5 sm:p-[8px] flex items-center ${
                    heading === "Claim all" ? "text-center justify-center" : "text-start justify-start"
                  } text-[10px] font-medium text-[#707070]`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="flex flex-col gap-[4px] max-h-[220px] overflow-y-auto">
            {rewardsData.map((reward,idx) => (
              <tr
                key={idx}
                className="cursor-pointer w-full h-fit flex hover:bg-[#F1EBFD] rounded-[8px] items-center group"
              >
                <td className={`w-full h-full py-[4px] px-[8px] text-[10px] font-medium flex items-center ${
                  isDark ? "text-white group-hover:text-[#090909]" : "text-[#090909]"
                }`}>
                  {reward.name}
                </td>
                <td className={`w-full h-full py-[4px] px-[8px] text-[10px] font-medium flex items-center ${
                  isDark ? "text-white group-hover:text-[#090909]" : "text-[#090909]"
                }`}>
                  {reward.points}
                </td>
                <td className={`w-full h-full py-[4px] px-[8px] text-[10px] font-medium flex items-center ${
                  isDark ? "text-white group-hover:text-[#090909]" : "text-[#090909]"
                }`}>
                  {reward.rewards}
                </td>
                <td className={`w-full h-full py-[4px] px-[8px] text-[10px] font-medium flex items-center justify-end ${
                  isDark ? "text-white group-hover:text-[#090909]" : "text-[#090909]"
                }`}>
                  <Button text="Claim" size="small" type="solid" disabled={false}  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </section>
  );
};
