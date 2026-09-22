"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Wallet, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { ZarveInvoiceListItem, ZarveInvoiceType, InvoiceStatusSummaryRow } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dropdown } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { DatePicker } from "@/components/ui/DatePicker";
import { StatTile } from "@/components/ui/StatTile";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

const STATUS_OPTION_DEFS = [
  { value: "", labelKey: "invoices.statusAll" },
  { value: "UNPAID", labelKey: "home.statusUnpaid" },
  { value: "PARTIAL", labelKey: "invoices.statusPartial" },
  { value: "PAID", labelKey: "home.statusPaid" },
  { value: "COMPLIMENTARY", labelKey: "home.statusCompl" },
  { value: "VOID", labelKey: "home.statusVoid" },
  { value: "REFUNDED", labelKey: "home.statusRefunded" },
];

const STATUS_STYLE: Record<string, string> = {
  UNPAID: "bg-red-50 text-red-600",
  PARTIAL: "bg-amber-50 text-amber-600",
  PAID: "bg-emerald-50 text-emerald-700",
  COMPLIMENTARY: "bg-sky-50 text-sky-600",
  VOID: "bg-zinc-100 text-zinc-500",
  REFUNDED: "bg-purple-50 text-purple-600",
};

// Same hex values as the Beranda status chart -- one concept, one color, everywhere.
const STATUS_HEX: Record<string, string> = {
  PAID: "#0ca30c",
  PARTIAL: "#9E9D24",
  UNPAID: "#d03b3b",
  COMPLIMENTARY: "#1baf7a",
  VOID: "#9a9a9a",
  REFUNDED: "#4a3aa7",
};

const LIMIT = 20;

export default function InvoicesPage() {
  return (
    <Suspense fallback={null}>
      <InvoicesPageInner />
    </Suspense>
  );
}

