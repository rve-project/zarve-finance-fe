export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

/** Year-to-date by default -- broader than "this month" so a report page shows
 * whatever's actually been posted this year instead of looking empty on, say, the
 * 1st of the month. */
export function defaultReportRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

/** Matches the backend's own EPOCH const (reports.controller.ts) -- the "since
 * inception" starting point every report's cumulative balances are built from. */
export const EPOCH = "1970-01-01";

/** One ISO date, N days earlier -- used to drill down into a "Saldo Awal" figure
 * (cumulative up to but excluding the report's own `from` date). */
export function dayBefore(iso: string) {
  const d = new Date(iso);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
