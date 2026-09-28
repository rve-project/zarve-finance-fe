"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { CashBankAccount, CashBankLedgerLine, CashBankReconciliationRunResult } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Pagination } from "@/components/ui/Pagination";
import { DatePicker } from "@/components/ui/DatePicker";

function today() {
  return new Date().toISOString().slice(0, 10);
}

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

  // Bank reconciliation (D'Consulting audit gap #8 for B2B) -- tick-and-go, no journal
  // entry posted. `selected` only ever holds currently-unreconciled line ids visible on
  // this page; `allMode` selects every unreconciled line for this account regardless of
  // page/search, resolved server-side at confirm time (mirrors /reconciliation's Zarve
  // pattern in reconciliation.controller.ts).
  const [unreconciledTotal, setUnreconciledTotal] = useState(0);
  const [unreconciledTotalAmount, setUnreconciledTotalAmount] = useState(0);
  const [selected, setSelected] = useState<Map<number, number>>(new Map());
  const [allMode, setAllMode] = useState(false);
  const [reconcileDate, setReconcileDate] = useState(today());
  const [confirming, setConfirming] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<CashBankReconciliationRunResult | null>(null);
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  useEffect(() => {
    api.cashBankAccounts(true).then((accounts) => setAccount(accounts.find((a) => a.id === Number(accountId)) ?? null)).catch(() => {});
  }, [accountId]);

  function loadUnreconciledCount() {
    api
      .cashBankUnreconciled(Number(accountId), 1, 1)
      .then((res) => {
        setUnreconciledTotal(res.total);
        setUnreconciledTotalAmount(res.totalAmount);
      })
      .catch(() => {});
  }

  useEffect(loadUnreconciledCount, [accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  function loadLedger() {
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
  }

  useEffect(loadLedger, [accountId, search, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => lines, [lines]);
  const unreconciledOnPage = rows.filter((l) => !l.reconciledAt);
  const pageAllSelected = unreconciledOnPage.length > 0 && unreconciledOnPage.every((l) => selected.has(l.lineId));

  function toggleOne(line: CashBankLedgerLine) {
    if (line.reconciledAt) return;
    setAllMode(false);
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(line.lineId)) next.delete(line.lineId);
      else next.set(line.lineId, line.debit - line.credit);
      return next;
    });
  }

  function toggleAllOnPage() {
    setAllMode(false);
    setSelected((prev) => {
      const next = new Map(prev);
      if (pageAllSelected) {
        unreconciledOnPage.forEach((l) => next.delete(l.lineId));
      } else {
        unreconciledOnPage.forEach((l) => next.set(l.lineId, l.debit - l.credit));
      }
      return next;
    });
  }

  function handleSelectAllUnreconciled() {
    setAllMode(true);
    setSelected(new Map());
  }

  function handleClearSelection() {
    setAllMode(false);
    setSelected(new Map());
  }

  const selectedCount = allMode ? unreconciledTotal : selected.size;
  const selectedTotal = allMode ? unreconciledTotalAmount : Array.from(selected.values()).reduce((s, v) => s + v, 0);

  async function handleConfirmReconcile() {
    setReconciling(true);
    setReconcileError(null);
    try {
      const res = await api.reconcileCashBankAccount(Number(accountId), {
        date: reconcileDate,
        all: allMode || undefined,
        lineIds: allMode ? undefined : Array.from(selected.keys()),
      });
      setReconcileResult(res);
      setConfirming(false);
      handleClearSelection();
      loadLedger();
      loadUnreconciledCount();
    } catch (err) {
      setReconcileError(err instanceof Error ? err.message : t("kasBank.errorSave"));
    } finally {
      setReconciling(false);
    }
  }

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
      {reconcileError && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{reconcileError}</p>}
      {reconcileResult && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {t("kasBank.reconcileResultSuccess")
            .replace("{count}", reconcileResult.lineCount.toLocaleString("id-ID"))
            .replace("{amount}", formatRupiah(reconcileResult.totalAmount))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSelectAllUnreconciled}
            disabled={loading || unreconciledTotal === 0}
            className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
          >
            {t("kasBank.selectAllUnreconciled").replace("{count}", unreconciledTotal.toLocaleString("id-ID"))}
          </button>
          {(allMode || selected.size > 0) && (
            <button onClick={handleClearSelection} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
              {t("reconciliation.clearSelection")}
            </button>
          )}
        </div>
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
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allMode || pageAllSelected}
                  onChange={toggleAllOnPage}
                  disabled={unreconciledOnPage.length === 0}
                  className="h-4 w-4 rounded border-zinc-300"
                />
              </th>
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
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={!line.reconciledAt && (allMode || selected.has(line.lineId))}
                    onChange={() => toggleOne(line)}
                    disabled={!!line.reconciledAt || allMode}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                </td>
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
                  {line.reconciledAt ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      {t("kasBank.statusReconciled")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                      {t("kasBank.statusUnreconciled")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <ActionMenu line={line} />
                </td>
              </tr>
            ))}
            {!loading && !rows.length && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                  {t("kasBank.emptyLedger")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={limit} total={total} onChange={setPage} loading={loading} itemLabel={t("kasBank.colTransaction")} />

      {selectedCount > 0 && (
        <div className="sticky bottom-4 mt-6 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              {selectedCount.toLocaleString("id-ID")} {t("kasBank.linesSelected")}
            </p>
            <p className="text-lg font-bold text-emerald-600">{formatRupiah(selectedTotal)}</p>
          </div>
          {!confirming ? (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <label className="text-sm">
                <span className="mb-1 block text-zinc-600">{t("kasBank.reconcileDateLabel")}</span>
                <DatePicker value={reconcileDate} onChange={setReconcileDate} maxDate={today()} />
              </label>
              <button
                onClick={() => setConfirming(true)}
                className="w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
              >
                {t("kasBank.reconcileNow")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <span className="text-sm text-zinc-600">{t("kasBank.reconcileConfirmPrompt")}</span>
              <div className="flex w-full gap-3 sm:w-auto">
                <button
                  onClick={handleConfirmReconcile}
                  disabled={reconciling}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 sm:flex-none"
                >
                  {reconciling ? t("reconciliation.processing") : t("reconciliation.confirmYes")}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 sm:flex-none"
                >
                  {t("reconciliation.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
