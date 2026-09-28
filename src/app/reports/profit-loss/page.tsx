"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah, defaultReportRange } from "@/lib/format";
import { BusinessUnit, ProfitAndLossResult } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { DatePicker } from "@/components/ui/DatePicker";
import { BusinessUnitToggle } from "@/components/ui/BusinessUnitToggle";

const INCOME_COLOR = "#0ca30c";
const EXPENSE_COLOR = "#d03b3b";

function axisTick(v: number) {
  return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : String(v);
}

export default function ProfitAndLossPage() {
  const { t } = useLanguage();
  const [unit, setUnit] = useState<BusinessUnit>("b2b");
  const [range, setRange] = useState(defaultReportRange());
  const [data, setData] = useState<ProfitAndLossResult | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .profitAndLossForUnit(range.from, range.to, unit)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader title={t("profitLoss.title")} subtitle={t("profitLoss.subtitle")} action={<BusinessUnitToggle value={unit} onChange={setUnit} />} />

      <div className="relative z-40 mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("profitLoss.fromLabel")}</span>
          <DatePicker value={range.from} onChange={(v) => setRange((r) => ({ ...r, from: v }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("profitLoss.toLabel")}</span>
          <DatePicker value={range.to} onChange={(v) => setRange((r) => ({ ...r, to: v }))} maxDate={new Date().toISOString().slice(0, 10)}
          />
        </label>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("profitLoss.showButton")}
        </button>
      </div>

      {data && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile icon={TrendingUp} iconClass="bg-emerald-50 text-emerald-600" label={t("profitLoss.totalIncome")} value={formatRupiah(data.totalIncome)} />
            <StatTile icon={TrendingDown} iconClass="bg-red-50 text-red-600" label={t("profitLoss.totalExpense")} value={formatRupiah(data.totalExpense)} />
            <StatTile
              icon={Wallet}
              iconClass={data.netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}
              label={t("profitLoss.netProfit")}
              value={formatRupiah(data.netProfit)}
              valueClass={data.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}
            />
          </div>

          {(() => {
            const incomeChart = data.income
              .map((r) => ({ name: r.account.name, value: r.periodCredit - r.periodDebit }))
              .filter((r) => r.value > 0)
              .sort((a, b) => b.value - a.value)
              .slice(0, 8)
              .reverse();
            const expenseChart = data.expense
              .map((r) => ({ name: r.account.name, value: r.periodDebit - r.periodCredit }))
              .filter((r) => r.value > 0)
              .sort((a, b) => b.value - a.value)
              .slice(0, 8)
              .reverse();
            if (!incomeChart.length && !expenseChart.length) return null;
            return (
              <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {incomeChart.length > 0 && (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
                    <p className="mb-4 text-sm font-semibold text-zinc-700">{t("profitLoss.incomeComposition")}</p>
                    <ResponsiveContainer width="100%" height={Math.max(160, incomeChart.length * 32)}>
                      <BarChart data={incomeChart} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 0 }}>
                        <CartesianGrid stroke="#f0efec" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={axisTick} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#52514e" }} axisLine={false} tickLine={false} width={140} />
                        <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
                        <Bar dataKey="value" fill={INCOME_COLOR} radius={[0, 4, 4, 0]} maxBarSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {expenseChart.length > 0 && (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
                    <p className="mb-4 text-sm font-semibold text-zinc-700">{t("profitLoss.expenseComposition")}</p>
                    <ResponsiveContainer width="100%" height={Math.max(160, expenseChart.length * 32)}>
                      <BarChart data={expenseChart} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 0 }}>
                        <CartesianGrid stroke="#f0efec" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={axisTick} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#52514e" }} axisLine={false} tickLine={false} width={140} />
                        <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
                        <Bar dataKey="value" fill={EXPENSE_COLOR} radius={[0, 4, 4, 0]} maxBarSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">{t("profitLoss.incomeSection")}</h2>
            <table className="mb-6 w-full text-sm">
              <tbody>
                {data.income
                  .filter((r) => r.periodCredit !== 0 || r.periodDebit !== 0)
                  .map((r) => (
                    <tr key={r.account.id} className="border-b border-zinc-50">
                      <td className="py-1.5">{r.account.name}</td>
                      <td className="py-1.5 text-right">{formatRupiah(r.periodCredit - r.periodDebit)}</td>
                    </tr>
                  ))}
                {!data.income.some((r) => r.periodCredit !== 0 || r.periodDebit !== 0) && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-zinc-400">
                      {t("profitLoss.noIncome")}
                    </td>
                  </tr>
                )}
                <tr className="font-semibold">
                  <td className="pt-2">{t("profitLoss.totalIncome")}</td>
                  <td className="pt-2 text-right">{formatRupiah(data.totalIncome)}</td>
                </tr>
              </tbody>
            </table>

            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">{t("profitLoss.expenseSection")}</h2>
            <table className="mb-6 w-full text-sm">
              <tbody>
                {data.expense
                  .filter((r) => r.periodDebit !== 0 || r.periodCredit !== 0)
                  .map((r) => (
                    <tr key={r.account.id} className="border-b border-zinc-50">
                      <td className="py-1.5">{r.account.name}</td>
                      <td className="py-1.5 text-right">{formatRupiah(r.periodDebit - r.periodCredit)}</td>
                    </tr>
                  ))}
                {!data.expense.some((r) => r.periodDebit !== 0 || r.periodCredit !== 0) && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-zinc-400">
                      {t("profitLoss.noExpense")}
                    </td>
                  </tr>
                )}
                <tr className="font-semibold">
                  <td className="pt-2">{t("profitLoss.totalExpense")}</td>
                  <td className="pt-2 text-right">{formatRupiah(data.totalExpense)}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-4 text-base font-bold sm:text-lg">
              <span>{t("profitLoss.netProfit")}</span>
              <span className={data.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}>{formatRupiah(data.netProfit)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
