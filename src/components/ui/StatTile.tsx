import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatTile({
  icon: Icon,
  iconClass,
  label,
  value,
  valueClass,
  delta,
  deltaGoodDirection = "up",
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  value: string;
  valueClass?: string;
  /** Percent change vs. a reference period (e.g. previous month). Omit when there's no baseline yet. */
  delta?: number;
  /** Whether a rising value is the desirable direction (income) or not (expense) -- flips the red/green mapping. */
  deltaGoodDirection?: "up" | "down";
}) {
  const isUp = (delta ?? 0) >= 0;
  const isGood = delta === undefined ? null : deltaGoodDirection === "up" ? isUp : !isUp;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 sm:p-5">
      <div className="flex items-start justify-between">
        <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg sm:mb-3 sm:h-9 sm:w-9 ${iconClass}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        {delta !== undefined && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
              isGood ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            }`}
          >
            {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500 sm:text-sm">{label}</p>
      <p className={`mt-1 text-lg font-bold sm:text-xl ${valueClass ?? "text-zinc-900"}`}>{value}</p>
    </div>
  );
}
