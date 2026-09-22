import type { LucideIcon } from "lucide-react";

export function StatTile({
  icon: Icon,
  iconClass,
  label,
  value,
  valueClass,
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 sm:p-5">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg sm:mb-3 sm:h-9 sm:w-9 ${iconClass}`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <p className="text-xs text-zinc-500 sm:text-sm">{label}</p>
      <p className={`mt-1 text-lg font-bold sm:text-xl ${valueClass ?? "text-zinc-900"}`}>{value}</p>
    </div>
  );
}
