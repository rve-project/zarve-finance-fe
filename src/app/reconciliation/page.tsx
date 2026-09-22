"use client";

import { useEffect, useState } from "react";
import { Wallet, ListChecks } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { Account, ReconciliationRunResult, UnreconciledPayment } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { Dropdown } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { DatePicker } from "@/components/ui/DatePicker";

const LIMIT = 20;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReconciliationPage() {
  const { t } = useLanguage();
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [bankAccountId, setBankAccountId] = useState<number | null>(null);
  const [date, setDate] = useState(today());

  const [payments, setPayments] = useState<UnreconciledPayment[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Manual per-row selection carries the amount alongside the id so the running total
  // stays correct even after paginating away from a page a selection was made on.
  const [selected, setSelected] = useState<Map<number, number>>(new Map());
  const [allMode, setAllMode] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ReconciliationRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.reconciliationBankAccounts().then((list) => {
      setBankAccounts(list);
      if (list.length) setBankAccountId(list[0].id);
    });
  }, []);

  function load(p = page) {
    setLoading(true);
    api
      .unreconciledPayments(p, LIMIT)
      .then((res) => {
        setPayments(res.data);
        setPage(res.page);
        setTotal(res.total);
        setTotalAmount(res.totalAmount);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("reconciliation.errorLoadFailed")))
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleOne(p: UnreconciledPayment) {
    setAllMode(false);
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(p.id)) next.delete(p.id);
      else next.set(p.id, p.amount);
      return next;
    });
  }

  const pageAllSelected = payments.length > 0 && payments.every((p) => selected.has(p.id));

  function toggleAllOnPage() {
    setAllMode(false);
    setSelected((prev) => {
      const next = new Map(prev);
      if (pageAllSelected) {
        payments.forEach((p) => next.delete(p.id));
      } else {
        payments.forEach((p) => next.set(p.id, p.amount));
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

  const selectedCount = allMode ? total : selected.size;
  const selectedTotal = allMode ? totalAmount : Array.from(selected.values()).reduce((s, v) => s + v, 0);

  async function handleConfirm() {
    if (!bankAccountId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.runReconciliation({
        bankAccountId,
        date,
        all: allMode || undefined,
        paymentIds: allMode ? undefined : Array.from(selected.keys()),
      });
      setResult(res);
      setConfirming(false);
      handleClearSelection();
      load(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reconciliation.errorRunFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedBank = bankAccounts.find((a) => a.id === bankAccountId);

  return (
    <div>
      <PageHeader
        title={t("reconciliation.title")}
        subtitle={t("reconciliation.subtitle")}
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {t("reconciliation.resultSuccess")
            .replace("{count}", result.paymentCount.toLocaleString("id-ID"))
            .replace("{amount}", formatRupiah(result.totalAmount))}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile icon={ListChecks} iconClass="bg-amber-50 text-amber-600" label={t("reconciliation.statUnreconciled")} value={total.toLocaleString("id-ID")} />
        <StatTile icon={Wallet} iconClass="bg-amber-50 text-amber-600" label={t("reconciliation.statTotalAmount")} value={formatRupiah(totalAmount)} />
      </div>

      <div className="relative z-40 mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("reconciliation.targetAccount")}</span>
          <Dropdown
            className="min-w-[220px]"
            value={bankAccountId ? String(bankAccountId) : ""}
            onChange={(v) => setBankAccountId(Number(v))}
            options={bankAccounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))}
            loading={!bankAccounts.length}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("reconciliation.reconciliationDate")}</span>
          <DatePicker value={date} onChange={setDate} maxDate={today()} />
        </label>
        <button
          onClick={handleSelectAllUnreconciled}
          disabled={loading || total === 0}
          className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
        >
          {t("reconciliation.selectAll").replace("{count}", total.toLocaleString("id-ID"))}
        </button>
        {(allMode || selected.size > 0) && (
          <button onClick={handleClearSelection} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
            {t("reconciliation.clearSelection")}
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allMode || pageAllSelected} onChange={toggleAllOnPage} className="h-4 w-4 rounded border-zinc-300" />
              </th>
              <th className="px-4 py-3 font-medium">{t("reconciliation.colDate")}</th>
              <th className="px-4 py-3 font-medium">{t("reconciliation.colDriver")}</th>
              <th className="px-4 py-3 font-medium">{t("reconciliation.colInvoice")}</th>
              <th className="px-4 py-3 font-medium">{t("reconciliation.colMethod")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("reconciliation.colAmount")}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allMode || selected.has(p.id)}
                    onChange={() => toggleOne(p)}
                    disabled={allMode}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                </td>
                <td className="px-4 py-2.5">{formatDate(p.date)}</td>
                <td className="px-4 py-2.5">{p.partnerName ?? "-"}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{p.invoiceNumber ?? "-"}</td>
                <td className="px-4 py-2.5 text-zinc-500">{p.method ?? "-"}</td>
                <td className="px-4 py-2.5 text-right font-medium">{formatRupiah(p.amount)}</td>
              </tr>
            ))}
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                  {t("reconciliation.emptyState")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={LIMIT} total={total} onChange={load} loading={loading} itemLabel={t("reconciliation.itemLabel")} />

      {selectedCount > 0 && (
        <div className="sticky bottom-4 mt-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-white p-4 shadow-lg">
          <div>
            <p className="text-sm text-zinc-500">
              {selectedCount.toLocaleString("id-ID")} {t("reconciliation.paymentsSelected")} {allMode && t("reconciliation.allUnreconciledNote")}
            </p>
            <p className="text-lg font-bold text-emerald-600">{formatRupiah(selectedTotal)}</p>
          </div>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              disabled={!bankAccountId}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {t("reconciliation.confirmNow")}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-600">
                {t("reconciliation.confirmMovePrefix")} <strong>{selectedBank?.name}</strong> {t("reconciliation.confirmMoveDateLabel")} {formatDate(date)}?
              </span>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? t("reconciliation.processing") : t("reconciliation.confirmYes")}
              </button>
              <button onClick={() => setConfirming(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
                {t("reconciliation.cancel")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