function InvoicesPageInner() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [data, setData] = useState<{ total: number; page: number; data: ZarveInvoiceListItem[] } | null>(null);
  const [types, setTypes] = useState<ZarveInvoiceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [type, setType] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") ?? "");
  const [startDate, setStartDate] = useState("");
  // Defaults to today: some vehicles have long-term lease bookings whose DAILY
  // invoices are all pre-generated years ahead (unpaid because that day hasn't
  // happened yet) -- without this cap they'd flood the top of the list. Clearable so
  // someone can still deliberately look those up.
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const [statusSummary, setStatusSummary] = useState<InvoiceStatusSummaryRow[]>([]);

  useEffect(() => {
    api.zarveInvoiceTypes().then(setTypes).catch(() => {});
  }, []);

  function load(p = page) {
    setLoading(true);
    setError(null);
    api
      .zarveInvoices({ page: p, limit: LIMIT, status: status || undefined, type: type || undefined, search: search || undefined, startDate: startDate || undefined, endDate: endDate || undefined })
      .then((res) => {
        setData(res);
        setPage(p);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("invoices.errorLoading")))
      .finally(() => setLoading(false));
  }

  function loadSummary() {
    api
      .invoiceStatusSummary(startDate || undefined, endDate || undefined)
      .then(setStatusSummary)
      .catch(() => {});
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(loadSummary, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    load(1);
    loadSummary();
  }

  const statusOptions = STATUS_OPTION_DEFS.map((s) => ({ value: s.value, label: t(s.labelKey) }));
  const statusLabel = (status: string) => {
    const def = STATUS_OPTION_DEFS.find((s) => s.value === status);
    return def ? t(def.labelKey) : status;
  };
  const typeOptions = [{ value: "", label: t("invoices.typeAll") }, ...types.map((ty) => ({ value: ty.code, label: ty.name }))];

  const totalOutstanding = statusSummary
    .filter((s) => s.status === "UNPAID" || s.status === "PARTIAL")
    .reduce((sum, s) => sum + s.outstandingAmount, 0);
  const totalTertagih = statusSummary.reduce((sum, s) => sum + (s.totalAmount - s.outstandingAmount), 0);
  const outstandingCount = statusSummary
    .filter((s) => s.status === "UNPAID" || s.status === "PARTIAL")
    .reduce((sum, s) => sum + s.count, 0);
  const statusChartData = statusSummary
    .map((s) => ({ status: statusLabel(s.status), count: s.count, color: STATUS_HEX[s.status] ?? "#9a9a9a" }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <PageHeader title={t("invoices.title")} subtitle={t("invoices.subtitle")} />

      <form onSubmit={handleFilterSubmit} className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("invoices.searchLabel")}</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("invoices.searchPlaceholder")}
              className="w-56 rounded-lg border border-zinc-200 py-1.5 pl-8 pr-3 text-sm"
            />
          </div>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("invoices.filterStatus")}</span>
          <Dropdown className="min-w-[160px]" value={status} onChange={(v) => { setStatus(v); load(1); }} options={statusOptions} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("invoices.filterType")}</span>
          <Dropdown className="min-w-[180px]" value={type} onChange={(v) => { setType(v); load(1); }} options={typeOptions} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("invoices.dateFrom")}</span>
          <DatePicker value={startDate} onChange={setStartDate} clearable maxDate={new Date().toISOString().slice(0, 10)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("invoices.dateTo")}</span>
          <DatePicker value={endDate} onChange={setEndDate} clearable maxDate={new Date().toISOString().slice(0, 10)} />
        </label>
        <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          {t("invoices.applyFilter")}
        </button>
      </form>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
          <StatTile
            icon={AlertTriangle}
            iconClass="bg-red-50 text-red-600"
            label={`${t("invoices.outstandingLabel")} (${outstandingCount} ${t("invoices.itemLabel")})`}
            value={formatRupiah(totalOutstanding)}
            valueClass="text-red-600"
          />
          <StatTile icon={Wallet} iconClass="bg-emerald-50 text-emerald-600" label={t("invoices.collected")} value={formatRupiah(totalTertagih)} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 lg:col-span-2">
          <p className="mb-3 text-sm font-semibold text-zinc-700">{t("invoices.statusComposition")}</p>
          <ResponsiveContainer width="100%" height={Math.max(140, statusChartData.length * 32)}>
            <BarChart data={statusChartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="#f0efec" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 11, fill: "#52514e" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<ChartTooltip formatter={(v: number) => v.toLocaleString("id-ID")} />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {statusChartData.map((s) => (
                  <Cell key={s.status} fill={s.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("invoices.colNumber")}</th>
              <th className="px-4 py-3 font-medium">{t("invoices.colDate")}</th>
              <th className="px-4 py-3 font-medium">{t("invoices.colDriver")}</th>
              <th className="px-4 py-3 font-medium">{t("invoices.colVehicle")}</th>
              <th className="px-4 py-3 font-medium">{t("invoices.colType")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("invoices.colTotal")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("invoices.colPaid")}</th>
              <th className="px-4 py-3 font-medium">{t("invoices.colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-400">
                  {t("common.loading")}
                </td>
              </tr>
            )}
            {!loading &&
              data?.data.map((inv) => (
                <tr key={inv.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-emerald-700 hover:underline">
                      {inv.invoiceNumber ?? inv.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{formatDate(inv.date)}</td>
                  <td className="px-4 py-2.5">{inv.booking?.driver?.name ?? "-"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{inv.booking?.vehicle?.plateNumber ?? "-"}</td>
                  <td className="px-4 py-2.5">{inv.type}</td>
                  <td className="px-4 py-2.5 text-right">{formatRupiah(Number(inv.total))}</td>
                  <td className="px-4 py-2.5 text-right">{formatRupiah(Number(inv.amountPaid))}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[inv.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                      {statusLabel(inv.status)}
                    </span>
                  </td>
                </tr>
              ))}
            {!loading && data?.data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-400">
                  {t("invoices.emptyFiltered")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={page} limit={LIMIT} total={data.total} onChange={load} loading={loading} itemLabel={t("invoices.itemLabel")} />}
    </div>
  );
}
