"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah } from "@/lib/format";
import { Contact, CreateSaleInput, Product, SaleDocType, SaleDocumentDetail, TaxCode, Warehouse } from "@/lib/types";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";

interface LineDraft {
  productId: string;
  description: string;
  qty: string;
  unitPrice: string;
  taxId: string;
}

function emptyLine(): LineDraft {
  return { productId: "", description: "", qty: "1", unitPrice: "", taxId: "" };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// "Syarat Pembayaran" presets -- picking one auto-computes Tgl. Jatuh Tempo from the
// document date; "Custom" leaves the due date free to edit directly. Mirrors
// PurchaseForm.tsx exactly.
const PAYMENT_TERMS: { label: string; days: number | null }[] = [
  { label: "Net 30", days: 30 },
  { label: "Cash on Delivery", days: 0 },
  { label: "Net 15", days: 15 },
  { label: "Net 60", days: 60 },
  { label: "Custom", days: null },
];

interface SaleFormProps {
  docType: SaleDocType;
  initial?: SaleDocumentDetail;
  cancelHref: string;
  onSubmit: (input: CreateSaleInput) => Promise<void>;
}

// Shared by /b2b-sales/new and /b2b-sales/[id]/edit -- mirrors PurchaseForm.tsx's
// Produk-based line model (a line's income account is resolved server-side from the
// product's sale_account_id, not typed in directly) with a customer picker instead of
// a supplier one. Text labels intentionally reuse "purchases.new.*" i18n keys where the
// wording is identical rather than duplicating them under "sales.new.*".
export function SaleForm({ docType, initial, cancelHref, onSubmit }: SaleFormProps) {
  const { t } = useLanguage();

  const [customers, setCustomers] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [taxes, setTaxes] = useState<TaxCode[]>([]);

  const [contactId, setContactId] = useState(initial?.contactId ? String(initial.contactId) : "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [billingAddress, setBillingAddress] = useState(initial?.billingAddress ?? "");
  const [documentDate, setDocumentDate] = useState(initial?.documentDate ?? today());
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [paymentTerm, setPaymentTerm] = useState(initial?.paymentTerm ?? "");
  const [customerRef, setCustomerRef] = useState(initial?.customerRef ?? "");
  const [tag, setTag] = useState(initial?.tag ?? "");
  const [warehouseId, setWarehouseId] = useState(initial?.warehouseId ? String(initial.warehouseId) : "");
  const [customerNote, setCustomerNote] = useState(initial?.customerNote ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [priceIncludesTax, setPriceIncludesTax] = useState(false);
  const [showDiscount, setShowDiscount] = useState((initial?.discountAmount ?? 0) > 0);
  const [discountAmount, setDiscountAmount] = useState(initial?.discountAmount ? String(initial.discountAmount) : "");
  const [lines, setLines] = useState<LineDraft[]>(
    initial?.lines.length
      ? initial.lines.map((l) => ({
          productId: l.productId ? String(l.productId) : "",
          description: l.description ?? "",
          qty: String(l.qty),
          unitPrice: String(l.unitPrice),
          taxId: l.taxId ? String(l.taxId) : "",
        }))
      : [emptyLine()]
  );

  const [submitting, setSubmitting] = useState<"draft" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.contacts({ type: "customer" }).then(setCustomers).catch(() => {});
    api.products().then((res) => setProducts(res.products)).catch(() => {});
    api.warehouses().then(setWarehouses).catch(() => {});
    api.taxes().then(setTaxes).catch(() => {});
  }, []);

  const customerOptions = customers.map((c) => ({ value: String(c.id), label: c.name }));
  const productOptions = products.map((p) => ({ value: String(p.id), label: `${p.code} - ${p.name}` }));
  const warehouseOptions = warehouses.map((w) => ({ value: String(w.id), label: w.name }));
  const taxOptions = taxes.map((tax) => ({ value: String(tax.id), label: `${tax.name} (${tax.rate}%)` }));

  function updateLine(i: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function selectLineProduct(i: number, productId: string) {
    const product = products.find((p) => String(p.id) === productId);
    updateLine(i, {
      productId,
      unitPrice: product ? String(product.sellingPrice) : "",
      taxId: product?.saleTaxId ? String(product.saleTaxId) : "",
      description: product?.name ?? "",
    });
  }

  function selectPaymentTerm(label: string) {
    setPaymentTerm(label);
    const term = PAYMENT_TERMS.find((p) => p.label === label);
    if (term && term.days !== null) setDueDate(addDays(documentDate, term.days));
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
        const qty = Number(line.qty) || 0;
        const unitPrice = Number(line.unitPrice) || 0;
        const gross = qty * unitPrice;
        const rate = taxes.find((tax) => String(tax.id) === line.taxId)?.rate ?? 0;
        const base = priceIncludesTax ? gross / (1 + rate / 100) : gross;
        const taxAmount = priceIncludesTax ? gross - base : base * (rate / 100);
        return { ...line, base, taxAmount };
      }),
    [lines, taxes, priceIncludesTax]
  );

  const subtotal = computedLines.reduce((sum, l) => sum + l.base, 0);
  const totalTax = computedLines.reduce((sum, l) => sum + l.taxAmount, 0);
  const discount = Number(discountAmount) || 0;
  const total = Math.max(subtotal + totalTax - discount, 0);

  async function handleSubmit(e: FormEvent, submitForApproval: boolean) {
    e.preventDefault();
    setError(null);

    const validLines = computedLines.filter((l) => l.productId && l.base > 0);
    if (!validLines.length) {
      setError(t("sales.new.errorSave"));
      return;
    }

    setSubmitting(submitForApproval ? "submit" : "draft");
    try {
      await onSubmit({
        contactId: contactId ? Number(contactId) : undefined,
        documentDate,
        dueDate: dueDate || undefined,
        email: email || undefined,
        billingAddress: billingAddress || undefined,
        customerRef: customerRef || undefined,
        tag: tag || undefined,
        paymentTerm: paymentTerm || undefined,
        warehouseId: warehouseId ? Number(warehouseId) : undefined,
        customerNote: customerNote || undefined,
        memo: memo || undefined,
        discountAmount: discount,
        submitForApproval,
        lines: validLines.map((l) => ({
          productId: Number(l.productId),
          description: l.description || undefined,
          qty: Number(l.qty) || 1,
          unitPrice: Number(l.unitPrice) || 0,
          taxId: l.taxId ? Number(l.taxId) : undefined,
          amount: Math.round(l.base * 100) / 100,
          taxAmount: Math.round(l.taxAmount * 100) / 100,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sales.new.errorSave"));
      setSubmitting(null);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {error && <p className="mx-6 mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:mx-8">{error}</p>}

      <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("sales.new.customer")}</span>
          <Dropdown value={contactId} onChange={setContactId} options={customerOptions} placeholder={t("sales.new.customerPlaceholder")} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.email")}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. john@example.com" className={inputClass} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("expenseNew.billingAddress")}</span>
          <textarea
            rows={2}
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            placeholder={t("contacts.new.addressPlaceholder")}
            className={`${inputClass} resize-none`}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 border-t border-zinc-100 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4 sm:px-8">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.date")}</span>
          <DatePicker value={documentDate} onChange={setDocumentDate} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.number")}</span>
          <input disabled value={initial?.number ?? t("purchases.new.numberAuto")} className={`${inputClass} bg-zinc-50 text-zinc-400`} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t(docType === "quotation" ? "purchases.new.expiryDate" : "purchases.new.dueDate")}</span>
          <DatePicker value={dueDate} onChange={setDueDate} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.paymentTerm")}</span>
          <Dropdown value={paymentTerm} onChange={selectPaymentTerm} options={PAYMENT_TERMS.map((p) => ({ value: p.label, label: p.label }))} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("sales.new.customerRef")}</span>
          <input value={customerRef} onChange={(e) => setCustomerRef(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.tag")}</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} className={inputClass} />
        </label>
        {docType !== "quotation" && (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.warehouse")}</span>
            <Dropdown value={warehouseId} onChange={setWarehouseId} options={warehouseOptions} placeholder={t("purchases.new.warehousePlaceholder")} />
          </label>
        )}
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

        <div className="hidden gap-3 border-b border-zinc-100 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_60px_70px_110px_minmax(0,0.8fr)_110px_36px]">
          <span>{t("purchases.new.product")}</span>
          <span>{t("purchases.new.colDescription")}</span>
          <span className="text-right">{t("purchases.new.colQty")}</span>
          <span>{t("purchases.new.colUnit")}</span>
          <span className="text-right">{t("purchases.new.colPrice")}</span>
          <span>{t("purchases.new.colTax")}</span>
          <span className="text-right">{t("purchases.new.colAmount")}</span>
          <span />
        </div>

        <div className="mt-2 space-y-3 pb-4 sm:space-y-2">
          {lines.map((line, i) => {
            const computed = computedLines[i];
            const unit = products.find((p) => String(p.id) === line.productId)?.unit;
            return (
              <div
                key={i}
                className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-100 p-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_60px_70px_110px_minmax(0,0.8fr)_110px_36px] sm:items-center sm:rounded-none sm:border-0 sm:p-0"
              >
                <Dropdown value={line.productId} onChange={(v) => selectLineProduct(i, v)} options={productOptions} placeholder={t("purchases.new.productPlaceholder")} />
                <input
                  value={line.description}
                  onChange={(e) => updateLine(i, { description: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  min={0}
                  value={line.qty}
                  onChange={(e) => updateLine(i, { qty: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-right text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-sm text-zinc-500">{unit ?? "-"}</p>
                <input
                  type="number"
                  min={0}
                  value={line.unitPrice}
                  onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-right text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Dropdown value={line.taxId} onChange={(v) => updateLine(i, { taxId: v })} options={taxOptions} placeholder={t("purchases.new.taxPlaceholder")} />
                <p className="text-right text-sm font-medium text-zinc-700">{formatRupiah(computed.base + computed.taxAmount)}</p>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={lines.length <= 1}
                  className="justify-self-end rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 sm:justify-self-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={addLine} className="mb-6 flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700">
          <Plus className="h-4 w-4" /> {t("purchases.new.addLine")}
        </button>
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
            <span className="text-zinc-500">{t("purchases.new.subtotal")}</span>
            <span className="font-semibold text-zinc-900">{formatRupiah(subtotal)}</span>
          </div>
          {totalTax > 0 && (
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-zinc-500">{t("purchases.new.tax")}</span>
              <span className="font-semibold text-zinc-900">{formatRupiah(totalTax)}</span>
            </div>
          )}

          {!showDiscount ? (
            <button type="button" onClick={() => setShowDiscount(true)} className="mt-2 text-sm font-medium text-emerald-600 hover:underline">
              {t("purchases.new.addDiscount")}
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
            <span className="font-semibold text-zinc-800">{t("purchases.new.total")}</span>
            <span className="text-lg font-bold text-zinc-900">{formatRupiah(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-zinc-100 bg-zinc-50 px-6 py-4 sm:px-8">
        <Link href={cancelHref} className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
          {t("purchases.new.cancel")}
        </Link>
        <button
          type="submit"
          disabled={submitting !== null}
          className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          {submitting === "draft" ? t("purchases.new.saving") : t("purchases.new.saveDraft")}
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={submitting !== null}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting === "submit" ? t("purchases.new.saving") : t("purchases.new.submitForApproval")}
        </button>
      </div>
    </form>
  );
}
