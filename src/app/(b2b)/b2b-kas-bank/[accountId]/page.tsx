"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { CashBankAccount, CashBankLedgerLine } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Pagination } from "@/components/ui/Pagination";

const SOURCE_LABEL_KEY: Record<string, string> = {
  purchase_invoice: "kasBank.sourcePurchaseInvoice",
  purchase_payment: "kasBank.sourcePurchasePayment",
  sale_invoice: "kasBank.sourceSaleInvoice",
  sale_payment: "kasBank.sourceSalePayment",
  expense: "kasBank.sourceExpense",
  manual: "kasBank.sourceManual",
};

const DOC_HREF: Record<NonNullable<CashBankLedgerLine["docKind"]>, string> = {
  purchase: "/b2b-purchases",
  sale: "/b2b-sales",
  expense: "/b2b-expenses",
};

function lineTitle(t: (key: string) => string, line: CashBankLedgerLine): string {
  const sourceLabel = t(SOURCE_LABEL_KEY[line.sourceType] ?? "kasBank.sourceOther");
  if (line.sourceType === "purchase_payment" || line.sourceType === "sale_payment") {
    return `${sourceLabel} #${line.lineId}`;
  }
  if (line.docNumber) return `${sourceLabel} ${line.docNumber}`;
  if (line.ref) return line.ref;
  return `${sourceLabel} #${line.lineId}`;
}

function lineSubtitle(t: (key: string) => string, line: CashBankLedgerLine): string {
  if (line.sourceType === "purchase_payment" || line.sourceType === "sale_payment") {
    const sourceLabel = t(line.sourceType === "purchase_payment" ? "kasBank.sourcePurchaseInvoice" : "kasBank.sourceSaleInvoice");
    return line.docNumber ? `${sourceLabel} ${line.docNumber}` : "-";
  }
  return line.lineDescription || line.narration || "-";
}

/** Per-row "Tindakan" dropdown -- a single "Lihat Detail" link to the source document
 * when one is resolvable (Purchase/Sale/Expense); nothing to link to for a manual
 * journal entry, so the menu just doesn't render. */
function ActionMenu({ line }: { line: CashBankLedgerLine }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  if (!line.docKind || !line.docId) return <span className="text-zinc-300">-</span>;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
      >
        {t("kasBank.colAction")} <ChevronDown className="h-4 w-4 text-zinc-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
            <Link
              href={`${DOC_HREF[line.docKind]}/${line.docId}`}
              className="block px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={() => setOpen(false)}
            >
              {t("kasBank.viewDetail")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function CashBankLedgerPage() {
  const { t } = useLanguage();
  const { accountId } = useParams<{ accountId: string }>();

  const [account, setAccount] = useState<CashBankAccount | null>(null);
  const [lines, setLines] = useState<CashBankLedgerLine[]>([]);
  const [total, setTotal] = useState(0);
  const [endBalance, setEndBalance] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 25;

  useEffect(() => {
    api.cashBankAccounts(true).then((accounts) => setAccount(accounts.find((a) => a.id === Number(accountId)) ?? null)).catch(() => {});
  }, [accountId]);

  useEffect(() => {
    setLoading(true);
    api
      .cashBankLedger(Number(accountId), { search: search || undefined, page, limit })
      .then((res) => {
        setLines(res.lines);
        setTotal(res.total);
        setEndBalance(res.endBalance);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("kasBank.errorSave")))
      .finally(() => setLoading(false));
  }, [accountId, search, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => lines, [lines]);

  return (
    <div>
      <Breadcrumb items={[{ label: t("kasBank.title"), href: "/b2b-kas-bank" }, { label: account?.name ?? "" }]} />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-400">{t("kasBank.categoryLabel")}</p>
          <h1 className="text-lg font-bold text-zinc-900 sm:text-xl">{account ? `${account.code} - ${account.name}` : "..."}</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400">{t("kasBank.colBalance")}</p>
          <p className="text-lg font-bold text-zinc-900">{formatRupiah(endBalance)}</p>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-4 flex justify-end">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("kasBank.searchPlaceholder")}
            className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("purchases.colDate")}</th>
              <th className="px-4 py-3 font-medium">{t("kasBank.colTransaction")}</th>
              <th className="px-4 py-3 font-medium">{t("kasBank.colContact")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("kasBank.colReceive")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("kasBank.colSend")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("kasBank.colBalance")}</th>
              <th className="px-4 py-3 font-medium">{t("kasBank.colStatus")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((line) => (
              <tr key={line.lineId} className="border-b border-zinc-50">
                <td className="px-4 py-2.5 text-zinc-500">{formatDate(line.date)}</td>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-emerald-700">{lineTitle(t, line)}</p>
                  <p className="text-xs text-zinc-400">{lineSubtitle(t, line)}</p>
                </td>
                <td className="px-4 py-2.5 text-zinc-600">{line.contactName ?? "-"}</td>
                <td className="px-4 py-2.5 text-right">{line.debit ? formatRupiah(line.debit) : "-"}</td>
                <td className="px-4 py-2.5 text-right">{line.credit ? formatRupiah(line.credit) : "-"}</td>
                <td className="px-4 py-2.5 text-right font-medium">{formatRupiah(line.runningBalance)}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                    {t("kasBank.statusUnreconciled")}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <ActionMenu line={line} />
                </td>
              </tr>
            ))}
            {!loading && !rows.length && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                  {t("kasBank.emptyLedger")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={limit} total={total} onChange={setPage} loading={loading} itemLabel={t("kasBank.colTransaction")} />
    </div>
  );
}
