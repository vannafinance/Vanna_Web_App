import { Button } from "../ui/button";

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
    id: 4,
    name: "10k Assets",
    points: "100",
    rewards: "100",
  }
];
export const RewardsTable = () => {
  return (
    <section 
      className="w-full h-[330px] rounded-[16px] border-[1px] border-[#E2E2E2] bg-[#F7F7F7] p-[16px] flex flex-col gap-[16px]"
      aria-label="Rewards Summary"
    >
      <h2 className="w-full h-fit text-[14px] font-semibold text-black">
        Rewards
      </h2>
      <table className="w-full h-fit flex flex-col gap-[4px]" aria-label="Claimable Rewards">
        <thead>
          <tr className="w-full h-fit flex gap-[2px] rounded-[12px]  items-center">
            {rewardsHeading.map((heading) => (
              <th
                key={heading}
                className={` w-full h-full p-[8px] flex items-center ${
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
              className="cursor-pointer    w-full h-fit flex hover:bg-[#F1EBFD] rounded-[8px]  items-center"
            >
              <td className="w-full h-full py-[4px] px-[8px] text-[10px] font-medium text-[#090909] flex items-center">
                {reward.name}
              </td>
              <td className="w-full h-full py-[4px] px-[8px] text-[10px] font-medium text-[#090909] flex items-center">
                {reward.points}
              </td>
              <td className="w-full h-full py-[4px] px-[8px] text-[10px] font-medium text-[#090909] flex items-center">
                {reward.rewards}
              </td>
              <td className="w-full h-full py-[4px] px-[8px] text-[10px] font-medium text-[#090909] flex items-center justify-end">
                <Button text="Claim" size="small" type="solid" disabled={false}  />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
