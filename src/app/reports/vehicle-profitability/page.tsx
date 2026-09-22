"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Car } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah, defaultReportRange } from "@/lib/format";
import { VehicleProfitabilityResult } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { DatePicker } from "@/components/ui/DatePicker";

const PROFIT_COLOR = "#0ca30c";
const LOSS_COLOR = "#d03b3b";

function axisTick(v: number) {
  return Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : String(v);
}

export default function VehicleProfitabilityPage() {
  const { t } = useLanguage();
  const [range, setRange] = useState(defaultReportRange());
  const [data, setData] = useState<VehicleProfitabilityResult | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .vehicleProfitability(range.from, range.to)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalIncome = data?.vehicles.reduce((s, v) => s + v.income, 0) ?? 0;
  const totalExpense = data?.vehicles.reduce((s, v) => s + v.expense, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title={t("vehicleProfitability.title")}
        subtitle={t("vehicleProfitability.subtitle")}
      />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("vehicleProfitability.from")}</span>
          <DatePicker value={range.from} onChange={(v) => setRange((r) => ({ ...r, from: v }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("vehicleProfitability.to")}</span>
          <DatePicker value={range.to} onChange={(v) => setRange((r) => ({ ...r, to: v }))} maxDate={new Date().toISOString().slice(0, 10)} />
        </label>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("vehicleProfitability.show")}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={TrendingUp} iconClass="bg-emerald-50 text-emerald-600" label={t("vehicleProfitability.totalIncome")} value={formatRupiah(totalIncome)} />
        <StatTile icon={TrendingDown} iconClass="bg-red-50 text-red-600" label={t("vehicleProfitability.totalTaggedExpense")} value={formatRupiah(totalExpense)} />
        <StatTile icon={Car} iconClass="bg-blue-50 text-blue-600" label={t("vehicleProfitability.vehicleCount")} value={(data?.vehicles.length ?? 0).toLocaleString("id-ID")} />
      </div>

      <p className="mb-3 text-xs text-zinc-500">
        {t("vehicleProfitability.expenseNote")}
      </p>

      {data && data.vehicles.length > 0 && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
          <p className="mb-4 text-sm font-semibold text-zinc-700">{t("vehicleProfitability.top10Title")}</p>
          {(() => {
            const top = [...data.vehicles].sort((a, b) => b.profit - a.profit).slice(0, 10).reverse();
            return (
              <ResponsiveContainer width="100%" height={Math.max(200, top.length * 32)}>
                <BarChart data={top} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 0 }}>
                  <CartesianGrid stroke="#f0efec" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={axisTick} />
                  <YAxis dataKey="platNumber" type="category" tick={{ fontSize: 11, fill: "#52514e" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
                  <Bar dataKey="profit" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {top.map((row, i) => (
                      <Cell key={i} fill={row.profit >= 0 ? PROFIT_COLOR : LOSS_COLOR} />
                    ))}
                  </Bar>
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
              <th className="px-4 py-2.5 font-medium">{t("vehicleProfitability.plateNumber")}</th>
              <th className="px-4 py-2.5 font-medium">{t("vehicleProfitability.vehicle")}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t("vehicleProfitability.income")}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t("vehicleProfitability.expense")}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t("vehicleProfitability.profit")}</th>
            </tr>
          </thead>
          <tbody>
            {data?.vehicles.map((v) => (
              <tr key={v.vehicleId} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-2.5 font-mono text-xs">
                  <Link href={`/invoices?search=${encodeURIComponent(v.platNumber)}`} className="text-emerald-700 hover:underline">
                    {v.platNumber}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{v.name}</td>
                <td className="px-4 py-2.5 text-right">{formatRupiah(v.income)}</td>
                <td className="px-4 py-2.5 text-right text-red-600">{v.expense ? formatRupiah(v.expense) : "-"}</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${v.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatRupiah(v.profit)}</td>
              </tr>
            ))}
            {!data?.vehicles.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-400">
                  {loading ? t("common.loading") : t("vehicleProfitability.emptyState")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
