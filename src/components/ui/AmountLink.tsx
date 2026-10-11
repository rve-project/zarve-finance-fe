import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { BusinessUnit } from "@/lib/types";

interface AmountLinkProps {
  accountId: number;
  from: string;
  to: string;
  unit: BusinessUnit;
  value: number;
  className?: string;
}

/** Drill-down from a report's per-account figure straight into that account's journal
 * lines for the exact date range the figure represents (General Ledger, pre-filled via
 * URL params) -- e.g. clicking a Trial Balance "Saldo Akhir" opens the GL from epoch
 * through that report's `to` date, the same range the figure was computed from. */
export function AmountLink({ accountId, from, to, unit, value, className }: AmountLinkProps) {
  const href = `/reports/general-ledger?${new URLSearchParams({ accountId: String(accountId), from, to, unit }).toString()}`;
  return (
    <Link href={href} className={`hover:text-emerald-700 hover:underline ${className ?? ""}`}>
      {formatRupiah(value)}
    </Link>
  );
}
