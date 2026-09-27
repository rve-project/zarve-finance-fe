"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Printer, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { Account, JournalEntryDetail, SaleDocType, SaleDocumentDetail } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";

const DOC_TYPE_LABEL_KEY: Record<SaleDocType, string> = {
  quotation: "sales.docTypeQuotation",
  order: "sales.docTypeOrder",
  invoice: "sales.docTypeInvoice",
  shipment: "sales.docTypeShipment",
  exchange: "sales.docTypeExchange",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "text-zinc-500",
  pending_approval: "text-amber-600",
  approved: "text-emerald-600",
  rejected: "text-red-600",
};

const STATUS_LABEL_KEY: Record<string, string> = {
  draft: "sales.statusDraft",
  pending_approval: "sales.statusPendingApproval",
  approved: "sales.statusApproved",
  rejected: "sales.statusRejected",
};

// Mirrors purchases' NEXT_STAGES -- exchanges are created directly (picking target
// invoices), not via convert, so "invoice" offers no next stage.
const NEXT_STAGES: Record<SaleDocType, SaleDocType[]> = {
  quotation: ["order"],
  order: ["invoice", "shipment"],
  invoice: [],
  shipment: [],
  exchange: [],
};

export default function SaleDetailPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [doc, setDoc] = useState<SaleDocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [journalExpanded, setJournalExpanded] = useState(false);
  const [journal, setJournal] = useState<JournalEntryDetail | null>(null);
  const [journalLoading, setJournalLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [paymentBankId, setPaymentBankId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMemo, setPaymentMemo] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  function load() {
    return api
      .getSale(Number(id))
      .then(setDoc)
      .catch((err) => setError(err instanceof Error ? err.message : t("sales.errorLoading")));
  }

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (paymentOpen && !bankAccounts.length) {
      api.accounts(undefined, "cash_bank").then(setBankAccounts).catch(() => {});
    }
  }, [paymentOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleJournal() {
    if (journalExpanded) {
      setJournalExpanded(false);
      return;
    }
    setJournalExpanded(true);
    if (!journal && doc?.journalEntryId) {
      setJournalLoading(true);
      api
        .getJournalEntry(doc.journalEntryId)
        .then(setJournal)
        .catch(() => {})
        .finally(() => setJournalLoading(false));
    }
  }

  async function runAction(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sales.errorAction"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!doc || !window.confirm(t("sales.confirmDelete").replace("{number}", doc.number))) return;
    setBusy(true);
    try {
      await api.deleteSale(doc.id);
      router.push("/b2b-sales");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sales.errorAction"));
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!doc) return;
    const reason = window.prompt(t("sales.confirmReject")) ?? undefined;
    await runAction(() => api.rejectSale(doc.id, reason));
  }

  async function handleSubmitPayment() {
    if (!doc) return;
    setPaymentError(null);
    if (!paymentBankId || !paymentAmount || !paymentDate) {
      setPaymentError(t("purchases.new.errorSave"));
      return;
    }
    setPaymentSaving(true);
    try {
      await api.addSalePayment(doc.id, {
        bankAccountId: Number(paymentBankId),
        amount: Number(paymentAmount),
        paymentDate,
        memo: paymentMemo || undefined,
      });
      setPaymentOpen(false);
      setPaymentAmount("");
      setPaymentMemo("");
      await load();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : t("sales.payment.errorSave"));
    } finally {
      setPaymentSaving(false);
    }
  }

  if (error && !doc) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!doc) return <p className="text-sm text-zinc-400">{t("common.loading")}</p>;

  const nextStages = NEXT_STAGES[doc.docType];
  const isExchange = doc.docType === "exchange";

  return (
    <div>
      <div className="print:hidden">
        <Breadcrumb items={[{ label: t("sales.title"), href: "/b2b-sales" }, { label: doc.number }]} />
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-start justify-between px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs text-zinc-400">
              {t("purchases.detail.transaction")} · {t(DOC_TYPE_LABEL_KEY[doc.docType])}
            </p>
            <h1 className="text-lg font-bold text-zinc-900 sm:text-xl">{doc.number}</h1>
          </div>
          <span className={`text-sm font-semibold ${STATUS_STYLE[doc.status]}`}>{t(STATUS_LABEL_KEY[doc.status])}</span>
        </div>

        {doc.status === "rejected" && doc.rejectedReason && (
          <div className="border-y border-red-100 bg-red-50/60 px-6 py-3 text-sm text-red-700 sm:px-8">
            <span className="font-medium">{t("sales.detail.rejectedReason")}:</span> {doc.rejectedReason}
          </div>
        )}

        {doc.docType === "invoice" && doc.status === "approved" && (
          <div className="flex flex-col gap-2 border-y border-emerald-100 bg-emerald-50/50 px-6 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-8">
            <div className="text-sm">
              <p className="text-xs text-zinc-500">{t("expenseNew.total")}</p>
              <p className="font-medium text-zinc-900">{formatRupiah(doc.totalAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">
                {t("expenses.colOutstanding")} <span className="text-lg font-bold text-zinc-900">{formatRupiah(doc.outstanding)}</span>
              </p>
              {doc.journalEntryId && (
                <button type="button" onClick={toggleJournal} className="mt-1 text-xs font-medium text-emerald-600 hover:underline">
                  {t("sales.detail.viewJournalEntry")}
                </button>
              )}
            </div>
          </div>
        )}

        {journalExpanded && (
          <div className="border-b border-zinc-100 bg-zinc-50/60 px-6 py-4 sm:px-8">
            {journalLoading && <p className="text-xs text-zinc-400">{t("common.loading")}</p>}
            {!journalLoading && journal && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-zinc-400">
                    <th className="px-2 py-1.5 font-medium">{t("journalEntries.table.account")}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{t("journalEntries.form.debitPlaceholder")}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{t("journalEntries.form.creditPlaceholder")}</th>
                  </tr>
                </thead>
                <tbody>
                  {journal.lines.map((l) => (
                    <tr key={l.id} className="border-t border-zinc-100">
                      <td className="px-2 py-1.5">
                        {l.accountCode} - {l.accountName}
                      </td>
                      <td className="px-2 py-1.5 text-right">{l.debit ? formatRupiah(l.debit) : "-"}</td>
                      <td className="px-2 py-1.5 text-right">{l.credit ? formatRupiah(l.credit) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4 sm:px-8">
          <div>
            <p className="text-xs text-zinc-400">{t("sales.detail.customer")}</p>
            <p className="font-medium text-zinc-900">{doc.contactName ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">{t("purchases.detail.date")}</p>
            <p className="font-medium text-zinc-900">{formatDate(doc.documentDate)}</p>
          </div>
          {doc.docType === "invoice" && (
            <div>
              <p className="text-xs text-zinc-400">{t("purchases.detail.dueDate")}</p>
              <p className="font-medium text-zinc-900">{doc.dueDate ? formatDate(doc.dueDate) : "-"}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-zinc-400">{t("purchases.detail.reference")}</p>
            <p className="font-medium text-zinc-900">{doc.reference ?? "-"}</p>
          </div>
          {doc.customerRef && (
            <div>
              <p className="text-xs text-zinc-400">{t("sales.new.customerRef")}</p>
              <p className="font-medium text-zinc-900">{doc.customerRef}</p>
            </div>
          )}
          {doc.paymentTerm && (
            <div>
              <p className="text-xs text-zinc-400">{t("purchases.new.paymentTerm")}</p>
              <p className="font-medium text-zinc-900">{doc.paymentTerm}</p>
            </div>
          )}
          {doc.warehouseName && (
            <div>
              <p className="text-xs text-zinc-400">{t("purchases.new.warehouse")}</p>
              <p className="font-medium text-zinc-900">{doc.warehouseName}</p>
            </div>
          )}
          {doc.tag && (
            <div>
              <p className="text-xs text-zinc-400">{t("purchases.new.tag")}</p>
              <p className="font-medium text-zinc-900">{doc.tag}</p>
            </div>
          )}
          {doc.email && (
            <div>
              <p className="text-xs text-zinc-400">{t("purchases.new.email")}</p>
              <p className="font-medium text-zinc-900">{doc.email}</p>
            </div>
          )}
          {doc.customerNote && (
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-xs text-zinc-400">{t("purchases.new.customerNote")}</p>
              <p className="font-medium text-zinc-900">{doc.customerNote}</p>
            </div>
          )}
          {doc.memo && (
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-xs text-zinc-400">{t("purchases.detail.memo")}</p>
              <p className="font-medium text-zinc-900">{doc.memo}</p>
            </div>
          )}
        </div>

        <div className="overflow-x-auto border-t border-zinc-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-zinc-500">
                {isExchange ? (
                  <>
                    <th className="px-6 py-2.5 font-medium sm:px-8">{t("purchases.new.exchangeInvoiceCol")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("purchases.new.colDescription")}</th>
                    <th className="px-4 py-2.5 pr-6 text-right font-medium sm:pr-8">{t("purchases.new.exchangeTotal")}</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-2.5 font-medium sm:px-8">{t("purchases.new.product")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("purchases.new.colDescription")}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t("purchases.new.colQty")}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t("purchases.new.colPrice")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("purchases.new.colTax")}</th>
                    <th className="px-4 py-2.5 pr-6 text-right font-medium sm:pr-8">{t("sales.colTotal")}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {doc.lines.map((line) => (
                <tr key={line.id} className="border-b border-zinc-50">
                  {isExchange ? (
                    <>
                      <td className="px-6 py-2.5 sm:px-8">{line.targetDocumentNumber ?? "-"}</td>
                      <td className="px-4 py-2.5 text-zinc-600">{line.description ?? "-"}</td>
                      <td className="px-4 py-2.5 pr-6 text-right sm:pr-8">{formatRupiah(line.amount)}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-2.5 sm:px-8">{line.productName ?? line.accountName ?? "-"}</td>
                      <td className="px-4 py-2.5 text-zinc-600">{line.description ?? "-"}</td>
                      <td className="px-4 py-2.5 text-right">{line.qty}</td>
                      <td className="px-4 py-2.5 text-right">{formatRupiah(line.unitPrice)}</td>
                      <td className="px-4 py-2.5 text-zinc-600">{line.taxName ?? "-"}</td>
                      <td className="px-4 py-2.5 pr-6 text-right sm:pr-8">{formatRupiah(line.amount + line.taxAmount)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end px-6 py-6 sm:px-8">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">{t("purchases.new.subtotal")}</span>
              <span className="font-medium text-zinc-900">{formatRupiah(doc.subtotal)}</span>
            </div>
            {doc.taxTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">{t("purchases.new.tax")}</span>
                <span className="font-medium text-zinc-900">{formatRupiah(doc.taxTotal)}</span>
              </div>
            )}
            {doc.discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">{t("purchases.new.addDiscount")}</span>
                <span className="font-medium text-zinc-900">-{formatRupiah(doc.discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-zinc-200 pt-2">
              <span className="font-semibold text-zinc-800">{t("purchases.new.total")}</span>
              <span className="font-semibold text-zinc-900">{formatRupiah(doc.totalAmount)}</span>
            </div>
          </div>
        </div>

        {doc.docType === "invoice" && doc.status === "approved" && (
          <div className="border-t border-zinc-100 px-6 py-5 sm:px-8">
            <p className="mb-2 text-sm font-semibold text-zinc-700">{t("sales.payment.history")}</p>
            {doc.payments.length > 0 ? (
              <table className="w-full text-sm">
                <tbody>
                  {doc.payments.map((p) => (
                    <tr key={p.id} className="border-b border-zinc-50">
                      <td className="py-1.5 text-zinc-500">{formatDate(p.paymentDate)}</td>
                      <td className="py-1.5 text-zinc-500">{p.bankAccountName}</td>
                      <td className="py-1.5 text-zinc-500">{p.memo ?? "-"}</td>
                      <td className="py-1.5 text-right font-medium">{formatRupiah(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-zinc-400">-</p>
            )}
          </div>
        )}

        <p className="border-t border-zinc-100 px-6 py-3 text-right text-xs text-zinc-400 sm:px-8">
          {t("expenseDetail.createdAt")} {formatDate(doc.createdAt)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          {(doc.status === "draft" || doc.status === "rejected") && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" /> {t("purchases.action.delete")}
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <Printer className="h-4 w-4" /> {t("purchases.action.print")}
          </button>

          {(doc.status === "draft" || doc.status === "rejected") && (
            <Link
              href={`/b2b-sales/${doc.id}/edit`}
              className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              {t("purchases.action.edit")}
            </Link>
          )}

          {doc.status === "draft" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction(() => api.submitSale(doc.id))}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {t("purchases.action.submit")}
            </button>
          )}

          {doc.status === "pending_approval" && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={handleReject}
                className="rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {t("purchases.action.reject")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => runAction(() => api.approveSale(doc.id))}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {t("purchases.action.approve")}
              </button>
            </>
          )}

          {doc.status === "approved" && doc.docType === "invoice" && (
            <button
              type="button"
              onClick={() => setPaymentOpen(true)}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              {t("sales.action.recordPayment")}
            </button>
          )}

          {doc.status === "approved" && nextStages.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setConvertOpen((v) => !v)}
                disabled={busy}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {t("purchases.action.convertTo")} <ChevronDown className="h-4 w-4" />
              </button>
              {convertOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setConvertOpen(false)} />
                  <div className="absolute bottom-full right-0 z-20 mb-2 w-56 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                    {nextStages.map((target) => (
                      <button
                        key={target}
                        type="button"
                        onClick={() => {
                          setConvertOpen(false);
                          runAction(async () => {
                            const created = await api.convertSale(doc.id, target);
                            router.push(`/b2b-sales/${created.id}`);
                          });
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                      >
                        {t(DOC_TYPE_LABEL_KEY[target])}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 print:hidden">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-sm font-semibold text-zinc-800">{t("sales.payment.title")}</h2>
            {paymentError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{paymentError}</p>}
            <div className="space-y-4">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-700">{t("sales.payment.payTo")}</span>
                <Dropdown value={paymentBankId} onChange={setPaymentBankId} options={bankAccounts.map((a) => ({ value: String(a.id), label: `(${a.code}) - ${a.name}` }))} />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.payment.amount")}</span>
                <input
                  type="number"
                  min={0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.payment.date")}</span>
                <DatePicker value={paymentDate} onChange={setPaymentDate} />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-700">{t("purchases.payment.memo")}</span>
                <input
                  value={paymentMemo}
                  onChange={(e) => setPaymentMemo(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPaymentOpen(false)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                {t("purchases.payment.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSubmitPayment}
                disabled={paymentSaving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {paymentSaving ? t("expenseNew.saving") : t("purchases.payment.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
