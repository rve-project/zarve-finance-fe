"use client";

import { useEffect, useRef, useState } from "react";
import { Check, GitCompare } from "lucide-react";
import clsx from "clsx";
import { useLanguage } from "@/lib/i18n";
import { ComparisonMode } from "@/lib/periods";

interface ComparisonPickerProps {
  value: ComparisonMode;
  onChange: (c: ComparisonMode) => void;
  disabled?: boolean;
}

/** Odoo-style "Comparison: N Previous Periods" picker -- adds extra columns to a
 * report (see expandComparison() in periods.ts) without touching the backend at all;
 * each period is just a separate call to the same *ForUnit report endpoint. */
export function ComparisonPicker({ value, onChange, disabled }: ComparisonPickerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(value.type === "previous" ? value.count : 2);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const label =
    value.type === "none"
      ? t("comparisonPicker.none")
      : value.type === "lastYear"
        ? t("comparisonPicker.lastYearShort")
        : `${t("comparisonPicker.previousShort")}: ${value.count}`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={clsx(
          "flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors",
          value.type === "none"
            ? "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <GitCompare className="h-4 w-4" />
        {label}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange({ type: "none" });
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50"
          >
            {t("comparisonPicker.none")}
            {value.type === "none" && <Check className="h-4 w-4 text-emerald-600" />}
          </button>

          <div
            className={clsx(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-zinc-50",
              value.type === "previous" ? "bg-emerald-50" : ""
            )}
          >
            <button
              type="button"
              onClick={() => onChange({ type: "previous", count })}
              className="flex flex-1 items-center gap-2 text-left"
            >
              {t("comparisonPicker.previous")}
              {value.type === "previous" && <Check className="h-4 w-4 text-emerald-600" />}
            </button>
            <input
              type="number"
              min={1}
              max={12}
              value={count}
              onChange={(e) => {
                const n = Math.min(12, Math.max(1, Number(e.target.value) || 1));
                setCount(n);
                if (value.type === "previous") onChange({ type: "previous", count: n });
              }}
              className="w-14 rounded-lg border border-zinc-200 px-2 py-1 text-right text-sm"
            />
            <span className="ml-1 text-xs text-zinc-400">{t("comparisonPicker.periods")}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onChange({ type: "lastYear" });
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50"
          >
            {t("comparisonPicker.lastYear")}
            {value.type === "lastYear" && <Check className="h-4 w-4 text-emerald-600" />}
          </button>
        </div>
      )}
    </div>
  );
}
