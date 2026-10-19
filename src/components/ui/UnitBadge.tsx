import { BusinessUnit } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";

/** Small inline tag next to an account name in the financial-statement reports'
 * "Konsolidasi" view, so a row's originating business unit stays visible once B2B and
 * Zarve accounts are listed together (they're never merged into one line -- see
 * reportEngine.ts's getAccountBalances doc comment). */
export function UnitBadge({ unit }: { unit: BusinessUnit }) {
  const { t } = useLanguage();
  return (
    <span
      className={`ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        unit === "b2b" ? "bg-sky-50 text-sky-600" : "bg-violet-50 text-violet-600"
      }`}
    >
      {t(unit === "b2b" ? "businessUnitToggle.b2b" : "businessUnitToggle.zarve")}
    </span>
  );
}
