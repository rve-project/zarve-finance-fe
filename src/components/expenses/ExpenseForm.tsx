"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah } from "@/lib/format";
import { Account, Contact, CreateExpenseInput, ExpenseDetail, TaxCode } from "@/lib/types";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";

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

const PAYMENT_METHOD_KEYS = [
  "expenseNew.paymentMethodTunai",
  "expenseNew.paymentMethodTransfer",
  "expenseNew.paymentMethodCekGiro",
  "expenseNew.paymentMethodKartuKredit",
  "expenseNew.paymentMethodKartuDebit",
];

interface ExpenseFormProps {
  initial?: ExpenseDetail;
  cancelHref: string;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (input: CreateExpenseInput) => Promise<void>;
}

// Shared by /b2b-expenses/new and /b2b-expenses/[id]/edit -- same fields, only what
// happens on submit (and the initial values) differs between create and update.
export function ExpenseForm({ initial, cancelHref, submitLabel, savingLabel, onSubmit }: ExpenseFormProps) {
  const { t } = useLanguage();

  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [taxes, setTaxes] = useState<TaxCode[]>([]);

  const [bankAccountId, setBankAccountId] = useState(initial?.bankAccountId ? String(initial.bankAccountId) : "");
  const [payLater, setPayLater] = useState(initial?.payLater ?? false);
  const [contactId, setContactId] = useState(initial?.contactId ? String(initial.contactId) : "");
  const [date, setDate] = useState(initial?.expenseDate ?? today());
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod ?? "");
  const [customPaymentMethods, setCustomPaymentMethods] = useState<string[]>(
    initial?.paymentMethod && !PAYMENT_METHOD_KEYS.some((key) => t(key) === initial.paymentMethod) ? [initial.paymentMethod] : []
  );
  const [addingPaymentMethod, setAddingPaymentMethod] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [tag, setTag] = useState(initial?.tag ?? "");
  const [billingAddress, setBillingAddress] = useState(initial?.billingAddress ?? "");
  // Editing always continues from the already-resolved base/tax split (see lines
  // prefill below), so this toggle -- a data-entry convenience for the "Jumlah" input
  // meaning gross-or-net -- defaults back off rather than trying to reverse-guess
  // whichever setting was used originally.
  const [priceIncludesTax, setPriceIncludesTax] = useState(false);
  const [lines, setLines] = useState<LineDraft[]>(
    initial?.lines.length
      ? initial.lines.map((l) => ({
          accountId: String(l.accountId),
          description: l.description ?? "",
          taxId: l.taxId ? String(l.taxId) : "",
          amount: String(l.amount),
        }))
      : [emptyLine(), emptyLine()]
  );
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [showDiscount, setShowDiscount] = useState((initial?.discountAmount ?? 0) > 0);
  const [discountAmount, setDiscountAmount] = useState(initial?.discountAmount ? String(initial.discountAmount) : "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.accounts(undefined, "cash_bank").then(setBankAccounts).catch(() => {});
    api.accounts("expense").then(setExpenseAccounts).catch(() => {});
    api.contacts().then(setContacts).catch(() => {});
    api.taxes().then(setTaxes).catch(() => {});
  }, []);

  const bankAccountOptions = bankAccounts.map((a) => ({ value: String(a.id), label: `(${a.code}) - ${a.name}` }));
  const expenseAccountOptions = expenseAccounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }));
  const contactOptions = contacts.map((c) => ({ value: String(c.id), label: c.name }));
  const taxOptions = taxes.map((tax) => ({ value: String(tax.id), label: `${tax.name} (${tax.rate}%)` }));
  const paymentMethodOptions = [...PAYMENT_METHOD_KEYS.map((key) => t(key)), ...customPaymentMethods].map((value) => ({ value, label: value }));

  function confirmNewPaymentMethod() {
    const value = newPaymentMethod.trim();
    if (value && !paymentMethodOptions.some((o) => o.value === value)) {
      setCustomPaymentMethods((prev) => [...prev, value]);
    }
    if (value) setPaymentMethod(value);
    setNewPaymentMethod("");
    setAddingPaymentMethod(false);
  }

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
        const jumlah = Number(line.amount) || 0;
        const rate = taxes.find((tax) => String(tax.id) === line.taxId)?.rate ?? 0;
        const base = priceIncludesTax ? jumlah / (1 + rate / 100) : jumlah;
        const taxAmount = priceIncludesTax ? jumlah - base : base * (rate / 100);
        return { ...line, base, taxAmount };
      }),
    [lines, taxes, priceIncludesTax]
  );

  const subtotal = computedLines.reduce((sum, l) => sum + l.base, 0);
  const totalTax = computedLines.reduce((sum, l) => sum + l.taxAmount, 0);
  const discount = Number(discountAmount) || 0;
  const total = Math.max(subtotal + totalTax - discount, 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validLines = computedLines.filter((l) => l.accountId && l.base + l.taxAmount > 0);
    if (!validLines.length) {
      setError(t("expenseNew.errorSave"));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        contactId: contactId ? Number(contactId) : undefined,
        expenseDate: date,
        paymentMethod: paymentMethod || undefined,
        bankAccountId: payLater ? undefined : bankAccountId ? Number(bankAccountId) : undefined,
        payLater,
        billingAddress: billingAddress || undefined,
        tag: tag || undefined,
        memo: memo || undefined,
        discountAmount: discount,
        lines: validLines.map((l) => ({
          accountId: Number(l.accountId),
          description: l.description || undefined,
          taxId: l.taxId ? Number(l.taxId) : undefined,
          amount: Math.round(l.base * 100) / 100,
          taxAmount: Math.round(l.taxAmount * 100) / 100,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("expenseNew.errorSave"));
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {error && <p className="mx-6 mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:mx-8">{error}</p>}

      <div className="flex flex-col gap-4 rounded-t-2xl border-b border-emerald-100 bg-emerald-50/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:max-w-xs">
            <Dropdown
              value={bankAccountId}
              onChange={setBankAccountId}
              options={bankAccountOptions}
              disabled={payLater}
              placeholder={t("expenseNew.payFrom")}
            />
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={payLater}
              onChange={(e) => setPayLater(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            {t("expenseNew.payLater")}
          </label>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-zinc-900">
            {t("expenseNew.total")} <span className="text-emerald-700">{formatRupiah(total)}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 sm:px-8">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("expenseNew.payee")}</span>
          <Dropdown value={contactId} onChange={setContactId} options={contactOptions} placeholder={t("expenseNew.payeePlaceholder")} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("expenseNew.date")}</span>
          <DatePicker value={date} onChange={setDate} maxDate={today()} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("expenseNew.paymentMethod")}</span>
          {addingPaymentMethod ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmNewPaymentMethod();
                  }
                }}
                placeholder={t("expenseNew.newPaymentMethodPlaceholder")}
                className={inputClass}
              />
              <button type="button" onClick={confirmNewPaymentMethod} className="shrink-0 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700">
                {t("expenseNew.newPaymentMethodAdd")}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <Dropdown value={paymentMethod} onChange={setPaymentMethod} options={paymentMethodOptions} />
              </div>
              <button
                type="button"
                aria-label={t("expenseNew.newPaymentMethodAdd")}
                onClick={() => setAddingPaymentMethod(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("expenseNew.number")}</span>
          <input disabled value={initial?.number ?? t("expenseNew.numberAuto")} className={`${inputClass} bg-zinc-50 text-zinc-400`} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("expenseNew.tag")}</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm sm:col-span-2 lg:col-span-3">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("expenseNew.billingAddress")}</span>
          <textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
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

        <div className="hidden gap-3 border-b border-zinc-100 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_160px_36px]">
          <span>{t("expenseNew.colAccount")}</span>
          <span>{t("expenseNew.colDescription")}</span>
          <span>{t("expenseNew.colTax")}</span>
          <span className="text-right">{t("expenseNew.colAmount")}</span>
          <span />
        </div>

        <div className="mt-2 space-y-3 pb-4 sm:space-y-2">
          {lines.map((line, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-100 p-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_160px_36px] sm:items-center sm:rounded-none sm:border-0 sm:p-0"
            >
              <Dropdown value={line.accountId} onChange={(v) => updateLine(i, { accountId: v })} options={expenseAccountOptions} placeholder={t("expenseNew.accountPlaceholder")} />
              <input
                value={line.description}
                onChange={(e) => updateLine(i, { description: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Dropdown value={line.taxId} onChange={(v) => updateLine(i, { taxId: v })} options={taxOptions} placeholder={t("expenseNew.taxPlaceholder")} />
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
          <Plus className="h-4 w-4" /> {t("expenseNew.addLine")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 border-t border-zinc-100 px-6 py-6 lg:grid-cols-[1fr_320px] sm:px-8">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("expenseNew.memo")}</span>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={4} className={`${inputClass} resize-none`} />
        </label>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">{t("expenseNew.subtotal")}</span>
            <span className="font-semibold text-zinc-900">{formatRupiah(subtotal + totalTax)}</span>
          </div>

          {!showDiscount ? (
            <button type="button" onClick={() => setShowDiscount(true)} className="mt-2 text-sm font-medium text-emerald-600 hover:underline">
              {t("expenseNew.discountLabel")}
            </button>
          ) : (
            <label className="mt-2 block text-sm">
              <span className="mb-1 block text-zinc-500">{t("expenseNew.discountAmount")}</span>
              <input
                type="number"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-right text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </label>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3">
            <span className="font-semibold text-zinc-800">{t("expenseNew.total")}</span>
            <span className="text-lg font-bold text-zinc-900">{formatRupiah(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-zinc-100 bg-zinc-50 px-6 py-4 sm:px-8">
        <Link href={cancelHref} className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
          {t("expenseNew.cancel")}
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? savingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
