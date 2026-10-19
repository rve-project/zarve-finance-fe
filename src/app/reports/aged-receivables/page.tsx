"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, ChevronRight, Search } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah } from "@/lib/format";
import { AgedReceivablesResult, AgedReceivableBucket, BusinessUnit } from "@/lib/types";
import { BUCKET_BADGE_CLASS, BUCKET_COLOR, BUCKET_LABEL_KEY } from "@/lib/agedReceivablesBuckets";
import { thisMonthPeriod, previousPeriod } from "@/lib/periods";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { DatePicker } from "@/components/ui/DatePicker";
import { BusinessUnitToggle } from "@/components/ui/BusinessUnitToggle";

type BucketFilter = AgedReceivableBucket | "all";
const BUCKET_FILTERS: BucketFilter[] = ["all", "current", "d1to30", "d31to60", "d61to90", "d90plus"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Zarve invoices live at /finance-invoices, B2B sale invoices at /b2b-sales -- the
// drill-down link below picks the right route per the unit the row came from.
function invoiceHref(unit: BusinessUnit, invoiceId: number) {
  return unit === "b2b" ? `/b2b-sales/${invoiceId}` : `/finance-invoices/${invoiceId}`;
}

export default function AgedReceivablesPage() {
  const { t } = useLanguage();
  const [unit, setUnit] = useState<BusinessUnit>("b2b");
  const [asOf, setAsOf] = useState(today());
  const [data, setData] = useState<AgedReceivablesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>("all");

  function load(nextAsOf = asOf) {
    setLoading(true);
    api
      .agedReceivablesForUnit(unit, nextAsOf)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  function setAsOfAndReload(next: string) {
    setAsOf(next);
    load(next);
  }

  function toggleExpanded(partnerId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(partnerId)) next.delete(partnerId);
      else next.add(partnerId);
      return next;
    });
  }

  const filteredPartners = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.partners.filter((p) => {
      if (q && !p.partnerName.toLowerCase().includes(q)) return false;
      if (bucketFilter !== "all" && !p[bucketFilter]) return false;
      return true;
    });
  }, [data, search, bucketFilter]);

  return (
    <div>
      <PageHeader
        title={t("agedReceivables.title")}
        subtitle={t("agedReceivables.subtitle")}
        action={<BusinessUnitToggle value={unit} onChange={setUnit} />}
      />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("agedReceivables.asOfDate")}</span>
          <DatePicker value={asOf} onChange={setAsOf} maxDate={new Date().toISOString().slice(0, 10)} />
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setAsOfAndReload(today())}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            {t("agedReceivables.quickToday")}
          </button>
          <button
            type="button"
            onClick={() => setAsOfAndReload(thisMonthPeriod().to)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            {t("agedReceivables.quickEndOfThisMonth")}
          </button>
          <button
            type="button"
            onClick={() => setAsOfAndReload(previousPeriod(thisMonthPeriod()).to)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            {t("agedReceivables.quickEndOfLastMonth")}
          </button>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("agedReceivables.show")}
        </button>
      </div>

      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile icon={AlertTriangle} iconClass="bg-emerald-50 text-emerald-600" label={t(BUCKET_LABEL_KEY.current)} value={formatRupiah(data.totals.current)} />
            <StatTile icon={AlertTriangle} iconClass="bg-amber-50 text-amber-600" label={t(BUCKET_LABEL_KEY.d1to30)} value={formatRupiah(data.totals.d1to30)} />
            <StatTile icon={AlertTriangle} iconClass="bg-orange-50 text-orange-600" label={t(BUCKET_LABEL_KEY.d31to60)} value={formatRupiah(data.totals.d31to60)} />
            <StatTile icon={AlertTriangle} iconClass="bg-red-50 text-red-600" label={t(BUCKET_LABEL_KEY.d61to90)} value={formatRupiah(data.totals.d61to90)} />
            <StatTile icon={AlertTriangle} iconClass="bg-red-100 text-red-700" label={t(BUCKET_LABEL_KEY.d90plus)} value={formatRupiah(data.totals.d90plus)} />
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("agedReceivables.searchPlaceholder")}
                className="w-56 rounded-lg border border-zinc-200 py-2 pl-8 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BUCKET_FILTERS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBucketFilter(b)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    bucketFilter === b ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {b === "all" ? t("agedReceivables.bucketAll") : t(BUCKET_LABEL_KEY[b])}
                </button>
              ))}
            </div>
          </div>

          {filteredPartners.length > 0 && (
            <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-zinc-700">{t("agedReceivables.top10Title")}</p>
                <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                  {(Object.keys(BUCKET_LABEL_KEY) as (keyof typeof BUCKET_COLOR)[]).map((k) => (
                    <span key={k} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BUCKET_COLOR[k] }} />
                      {t(BUCKET_LABEL_KEY[k])}
                    </span>
                  ))}
                </div>
              </div>
              {(() => {
                const top = [...filteredPartners].sort((a, b) => b.total - a.total).slice(0, 10).reverse();
                return (
                  <ResponsiveContainer width="100%" height={Math.max(200, top.length * 32)}>
                    <BarChart data={top} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 0 }}>
                      <CartesianGrid stroke="#f0efec" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v)} />
                      <YAxis dataKey="partnerName" type="category" tick={{ fontSize: 11, fill: "#52514e" }} axisLine={false} tickLine={false} width={140} />
                      <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
                      <Bar dataKey="current" name={t(BUCKET_LABEL_KEY.current)} stackId="age" fill={BUCKET_COLOR.current} />
                      <Bar dataKey="d1to30" name={t(BUCKET_LABEL_KEY.d1to30)} stackId="age" fill={BUCKET_COLOR.d1to30} />
                      <Bar dataKey="d31to60" name={t(BUCKET_LABEL_KEY.d31to60)} stackId="age" fill={BUCKET_COLOR.d31to60} />
                      <Bar dataKey="d61to90" name={t(BUCKET_LABEL_KEY.d61to90)} stackId="age" fill={BUCKET_COLOR.d61to90} />
                      <Bar dataKey="d90plus" name={t(BUCKET_LABEL_KEY.d90plus)} stackId="age" fill={BUCKET_COLOR.d90plus} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-500">
                  <th className="px-4 py-2.5 font-medium">{t("agedReceivables.driverCustomer")}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t(BUCKET_LABEL_KEY.current)}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t(BUCKET_LABEL_KEY.d1to30)}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t(BUCKET_LABEL_KEY.d31to60)}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t(BUCKET_LABEL_KEY.d61to90)}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t(BUCKET_LABEL_KEY.d90plus)}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t("agedReceivables.total")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map((p) => {
                  const isExpanded = expanded.has(p.partnerId);
                  return (
                    <Fragment key={p.partnerId}>
                      <tr onClick={() => toggleExpanded(p.partnerId)} className="cursor-pointer border-b border-zinc-50 hover:bg-zinc-50">
                        <td className="px-4 py-2.5 font-medium text-zinc-900">
                          <div className="flex items-center gap-1.5">
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
                            {p.partnerName}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right">{p.current ? formatRupiah(p.current) : "-"}</td>
                        <td className="px-4 py-2.5 text-right">{p.d1to30 ? formatRupiah(p.d1to30) : "-"}</td>
                        <td className="px-4 py-2.5 text-right">{p.d31to60 ? formatRupiah(p.d31to60) : "-"}</td>
                        <td className="px-4 py-2.5 text-right text-amber-700">{p.d61to90 ? formatRupiah(p.d61to90) : "-"}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-red-600">{p.d90plus ? formatRupiah(p.d90plus) : "-"}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{formatRupiah(p.total)}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-zinc-50 bg-zinc-50/60">
                          <td colSpan={7} className="px-4 py-3">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-zinc-400">
                                  <th className="px-3 py-1.5 font-medium">{t("agedReceivables.colInvoice")}</th>
                                  <th className="px-3 py-1.5 font-medium">{t("agedReceivables.colDate")}</th>
                                  <th className="px-3 py-1.5 font-medium">{t("agedReceivables.colBucket")}</th>
                                  <th className="px-3 py-1.5 text-right font-medium">{t("agedReceivables.colTotalAmount")}</th>
                                  <th className="px-3 py-1.5 text-right font-medium">{t("agedReceivables.colPaid")}</th>
                                  <th className="px-3 py-1.5 text-right font-medium">{t("agedReceivables.colOutstanding")}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.invoices.map((inv) => (
                                  <tr key={inv.invoiceId} className="border-t border-zinc-100">
                                    <td className="px-3 py-1.5">
                                      <Link href={invoiceHref(unit, inv.invoiceId)} className="font-medium text-emerald-700 hover:underline">
                                        {inv.invoiceNumber}
                                      </Link>
                                    </td>
                                    <td className="px-3 py-1.5 text-zinc-500">{inv.invoiceDate}</td>
                                    <td className="px-3 py-1.5">
                                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BUCKET_BADGE_CLASS[inv.bucket]}`}>
                                        {t(BUCKET_LABEL_KEY[inv.bucket])}
                                      </span>
                                    </td>
                                    <td className="px-3 py-1.5 text-right text-zinc-500">{formatRupiah(inv.totalAmount)}</td>
                                    <td className="px-3 py-1.5 text-right text-zinc-500">{formatRupiah(inv.paid)}</td>
                                    <td className="px-3 py-1.5 text-right font-semibold text-zinc-900">{formatRupiah(inv.outstanding)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {!filteredPartners.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-400">
                      {data.partners.length ? t("agedReceivables.noMatchState") : t("agedReceivables.emptyState")}
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
