"use client";

import { BusinessUnit } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";

const UNITS: BusinessUnit[] = ["b2b", "zarve"];

/**
 * Per-page Zarve/B2B switch for the shared financial report pages (Trial Balance,
 * General Ledger, Laba Rugi, Neraca, Arus Kas, Jurnal Manual) -- these are the only
 * screens in the app that read from either business unit on the same URL, so this
 * lives as local page state (an explicit `unit` passed to the *ForUnit api.ts calls)
 * rather than the global X-Business-Unit switch every other page relies on
 * (lib/business-unit.tsx's useForceBusinessUnit). B2B is first/default per this app's
 * primary focus having shifted there.
 */
export function BusinessUnitToggle({ value, onChange }: { value: BusinessUnit; onChange: (unit: BusinessUnit) => void }) {
  const { t } = useLanguage();
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5">
      {UNITS.map((unit) => (
        <button
          key={unit}
          type="button"
          onClick={() => onChange(unit)}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
            value === unit ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          {t(unit === "b2b" ? "businessUnitToggle.b2b" : "businessUnitToggle.zarve")}
        </button>
      ))}
    </div>
  );
}
