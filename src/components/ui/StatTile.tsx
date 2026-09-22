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
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${valueClass ?? "text-zinc-900"}`}>{value}</p>
    </div>
  );
}
