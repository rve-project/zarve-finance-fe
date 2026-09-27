"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah } from "@/lib/format";
import { Account, Contact, TaxCode } from "@/lib/types";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";

const PPN_MASUKAN_CODE = "1-10500"; // input VAT -- same account purchases/sales controllers use

interface LineDraft {
  accountId: string;
  description: string;
  taxId: string;
  amount: string;
}

function emptyLine(): LineDraft {
  return { accountId: "", description: "", taxId: "", amount: "" };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// "Kirim Uang" -- a cash payment not tied to a Faktur Pembelian (e.g. a reimbursement,
// a loan repayment, an owner's draw): one bank/cash account is credited-out for the
// full total, split across one or more "Pembayaran Untuk" account lines, each with its
// own optional tax. Mirrors receive/page.tsx exactly, direction reversed.
function SendMoneyPageInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetAccountId = searchParams.get("accountId") ?? "";

  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [taxes, setTaxes] = useState<TaxCode[]>([]);

  const [bankAccountId, setBankAccountId] = useState(presetAccountId);
  const [recipientContactId, setRecipientContactId] = useState("");
  const [date, setDate] = useState(today());
  const [number, setNumber] = useState("");
  const [priceIncludesTax, setPriceIncludesTax] = useState(false);
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.accounts(undefined, "cash_bank").then(setBankAccounts).catch(() => {});
    api.accounts().then(setAllAccounts).catch(() => {});
    api.contacts({}).then(setContacts).catch(() => {});
    api.taxes().then(setTaxes).catch(() => {});
  }, []);

  const bankOptions = bankAccounts.map((a) => ({ value: String(a.id), label: `(${a.code}) - ${a.name}` }));
  const accountOptions = allAccounts.map((a) => ({ value: String(a.id), label: `(${a.code}) - ${a.name}` }));
  const contactOptions = contacts.map((c) => ({ value: String(c.id), label: c.name }));
  const taxOptions = taxes.map((tax) => ({ value: String(tax.id), label: `${tax.name} (${tax.rate}%)` }));

  function updateLine(i: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  const computedLines = useMemo(
    () =>
      lines.map((line) => {
        const gross = Number(line.amount) || 0;
        const rate = taxes.find((tax) => String(tax.id) === line.taxId)?.rate ?? 0;
        const base = priceIncludesTax ? gross / (1 + rate / 100) : gross;
        const taxAmount = priceIncludesTax ? gross - base : base * (rate / 100);
        return { ...line, base, taxAmount };
      }),
    [lines, taxes, priceIncludesTax]
  );

  const subtotal = computedLines.reduce((sum, l) => sum + l.base, 0);
  const totalTax = computedLines.reduce((sum, l) => sum + l.taxAmount, 0);
  const total = subtotal + totalTax;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validLines = computedLines.filter((l) => l.accountId && l.base > 0);
    if (!bankAccountId || !validLines.length || !date) {
      setError(t("kasBank.errorFillFields"));
      return;
    }

    let ppnMasukanId: number | undefined;
    if (totalTax > 0) {
      ppnMasukanId = allAccounts.find((a) => a.code === PPN_MASUKAN_CODE)?.id;
    }

    const recipientName = contacts.find((c) => String(c.id) === recipientContactId)?.name;

    setSaving(true);
    try {
      await api.createJournalEntry({
        date,
        ref: number || undefined,
        narration: `${t("kasBank.sendPageTitle")}${recipientName ? ` - ${recipientName}` : ""}${memo ? ` - ${memo}` : ""}`,
        lines: [
          { accountId: Number(bankAccountId), debit: 0, credit: Math.round(total * 100) / 100 },
          ...validLines.map((l) => ({
            accountId: Number(l.accountId),
            debit: Math.round(l.base * 100) / 100,
            credit: 0,
            description: l.description || undefined,
          })),
          ...(ppnMasukanId && totalTax > 0 ? [{ accountId: ppnMasukanId, debit: Math.round(totalTax * 100) / 100, credit: 0 }] : []),
        ],
      });
      router.push("/b2b-kas-bank");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("kasBank.errorSave"));
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="mx-auto max-w-6xl">
      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5 sm:px-8">
          <p className="text-xs text-zinc-400">{t("kasBank.transaction")}</p>
          <h1 className="text-lg font-bold text-emerald-700 sm:text-xl">{t("kasBank.sendPageTitle")}</h1>
        </div>

        {error && <p className="mx-6 mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:mx-8">{error}</p>}

        <div className="flex flex-col gap-4 border-b border-zinc-100 bg-sky-50/50 px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <label className="block w-full max-w-xs text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("kasBank.sentFromAccount")}</span>
            <Dropdown value={bankAccountId} onChange={setBankAccountId} options={bankOptions} placeholder={t("kasBank.accountPlaceholder")} />
          </label>
          <p className="text-lg font-bold text-zinc-900">
            {t("kasBank.totalAmount")} <span className="text-emerald-700">{formatRupiah(total)}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4 sm:px-8">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("kasBank.recipient")}</span>
            <Dropdown value={recipientContactId} onChange={setRecipientContactId} options={contactOptions} placeholder={t("kasBank.recipientPlaceholder")} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("kasBank.date")}</span>
            <DatePicker value={date} onChange={setDate} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("kasBank.number")}</span>
            <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={t("kasBank.numberAuto")} className={inputClass} />
          </label>
        </div>

        <div className="px-6 sm:px-8">
          <div className="mb-2 flex justify-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
              {t("expenseNew.priceIncludesTax")}
              <span
                onClick={() => setPriceIncludesTax((v) => !v)}
                className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${
                  priceIncludesTax ? "bg-emerald-600" : "bg-zinc-200"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${priceIncludesTax ? "translate-x-4" : "translate-x-0.5"}`} />
              </span>
            </label>
          </div>

          <div className="hidden gap-3 border-b border-zinc-100 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_130px_36px]">
            <span>{t("kasBank.paidFor")}</span>
            <span>{t("kasBank.colDescription")}</span>
            <span>{t("kasBank.colTax")}</span>
            <span className="text-right">{t("kasBank.colAmount")}</span>
            <span />
          </div>

          <div className="mt-2 space-y-3 pb-4 sm:space-y-2">
            {lines.map((line, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-100 p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_130px_36px] sm:items-center sm:rounded-none sm:border-0 sm:p-0"
              >
                <Dropdown value={line.accountId} onChange={(v) => updateLine(i, { accountId: v })} options={accountOptions} placeholder={t("kasBank.accountPlaceholder")} />
                <input
                  value={line.description}
                  onChange={(e) => updateLine(i, { description: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Dropdown value={line.taxId} onChange={(v) => updateLine(i, { taxId: v })} options={taxOptions} placeholder={t("purchases.new.taxPlaceholder")} />
                <input
                  type="number"
                  min={0}
                  value={line.amount}
                  onChange={(e) => updateLine(i, { amount: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-right text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={lines.length <= 1}
                  className="justify-self-end rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 sm:justify-self-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addLine} className="mb-6 flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700">
            <Plus className="h-4 w-4" /> {t("kasBank.addLine")}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-zinc-100 px-6 py-6 lg:grid-cols-[1fr_320px] sm:px-8">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("kasBank.memo")}</span>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={4} className={`${inputClass} resize-none`} />
          </label>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">{t("kasBank.subtotal")}</span>
              <span className="font-semibold text-zinc-900">{formatRupiah(subtotal)}</span>
            </div>
            {totalTax > 0 && (
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-zinc-500">{t("kasBank.colTax")}</span>
                <span className="font-semibold text-zinc-900">{formatRupiah(totalTax)}</span>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3">
              <span className="font-semibold text-zinc-800">{t("kasBank.total")}</span>
              <span className="text-lg font-bold text-zinc-900">{formatRupiah(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50 px-6 py-4 sm:px-8">
          <Link href="/b2b-kas-bank" className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
            {t("kasBank.cancel")}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40"
          >
            {saving ? t("kasBank.saving") : t("kasBank.createPayment")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SendMoneyPage() {
  return (
    <Suspense fallback={null}>
      <SendMoneyPageInner />
    </Suspense>
  );
}
