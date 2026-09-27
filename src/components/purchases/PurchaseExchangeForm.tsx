"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { Contact, CreatePurchaseInput, PurchaseDocument, PurchaseDocumentDetail } from "@/lib/types";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";

interface ExchangeLineDraft {
  invoice: PurchaseDocument;
  creditAmount: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const PAYMENT_TERMS = ["Net 30", "Cash on Delivery", "Net 15", "Net 60"];

interface PurchaseExchangeFormProps {
  initial?: PurchaseDocumentDetail;
  cancelHref: string;
  onSubmit: (input: CreatePurchaseInput) => Promise<void>;
}

// "Tukar Faktur Pembelian" doesn't buy anything new -- each line instead picks an
// existing approved purchase invoice and credits part (or all) of its outstanding
// balance, matching the reference screen's invoice picker (no Produk/Akun involved).
export function PurchaseExchangeForm({ initial, cancelHref, onSubmit }: PurchaseExchangeFormProps) {
  const { t } = useLanguage();

  const [suppliers, setSuppliers] = useState<Contact[]>([]);
  const [candidateInvoices, setCandidateInvoices] = useState<PurchaseDocument[]>([]);

  const [contactId, setContactId] = useState(initial?.contactId ? String(initial.contactId) : "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [billingAddress, setBillingAddress] = useState(initial?.billingAddress ?? "");
  const [documentDate, setDocumentDate] = useState(initial?.documentDate ?? today());
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [paymentTerm, setPaymentTerm] = useState(initial?.paymentTerm ?? "Net 30");
  const [customerNote, setCustomerNote] = useState(initial?.customerNote ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [pickInvoiceId, setPickInvoiceId] = useState("");
  const [lines, setLines] = useState<ExchangeLineDraft[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.contacts({ type: "vendor" }).then(setSuppliers).catch(() => {});
  }, []);

  // Prefill lines when editing an existing draft/rejected exchange -- fetch each
  // target invoice individually since the list endpoint alone won't have them all.
  useEffect(() => {
    if (!initial?.lines.length) return;
    Promise.all(
      initial.lines.filter((l) => l.targetDocumentId).map((l) => api.getPurchase(l.targetDocumentId!))
    ).then((invoices) => {
      setLines(
        invoices.map((inv, i) => ({
          invoice: inv,
          creditAmount: String(initial.lines[i].amount),
        }))
      );
    });
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!contactId) {
      setCandidateInvoices([]);
      return;
    }
    api
      .purchases({ docType: "invoice", status: "approved", contactId: Number(contactId) })
      .then((invoices) => setCandidateInvoices(invoices.filter((i) => i.outstanding > 0)))
      .catch(() => {});
  }, [contactId]);

  const supplierOptions = suppliers.map((s) => ({ value: String(s.id), label: s.name }));
  const invoiceOptions = candidateInvoices
    .filter((inv) => !lines.some((l) => l.invoice.id === inv.id))
    .map((inv) => ({ value: String(inv.id), label: `${inv.number} (${formatRupiah(inv.outstanding)})` }));

  function pickInvoice(invoiceId: string) {
    const invoice = candidateInvoices.find((i) => String(i.id) === invoiceId);
    if (!invoice) return;
    setLines((prev) => [...prev, { invoice, creditAmount: String(invoice.outstanding) }]);
    setPickInvoiceId("");
  }

  function updateCreditAmount(i: number, value: string) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, creditAmount: value } : l)));
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  const totalExchange = lines.reduce((sum, l) => sum + (Number(l.creditAmount) || 0), 0);
  const totalRemaining = lines.reduce((sum, l) => sum + Math.max(l.invoice.outstanding - (Number(l.creditAmount) || 0), 0), 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validLines = lines.filter((l) => Number(l.creditAmount) > 0);
    if (!validLines.length) {
      setError(t("purchases.new.errorSave"));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        contactId: contactId ? Number(contactId) : undefined,
        documentDate,
        dueDate: dueDate || undefined,
        email: email || undefined,
        billingAddress: billingAddress || undefined,
        paymentTerm: paymentTerm || undefined,
        customerNote: customerNote || undefined,
        memo: memo || undefined,
        discountAmount: 0,
        submitForApproval: true,
        lines: validLines.map((l) => ({
          targetDocumentId: l.invoice.id,
          description: l.invoice.number,
          qty: 1,
          unitPrice: 0,
          amount: Number(l.creditAmount),
          taxAmount: 0,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("purchases.new.errorSave"));
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {error && <p className="mx-6 mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:mx-8">{error}</p>}

      <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.supplier")} *</span>
          <Dropdown value={contactId} onChange={setContactId} options={supplierOptions} placeholder={t("purchases.new.supplierPlaceholder")} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.email")}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("expenseNew.billingAddress")}</span>
          <textarea rows={2} value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className={`${inputClass} resize-none`} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 border-t border-zinc-100 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.date")}</span>
          <DatePicker value={documentDate} onChange={setDocumentDate} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.number")}</span>
          <input disabled value={initial?.number ?? t("purchases.new.exchangeNumberAuto")} className={`${inputClass} bg-zinc-50 text-zinc-400`} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.dueDate")} *</span>
          <DatePicker value={dueDate} onChange={setDueDate} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.paymentTerm")}</span>
          <Dropdown value={paymentTerm} onChange={setPaymentTerm} options={PAYMENT_TERMS.map((p) => ({ value: p, label: p }))} />
        </label>
      </div>

      <div className="border-t border-zinc-100 px-6 py-6 sm:px-8">
        <div className="hidden gap-3 border-b border-zinc-100 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_110px_110px_130px_130px_36px]">
          <span>{t("purchases.new.exchangeInvoiceCol")}</span>
          <span>{t("purchases.new.colDescription")}</span>
          <span>{t("purchases.detail.dueDate")}</span>
          <span>{t("purchases.colStatus")}</span>
          <span className="text-right">{t("purchases.new.billedAmount")}</span>
          <span className="text-right">{t("purchases.colOutstanding")}</span>
          <span />
        </div>

        <div className="mt-2 space-y-3 pb-4 sm:space-y-2">
          {lines.map((line, i) => (
            <div
              key={line.invoice.id}
              className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-100 p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_110px_110px_130px_130px_36px] sm:items-center sm:rounded-none sm:border-0 sm:p-0"
            >
              <p className="text-sm font-medium text-emerald-700">{line.invoice.number}</p>
              <p className="text-sm text-zinc-500">{line.invoice.memo ?? "-"}</p>
              <p className="text-sm text-zinc-500">{line.invoice.dueDate ? formatDate(line.invoice.dueDate) : "-"}</p>
              <p className="text-sm text-zinc-500">{line.invoice.status}</p>
              <p className="text-right text-sm text-zinc-500">{formatRupiah(line.invoice.totalAmount)}</p>
              <input
                type="number"
                min={0}
                max={line.invoice.outstanding}
                value={line.creditAmount}
                onChange={(e) => updateCreditAmount(i, e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-right text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="justify-self-end rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 sm:justify-self-auto"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <Dropdown
          value={pickInvoiceId}
          onChange={pickInvoice}
          options={invoiceOptions}
          placeholder={t("purchases.new.pickInvoicePlaceholder")}
          disabled={!contactId}
          className="max-w-xs"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 border-t border-zinc-100 px-6 py-6 lg:grid-cols-[1fr_320px] sm:px-8">
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.customerNote")}</span>
            <textarea value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.memo")}</span>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
          </label>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">{t("purchases.new.exchangeTotal")}</span>
            <span className="text-lg font-bold text-zinc-900">{formatRupiah(totalExchange)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3">
            <span className="font-semibold text-zinc-800">{t("purchases.new.remainingTotal")}</span>
            <span className="font-semibold text-zinc-900">{formatRupiah(totalRemaining)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-zinc-100 bg-zinc-50 px-6 py-4 sm:px-8">
        <Link href={cancelHref} className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
          {t("purchases.new.cancel")}
        </Link>
        <button
          type="submit"
          disabled={submitting || !lines.length}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40"
        >
          {submitting ? t("purchases.new.saving") : t("purchases.new.submitForApproval")}
        </button>
      </div>
    </form>
  );
}
