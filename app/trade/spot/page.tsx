"use client";

import dynamic from "next/dynamic";
import { useTheme } from "@/contexts/theme-context";

const SpotSwapView = dynamic(
  () => import("@/components/spot/spot-nonorderbook").then((mod) => mod.SpotSwapView),
  { ssr: false }
);

const Spot = () => {
  const { isDark } = useTheme();

  return (
    <main
      className={`w-full min-h-screen ${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"}`}
    >
      <SpotSwapView />
    </main>
  );
};

export default Spot;
