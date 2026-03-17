"use client";

import { useTheme } from "@/contexts/theme-context";
import { SpotSwapView } from "@/components/spot/spot-nonorderbook";

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
