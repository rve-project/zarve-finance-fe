"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah } from "@/lib/format";
import { AgedReceivablesResult } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { DatePicker } from "@/components/ui/DatePicker";

// Fixed status palette (never themed/reused) -- "current" isn't a severity yet, so it
// gets a neutral gray instead of stretching the 4-step good/warning/serious/critical
// scale to 5.
const BUCKET_COLOR = {
  current: "#9a9a9a",
  d1to30: "#0ca30c",
  d31to60: "#fab219",
  d61to90: "#ec835a",
  d90plus: "#d03b3b",
};
const BUCKET_LABEL_KEY: Record<keyof typeof BUCKET_COLOR, string> = {
  current: "agedReceivables.bucket.current",
  d1to30: "agedReceivables.bucket.d1to30",
  d31to60: "agedReceivables.bucket.d31to60",
  d61to90: "agedReceivables.bucket.d61to90",
  d90plus: "agedReceivables.bucket.d90plus",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AgedReceivablesPage() {
  const { t } = useLanguage();
  const [asOf, setAsOf] = useState(today());
  const [data, setData] = useState<AgedReceivablesResult | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .agedReceivables(asOf)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader title={t("agedReceivables.title")} subtitle={t("agedReceivables.subtitle")} />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("agedReceivables.asOfDate")}</span>
          <DatePicker value={asOf} onChange={setAsOf} maxDate={new Date().toISOString().slice(0, 10)} />
        </label>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("agedReceivables.show")}
        </button>
      </div>

      {data && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
            <StatTile icon={AlertTriangle} iconClass="bg-emerald-50 text-emerald-600" label={t(BUCKET_LABEL_KEY.current)} value={formatRupiah(data.totals.current)} />
            <StatTile icon={AlertTriangle} iconClass="bg-amber-50 text-amber-600" label={t(BUCKET_LABEL_KEY.d1to30)} value={formatRupiah(data.totals.d1to30)} />
            <StatTile icon={AlertTriangle} iconClass="bg-orange-50 text-orange-600" label={t(BUCKET_LABEL_KEY.d31to60)} value={formatRupiah(data.totals.d31to60)} />
            <StatTile icon={AlertTriangle} iconClass="bg-red-50 text-red-600" label={t(BUCKET_LABEL_KEY.d61to90)} value={formatRupiah(data.totals.d61to90)} />
            <StatTile icon={AlertTriangle} iconClass="bg-red-100 text-red-700" label={t(BUCKET_LABEL_KEY.d90plus)} value={formatRupiah(data.totals.d90plus)} />
          </div>

          {data.partners.length > 0 && (
            <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
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
                const top = [...data.partners].sort((a, b) => b.total - a.total).slice(0, 10).reverse();
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
                {data.partners.map((p) => (
                  <tr key={p.partnerId} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-4 py-2.5 font-medium text-zinc-900">
                      <Link href={`/partners/${p.partnerId}`} className="hover:text-emerald-600 hover:underline">
                        {p.partnerName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right">{p.current ? formatRupiah(p.current) : "-"}</td>
                    <td className="px-4 py-2.5 text-right">{p.d1to30 ? formatRupiah(p.d1to30) : "-"}</td>
                    <td className="px-4 py-2.5 text-right">{p.d31to60 ? formatRupiah(p.d31to60) : "-"}</td>
                    <td className="px-4 py-2.5 text-right text-amber-700">{p.d61to90 ? formatRupiah(p.d61to90) : "-"}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-red-600">{p.d90plus ? formatRupiah(p.d90plus) : "-"}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{formatRupiah(p.total)}</td>
                  </tr>
                ))}
                {!data.partners.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-400">
                      {t("agedReceivables.emptyState")}
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
