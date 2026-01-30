"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ToggleButton from "../ui/toggle";
import { useState } from "react";

export type ColumnPreferenceItem = {
  id: string;
  label: string;
  hasToggle: boolean; // false means "Not Supported" - can't be toggled
};

type Props = {
  columnItems: ColumnPreferenceItem[];
  visibleColumns: string[];
  columnOrder: string[];
  onToggleColumn: (columnId: string) => void;
  onReorderColumns: (newOrder: string[]) => void;
  onReset: () => void;
  isOpen: boolean;
  onToggle: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  popupRef?: React.RefObject<HTMLDivElement | null>;
};

export default function ColumnPreferencesPopup({
  columnItems,
  visibleColumns,
  columnOrder,
  onToggleColumn,
  onReorderColumns,
  onReset,
  isOpen,
  onToggle,
  buttonRef,
  popupRef,
}: Props) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Get displayed columns (toggle ON) and sort by columnOrder
  const displayedColumns = columnItems
    .filter((col) => !col.hasToggle || visibleColumns.includes(col.id))
    .sort((a, b) => {
      const indexA = columnOrder.indexOf(a.id);
      const indexB = columnOrder.indexOf(b.id);
      // If not in order, put at end
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

  // Get hidden columns (toggle OFF, only those with hasToggle: true)
  const hiddenColumns = columnItems.filter(
    (col) => col.hasToggle && !visibleColumns.includes(col.id),
  );

  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedItem(columnId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", columnId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedItem) return;

    const draggedIndex = displayedColumns.findIndex((col) => col.id === draggedItem);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedItem(null);
      return;
    }

    // Create new order for displayed columns
    const newDisplayedOrder = [...displayedColumns];
    const [removed] = newDisplayedOrder.splice(draggedIndex, 1);
    newDisplayedOrder.splice(dropIndex, 0, removed);

    // Get displayed column IDs in new order
    const newDisplayedIds = newDisplayedOrder.map((col) => col.id);

    // Get hidden column IDs (columns that are in columnOrder but not displayed)
    const displayedSet = new Set(newDisplayedIds);
    const hiddenIds = columnOrder.filter((id) => !displayedSet.has(id));

    // Final order: displayed columns in new order, then hidden columns
    const finalOrder = [...newDisplayedIds, ...hiddenIds];
    
    onReorderColumns(finalOrder);

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  return (
    <div ref={popupRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="cursor-pointer w-7 h-3.5 flex items-center justify-center"
        onClick={onToggle}
      >
        <Image
          src="/icons/filter-icon.svg"
          alt="filter"
          width={24}
          height={24}
          className="w-7 h-3.5"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[580px] bg-[#F7F7F7] rounded-[20px] z-9999 p-6 shadow-[0px_-7px_15px_rgba(0,0,0,0.08),0px_-28px_28px_rgba(0,0,0,0.07)]"
          >
            <div className="flex gap-4">
              {/* Displayed Section */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
                    Displayed({displayedColumns.length})
                  </span>
                  <button
                    type="button"
                    onClick={onReset}
                    className="text-[12px] leading-[18px] font-semibold text-[#111111] hover:text-[#703AE6] cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex flex-col ">
                  {displayedColumns.map((column, index) => (
                    <motion.div
                      key={column.id}
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      draggable={column.hasToggle}
                      onDragStartCapture={(e) =>
                        column.hasToggle && handleDragStart(e, column.id)
                      }
                      onDragOver={(e) =>
                        column.hasToggle && handleDragOver(e, index)
                      }
                      onDragLeave={() => column.hasToggle && handleDragLeave()}
                      onDrop={(e) => column.hasToggle && handleDrop(e, index)}
                      onDragEnd={() => column.hasToggle && handleDragEnd()}
                      className={`flex items-center justify-between transition-colors py-1.5 ${
                        draggedItem === column.id
                          ? "opacity-50"
                          : dragOverIndex === index
                            ? "bg-[#F1EBFD] rounded-md px-2 py-1"
                            : ""
                      }`}
                    >
                      <span className="text-[12px] leading-[18px]  font-medium text-[#111111]">
                        {column.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {column.hasToggle ? (
                          <ToggleButton
                            size="small"
                            defaultChecked={visibleColumns.includes(column.id)}
                            onToggle={() => onToggleColumn(column.id)}
                          />
                        ) : (
                          <span className="text-[10px] leading-[15px] font-medium text-[#A7A7A7]">
                            Not Supported
                          </span>
                        )}
                        {column.hasToggle && (
                          <Image
                            src="/icons/menu-rounded-icon.svg"
                            alt="drag"
                            width={18}
                            height={12}
                            className="cursor-grab active:cursor-grabbing"
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-[#E2E2E2]" />

              {/* Hidden Section */}
              <div className="flex-1 flex flex-col gap-4">
                <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
                  Hidden ({hiddenColumns.length})
                </span>

                <div className="flex flex-col gap-3">
                  {hiddenColumns.map((column) => (
                    <div
                      key={column.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-[12px] leading-[18px] font-medium text-[#111111]">
                        {column.label}
                      </span>
                      <ToggleButton
                        size="small"
                        defaultChecked={false}
                        onToggle={() => onToggleColumn(column.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
