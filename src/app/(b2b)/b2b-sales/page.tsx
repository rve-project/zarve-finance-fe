"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Package, Plus, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { SaleDocType, SaleDocument, SaleStats, SaleStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { Dropdown } from "@/components/ui/Dropdown";

type Tab = { docType?: SaleDocType; status?: SaleStatus };

// Same shape as Pembelian's tab list, minus "Permintaan" -- there's no sales
// equivalent of a purchase request, but Tukar Faktur exists on both sides.
const TABS: { key: string; labelKey: string; tab: Tab }[] = [
  { key: "invoice", labelKey: "sales.tabInvoice", tab: { docType: "invoice" } },
  { key: "exchange", labelKey: "sales.tabExchange", tab: { docType: "exchange" } },
  { key: "shipment", labelKey: "sales.tabShipment", tab: { docType: "shipment" } },
  { key: "order", labelKey: "sales.tabOrder", tab: { docType: "order" } },
  { key: "quotation", labelKey: "sales.tabQuotation", tab: { docType: "quotation" } },
  { key: "pending", labelKey: "sales.tabPendingApproval", tab: { status: "pending_approval" } },
  { key: "rejected", labelKey: "sales.tabRejected", tab: { status: "rejected" } },
];

const CREATE_OPTIONS: { docType: SaleDocType; labelKey: string }[] = [
  { docType: "invoice", labelKey: "sales.docTypeInvoice" },
  { docType: "exchange", labelKey: "sales.docTypeExchange" },
  { docType: "order", labelKey: "sales.docTypeOrder" },
  { docType: "quotation", labelKey: "sales.docTypeQuotation" },
];

const STATUS_BADGE: Record<SaleStatus, string> = {
  draft: "bg-zinc-100 text-zinc-500",
  pending_approval: "bg-amber-50 text-amber-600",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

const STATUS_LABEL_KEY: Record<SaleStatus, string> = {
  draft: "sales.statusDraft",
  pending_approval: "sales.statusPendingApproval",
  approved: "sales.statusApproved",
  rejected: "sales.statusRejected",
};

type PaymentStatus = "awaiting_payment" | "overdue" | "paid" | "partially_paid" | "unpaid";

const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  awaiting_payment: "bg-amber-50 text-amber-600",
  overdue: "bg-red-50 text-red-600",
  paid: "bg-emerald-50 text-emerald-700",
  partially_paid: "bg-sky-50 text-sky-600",
  unpaid: "bg-zinc-100 text-zinc-500",
};

const PAYMENT_STATUS_LABEL_KEY: Record<PaymentStatus, string> = {
  awaiting_payment: "purchases.paymentStatusAwaiting",
  overdue: "purchases.paymentStatusOverdue",
  paid: "purchases.paymentStatusPaid",
  partially_paid: "purchases.paymentStatusPartial",
  unpaid: "purchases.paymentStatusUnpaid",
};

// Payment lifecycle, only meaningful once a sales invoice has been submitted --
// mirrors b2b-purchases/page.tsx's getPaymentStatus exactly.
function getPaymentStatus(doc: SaleDocument): PaymentStatus | null {
  if (doc.status === "pending_approval") return "awaiting_payment";
  if (doc.status !== "approved") return null;
  if (doc.outstanding <= 0) return "paid";
  if (doc.isOverdue) return "overdue";
  return doc.amountPaid > 0 ? "partially_paid" : "unpaid";
}

