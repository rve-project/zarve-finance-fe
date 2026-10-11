"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
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
  /** Renders a "+ {createLabel}" row at the bottom of the list (after the current
   * search query, if any, filtered results) that calls back with the query typed so
   * far -- e.g. to open a quick-add modal pre-filled with what the user was searching
   * for. Omit to leave the dropdown as a plain picker. */
  onCreateNew?: (query: string) => void;
  createLabel?: string;
  /** Lets a selection be cleared back to "" -- an "x" button on the closed field, and
   * clicking the already-selected option in the list toggles it off. Off by default:
   * most dropdowns in this app are required fields where an empty value would leave the
   * form invalid, so this only goes on fields (like a line's optional Pajak) where "no
   * selection" is itself a valid, meaningful state. */
  clearable?: boolean;
}

export function Dropdown({
  value,
  onChange,
  options,
  disabled,
  loading,
  placeholder,
  className,
  onCreateNew,
  createLabel = "Tambah baru",
  clearable = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ top: number | null; bottom: number | null; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    // The popup renders through a portal (see below) so it can float over a scrollable
    // ancestor -- e.g. a table wrapped in overflow-x-auto, which used to clip the popup
    // or force the table itself to grow a scrollbar just to fit it. A portaled popup is
    // no longer inside that ancestor, so it can't track its own position automatically;
    // closing on scroll/resize instead of trying to continuously reposition keeps this
    // simple and avoids ever rendering it stale/misaligned.
    if (!open) return;
    function handleScroll() {
      setOpen(false);
    }
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
    } else {
      // preventScroll: a plain .focus() makes the browser scroll the search input into
      // view on whatever ancestor it thinks is scrollable -- including the whole page,
      // not just this dropdown's own scroll container -- which was yanking the page
      // sideways every time a dropdown opened near the edge of a wide table.
      searchRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const isDisabled = disabled || loading;
  const showSearch = true;
  const q = query.trim().toLowerCase();
  const filteredOptions = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  function toggleOpen() {
    if (isDisabled) return;
    if (!open && buttonRef.current) {
      // Flip upward when there isn't enough room below -- otherwise the option list
      // gets rendered half off-screen or over whatever's below.
      const rect = buttonRef.current.getBoundingClientRect();
      const POPUP_HEIGHT = 288;
      const upward = window.innerHeight - rect.bottom < POPUP_HEIGHT && rect.top > POPUP_HEIGHT;
      // Fixed-position coords (viewport-relative, same frame getBoundingClientRect
      // already uses) computed once on open -- the popup portals to <body>, so it's
      // positioned independently of whatever scrollable/clipping ancestor the button
      // itself sits in (see the scroll-closes-the-popup effect above).
      setCoords({
        top: upward ? null : rect.bottom + 8,
        bottom: upward ? window.innerHeight - rect.top + 8 : null,
        left: rect.left,
        width: rect.width,
      });
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
        <span className="flex shrink-0 items-center gap-1">
          {clearable && selected && !isDisabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Hapus pilihan"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={clsx("h-4 w-4 text-zinc-400 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open && !isDisabled && coords && typeof document !== "undefined" && createPortal(
        <div
          ref={popupRef}
          style={{ position: "fixed", left: coords.left, width: Math.max(coords.width, 220), top: coords.top ?? undefined, bottom: coords.bottom ?? undefined }}
          // z-[120]: portaling to <body> makes this a sibling of modals (z-[60]) and the
          // mobile sidebar overlay (up to z-[110]) instead of a descendant that inherited
          // their stacking context -- it needs to out-rank all of them to still render on
          // top when a Dropdown is used inside a modal, which several forms do.
          className="z-[120] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
        >
          {showSearch && (
            <div className="relative border-b border-zinc-100 p-1.5">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari..."
                className="w-full rounded-lg border border-zinc-200 py-1.5 pl-8 pr-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          )}
          <div className="scroll-thin max-h-72 overflow-auto p-1.5">
            {filteredOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(clearable && isSelected ? "" : option.value);
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
            {filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-zinc-400">{options.length === 0 ? "Tidak ada opsi." : "Tidak ditemukan."}</p>
            )}
          </div>
          {onCreateNew && (
            <button
              type="button"
              onClick={() => {
                onCreateNew(query.trim());
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              <Plus className="h-3.5 w-3.5" />
              {query.trim() ? `${createLabel} "${query.trim()}"` : createLabel}
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
