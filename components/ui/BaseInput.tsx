import { useTheme } from "@/contexts/theme-context";

interface BaseInputProps {
  label?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function BaseInput({ label, children, disabled }: BaseInputProps) {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label && (
        <label className={`text-[10px] leading-[15px] font-medium ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>
          {label}
        </label>
      )}

      <div
        className={`h-9 flex items-center rounded-lg px-2 ${
          isDark
            ? `border border-[#333333] ${disabled ? "bg-[#111111]" : "bg-[#111111]"}`
            : `border border-[#E2E2E2] ${disabled ? "bg-[#F4F4F4]" : "bg-white"}`
        }`}
      >
        {children}
      </div>
    </div>
  );
}
