"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import clsx from "clsx";
import { useLanguage } from "@/lib/i18n";

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseIso(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

interface DatePickerProps {
  /** "YYYY-MM-DD" */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** "YYYY-MM-DD" -- dates after this are disabled (e.g. can't report as-of the future). */
  maxDate?: string;
  placeholder?: string;
  /** Shows a small clear (x) button once a date is picked -- for optional filters
   * (e.g. an unset date range) rather than a report's always-required from/to. */
  clearable?: boolean;
}

export function DatePicker({ value, onChange, disabled, maxDate, placeholder, clearable }: DatePickerProps) {
  const { t } = useLanguage();
  const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => t(`date.month${i}`));
  const DAY_LABELS = Array.from({ length: 7 }, (_, i) => t(`date.day${i}`));
  const parsed = parseIso(value);
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [viewYear, setViewYear] = useState(() => parsed?.y ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsed?.m ?? new Date().getMonth());
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

  function toggleOpen() {
    if (disabled) return;
    const p = parseIso(value);
    setViewYear(p?.y ?? new Date().getFullYear());
    setViewMonth(p?.m ?? new Date().getMonth());
    if (!open && buttonRef.current) {
      // Flip upward when there isn't enough room below -- otherwise the calendar
      // (roughly 380px tall) gets rendered half off-screen or over whatever's below.
      const rect = buttonRef.current.getBoundingClientRect();
      const POPUP_HEIGHT = 380;
      setOpenUpward(window.innerHeight - rect.bottom < POPUP_HEIGHT && rect.top > POPUP_HEIGHT);
    }
    setOpen((o) => !o);
  }

  function stepMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  function selectDay(day: number) {
    onChange(toIso(viewYear, viewMonth, day));
    setOpen(false);
  }

  function selectToday() {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onChange(toIso(now.getFullYear(), now.getMonth(), now.getDate()));
    setOpen(false);
  }

  const max = maxDate ? parseIso(maxDate) : null;
  const maxTime = max ? new Date(max.y, max.m, max.d).getTime() : null;

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  // getDay() is 0=Sunday -- shift so the grid starts on Monday, matching DAY_LABELS.
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const label = parsed
    ? `${parsed.d} ${MONTH_LABELS[parsed.m].slice(0, 3)} ${parsed.y}`
    : placeholder ?? t("date.selectDate");

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className={clsx(
          "flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm transition-colors",
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-emerald-300 hover:bg-emerald-50"
        )}
      >
        <Calendar className="h-4 w-4 text-emerald-600" />
        {label}
        {clearable && parsed && !disabled && (
          <X
            className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-600"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          />
        )}
      </button>

      {open && (
        <div
          className={clsx(
            "absolute left-0 z-50 w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg",
            openUpward ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => stepMonth(-1)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100" aria-label={t("date.prevMonth")}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-zinc-900">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={() => stepMonth(1)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100" aria-label={t("date.nextMonth")}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-zinc-400">
            {DAY_LABELS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const isSelected = parsed?.y === viewYear && parsed?.m === viewMonth && parsed?.d === day;
              const isFuture = maxTime !== null && new Date(viewYear, viewMonth, day).getTime() > maxTime;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isFuture}
                  onClick={() => selectDay(day)}
                  className={clsx(
                    "rounded-lg py-1.5 text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-emerald-600 text-white shadow-sm"
                      : isFuture
                        ? "cursor-not-allowed text-zinc-300"
                        : "text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={selectToday}
            className="mt-2 w-full rounded-lg border border-zinc-200 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            {t("date.today")}
          </button>
        </div>
      )}
    </div>
  );
}
