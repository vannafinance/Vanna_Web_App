"use client";

import { Button } from "./button";
import { ReactNode } from "react";

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
  const containerClasses = `rounded-[20px] bg-[#F7F7F7] p-5 flex flex-col ${gap}`;
  const style = { width };

  return (
    <div className={containerClasses} style={style}>
      {/* Title */}
      <div className="text-[16px] leading-[24px] font-semibold text-[#111111] flex items-center gap-1.5">
        {title}
      </div>

      {/* Subtitle (optional) */}
      {subtitle && (
        <p className="text-[14px] leading-[21px] font-semibold text-[#111111]">
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
