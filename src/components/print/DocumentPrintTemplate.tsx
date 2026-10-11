"use client";

import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { DocumentSettings } from "@/lib/types";

// The upload endpoint returns a path relative to the backend, not the frontend --
// prefix with the API's own origin so <img> can actually load it (mirrors bengkel-fe's
// identical logo-serving setup).
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api").replace(/\/api\/?$/, "");

export interface PrintLine {
  id: number;
  name: string;
  description?: string | null;
  qty?: number;
  unitPrice?: number;
  taxName?: string | null;
  amount: number;
}

export interface PrintDocumentData {
  docTypeLabel: string;
  number: string;
  documentDate: string;
  dueDate?: string | null;
  contactLabel: string;
  contactName: string;
  reference?: string | null;
  paymentTerm?: string | null;
  lines: PrintLine[];
  subtotal: number;
  taxTotal: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  notes?: string | null;
}

/**
 * Shared print layout for Faktur Penjualan/Pembelian. Pure/controlled -- `settings`
 * (company letterhead + section toggles) is passed in rather than self-fetched, so
 * PrintPreviewOverlay can let the user tweak it live for just this one print without
 * touching the saved "Template Dokumen" default in Pengaturan.
 *
 * w-[210mm] is the FULL A4 sheet width, not the printable area -- @page's own 12mm
 * margin already eats into that, so forcing a fixed 210mm box on top of it overflowed
 * the right edge. print:w-auto (mirrors bengkel-fe's invoice print pages) lets the box
 * size to whatever's actually left after the page margin instead.
 */
export function DocumentPrintTemplate({ doc, settings }: { doc: PrintDocumentData; settings: DocumentSettings }) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-[210mm] bg-white p-[12mm] text-[13px] text-zinc-900 print:w-auto print:p-0">
      <style>{`@page { size: A4; margin: 12mm; }`}</style>
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          {settings.showLogo && settings.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${API_ORIGIN}${settings.logoUrl}`} alt="Logo" className="h-16 w-16 object-contain" />
          )}
          <div>
            <p className="text-base font-bold leading-tight">{settings.companyName || "-"}</p>
            {settings.address && <p className="mt-0.5 text-[11px] text-zinc-500">{settings.address}</p>}
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {settings.phone}
              {settings.phone && settings.email ? " · " : ""}
              {settings.email}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{doc.docTypeLabel}</p>
          <p className="text-sm font-semibold text-zinc-700">{doc.number}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-zinc-400">{doc.contactLabel}</p>
          <p className="font-medium">{doc.contactName}</p>
        </div>
        <div className="space-y-1 text-right text-[12px]">
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">{t("purchases.detail.date")}</span>
            <span className="font-medium">{formatDate(doc.documentDate)}</span>
          </div>
          {doc.dueDate && (
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">{t("purchases.detail.dueDate")}</span>
              <span className="font-medium">{formatDate(doc.dueDate)}</span>
            </div>
          )}
          {doc.reference && (
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">{t("purchases.detail.reference")}</span>
              <span className="font-medium">{doc.reference}</span>
            </div>
          )}
          {settings.showPaymentTerm && doc.paymentTerm && (
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">{t("purchases.new.paymentTerm")}</span>
              <span className="font-medium">{doc.paymentTerm}</span>
            </div>
          )}
        </div>
      </div>

      <table className="mt-5 w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-zinc-800 text-left">
            <th className="py-1.5 pr-2 font-semibold">{t("purchases.new.product")}</th>
            <th className="py-1.5 pr-2 font-semibold">{t("purchases.new.colDescription")}</th>
            <th className="py-1.5 pr-2 text-right font-semibold">{t("purchases.new.colQty")}</th>
            <th className="py-1.5 pr-2 text-right font-semibold">{t("purchases.new.colPrice")}</th>
            <th className="py-1.5 pr-2 font-semibold">{t("purchases.new.colTax")}</th>
            <th className="py-1.5 text-right font-semibold">{t("sales.colTotal")}</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((line) => (
            <tr key={line.id} className="border-b border-zinc-100">
              <td className="py-1.5 pr-2">{line.name}</td>
              <td className="py-1.5 pr-2 text-zinc-600">{line.description ?? "-"}</td>
              <td className="py-1.5 pr-2 text-right">{line.qty ?? "-"}</td>
              <td className="py-1.5 pr-2 text-right">{line.unitPrice !== undefined ? formatRupiah(line.unitPrice) : "-"}</td>
              <td className="py-1.5 pr-2 text-zinc-600">{line.taxName ?? "-"}</td>
              <td className="py-1.5 text-right">{formatRupiah(line.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1.5 text-[12px]">
          <div className="flex justify-between">
            <span className="text-zinc-500">{t("purchases.new.subtotal")}</span>
            <span className="font-medium">{formatRupiah(doc.subtotal)}</span>
          </div>
          {doc.taxTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-500">{t("purchases.new.tax")}</span>
              <span className="font-medium">{formatRupiah(doc.taxTotal)}</span>
            </div>
          )}
          {doc.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-500">{t("purchases.new.addDiscount")}</span>
              <span className="font-medium">-{formatRupiah(doc.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-800 pt-1.5 text-sm font-bold">
            <span>{t("purchases.new.total")}</span>
            <span>{formatRupiah(doc.totalAmount)}</span>
          </div>
        </div>
      </div>

      {settings.showBankInfo && (settings.bankName || settings.bankAccountNumber) && (
        <div className="mt-6 rounded-lg border border-zinc-300 p-3 text-[12px]">
          <p className="mb-1.5 font-semibold">{t("documentSettings.bankInfoTitle")}</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            <span className="text-zinc-500">{t("documentSettings.bankName")}</span>
            <span>: {settings.bankName || "-"}</span>
            <span className="text-zinc-500">{t("documentSettings.bankAccountNumber")}</span>
            <span>: {settings.bankAccountNumber || "-"}</span>
            <span className="text-zinc-500">{t("documentSettings.bankAccountHolder")}</span>
            <span>: {settings.bankAccountHolder || "-"}</span>
          </div>
        </div>
      )}

      {settings.showNotes && (doc.notes || settings.footerNote) && (
        <div className="mt-4 text-[11px] text-zinc-500">
          {doc.notes && <p className="mb-1">{doc.notes}</p>}
          {settings.footerNote && <p className="whitespace-pre-line">{settings.footerNote}</p>}
        </div>
      )}

      <p className="mt-6 text-right text-[10px] text-zinc-400">
        {t("expenseDetail.createdAt")} {formatDate(doc.createdAt)}
      </p>
    </div>
  );
}
