"use client";

import { ReportUnit } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";

const UNITS: ReportUnit[] = ["b2b", "zarve", "consolidated"];

const LABEL_KEY: Record<ReportUnit, string> = {
  b2b: "businessUnitToggle.b2b",
  zarve: "businessUnitToggle.zarve",
  consolidated: "businessUnitToggle.consolidated",
};

/**
 * Like BusinessUnitToggle, but for the 5 financial-statement report pages (Trial
 * Balance, Laba Rugi, Neraca, Arus Kas, Perubahan Modal) which also offer a combined
 * B2B+Zarve "Konsolidasi" view. Kept as its own component rather than widening
 * BusinessUnitToggle itself, since every other screen's local `unit` state is typed
 * strictly as BusinessUnit and shouldn't need to guard against a "consolidated" value
 * it never produces.
 */
export function ReportUnitToggle({ value, onChange }: { value: ReportUnit; onChange: (unit: ReportUnit) => void }) {
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
          {t(LABEL_KEY[unit])}
        </button>
      ))}
    </div>
  );
}
