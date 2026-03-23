"use client";

import { ReactNode, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/theme-context";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  bottomSheet?: boolean;
}

export const Modal = ({ open, onClose, children, bottomSheet = false }: ModalProps) => {
  const { isDark } = useTheme();
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const startDrag = useCallback((clientY: number) => {
    isDragging.current = true;
    dragStartY.current = clientY;
    currentTranslateY.current = 0;
  }, []);

  const moveDrag = useCallback((clientY: number) => {
    if (!isDragging.current || !sheetRef.current) return;
    const diff = clientY - dragStartY.current;
    if (diff > 0) {
      currentTranslateY.current = diff;
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  }, []);

  const endDrag = useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    if (currentTranslateY.current > 150) {
      onClose();
    } else {
      sheetRef.current.style.transform = "translateY(0)";
    }
    currentTranslateY.current = 0;
  }, [onClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startDrag(e.clientY);
    const handleMouseMove = (ev: MouseEvent) => moveDrag(ev.clientY);
    const handleMouseUp = () => {
      endDrag();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [startDrag, moveDrag, endDrag]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Desktop: centered modal (always for non-bottomSheet, md+ for bottomSheet) */}
          <div className={`fixed inset-0 z-[1000] ${bottomSheet ? "hidden min-[550px]:flex" : "flex"} items-center justify-center px-4 md:px-0`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-[1001] w-full max-w-[calc(100vw-32px)] md:w-auto max-h-[85vh] overflow-y-auto scrollbar-hide flex justify-center min-w-0"
            >
              {children}
            </motion.div>
          </div>

          {/* Mobile: bottom sheet (only when bottomSheet=true) */}
          {bottomSheet && (
            <div className="fixed inset-0 z-[1000] flex max-[549px]:flex min-[550px]:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
              />
              <motion.div
                ref={sheetRef}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className={`absolute bottom-0 left-0 right-0 z-[1001] max-h-[90vh] overflow-y-auto scrollbar-hide rounded-t-2xl ${isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"}`}
              >
                {/* Drag handle */}
                <div
                  className={`sticky top-0 z-10 flex justify-center py-3 cursor-grab rounded-t-2xl ${isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"}`}
                  onTouchStart={(e) => startDrag(e.touches[0].clientY)}
                  onTouchMove={(e) => moveDrag(e.touches[0].clientY)}
                  onTouchEnd={endDrag}
                  onMouseDown={handleMouseDown}
                >
                  <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>
                <div className="pb-6 px-1">
                  {children}
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
