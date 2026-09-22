"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { Account, Partner, VendorBill } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dropdown } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { DatePicker } from "@/components/ui/DatePicker";

const LIMIT = 20;

interface LineDraft {
  description: string;
  accountId: string;
  amount: string;
}

function emptyLine(): LineDraft {
  return { description: "", accountId: "", amount: "" };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function VendorBillsPage() {
  const { t } = useLanguage();
  const [vendors, setVendors] = useState<Partner[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);

  const [bills, setBills] = useState<VendorBill[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [billDate, setBillDate] = useState(today());
  const [ref, setRef] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [payingBillId, setPayingBillId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payBankAccountId, setPayBankAccountId] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api.partners({ type: "vendor", limit: 500 }).then((res) => setVendors(res.data));
    api.accounts("expense").then(setExpenseAccounts);
    api.reconciliationBankAccounts().then(setBankAccounts);
  }, []);

  function load(p = 1) {
    setLoading(true);
    api
      .vendorBills({ page: p, limit: LIMIT })
      .then((res) => {
        setBills(res.data);
        setTotal(res.total);
        setPage(res.page);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function updateLine(i: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  const linesTotal = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!vendorId) {
      setError(t("vendorBills.validation.selectVendor"));
      return;
    }
    const validLines = lines.filter((l) => l.description && l.accountId && Number(l.amount) > 0);
    if (!validLines.length) {
      setError(t("vendorBills.validation.needLine"));
      return;
    }
    setSubmitting(true);
    try {
      await api.createVendorBill({
        vendorId: Number(vendorId),
        billDate,
        ref: ref || undefined,
        lines: validLines.map((l) => ({ description: l.description, accountId: Number(l.accountId), amount: Number(l.amount) })),
      });
      setVendorId("");
      setBillDate(today());
      setRef("");
      setLines([emptyLine()]);
      setShowForm(false);
      load(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("vendorBills.error.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  function startPay(bill: VendorBill) {
    setPayingBillId(bill.id);
    setPayAmount(String(bill.totalAmount));
    setPayDate(today());
  }

  async function handlePay(bill: VendorBill) {
    if (!payBankAccountId || !payAmount) return;
    setPaying(true);
    try {
      await api.createVendorPayment({
        vendorId: bill.vendorId,
        vendorBillId: bill.id,
        bankAccountId: Number(payBankAccountId),
        amount: Number(payAmount),
        date: payDate,
      });
      setPayingBillId(null);
      load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("vendorBills.error.payFailed"));
    } finally {
      setPaying(false);
    }
  }

  const vendorOptions = vendors.map((v) => ({ value: String(v.id), label: v.name }));
  const expenseOptions = expenseAccounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }));
  const bankOptions = bankAccounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }));

  return (
    <div>
      <PageHeader
        title={t("vendorBills.title")}
        subtitle={t("vendorBills.subtitle")}
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {showForm ? t("vendorBills.cancelButton") : t("vendorBills.newButton")}
          </button>
        }
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="relative z-40 mb-6 rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">{t("vendorBills.form.vendorLabel")}</span>
              <Dropdown className="min-w-[220px]" value={vendorId} onChange={setVendorId} options={vendorOptions} placeholder={t("vendorBills.form.vendorPlaceholder")} loading={!vendors.length} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">{t("vendorBills.form.billDateLabel")}</span>
              <DatePicker value={billDate} onChange={setBillDate} maxDate={today()} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">{t("vendorBills.form.refLabel")}</span>
              <input value={ref} onChange={(e) => setRef(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
            </label>
          </div>

          <div className="mb-3 space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  placeholder={t("vendorBills.form.descriptionPlaceholder")}
                  value={line.description}
                  onChange={(e) => updateLine(i, { description: e.target.value })}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                />
                <Dropdown
                  className="min-w-[220px]"
                  value={line.accountId}
                  onChange={(v) => updateLine(i, { accountId: v })}
                  options={expenseOptions}
                  placeholder={t("vendorBills.form.accountPlaceholder")}
                />
                <input
                  type="number"
                  placeholder={t("vendorBills.form.amountPlaceholder")}
                  value={line.amount}
                  onChange={(e) => updateLine(i, { amount: e.target.value })}
                  className="w-36 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-right"
                />
                <button
                  type="button"
                  onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={lines.length <= 1}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
            className="mb-4 flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="h-4 w-4" /> {t("vendorBills.form.addLine")}
          </button>

          <div className="mb-4 text-sm text-zinc-600">
            {t("vendorBills.form.total")} <strong>{formatRupiah(linesTotal)}</strong>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? t("vendorBills.form.saving") : t("vendorBills.form.submit")}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("vendorBills.table.number")}</th>
              <th className="px-4 py-3 font-medium">{t("vendorBills.table.vendor")}</th>
              <th className="px-4 py-3 font-medium">{t("vendorBills.table.date")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("vendorBills.table.amount")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-2.5 font-mono text-xs">{b.number}</td>
                <td className="px-4 py-2.5">{b.vendorName}</td>
                <td className="px-4 py-2.5">{formatDate(b.billDate)}</td>
                <td className="px-4 py-2.5 text-right">{formatRupiah(b.totalAmount)}</td>
                <td className="px-4 py-2.5 text-right">
                  {payingBillId === b.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <Dropdown className="min-w-[160px]" value={payBankAccountId} onChange={setPayBankAccountId} options={bankOptions} placeholder={t("vendorBills.pay.bankPlaceholder")} />
                      <input
                        type="number"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-28 rounded-lg border border-zinc-200 px-2 py-1 text-sm text-right"
                      />
                      <DatePicker value={payDate} onChange={setPayDate} maxDate={today()} />
                      <button
                        onClick={() => handlePay(b)}
                        disabled={paying || !payBankAccountId}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {paying ? t("vendorBills.pay.processing") : t("vendorBills.pay.submitButton")}
                      </button>
                      <button onClick={() => setPayingBillId(null)} className="text-xs text-zinc-500 hover:underline">
                        {t("vendorBills.pay.cancel")}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startPay(b)} className="text-xs font-medium text-emerald-600 hover:underline">
                      {t("vendorBills.pay.startButton")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && bills.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  {t("vendorBills.table.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={LIMIT} total={total} onChange={load} loading={loading} itemLabel={t("vendorBills.pagination.itemLabel")} />
    </div>
  );
}
