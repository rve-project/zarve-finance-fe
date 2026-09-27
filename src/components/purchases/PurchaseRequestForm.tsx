"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Contact, CreatePurchaseInput, ManagedUser, Product, PurchaseDocumentDetail } from "@/lib/types";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";

interface LineDraft {
  productId: string;
  description: string;
  qty: string;
}

function emptyLine(): LineDraft {
  return { productId: "", description: "", qty: "1" };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const URGENCY_OPTIONS = [
  { value: "low", labelKey: "purchases.new.urgencyLow" },
  { value: "medium", labelKey: "purchases.new.urgencyMedium" },
  { value: "high", labelKey: "purchases.new.urgencyHigh" },
  { value: "urgent", labelKey: "purchases.new.urgencyUrgent" },
];

interface PurchaseRequestFormProps {
  initial?: PurchaseDocumentDetail;
  cancelHref: string;
  onSubmit: (input: CreatePurchaseInput) => Promise<void>;
}

// "Permintaan Pembelian" has no pricing at all (just what's needed and how much -- a
// price only exists once it becomes a Penawaran/Pesanan/Faktur), and needs an assigned
// approver + urgency instead of the usual line-item financial fields.
export function PurchaseRequestForm({ initial, cancelHref, onSubmit }: PurchaseRequestFormProps) {
  const { t } = useLanguage();

  const [staff, setStaff] = useState<ManagedUser[]>([]);
  const [suppliers, setSuppliers] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [approverUserId, setApproverUserId] = useState(initial?.approverUserId ? String(initial.approverUserId) : "");
  const [approverEmail, setApproverEmail] = useState(initial?.approverEmail ?? "");
  const [contactId, setContactId] = useState(initial?.contactId ? String(initial.contactId) : "");
  const [documentDate, setDocumentDate] = useState(initial?.documentDate ?? today());
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [urgency, setUrgency] = useState(initial?.urgency ?? "medium");
  const [budgetYear, setBudgetYear] = useState(initial?.budgetYear ?? "");
  const [tag, setTag] = useState(initial?.tag ?? "");
  const [customerNote, setCustomerNote] = useState(initial?.customerNote ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [lines, setLines] = useState<LineDraft[]>(
    initial?.lines.length
      ? initial.lines.map((l) => ({ productId: l.productId ? String(l.productId) : "", description: l.description ?? "", qty: String(l.qty) }))
      : [emptyLine()]
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.users().then(setStaff).catch(() => {});
    api.contacts({ type: "vendor" }).then(setSuppliers).catch(() => {});
    api.products().then((res) => setProducts(res.products)).catch(() => {});
  }, []);

  const staffOptions = staff.map((u) => ({ value: String(u.id), label: u.name }));
  const supplierOptions = suppliers.map((s) => ({ value: String(s.id), label: s.name }));
  const productOptions = products.map((p) => ({ value: String(p.id), label: `${p.code} - ${p.name}` }));
  const selectedSupplier = suppliers.find((s) => String(s.id) === contactId);

  function selectApprover(userId: string) {
    setApproverUserId(userId);
    const user = staff.find((u) => String(u.id) === userId);
    if (user?.email) setApproverEmail(user.email);
  }

  function updateLine(i: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function selectLineProduct(i: number, productId: string) {
    const product = products.find((p) => String(p.id) === productId);
    updateLine(i, { productId, description: product?.name ?? "" });
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  const totalItems = lines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0);
  const validLines = lines.filter((l) => l.productId && Number(l.qty) > 0);
  const canSubmit = !!approverUserId && !!approverEmail && !!documentDate && !!urgency && validLines.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError(t("purchases.new.errorSave"));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        contactId: contactId ? Number(contactId) : undefined,
        documentDate,
        dueDate: dueDate || undefined,
        approverUserId: Number(approverUserId),
        approverEmail,
        urgency,
        budgetYear: budgetYear || undefined,
        tag: tag || undefined,
        customerNote: customerNote || undefined,
        memo: memo || undefined,
        discountAmount: 0,
        submitForApproval: true,
        lines: validLines.map((l) => ({
          productId: Number(l.productId),
          description: l.description || undefined,
          qty: Number(l.qty) || 1,
          unitPrice: 0,
          amount: 0,
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
  const disabledInputClass = `${inputClass} bg-zinc-50 text-zinc-400`;

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {error && <p className="mx-6 mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:mx-8">{error}</p>}

      <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.approverStaff")} *</span>
          <Dropdown value={approverUserId} onChange={selectApprover} options={staffOptions} placeholder={t("purchases.new.approverStaffPlaceholder")} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.approverEmail")} *</span>
          <input required type="email" value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 border-t border-zinc-100 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.supplierName")}</span>
          <Dropdown value={contactId} onChange={setContactId} options={supplierOptions} placeholder={t("purchases.new.supplierPlaceholder")} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.supplierAddress")}</span>
          <textarea disabled rows={2} value={selectedSupplier?.address ?? ""} className={`${disabledInputClass} resize-none`} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.supplierEmail")}</span>
          <input disabled value={selectedSupplier?.email ?? ""} className={disabledInputClass} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 border-t border-zinc-100 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 sm:px-8">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.date")} *</span>
          <DatePicker value={documentDate} onChange={setDocumentDate} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.dueDate")}</span>
          <DatePicker value={dueDate} onChange={setDueDate} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.urgency")} *</span>
          <Dropdown value={urgency} onChange={setUrgency} options={URGENCY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.number")}</span>
          <input disabled value={initial?.number ?? t("purchases.new.numberAuto")} className={disabledInputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.budgetYear")}</span>
          <input value={budgetYear} onChange={(e) => setBudgetYear(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.tag")}</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="px-6 sm:px-8">
        <div className="hidden gap-3 border-b border-zinc-100 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_100px_100px_36px]">
          <span>{t("purchases.new.product")}</span>
          <span>{t("purchases.new.colDescription")}</span>
          <span className="text-right">{t("purchases.new.colQty")}</span>
          <span>{t("purchases.new.colUnit")}</span>
          <span />
        </div>

        <div className="mt-2 space-y-3 pb-4 sm:space-y-2">
          {lines.map((line, i) => {
            const unit = products.find((p) => String(p.id) === line.productId)?.unit;
            return (
              <div
                key={i}
                className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-100 p-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_100px_100px_36px] sm:items-center sm:rounded-none sm:border-0 sm:p-0"
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
            <textarea value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.new.memo")}</span>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </label>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">{t("purchases.new.totalItems")}</span>
            <span className="font-semibold text-zinc-900">
              {totalItems} {t("purchases.new.itemsUnit")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-zinc-100 bg-zinc-50 px-6 py-4 sm:px-8">
        <Link href={cancelHref} className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
          {t("purchases.new.cancel")}
        </Link>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40"
        >
          {submitting ? t("purchases.new.saving") : t("purchases.new.createRequest")}
        </button>
      </div>
    </form>
  );
}
