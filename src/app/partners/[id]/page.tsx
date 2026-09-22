"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { Partner, Invoice, Payment, VendorBill, VendorPayment } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { Wallet, Receipt, AlertTriangle } from "lucide-react";

export default function PartnerStatementPage() {
  const { t } = useLanguage();
  const params = useParams();
  const id = Number(params.id);

  const [partner, setPartner] = useState<Partner | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getPartner(id)
      .then(async (p) => {
        setPartner(p);
        if (p.type === "vendor") {
          const [billsRes, paymentsRes] = await Promise.all([
            api.vendorBills({ vendorId: id, limit: 200 }),
            api.vendorPayments({ vendorId: id, limit: 200 }),
          ]);
          setBills(billsRes.data);
          setVendorPayments(paymentsRes.data);
        } else {
          const [invoicesRes, paymentsRes] = await Promise.all([api.invoices({ partnerId: id }), api.payments({ partnerId: id })]);
          setInvoices(invoicesRes);
          setPayments(paymentsRes);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("partnersDetail.errorLoading")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-zinc-400">{t("common.loading")}</p>;
  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!partner) return null;

  const isVendor = partner.type === "vendor";
  const backHref = isVendor ? "/vendors" : "/partners";

  const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = totalInvoiced - totalPaid;

  const totalBilled = bills.reduce((s, b) => s + b.totalAmount, 0);
  const totalVendorPaid = vendorPayments.reduce((s, p) => s + p.amount, 0);
  const vendorOutstanding = totalBilled - totalVendorPaid;

  return (
    <div>
      <Link href={backHref} className="mb-3 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-emerald-600">
        <ArrowLeft className="h-4 w-4" /> {t("partnersDetail.back")}
      </Link>
      <PageHeader title={partner.name} subtitle={isVendor ? t("partnersDetail.statementVendor") : t("partnersDetail.statementDriver")} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isVendor ? (
          <>
            <StatTile icon={Receipt} iconClass="bg-blue-50 text-blue-600" label={t("partnersDetail.totalTagihan")} value={formatRupiah(totalBilled)} />
            <StatTile icon={Wallet} iconClass="bg-emerald-50 text-emerald-600" label={t("partnersDetail.totalDibayar")} value={formatRupiah(totalVendorPaid)} />
            <StatTile
              icon={AlertTriangle}
              iconClass={vendorOutstanding > 0 ? "bg-red-50 text-red-600" : "bg-zinc-50 text-zinc-500"}
              label={t("partnersDetail.belumDibayar")}
              value={formatRupiah(vendorOutstanding)}
              valueClass={vendorOutstanding > 0 ? "text-red-600" : undefined}
            />
          </>
        ) : (
          <>
            <StatTile icon={Receipt} iconClass="bg-blue-50 text-blue-600" label={t("partnersDetail.totalInvoice")} value={formatRupiah(totalInvoiced)} />
            <StatTile icon={Wallet} iconClass="bg-emerald-50 text-emerald-600" label={t("partnersDetail.totalDibayar")} value={formatRupiah(totalPaid)} />
            <StatTile
              icon={AlertTriangle}
              iconClass={outstanding > 0 ? "bg-red-50 text-red-600" : "bg-zinc-50 text-zinc-500"}
              label={t("partnersDetail.piutangBelumDibayar")}
              value={formatRupiah(outstanding)}
              valueClass={outstanding > 0 ? "text-red-600" : undefined}
            />
          </>
        )}
      </div>

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
        {partner.phone && <p>{t("partnersDetail.phoneLabel")}: {partner.phone}</p>}
        {partner.email && <p>{t("partnersDetail.emailLabel")}: {partner.email}</p>}
        {partner.ktpNumber && <p>{t("partnersDetail.ktpLabel")}: {partner.ktpNumber}</p>}
        {partner.notes && <p>{t("partnersDetail.notesLabel")}: {partner.notes}</p>}
      </div>

      {isVendor ? (
        <>
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">{t("partnersDetail.billHistory")}</h2>
          <div className="mb-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-500">
                  <th className="px-4 py-2.5 font-medium">{t("partnersDetail.colBillNumber")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("partnersDetail.colDate")}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t("partnersDetail.colAmount")}</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id} className="border-b border-zinc-50">
                    <td className="px-4 py-2.5 font-mono text-xs">{b.number}</td>
                    <td className="px-4 py-2.5">{formatDate(b.billDate)}</td>
                    <td className="px-4 py-2.5 text-right">{formatRupiah(b.totalAmount)}</td>
                  </tr>
                ))}
                {!bills.length && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
                      {t("partnersDetail.emptyBills")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mb-2 text-sm font-semibold text-zinc-700">{t("partnersDetail.paymentHistory")}</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-500">
                  <th className="px-4 py-2.5 font-medium">{t("partnersDetail.colDate")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("partnersDetail.colMethod")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("partnersDetail.colMemo")}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t("partnersDetail.colAmount")}</th>
                </tr>
              </thead>
              <tbody>
                {vendorPayments.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-50">
                    <td className="px-4 py-2.5">{formatDate(p.date)}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{p.method ?? "-"}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{p.memo ?? "-"}</td>
                    <td className="px-4 py-2.5 text-right">{formatRupiah(p.amount)}</td>
                  </tr>
                ))}
                {!vendorPayments.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                      {t("partnersDetail.emptyPayments")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">{t("partnersDetail.invoiceHistory")}</h2>
          <div className="mb-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-500">
                  <th className="px-4 py-2.5 font-medium">{t("partnersDetail.colInvoiceNumber")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("partnersDetail.colDate")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("partnersDetail.colStatus")}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t("partnersDetail.colAmount")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-zinc-50">
                    <td className="px-4 py-2.5 font-mono text-xs">{inv.number}</td>
                    <td className="px-4 py-2.5">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{inv.state === "posted" ? t("partnersDetail.statusPosted") : t("partnersDetail.statusDraft")}</td>
                    <td className="px-4 py-2.5 text-right">{formatRupiah(inv.totalAmount)}</td>
                  </tr>
                ))}
                {!invoices.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                      {t("partnersDetail.emptyInvoices")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mb-2 text-sm font-semibold text-zinc-700">{t("partnersDetail.paymentHistory")}</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-500">
                  <th className="px-4 py-2.5 font-medium">{t("partnersDetail.colDate")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("partnersDetail.colMethod")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("partnersDetail.colReconciliationStatus")}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t("partnersDetail.colAmount")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-50">
                    <td className="px-4 py-2.5">{formatDate(p.date)}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{p.method ?? "-"}</td>
                    <td className="px-4 py-2.5">
                      {p.reconciliationId ? (
                        <span className="text-emerald-600">{t("partnersDetail.reconciled")}</span>
                      ) : (
                        <span className="text-amber-600">{t("partnersDetail.notReconciled")}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">{formatRupiah(p.amount)}</td>
                  </tr>
                ))}
                {!payments.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                      {t("partnersDetail.emptyPayments")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
