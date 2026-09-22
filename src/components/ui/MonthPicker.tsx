"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { useLanguage } from "@/lib/i18n";

interface MonthPickerProps {
  /** "YYYY-MM" */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MonthPicker({ value, onChange, disabled }: MonthPickerProps) {
  const { t } = useLanguage();
  const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => t(`date.month${i}`));
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => Number(value.slice(0, 4)));
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedYear, selectedMonth] = value.split("-").map(Number);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggleOpen() {
    if (disabled) return;
    setViewYear(selectedYear);
    setOpen((o) => !o);
  }

  function selectMonth(monthIndex: number) {
    onChange(`${viewYear}-${String(monthIndex + 1).padStart(2, "0")}`);
    setOpen(false);
  }

  const now = new Date();
  const isFutureMonth = (monthIndex: number) => viewYear > now.getFullYear() || (viewYear === now.getFullYear() && monthIndex > now.getMonth());

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className={clsx(
          "flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm transition-colors",
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-emerald-300 hover:bg-emerald-50"
        )}
      >
        <Calendar className="h-4 w-4 text-emerald-600" />
        {MONTH_LABELS[selectedMonth - 1]} {selectedYear}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100"
              aria-label={t("date.prevYear")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-zinc-900">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100"
              aria-label={t("date.nextYear")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_LABELS.map((label, i) => {
              const isSelected = viewYear === selectedYear && i + 1 === selectedMonth;
              const disabledMonth = isFutureMonth(i);
              return (
                <button
                  key={label}
                  type="button"
                  disabled={disabledMonth}
                  onClick={() => selectMonth(i)}
                  className={clsx(
                    "rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-emerald-600 text-white shadow-sm"
                      : disabledMonth
                        ? "cursor-not-allowed text-zinc-300"
                        : "text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700"
                  )}
                >
                  {label.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
