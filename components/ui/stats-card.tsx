import { useState } from "react";
import { PieChart } from "./pie-chart";
import { useTheme } from "@/contexts/theme-context";

interface StatsCardProps {
  percentage?: number;
  heading: string;
  mainInfo?: string;
  subInfo?: string;
  pie?: boolean;
  tooltip?: string;
  address?: string;
  fullAddress?: string;
  explorerUrl?: string;
}

export const StatsCard = ({
  percentage,
  heading,
  mainInfo,
  subInfo,
  pie,
  address,
  fullAddress,
  explorerUrl,
}: StatsCardProps) => {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const addrToCopy = fullAddress || address;
    if (!addrToCopy || addrToCopy === "N/A") return;
    try {
      await navigator.clipboard.writeText(addrToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = addrToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleOpenExplorer = () => {
    const addr = fullAddress || address;
    if (!addr || addr === "N/A" || !explorerUrl) return;
    window.open(`${explorerUrl}/address/${addr}`, "_blank", "noopener,noreferrer");
  };
  if (pie && percentage) {
    return (
      <div className={`w-full h-fit rounded-[12px] py-[32px] px-[20px] flex ${
        isDark ? "bg-[#222222]" : "bg-[#FFFFFF]"
      }`}>
        <div className="w-full h-fit flex gap-[16px] items-center ">
          <div className="w-[78.65px] h-[78.65px]">
            <PieChart
              percentage={percentage}
              textSize="text-[12px] font-medium "
            />
          </div>

          <div className="w-fit h-fit flex flex-col gap-[6px]">
            <div className={`w-fit h-fit flex gap-[4px] items-center text-[10px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#5C5B5B]"
            }`}>
              {heading}
              <div className="cursor-pointer w-[12px] h-[12px] flex items-center ">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 7.5C5.14167 7.5 5.2605 7.452 5.3565 7.356C5.4525 7.26 5.50033 7.14133 5.5 7V5C5.5 4.85833 5.452 4.73967 5.356 4.644C5.26 4.54833 5.14133 4.50033 5 4.5C4.85867 4.49967 4.74 4.54767 4.644 4.644C4.548 4.74033 4.5 4.859 4.5 5V7C4.5 7.14167 4.548 7.2605 4.644 7.3565C4.74 7.4525 4.85867 7.50033 5 7.5ZM5 3.5C5.14167 3.5 5.2605 3.452 3.356 3.356C5.4525 3.26 5.50033 3.14133 5.5 3C5.49967 2.85867 5.45167 2.74 5.356 2.644C5.26033 2.548 5.14167 2.5 5 2.5C4.85833 2.5 4.73967 2.548 4.644 2.644C4.54833 2.74 4.50033 2.85867 4.5 3C4.49967 3.14133 4.54767 3.26017 4.644 3.3565C4.74033 3.45283 4.859 3.50067 5 3.5ZM5 10C4.30833 10 3.65833 9.86867 3.05 9.606C2.44167 9.34333 1.9125 8.98717 1.4625 8.5375C1.0125 8.08783 0.656334 7.55867 0.394001 6.95C0.131667 6.34133 0.000333966 5.69133 6.32911e-07 5C-0.0003327 4.30867 0.131001 3.65867 0.394001 3.05C0.657001 2.44133 1.01317 1.91217 1.4625 1.4625C1.91183 1.01283 2.441 0.656667 3.05 0.394C3.659 0.131333 4.309 0 5 0C5.691 0 6.341 0.131333 6.95 0.394C7.559 0.656667 8.08817 1.01283 8.5375 1.4625C8.98683 1.91217 9.34317 2.44133 9.6065 3.05C9.86983 3.65867 10.001 4.30867 10 5C9.999 5.69133 9.86767 6.34133 9.606 6.95C9.34433 7.55867 8.98817 8.08783 8.5375 8.5375C8.08683 8.98717 7.55767 9.3435 6.95 9.6065C6.34233 9.8695 5.69233 10.0007 5 10ZM5 9C6.11667 9 7.0625 8.6125 7.8375 7.8375C8.6125 7.0625 9 6.11667 9 5C9 3.88333 8.6125 2.9375 7.8375 2.1625C7.0625 1.3875 6.11667 1 5 1C3.88333 1 2.9375 1.3875 2.1625 2.1625C1.3875 2.9375 1 3.88333 1 5C1 6.11667 1.3875 7.0625 2.1625 7.8375C2.9375 8.6125 3.88333 9 5 9Z"
                    fill="#703AE6"
                  />
                </svg>
              </div>
            </div>
            <div className="w-full h-fit flex flex-col gap-[2px]">
              {mainInfo && (
                <div className={`text-[14px] font-semibold ${
                  isDark ? "text-white" : "text-[#111111]"
                }`}>
                  {mainInfo}
                </div>
              )}
              {subInfo && (
                <div className={`text-[10px] font-medium ${
                  isDark ? "text-[#919191]" : "text-[#5C5B5B]"
                }`}>
                  {subInfo}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cols-span-1 row-span-1 w-full h-fit py-[16px]  ">
      <div className="w-fit h-fit flex flex-col gap-[6px] ">
        <div className={`w-fit h-fit flex gap-[4px] items-center text-[10px] font-medium ${
          isDark ? "text-[#919191]" : "text-[#5C5B5B]"
        }`}>
          {heading}
          <div className="cursor-pointer w-[12px] h-[12px] flex items-center ">
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 7.5C5.14167 7.5 5.2605 7.452 5.3565 7.356C5.4525 7.26 5.50033 7.14133 5.5 7V5C5.5 4.85833 5.452 4.73967 5.356 4.644C5.26 4.54833 5.14133 4.50033 5 4.5C4.85867 4.49967 4.74 4.54767 4.644 4.644C4.548 4.74033 4.5 4.859 4.5 5V7C4.5 7.14167 4.548 7.2605 4.644 7.3565C4.74 7.4525 4.85867 7.50033 5 7.5ZM5 3.5C5.14167 3.5 5.2605 3.452 5.3565 3.356C5.4525 3.26 5.50033 3.14133 5.5 3C5.49967 2.85867 5.45167 2.74 5.356 2.644C5.26033 2.548 5.14167 2.5 5 2.5C4.85833 2.5 4.73967 2.548 4.644 2.644C4.54833 2.74 4.50033 2.85867 4.5 3C4.49967 3.14133 4.54767 3.26017 4.644 3.3565C4.74033 3.45283 4.859 3.50067 5 3.5ZM5 10C4.30833 10 3.65833 9.86867 3.05 9.606C2.44167 9.34333 1.9125 8.98717 1.4625 8.5375C1.0125 8.08783 0.656334 7.55867 0.394001 6.95C0.131667 6.34133 0.000333966 5.69133 6.32911e-07 5C-0.0003327 4.30867 0.131001 3.65867 0.394001 3.05C0.657001 2.44133 1.01317 1.91217 1.4625 1.4625C1.91183 1.01283 2.441 0.656667 3.05 0.394C3.659 0.131333 4.309 0 5 0C5.691 0 6.341 0.131333 6.95 0.394C7.559 0.656667 8.08817 1.01283 8.5375 1.4625C8.98683 1.91217 9.34317 2.44133 9.6065 3.05C9.86983 3.65867 10.001 4.30867 10 5C9.999 5.69133 9.86767 6.34133 9.606 6.95C9.34433 7.55867 8.98817 8.08783 8.5375 8.5375C8.08683 8.98717 7.55767 9.3435 6.95 9.6065C6.34233 9.8695 5.69233 10.0007 5 10ZM5 9C6.11667 9 7.0625 8.6125 7.8375 7.8375C8.6125 7.0625 9 6.11667 9 5C9 3.88333 8.6125 2.9375 7.8375 2.1625C7.0625 1.3875 6.11667 1 5 1C3.88333 1 2.9375 1.3875 2.1625 2.1625C1.3875 2.9375 1 3.88333 1 5C1 6.11667 1.3875 7.0625 2.1625 7.8375C2.9375 8.6125 3.88333 9 5 9Z"
                fill="#703AE6"
              />
            </svg>
          </div>
        </div>
        <div className="w-full h-fit flex flex-col gap-[2px]">
          <div className={`text-[14px] font-semibold ${
            isDark ? "text-white" : "text-[#111111]"
          }`}>
            {mainInfo}
          </div>
          <div className={`text-[10px] font-medium ${
            isDark ? "text-[#919191]" : "text-[#5C5B5B]"
          }`}>
            {subInfo}
          </div>
          {address && (
            <div className="flex gap-[8px] items-center">
              <div className={`text-[14px] font-semibold ${
                isDark ? "text-white" : "text-[#111111]"
              }`}>
                {address}
              </div>
              <div className="w-fit h-fit flex gap-[5px]">
                <div
                  className="cursor-pointer w-[12px] h-[12px] flex items-center"
                  onClick={handleOpenExplorer}
                  title="View on block explorer"
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 9 9"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.65625 1.32687e-06C6.02925 1.32687e-06 5.4345 0.247501 4.992 0.691501L4.4415 1.242C4.22212 1.46005 4.04808 1.71937 3.92939 2.00501C3.81071 2.29064 3.74974 2.59694 3.75 2.90625C3.75 3.20363 3.807 3.4935 3.91425 3.76163L4.52325 3.15225C4.48393 2.90306 4.50376 2.64811 4.58115 2.408C4.65854 2.16788 4.79131 1.94933 4.96875 1.77L5.51963 1.21913C5.66895 1.07006 5.8462 0.951896 6.04123 0.871398C6.23627 0.790901 6.44526 0.749648 6.65625 0.750001C7.08263 0.750001 7.47938 0.916876 7.78125 1.21875C8.0803 1.51912 8.24819 1.92571 8.24819 2.34956C8.24819 2.77341 8.0803 3.18001 7.78125 3.48038L7.23038 4.03125C7.08102 4.18025 6.90376 4.29835 6.70873 4.37878C6.5137 4.45921 6.30472 4.5004 6.09375 4.5C6.01025 4.4995 5.92825 4.49163 5.84775 4.47638L5.23838 5.08613C5.51063 5.19414 5.80085 5.24974 6.09375 5.25C6.72075 5.25 7.3155 5.0025 7.758 4.5585L8.3085 4.008C8.52788 3.78995 8.70193 3.53063 8.82061 3.245C8.93929 2.95936 9.00026 2.65306 9 2.34375C9 1.71675 8.7525 1.13513 8.3085 0.691501C8.09288 0.472217 7.8357 0.29812 7.552 0.179388C7.26831 0.060656 6.96379 -0.000328017 6.65625 1.32687e-06ZM5.73038 2.73038L2.73038 5.73038L3.26963 6.26963L6.26963 3.26963L5.73038 2.73038ZM2.90625 3.75C2.27925 3.75 1.6845 3.9975 1.242 4.4415L0.691501 4.99238C0.472168 5.21038 0.298147 5.46964 0.179467 5.75521C0.0607862 6.04077 -0.000207503 6.347 5.30369e-07 6.65625C5.30369e-07 7.28325 0.2475 7.86488 0.691501 8.3085C0.907126 8.52779 1.1643 8.70188 1.448 8.82061C1.73169 8.93935 2.03621 9.00033 2.34375 9C2.97075 9 3.5655 8.7525 4.008 8.3085L4.5585 7.758C4.77788 7.53995 4.95192 7.28063 5.07061 6.995C5.18929 6.70936 5.25026 6.40306 5.25 6.09375C5.25 5.79638 5.193 5.5065 5.08575 5.23838L4.47638 5.84775C4.51581 6.09697 4.49606 6.35198 4.41874 6.59216C4.34141 6.83234 4.20868 7.05097 4.03125 7.23038L3.48038 7.78125C3.33102 7.93025 3.15376 8.04835 2.95873 8.12878C2.76369 8.20921 2.55472 8.2504 2.34375 8.25C2.13449 8.25052 1.92723 8.20934 1.73407 8.12885C1.54091 8.04837 1.36573 7.9302 1.21875 7.78125C0.919705 7.48088 0.751813 7.07429 0.751813 6.65044C0.751813 6.22659 0.919705 5.81999 1.21875 5.51963L1.76963 4.96875C1.91898 4.81975 2.09624 4.70166 2.29127 4.62123C2.48631 4.54079 2.69528 4.4996 2.90625 4.5C2.98975 4.5005 3.07175 4.50838 3.15225 4.52363L3.76163 3.91425C3.48939 3.80611 3.19918 3.75038 2.90625 3.75Z"
                      fill={isDark ? "#FFFFFF" : "#111111"}
                    />
                  </svg>
                </div>
                <div
                  className="cursor-pointer w-[12px] h-[12px] flex items-center"
                  onClick={handleCopy}
                  title={copied ? "Copied!" : "Copy address"}
                >
                  {copied ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1.5 5.5L4 8L8.5 2"
                        stroke="#22C55E"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="10"
                      height="11"
                      viewBox="0 0 10 11"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1.875 4.875C1.875 3.461 1.875 2.7535 2.3145 2.3145C2.7535 1.875 3.461 1.875 4.875 1.875H6.375C7.789 1.875 8.4965 1.875 8.9355 2.3145C9.375 2.7535 9.375 3.461 9.375 4.875V7.375C9.375 8.789 9.375 9.4965 8.9355 9.9355C8.4965 10.375 7.789 10.375 6.375 10.375H4.875C3.461 10.375 2.7535 10.375 2.3145 9.9355C1.875 9.4965 1.875 8.789 1.875 7.375V4.875Z"
                        stroke={isDark ? "#FFFFFF" : "#111111"}
                        strokeWidth="0.75"
                      />
                      <path
                        d="M1.875 8.875C1.47718 8.875 1.09564 8.71696 0.81434 8.43566C0.533035 8.15436 0.375 7.77282 0.375 7.375V4.375C0.375 2.4895 0.375 1.5465 0.961 0.961C1.547 0.3755 2.4895 0.375 4.375 0.375H6.375C6.77282 0.375 7.15436 0.533035 7.43566 0.81434C7.71696 1.09564 7.875 1.47718 7.875 1.875"
                        stroke={isDark ? "#FFFFFF" : "#111111"}
                        strokeWidth="0.75"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
