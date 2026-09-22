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
