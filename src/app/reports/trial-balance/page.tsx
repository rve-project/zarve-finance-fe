"use client";

import { useEffect, useState } from "react";
import { Scale, TrendingUp, TrendingDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah, defaultReportRange } from "@/lib/format";
import { AccountType, TrialBalanceResult } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { DatePicker } from "@/components/ui/DatePicker";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

// Validated categorical order (see dataviz skill's reference palette) -- the first 5
// slots of the documented 8-hue sequence, used as-is rather than re-picked by
// semantic hunch, so adjacent pairs stay colorblind-safe.
const TYPE_COLOR: Record<AccountType, string> = {
  asset: "#2a78d6",
  liability: "#eb6834",
  equity: "#1baf7a",
  income: "#eda100",
  expense: "#e87ba4",
};
const TYPE_LABEL_KEY: Record<AccountType, string> = {
  asset: "trialBalance.typeAsset",
  liability: "trialBalance.typeLiability",
  equity: "trialBalance.typeEquity",
  income: "trialBalance.typeIncome",
  expense: "trialBalance.typeExpense",
};

function axisTick(v: number) {
  return Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : String(v);
}

export default function TrialBalancePage() {
  const { t } = useLanguage();
  const [range, setRange] = useState(defaultReportRange());
  const [data, setData] = useState<TrialBalanceResult | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .trialBalance(range.from, range.to)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeRows = data?.rows.filter((r) => r.initialBalance !== 0 || r.periodDebit !== 0 || r.periodCredit !== 0 || r.endBalance !== 0) ?? [];
  const totalDebit = activeRows.reduce((sum, r) => sum + r.periodDebit, 0);
  const totalCredit = activeRows.reduce((sum, r) => sum + r.periodCredit, 0);

  return (
    <div>
      <PageHeader title={t("nav.trialBalance")} subtitle={t("trialBalance.subtitle")} />

      <div className="relative z-40 mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("trialBalance.dateFrom")}</span>
          <DatePicker value={range.from} onChange={(v) => setRange((r) => ({ ...r, from: v }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("trialBalance.dateTo")}</span>
          <DatePicker value={range.to} onChange={(v) => setRange((r) => ({ ...r, to: v }))} maxDate={new Date().toISOString().slice(0, 10)} />
        </label>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("trialBalance.show")}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={TrendingUp} iconClass="bg-emerald-50 text-emerald-600" label={t("trialBalance.statTotalDebit")} value={formatRupiah(totalDebit)} />
        <StatTile icon={TrendingDown} iconClass="bg-red-50 text-red-600" label={t("trialBalance.statTotalCredit")} value={formatRupiah(totalCredit)} />
        <StatTile icon={Scale} iconClass="bg-blue-50 text-blue-600" label={t("trialBalance.statActiveAccounts")} value={activeRows.length.toLocaleString("id-ID")} />
      </div>

      {activeRows.length > 0 && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-700">{t("trialBalance.chartTitle")}</p>
            <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
              {(Object.keys(TYPE_LABEL_KEY) as AccountType[]).map((accType) => (
                <span key={accType} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TYPE_COLOR[accType] }} />
                  {t(TYPE_LABEL_KEY[accType])}
                </span>
              ))}
            </div>
          </div>
          {(() => {
            const top = [...activeRows]
              .sort((a, b) => Math.abs(b.endBalance) - Math.abs(a.endBalance))
              .slice(0, 10)
              .map((r) => ({ name: r.account.name, value: r.endBalance, type: r.account.type }))
              .reverse();
            return (
              <ResponsiveContainer width="100%" height={Math.max(200, top.length * 32)}>
                <BarChart data={top} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 0 }}>
                  <CartesianGrid stroke="#f0efec" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={axisTick} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#52514e" }} axisLine={false} tickLine={false} width={160} />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {top.map((row, i) => (
                      <Cell key={i} fill={TYPE_COLOR[row.type]} />
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
              <th className="px-3 py-2.5 font-medium">{t("trialBalance.colCode")}</th>
              <th className="px-3 py-2.5 font-medium">{t("trialBalance.colAccountName")}</th>
              <th className="px-3 py-2.5 text-right font-medium">{t("trialBalance.colInitialBalance")}</th>
              <th className="px-3 py-2.5 text-right font-medium">{t("trialBalance.colDebit")}</th>
              <th className="px-3 py-2.5 text-right font-medium">{t("trialBalance.colCredit")}</th>
              <th className="px-3 py-2.5 text-right font-medium">{t("trialBalance.colEndBalance")}</th>
            </tr>
          </thead>
          <tbody>
            {activeRows.map((r) => (
              <tr key={r.account.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-3 py-2.5 font-mono text-xs text-zinc-500">{r.account.code}</td>
                <td className="px-3 py-2.5">{r.account.name}</td>
                <td className="px-3 py-2.5 text-right text-zinc-500">{formatRupiah(r.initialBalance)}</td>
                <td className="px-3 py-2.5 text-right">{formatRupiah(r.periodDebit)}</td>
                <td className="px-3 py-2.5 text-right">{formatRupiah(r.periodCredit)}</td>
                <td className="px-3 py-2.5 text-right font-semibold">{formatRupiah(r.endBalance)}</td>
              </tr>
            ))}
            {!activeRows.length && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-zinc-400">
                  {loading ? t("common.loading") : t("trialBalance.emptyState")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
