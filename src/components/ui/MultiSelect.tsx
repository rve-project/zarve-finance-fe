"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

export interface MultiSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface MultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  /** Blocks picking more once reached -- already-selected options stay togglable off. */
  max?: number;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

export function MultiSelect({ values, onChange, options, max, placeholder, emptyText, className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      if (max && values.length >= max) return;
      onChange([...values, value]);
    }
  }

  const selectedLabels = options.filter((o) => values.includes(o.value)).map((o) => o.label);

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-left text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50"
      >
        <span className="truncate">{selectedLabels.length ? selectedLabels.join(", ") : (placeholder ?? "Pilih...")}</span>
        <ChevronDown className={clsx("h-4 w-4 shrink-0 text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-72 w-full min-w-[220px] overflow-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
          {options.map((option) => {
            const isSelected = values.includes(option.value);
            const disabled = !isSelected && !!max && values.length >= max;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                disabled={disabled}
                className={clsx(
                  "flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  isSelected ? "bg-emerald-50 font-medium text-emerald-700" : disabled ? "cursor-not-allowed text-zinc-300" : "text-zinc-700 hover:bg-zinc-50"
                )}
              >
                <span className={option.sublabel ? "" : "truncate"}>
                  <span className="block">{option.label}</span>
                  {option.sublabel && <span className="mt-0.5 block text-xs font-normal text-zinc-400">{option.sublabel}</span>}
                </span>
                {isSelected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
              </button>
            );
          })}
          {!options.length && <p className="px-3 py-2 text-sm text-zinc-400">{emptyText ?? "Tidak ada opsi."}</p>}
        </div>
      )}
    </div>
  );
}
