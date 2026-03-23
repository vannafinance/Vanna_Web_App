"use client";

import { useTheme } from "@/contexts/theme-context";
import cn from "classnames";
import React, { useRef, useState, useEffect } from "react";

export type Align = "left" | "center" | "right";

export type Column<T> = {
  // header label
  header: React.ReactNode;
  // unique id for each column
  id: string;
  // which field to show (optional if you use render)
  accessorKey?: keyof T;
  // custom cell rendering
  render?: (row: T) => React.ReactNode;
  className?: string;
  align?: Align;
  // sticky column (right side)
  sticky?: boolean;
};

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  // Unique key for each row
  getRowKey: (row: T, index: number) => string;
  className?: string;
  emptyText?: string;
}

export function Table<T>({
  columns,
  data,
  getRowKey,
  className,
  emptyText = "",
}: TableProps<T>) {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolledToRight, setIsScrolledToRight] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      // Consider "at right" if within 2px of the end
      const atRight = scrollLeft + clientWidth >= scrollWidth - 2;
      setIsScrolledToRight(atRight);
    };

    // Check initial state
    checkScroll();

    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-[340px]     overflow-x-auto overflow-y-auto scrollbar-hide ",
        className
      )}
    >
      <table className="min-w-full table-fixed border-separate border-spacing-y-2 ">
        {/* HEADER */}
        <thead className={`sticky top-0 z-20 ${isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"}`}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className={cn(
                  `px-2 py-1 text-[12px] leading-[18px] h-8 font-medium text-[#919191] text-left whitespace-nowrap border-b ${isDark ? "border-[#333333]" : "border-[#E8E8E8]"}`,
                  col.className ?? "min-w-[120px]",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right",
                  col.sticky && `sticky right-0 z-30 ${isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"}`,
                  col.sticky && !isScrolledToRight && "shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* BODY */}
        <tbody className="gap-2">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-xs text-[#919191]"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={getRowKey ? getRowKey(row, index) : index}>
                {columns.map((col) => {
                  const content: React.ReactNode = col.render
                    ? col.render(row)
                    : col.accessorKey
                    ? String(row[col.accessorKey])
                    : null;

                  return (
                    <td
                      key={col.id}
                      className={cn(
                        `text-[12px] text-left leading-[18px] font-medium px-2 py-1 align-top ${isDark ? "text-[#FFFFFF]" : "text-[#222222]"}`,

                        col.className ?? "min-w-[120px]",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right",
                        col.sticky && `sticky right-0 z-10 ${isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"}`,
                        col.sticky && !isScrolledToRight && "shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]"
                      )}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
