"use client";

import { useEffect, useState } from "react";
import { Wallet, PiggyBank, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah, defaultReportRange } from "@/lib/format";
import { BusinessUnit, CashFlowResult } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { DatePicker } from "@/components/ui/DatePicker";
import { BusinessUnitToggle } from "@/components/ui/BusinessUnitToggle";

const IN_COLOR = "#0ca30c";
const OUT_COLOR = "#d03b3b";
const BLUE = "#2a78d6";

function axisTick(v: number) {
  return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : String(v);
}

export default function CashFlowPage() {
  const { t } = useLanguage();
  const [unit, setUnit] = useState<BusinessUnit>("b2b");
  const [range, setRange] = useState(defaultReportRange());
  const [data, setData] = useState<CashFlowResult | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .cashFlowForUnit(range.from, range.to, unit)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader
        title={t("cashFlow.title")}
        subtitle={t("cashFlow.subtitle")}
        action={<BusinessUnitToggle value={unit} onChange={setUnit} />}
      />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("cashFlow.from")}</span>
          <DatePicker value={range.from} onChange={(v) => setRange((r) => ({ ...r, from: v }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("cashFlow.to")}</span>
          <DatePicker value={range.to} onChange={(v) => setRange((r) => ({ ...r, to: v }))} maxDate={new Date().toISOString().slice(0, 10)} />
        </label>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("cashFlow.show")}
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={PiggyBank} iconClass="bg-blue-50 text-blue-600" label={t("cashFlow.beginningBalance")} value={formatRupiah(data.beginningBalance)} />
          <StatTile icon={Wallet} iconClass="bg-blue-50 text-blue-600" label={t("cashFlow.endingBalance")} value={formatRupiah(data.endingBalance)} />
          <StatTile icon={ArrowUpCircle} iconClass="bg-emerald-50 text-emerald-600" label={t("cashFlow.cashIn")} value={formatRupiah(data.cashIn)} valueClass="text-emerald-600" />
          <StatTile icon={ArrowDownCircle} iconClass="bg-red-50 text-red-600" label={t("cashFlow.cashOut")} value={formatRupiah(data.cashOut)} valueClass="text-red-600" />

          <div className="grid grid-cols-1 gap-4 lg:col-span-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
              <p className="mb-4 text-sm font-semibold text-zinc-700">{t("cashFlow.cashInVsOut")}</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  data={[
                    { name: t("cashFlow.cashIn"), value: data.cashIn },
                    { name: t("cashFlow.cashOut"), value: data.cashOut },
                  ]}
                  layout="vertical"
                  margin={{ left: 8, right: 24, top: 4, bottom: 0 }}
                >
                  <CartesianGrid stroke="#f0efec" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={axisTick} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#52514e" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                    <Cell fill={IN_COLOR} />
                    <Cell fill={OUT_COLOR} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {data.accounts.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
                <p className="mb-4 text-sm font-semibold text-zinc-700">{t("cashFlow.endingBalanceByAccount")}</p>
                <ResponsiveContainer width="100%" height={Math.max(140, data.accounts.length * 32)}>
                  <BarChart
                    data={data.accounts.map((r) => ({ name: r.account.name, value: r.endBalance }))}
                    layout="vertical"
                    margin={{ left: 8, right: 24, top: 4, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#f0efec" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={axisTick} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#52514e" }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
                    <Bar dataKey="value" fill={BLUE} radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white lg:col-span-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-500">
                  <th className="px-3 py-2.5 font-medium">{t("cashFlow.account")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("cashFlow.beginningBalance")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("cashFlow.in")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("cashFlow.out")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("cashFlow.endingBalance")}</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((r) => (
                  <tr key={r.account.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-3 py-2.5">{r.account.name}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-500">{formatRupiah(r.initialBalance)}</td>
                    <td className="px-3 py-2.5 text-right">{formatRupiah(r.periodDebit)}</td>
                    <td className="px-3 py-2.5 text-right">{formatRupiah(r.periodCredit)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{formatRupiah(r.endBalance)}</td>
                  </tr>
                ))}
                {!data.accounts.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-sm text-zinc-400">
                      {t("cashFlow.emptyAccounts")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
