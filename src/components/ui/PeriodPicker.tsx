"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { useLanguage } from "@/lib/i18n";
import { Period, PeriodGranularity, monthPeriod, quarterPeriod, yearPeriod, customPeriod, previousPeriod, nextPeriod, periodLabel } from "@/lib/periods";

interface PeriodPickerProps {
  value: Period;
  onChange: (p: Period) => void;
  disabled?: boolean;
}

/** Odoo-style "Month / Quarter / Year / Custom Dates" period picker, with prev/next
 * arrows to step one period at a time -- used by every financial report's filter bar
 * instead of a plain from/to date range, so reports can be viewed (and compared, see
 * ComparisonPicker) a calendar period at a time. */
export function PeriodPicker({ value, onChange, disabled }: PeriodPickerProps) {
  const { t } = useLanguage();
  const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => t(`date.month${i}`));
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [tab, setTab] = useState<PeriodGranularity>(value.granularity);
  const [viewYear, setViewYear] = useState(() => Number(value.from.slice(0, 4)));
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const now = new Date();
  function isFutureMonth(y: number, m: number) {
    return y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth() + 1);
  }

  function toggleOpen() {
    if (disabled) return;
    setTab(value.granularity);
    setViewYear(Number(value.from.slice(0, 4)));
    setCustomFrom(value.from);
    setCustomTo(value.to);
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const POPUP_HEIGHT = 320;
      setOpenUpward(window.innerHeight - rect.bottom < POPUP_HEIGHT && rect.top > POPUP_HEIGHT);
    }
    setOpen((o) => !o);
  }

  function pick(p: Period) {
    onChange(p);
    setOpen(false);
  }

  function step(dir: "prev" | "next") {
    const candidate = dir === "prev" ? previousPeriod(value) : nextPeriod(value);
    if (dir === "next" && isFutureMonth(Number(candidate.from.slice(0, 4)), Number(candidate.from.slice(5, 7)))) return;
    onChange(candidate);
  }

  const todayIso = now.toISOString().slice(0, 10);

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => step("prev")}
        disabled={disabled}
        aria-label={t("periodPicker.previous")}
        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className={clsx(
          "flex items-center gap-2 whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm transition-colors",
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-emerald-300 hover:bg-emerald-50"
        )}
      >
        <Calendar className="h-4 w-4 text-emerald-600" />
        {periodLabel(value, MONTH_LABELS)}
      </button>
      <button
        type="button"
        onClick={() => step("next")}
        disabled={disabled}
        aria-label={t("periodPicker.next")}
        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {open && (
        <div
          className={clsx(
            "absolute left-0 z-40 w-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg",
            openUpward ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
          <div className="mb-3 flex gap-1 rounded-lg bg-zinc-50 p-1">
            {(["month", "quarter", "year", "custom"] as PeriodGranularity[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setTab(g)}
                className={clsx(
                  "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
                  tab === g ? "bg-white text-emerald-700 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                )}
              >
                {t(`periodPicker.${g}`)}
              </button>
            ))}
          </div>

          {tab !== "custom" && (
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={() => setViewYear((y) => y - 1)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-zinc-900">{viewYear}</span>
              <button
                type="button"
                onClick={() => setViewYear((y) => y + 1)}
                disabled={viewYear >= now.getFullYear()}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {tab === "month" && (
            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_LABELS.map((label, i) => {
                const monthNum = i + 1;
                const p = monthPeriod(viewYear, monthNum);
                const isDisabled = isFutureMonth(viewYear, monthNum);
                const isSelected = value.granularity === "month" && value.from === p.from;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => pick(p)}
                    className={clsx(
                      "rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                      isSelected
                        ? "bg-emerald-600 text-white shadow-sm"
                        : isDisabled
                          ? "cursor-not-allowed text-zinc-300"
                          : "text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700"
                    )}
                  >
                    {label.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}

          {tab === "quarter" && (
            <div className="grid grid-cols-2 gap-1.5">
              {[1, 2, 3, 4].map((q) => {
                const p = quarterPeriod(viewYear, q);
                const isDisabled = isFutureMonth(viewYear, (q - 1) * 3 + 1);
                const isSelected = value.granularity === "quarter" && value.from === p.from;
                return (
                  <button
                    key={q}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => pick(p)}
                    className={clsx(
                      "rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                      isSelected
                        ? "bg-emerald-600 text-white shadow-sm"
                        : isDisabled
                          ? "cursor-not-allowed text-zinc-300"
                          : "text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700"
                    )}
                  >
                    {periodLabel(p, MONTH_LABELS)}
                  </button>
                );
              })}
            </div>
          )}

          {tab === "year" && (
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 6 }, (_, i) => viewYear - 2 + i).map((y) => {
                const isDisabled = y > now.getFullYear();
                const isSelected = value.granularity === "year" && Number(value.from.slice(0, 4)) === y;
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => pick(yearPeriod(y))}
                    className={clsx(
                      "rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                      isSelected
                        ? "bg-emerald-600 text-white shadow-sm"
                        : isDisabled
                          ? "cursor-not-allowed text-zinc-300"
                          : "text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700"
                    )}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {tab === "custom" && (
            <div className="space-y-2">
              <label className="block text-xs">
                <span className="mb-1 block text-zinc-500">{t("periodPicker.from")}</span>
                <input
                  type="date"
                  value={customFrom}
                  max={todayIso}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </label>
              <label className="block text-xs">
                <span className="mb-1 block text-zinc-500">{t("periodPicker.to")}</span>
                <input
                  type="date"
                  value={customTo}
                  max={todayIso}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </label>
              <button
                type="button"
                disabled={!customFrom || !customTo || customFrom > customTo}
                onClick={() => pick(customPeriod(customFrom, customTo))}
                className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("periodPicker.apply")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
