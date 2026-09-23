"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

export interface DropdownOption {
  value: string;
  label: string;
  /** Extra explanatory text shown under the label in the option list (not in the
   * closed button) -- e.g. Mekari's "Single"/"Bundle" product type picker. */
  description?: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

export function Dropdown({ value, onChange, options, disabled, loading, placeholder, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const selected = options.find((o) => o.value === value);
  const isDisabled = disabled || loading;

  function toggleOpen() {
    if (isDisabled) return;
    if (!open && buttonRef.current) {
      // Flip upward when there isn't enough room below -- otherwise the option list
      // gets rendered half off-screen or over whatever's below.
      const rect = buttonRef.current.getBoundingClientRect();
      const POPUP_HEIGHT = 288;
      setOpenUpward(window.innerHeight - rect.bottom < POPUP_HEIGHT && rect.top > POPUP_HEIGHT);
    }
    setOpen((o) => !o);
  }

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        disabled={isDisabled}
        className={clsx(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-left text-sm font-medium text-zinc-800 shadow-sm transition-colors",
          isDisabled ? "cursor-not-allowed opacity-60" : "hover:border-emerald-300 hover:bg-emerald-50"
        )}
      >
        <span className="truncate">{loading ? "Memuat..." : selected?.label ?? placeholder ?? "Pilih..."}</span>
        <ChevronDown className={clsx("h-4 w-4 shrink-0 text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && !isDisabled && (
        <div
          className={clsx(
            "absolute left-0 z-50 max-h-72 w-full min-w-[220px] overflow-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg",
            openUpward ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={clsx(
                  "flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  isSelected ? "bg-emerald-50 font-medium text-emerald-700" : "text-zinc-700 hover:bg-zinc-50"
                )}
              >
                <span className={option.description ? "" : "truncate"}>
                  <span className="block">{option.label}</span>
                  {option.description && <span className="mt-0.5 block text-xs font-normal text-zinc-400">{option.description}</span>}
                </span>
                {isSelected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
              </button>
            );
          })}
          {options.length === 0 && <p className="px-3 py-2 text-sm text-zinc-400">Tidak ada opsi.</p>}
        </div>
      )}
    </div>
  );
}
