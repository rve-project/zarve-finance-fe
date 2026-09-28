"use client";

import { Fragment, FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { InvoiceDetail, Payment, ZarveInvoiceDetail } from "@/lib/types";
import { DatePicker } from "@/components/ui/DatePicker";

const SOURCE_STATUS_STYLE: Record<string, string> = {
  UNPAID: "bg-red-50 text-red-600",
  PARTIAL: "bg-amber-50 text-amber-600",
  COMPLIMENTARY: "bg-sky-50 text-sky-600",
  VOID: "bg-zinc-100 text-zinc-500",
};

// Matches Zarve's own invoice-outstanding page: COMPLIMENTARY ("Gratis / Internal",
// revenue zeroed by Zarve) and VOID (cancelled) never carry a real balance, even though
// they still report their original `total` with `amountPaid` 0. Without this, those rows
// would show a red "sisa" equal to the full total for an invoice that was never owed.
const ZERO_BILL_STATUSES = new Set(["COMPLIMENTARY", "VOID"]);

export default function FinanceInvoiceDetailPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // "Riwayat Invoice Zarve" only reconstructs the summary fields (number/date/status/
  // total) from the local mirror -- item-level description never gets mirrored (see
  // zarveMirrorSync.ts, it only pulls summary columns). Fetched live, one invoice at a
  // time, on expand, the same way the Zarve invoice detail page itself does.
  const [expandedSource, setExpandedSource] = useState<Set<string>>(new Set());
  const [sourceDetails, setSourceDetails] = useState<Record<string, ZarveInvoiceDetail>>({});
  const [loadingSource, setLoadingSource] = useState<Set<string>>(new Set());

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMemo, setPaymentMemo] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  function load() {
    api
      .getInvoice(Number(id))
      .then(setInvoice)
      .catch((err) => setError(err instanceof Error ? err.message : t("financeInvoiceDetail.errorLoading")));
    api
      .payments({ invoiceId: Number(id) })
      .then(setPayments)
      .catch(() => {});
  }

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmitPayment(e: FormEvent) {
    e.preventDefault();
    if (!invoice || !paymentAmount || !paymentDate) {
      setPaymentError(t("financeInvoiceDetail.payment.errorRequired"));
      return;
    }
    setPaymentError(null);
    setPaymentSaving(true);
    try {
      await api.createPayment({
        partnerId: invoice.partnerId,
        invoiceId: invoice.id,
        amount: Number(paymentAmount),
        date: paymentDate,
        memo: paymentMemo || undefined,
      });
      setPaymentOpen(false);
      setPaymentAmount("");
      setPaymentMemo("");
      load();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : t("financeInvoiceDetail.payment.errorSave"));
    } finally {
      setPaymentSaving(false);
    }
  }

  function toggleSource(zarveInvoiceId: string) {
    setExpandedSource((prev) => {
      const next = new Set(prev);
      if (next.has(zarveInvoiceId)) {
        next.delete(zarveInvoiceId);
        return next;
      }
      next.add(zarveInvoiceId);
      if (!sourceDetails[zarveInvoiceId] && !loadingSource.has(zarveInvoiceId)) {
        setLoadingSource((l) => new Set(l).add(zarveInvoiceId));
        api
          .zarveInvoiceDetail(zarveInvoiceId)
          .then((detail) => setSourceDetails((d) => ({ ...d, [zarveInvoiceId]: detail })))
          .catch(() => {})
          .finally(() =>
            setLoadingSource((l) => {
              const nextLoading = new Set(l);
              nextLoading.delete(zarveInvoiceId);
              return nextLoading;
            })
          );
      }
      return next;
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" /> {t("financeInvoiceDetail.back")}
      </button>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {!error && !invoice && <p className="text-sm text-zinc-400">{t("common.loading")}</p>}

      {invoice && (
        <>
          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
            <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-lg font-bold text-zinc-900 sm:text-xl">{invoice.number}</h1>
                <p className="text-sm text-zinc-500">{formatDate(invoice.invoiceDate)}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  invoice.state === "posted" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {t(invoice.state === "posted" ? "financeInvoiceDetail.statusPosted" : "financeInvoiceDetail.statusDraft")}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-zinc-400">{t("financeInvoiceDetail.partner")}</p>
                <p className="font-medium text-zinc-800">{invoice.partnerName}</p>
              </div>
              {invoice.vehiclePlateNumber && (
                <div>
                  <p className="text-xs text-zinc-400">{t("financeInvoiceDetail.vehicle")}</p>
                  <p className="font-medium text-zinc-800">{invoice.vehiclePlateNumber}</p>
                </div>
              )}
              {invoice.ref && (
                <div>
                  <p className="text-xs text-zinc-400">{t("financeInvoiceDetail.ref")}</p>
                  <p className="font-medium text-zinc-800">{invoice.ref}</p>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4 text-sm">
              <div>
                <p className="text-xs text-zinc-400">{t("financeInvoiceDetail.total")}</p>
                <p className="font-semibold text-zinc-900">{formatRupiah(invoice.totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">{t("financeInvoiceDetail.paid")}</p>
                <p className="font-semibold text-zinc-900">{formatRupiah(invoice.amountPaid)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">{t("financeInvoiceDetail.outstanding")}</p>
                <p className={`font-semibold ${invoice.outstanding > 0 ? "text-red-600" : "text-zinc-900"}`}>{formatRupiah(invoice.outstanding)}</p>
              </div>
            </div>

            {invoice.outstanding > 0 && (
              <div className="mt-4 flex justify-end border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentAmount(String(invoice.outstanding));
                    setPaymentOpen(true);
                  }}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  {t("financeInvoiceDetail.payment.action")}
                </button>
              </div>
            )}

            {payments.length > 0 && (
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <p className="mb-2 text-sm font-semibold text-zinc-700">{t("financeInvoiceDetail.payment.history")}</p>
                <table className="w-full text-sm">
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-zinc-50">
                        <td className="py-1.5 text-zinc-500">{formatDate(p.date)}</td>
                        <td className="py-1.5 text-zinc-500">{p.memo ?? "-"}</td>
                        <td className="py-1.5 text-right font-medium">{formatRupiah(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <h2 className="mb-2 text-sm font-semibold text-zinc-700">{t("financeInvoiceDetail.lines")}</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-500">
                  <th className="px-4 py-2.5 font-medium">{t("financeInvoiceDetail.colDescription")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("financeInvoiceDetail.colCategory")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("financeInvoiceDetail.colAccount")}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t("financeInvoiceDetail.colAmount")}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t("financeInvoiceDetail.colTax")}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id} className="border-b border-zinc-50">
                    <td className="px-4 py-2.5">{line.description}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">{line.category}</span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500">
                      {line.accountCode} - {line.accountName}
                    </td>
                    <td className="px-4 py-2.5 text-right">{formatRupiah(line.amount)}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-500">{line.taxAmount ? formatRupiah(line.taxAmount) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invoice.sourceInvoices.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-1 text-sm font-semibold text-zinc-700">{t("financeInvoiceDetail.sourceInvoices")}</h2>
              <p className="mb-2 text-xs text-zinc-400">{t("financeInvoiceDetail.sourceInvoicesHint")}</p>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-zinc-500">
                      <th className="px-4 py-2.5 font-medium">{t("financeInvoiceDetail.colInvoiceNumber")}</th>
                      <th className="px-4 py-2.5 font-medium">{t("financeInvoiceDetail.colDate")}</th>
                      <th className="px-4 py-2.5 font-medium">{t("financeInvoiceDetail.colStatus")}</th>
                      <th className="px-4 py-2.5 text-right font-medium">{t("financeInvoiceDetail.colTotalAmount")}</th>
                      <th className="px-4 py-2.5 text-right font-medium">{t("financeInvoiceDetail.colOutstanding")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.sourceInvoices.map((src) => {
                      const isExpanded = expandedSource.has(src.zarveInvoiceId);
                      const isLoading = loadingSource.has(src.zarveInvoiceId);
                      const detail = sourceDetails[src.zarveInvoiceId];
                      return (
                        <Fragment key={src.zarveInvoiceId}>
                          <tr onClick={() => toggleSource(src.zarveInvoiceId)} className="cursor-pointer border-b border-zinc-50 hover:bg-zinc-50">
                            <td className="px-4 py-2.5 font-mono text-xs">
                              <div className="flex items-center gap-1.5">
                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
                                {src.invoiceNumber}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-zinc-500">{src.invoiceDate}</td>
                            <td className="px-4 py-2.5">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${SOURCE_STATUS_STYLE[src.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                                {src.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">{formatRupiah(src.total)}</td>
                            <td
                              className={`px-4 py-2.5 text-right font-medium ${
                                ZERO_BILL_STATUSES.has(src.status) ? "text-zinc-400" : "text-red-600"
                              }`}
                            >
                              {formatRupiah(ZERO_BILL_STATUSES.has(src.status) ? 0 : src.total - src.amountPaid)}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="border-b border-zinc-50 bg-zinc-50/60">
                              <td colSpan={5} className="px-4 py-3">
                                {isLoading && <p className="text-xs text-zinc-400">{t("common.loading")}</p>}
                                {!isLoading && detail && (
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-left text-zinc-400">
                                        <th className="px-3 py-1.5 font-medium">{t("invoiceDetail.colDescription")}</th>
                                        <th className="px-3 py-1.5 font-medium">{t("invoiceDetail.colType")}</th>
                                        <th className="px-3 py-1.5 text-right font-medium">{t("invoiceDetail.colQty")}</th>
                                        <th className="px-3 py-1.5 text-right font-medium">{t("invoiceDetail.colPrice")}</th>
                                        <th className="px-3 py-1.5 text-right font-medium">{t("invoiceDetail.colSubtotal")}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detail.items?.map((item) => (
                                        <tr key={item.id} className="border-t border-zinc-100">
                                          <td className="px-3 py-1.5">{item.description}</td>
                                          <td className="px-3 py-1.5 text-zinc-500">{item.type ?? "-"}</td>
                                          <td className="px-3 py-1.5 text-right">{item.qty}</td>
                                          <td className="px-3 py-1.5 text-right">{formatRupiah(Number(item.price))}</td>
                                          <td className="px-3 py-1.5 text-right font-medium">{formatRupiah(Number(item.subtotal))}</td>
                                        </tr>
                                      ))}
                                      {(!detail.items || detail.items.length === 0) && (
                                        <tr>
                                          <td colSpan={5} className="px-3 py-2 text-center text-zinc-400">
                                            {t("invoiceDetail.noItems")}
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {paymentOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
              <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-sm font-semibold text-zinc-800">{t("financeInvoiceDetail.payment.title")}</h2>
                {paymentError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{paymentError}</p>}
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-zinc-700">{t("financeInvoiceDetail.payment.amount")}</span>
                    <input
                      required
                      type="number"
                      min={0}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-zinc-700">{t("financeInvoiceDetail.payment.date")}</span>
                    <DatePicker value={paymentDate} onChange={setPaymentDate} />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-zinc-700">{t("financeInvoiceDetail.payment.memo")}</span>
                    <input
                      value={paymentMemo}
                      onChange={(e) => setPaymentMemo(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </label>
                  <div className="mt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentOpen(false)}
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      {t("financeInvoiceDetail.payment.cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={paymentSaving}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {paymentSaving ? t("financeInvoiceDetail.payment.saving") : t("financeInvoiceDetail.payment.save")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
