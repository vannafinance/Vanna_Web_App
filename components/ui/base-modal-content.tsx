"use client";

import { Button } from "./button";
import { ReactNode } from "react";
import { useTheme } from "@/contexts/theme-context";

interface BaseModalContentProps {
  title: ReactNode;
  subtitle?: string;
  width?: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  gap?: string;
  hideButtons?: boolean;
}

export const BaseModalContent = ({
  title,
  subtitle,
  width = "400px",
  children,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmDisabled = false,
  gap = "gap-6",
  hideButtons = false,
}: BaseModalContentProps) => {
  const { isDark } = useTheme();
  const containerClasses = `rounded-[20px] p-5 flex flex-col ${gap} ${isDark ? "bg-[#222222] border border-[#333333]" : "bg-[#F7F7F7]"}`;
  const style = { width };

  return (
    <div className={containerClasses} style={style}>
      {/* Title */}
      <div className={`text-[16px] leading-[24px] font-semibold flex items-center gap-1.5 ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>
        {title}
      </div>

      {/* Subtitle (optional) */}
      {subtitle && (
        <p className={`text-[14px] leading-[21px] font-semibold ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>
          {subtitle}
        </p>
      )}

      {/* Custom Content */}
      {children}

      {/* Action Buttons */}
      {!hideButtons && (
        <div className="flex gap-3 mt-auto">
          <div className="flex-1">
            <Button
              text={cancelText}
              size="small"
              type="ghost"
              disabled={false}
              onClick={onClose}
            />
          </div>
          {onConfirm && (
            <div className="flex-1">
              <Button
                text={confirmText}
                size="small"
                type="solid"
                disabled={confirmDisabled}
                onClick={onConfirm}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
