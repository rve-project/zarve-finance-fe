"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { ZarveInvoiceDetail } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  UNPAID: "bg-red-50 text-red-600",
  PARTIAL: "bg-amber-50 text-amber-600",
  PAID: "bg-emerald-50 text-emerald-700",
  COMPLIMENTARY: "bg-sky-50 text-sky-600",
  VOID: "bg-zinc-100 text-zinc-500",
  REFUNDED: "bg-purple-50 text-purple-600",
};

const STATUS_LABEL_KEY: Record<string, string> = {
  UNPAID: "home.statusUnpaid",
  PARTIAL: "invoices.statusPartial",
  PAID: "home.statusPaid",
  COMPLIMENTARY: "home.statusCompl",
  VOID: "home.statusVoid",
  REFUNDED: "home.statusRefunded",
};

export default function InvoiceDetailPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<ZarveInvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .zarveInvoiceDetail(id)
      .then(setInvoice)
      .catch((err) => setError(err instanceof Error ? err.message : t("invoiceDetail.errorLoading")));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!invoice) return <p className="text-sm text-zinc-400">{t("common.loading")}</p>;

  const driver = invoice.booking?.driver;
  const vehicle = invoice.booking?.vehicle;

  return (
    <div>
      <Link href="/invoices" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="h-4 w-4" /> {t("invoiceDetail.backToList")}
      </Link>

      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">{invoice.invoiceNumber ?? invoice.id}</h1>
            <p className="text-sm text-zinc-500">{formatDate(invoice.date)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[invoice.status] ?? "bg-zinc-100 text-zinc-500"}`}>
            {STATUS_LABEL_KEY[invoice.status] ? t(STATUS_LABEL_KEY[invoice.status]) : invoice.status}
          </span>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-zinc-400">{t("invoiceDetail.driver")}</p>
            <p className="font-medium text-zinc-900">{driver?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-zinc-400">{t("invoiceDetail.nik")}</p>
            <p className="font-mono text-zinc-700">{driver?.nik?.trim() ?? "-"}</p>
          </div>
          <div>
            <p className="text-zinc-400">{t("invoiceDetail.vehicle")}</p>
            <p className="text-zinc-700">{vehicle?.category?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-zinc-400">{t("invoiceDetail.plateNumber")}</p>
            <p className="font-mono text-zinc-700">{vehicle?.plateNumber ?? "-"}</p>
          </div>
          <div>
            <p className="text-zinc-400">{t("invoiceDetail.invoiceType")}</p>
            <p className="text-zinc-700">{invoice.type}</p>
          </div>
          <div>
            <p className="text-zinc-400">{t("invoiceDetail.paymentMethod")}</p>
            <p className="text-zinc-700">{invoice.paymentMethod ?? "-"}</p>
          </div>
          <div>
            <p className="text-zinc-400">{t("invoiceDetail.paidAt")}</p>
            <p className="text-zinc-700">{invoice.paidAt ? formatDate(invoice.paidAt) : "-"}</p>
          </div>
          <div>
            <p className="text-zinc-400">{t("invoiceDetail.paymentTimeliness")}</p>
            <p className="text-zinc-700">
              {invoice.paymentTimeliness ?? "-"}
              {invoice.lateDays ? ` (${invoice.lateDays} ${t("invoiceDetail.days")})` : ""}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="py-2 font-medium">{t("invoiceDetail.colDescription")}</th>
              <th className="py-2 font-medium">{t("invoiceDetail.colType")}</th>
              <th className="py-2 text-right font-medium">{t("invoiceDetail.colQty")}</th>
              <th className="py-2 text-right font-medium">{t("invoiceDetail.colPrice")}</th>
              <th className="py-2 text-right font-medium">{t("invoiceDetail.colSubtotal")}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item) => (
              <tr key={item.id} className="border-b border-zinc-50">
                <td className="py-2">{item.description}</td>
                <td className="py-2">{item.type ?? "-"}</td>
                <td className="py-2 text-right">{item.qty}</td>
                <td className="py-2 text-right">{formatRupiah(Number(item.price))}</td>
                <td className="py-2 text-right">{formatRupiah(Number(item.subtotal))}</td>
              </tr>
            ))}
            {(!invoice.items || invoice.items.length === 0) && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-zinc-400">
                  {t("invoiceDetail.noItems")}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            {!!Number(invoice.totalDiscount) && (
              <tr>
                <td colSpan={4} className="pt-3 text-right text-zinc-500">
                  {t("invoiceDetail.discount")}
                </td>
                <td className="pt-3 text-right text-zinc-500">-{formatRupiah(Number(invoice.totalDiscount))}</td>
              </tr>
            )}
            <tr>
              <td colSpan={4} className="pt-3 text-right font-semibold">
                {t("invoiceDetail.total")}
              </td>
              <td className="pt-3 text-right font-semibold">{formatRupiah(Number(invoice.total))}</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right text-emerald-600">
                {t("invoiceDetail.paid")}
              </td>
              <td className="text-right text-emerald-600">{formatRupiah(Number(invoice.amountPaid))}</td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>
    </div>
  );
}