export default function B2bSalesPage() {
  const { t } = useLanguage();
  const [tabKey, setTabKey] = useState("invoice");
  const [docs, setDocs] = useState<SaleDocument[]>([]);
  const [stats, setStats] = useState<SaleStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const activeTab = TABS.find((t) => t.key === tabKey)!.tab;
  const isInvoiceTab = tabKey === "invoice";

  function load() {
    setLoading(true);
    api
      .sales({ docType: activeTab.docType, status: (isInvoiceTab ? undefined : (statusFilter as any)) || activeTab.status })
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [tabKey, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    api.saleStats().then(setStats).catch(() => {});
  }, []);
  useEffect(() => setStatusFilter(""), [tabKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs
      .filter((d) => !q || d.number.toLowerCase().includes(q) || (d.contactName ?? "").toLowerCase().includes(q))
      .filter((d) => !isInvoiceTab || !statusFilter || getPaymentStatus(d) === statusFilter);
  }, [docs, search, isInvoiceTab, statusFilter]);

  return (
    <div>
      <PageHeader
        title={t("sales.title")}
        action={
          <div className="relative">
            <button
              type="button"
              onClick={() => setCreateOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              {t("sales.createNew")} <ChevronDown className="h-4 w-4" />
            </button>
            {createOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCreateOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                  {CREATE_OPTIONS.map((opt) => (
                    <Link
                      key={opt.docType}
                      href={`/b2b-sales/new?type=${opt.docType}`}
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                      onClick={() => setCreateOpen(false)}
                    >
                      {t(opt.labelKey)}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={Package} iconClass="bg-amber-50 text-amber-600" label={t("sales.statUnpaid")} value={formatRupiah(stats?.unpaidTotal ?? 0)} />
        <StatTile icon={Package} iconClass="bg-red-50 text-red-600" label={t("sales.statOverdue")} value={formatRupiah(stats?.overdueTotal ?? 0)} />
        <StatTile icon={Package} iconClass="bg-emerald-50 text-emerald-600" label={t("sales.statLast30Paid")} value={formatRupiah(stats?.last30PaidTotal ?? 0)} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-wrap gap-1 border-b border-zinc-200 px-2 pt-2">
          {TABS.map((tabDef) => (
            <button
              key={tabDef.key}
              type="button"
              onClick={() => setTabKey(tabDef.key)}
              className={`rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                tabKey === tabDef.key ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {t(tabDef.labelKey)}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Dropdown
            className="w-full sm:w-56"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: t("sales.allStatus") },
              ...(isInvoiceTab
                ? [
                    { value: "awaiting_payment", label: t(PAYMENT_STATUS_LABEL_KEY.awaiting_payment) },
                    { value: "overdue", label: t(PAYMENT_STATUS_LABEL_KEY.overdue) },
                    { value: "paid", label: t(PAYMENT_STATUS_LABEL_KEY.paid) },
                    { value: "partially_paid", label: t(PAYMENT_STATUS_LABEL_KEY.partially_paid) },
                    { value: "unpaid", label: t(PAYMENT_STATUS_LABEL_KEY.unpaid) },
                  ]
                : [
                    { value: "draft", label: t("sales.statusDraft") },
                    { value: "pending_approval", label: t("sales.statusPendingApproval") },
                    { value: "approved", label: t("sales.statusApproved") },
                    { value: "rejected", label: t("sales.statusRejected") },
                  ]),
            ]}
          />
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("sales.searchPlaceholder")}
              className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto border-t border-zinc-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-500">
                <th className="px-4 py-2.5 font-medium">{t("sales.colDate")}</th>
                <th className="px-4 py-2.5 font-medium">{t("sales.colNumber")}</th>
                <th className="px-4 py-2.5 font-medium">{t("sales.colCustomer")}</th>
                <th className="px-4 py-2.5 font-medium">{t("sales.colStatus")}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t("sales.colOutstanding")}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t("sales.colTotal")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-4 py-2.5 text-zinc-500">{formatDate(doc.documentDate)}</td>
                  <td className="px-4 py-2.5 font-medium">
                    <Link href={`/b2b-sales/${doc.id}`} className="text-emerald-700 hover:underline">
                      {doc.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{doc.contactName ?? "-"}</td>
                  <td className="px-4 py-2.5">
                    {isInvoiceTab && getPaymentStatus(doc) ? (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_BADGE[getPaymentStatus(doc)!]}`}>
                        {t(PAYMENT_STATUS_LABEL_KEY[getPaymentStatus(doc)!])}
                      </span>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[doc.status]}`}>
                        {t(STATUS_LABEL_KEY[doc.status])}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-red-600">{doc.outstanding ? formatRupiah(doc.outstanding) : "-"}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{formatRupiah(doc.totalAmount)}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <p className="mb-1 text-sm font-semibold text-zinc-700">{t("sales.emptyTitle")}</p>
                    <p className="mb-4 text-sm text-zinc-400">{t("sales.emptyHint")}</p>
                    <Link
                      href={`/b2b-sales/new?type=${activeTab.docType ?? "invoice"}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" /> {t("sales.createButton")}
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
