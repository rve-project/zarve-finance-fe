"use client";

import { useEffect, useState } from "react";
import { Wallet, PiggyBank, ArrowDownCircle, ArrowUpCircle, Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah, EPOCH, dayBefore } from "@/lib/format";
import { ReportUnit, CashFlowResult } from "@/lib/types";
import { Period, ComparisonMode, thisMonthPeriod, expandComparison, periodLabel } from "@/lib/periods";
import { activeAccountsAcrossColumns, buildColumnMaps } from "@/lib/reportColumns";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { ComparisonPicker } from "@/components/ui/ComparisonPicker";
import { ReportUnitToggle } from "@/components/ui/ReportUnitToggle";
import { AmountLink } from "@/components/ui/AmountLink";
import { UnitBadge } from "@/components/ui/UnitBadge";

const IN_COLOR = "#0ca30c";
const OUT_COLOR = "#d03b3b";
const BLUE = "#2a78d6";

function axisTick(v: number) {
  return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : String(v);
}

interface Column {
  period: Period;
  data: CashFlowResult;
}

export default function CashFlowPage() {
  const { t } = useLanguage();
  const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => t(`date.month${i}`));
  const [unit, setUnit] = useState<ReportUnit>("b2b");
  const [period, setPeriod] = useState<Period>(thisMonthPeriod());
  const [comparison, setComparison] = useState<ComparisonMode>({ type: "none" });
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    const periods = expandComparison(period, comparison);
    Promise.all(periods.map((p) => api.cashFlowForUnit(p.from, p.to, unit).then((data) => ({ period: p, data }))))
      .then(setColumns)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await api.exportCashFlow(period.from, period.to, unit);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : t("common.exportError"));
    } finally {
      setExporting(false);
    }
  }

  const primaryData = columns[0]?.data ?? null;
  const isComparing = columns.length > 1;
  const activeAccounts = activeAccountsAcrossColumns(columns.map((c) => ({ rows: c.data.accounts })));
  const columnMaps = buildColumnMaps(columns.map((c) => ({ rows: c.data.accounts })));

  return (
    <div>
      <PageHeader title={t("cashFlow.title")} subtitle={t("cashFlow.subtitle")} action={<ReportUnitToggle value={unit} onChange={setUnit} />} />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <PeriodPicker value={period} onChange={setPeriod} />
        <ComparisonPicker value={comparison} onChange={setComparison} />
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("cashFlow.show")}
        </button>
        {columns.length > 0 && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="ml-auto flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {exporting ? t("common.exporting") : t("common.exportExcel")}
          </button>
        )}
      </div>

      {exportError && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{exportError}</p>}

      {primaryData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={PiggyBank} iconClass="bg-blue-50 text-blue-600" label={t("cashFlow.beginningBalance")} value={formatRupiah(primaryData.beginningBalance)} />
          <StatTile icon={Wallet} iconClass="bg-blue-50 text-blue-600" label={t("cashFlow.endingBalance")} value={formatRupiah(primaryData.endingBalance)} />
          <StatTile icon={ArrowUpCircle} iconClass="bg-emerald-50 text-emerald-600" label={t("cashFlow.cashIn")} value={formatRupiah(primaryData.cashIn)} valueClass="text-emerald-600" />
          <StatTile icon={ArrowDownCircle} iconClass="bg-red-50 text-red-600" label={t("cashFlow.cashOut")} value={formatRupiah(primaryData.cashOut)} valueClass="text-red-600" />

          <div className="grid grid-cols-1 gap-4 lg:col-span-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
              <p className="mb-4 text-sm font-semibold text-zinc-700">{t("cashFlow.cashInVsOut")}</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  data={[
                    { name: t("cashFlow.cashIn"), value: primaryData.cashIn },
                    { name: t("cashFlow.cashOut"), value: primaryData.cashOut },
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

            {primaryData.accounts.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
                <p className="mb-4 text-sm font-semibold text-zinc-700">{t("cashFlow.endingBalanceByAccount")}</p>
                <ResponsiveContainer width="100%" height={Math.max(140, primaryData.accounts.length * 32)}>
                  <BarChart
                    data={primaryData.accounts.map((r) => ({ name: r.account.name, value: r.endBalance }))}
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
                  {isComparing ? (
                    columns.map((col) => (
                      <th key={col.period.from + col.period.to} className="px-3 py-2.5 text-right font-medium">
                        {periodLabel(col.period, MONTH_LABELS)}
                      </th>
                    ))
                  ) : (
                    <>
                      <th className="px-3 py-2.5 text-right font-medium">{t("cashFlow.beginningBalance")}</th>
                      <th className="px-3 py-2.5 text-right font-medium">{t("cashFlow.in")}</th>
                      <th className="px-3 py-2.5 text-right font-medium">{t("cashFlow.out")}</th>
                      <th className="px-3 py-2.5 text-right font-medium">{t("cashFlow.endingBalance")}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {!isComparing &&
                  primaryData.accounts.map((r) => (
                    <tr key={r.account.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                      <td className="px-3 py-2.5">
                        {r.account.name}
                        {unit === "consolidated" && <UnitBadge unit={r.account.businessUnit} />}
                      </td>
                      <td className="px-3 py-2.5 text-right text-zinc-500">
                        <AmountLink accountId={r.account.id} from={EPOCH} to={dayBefore(period.from)} unit={r.account.businessUnit} value={r.initialBalance} />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <AmountLink accountId={r.account.id} from={period.from} to={period.to} unit={r.account.businessUnit} value={r.periodDebit} />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <AmountLink accountId={r.account.id} from={period.from} to={period.to} unit={r.account.businessUnit} value={r.periodCredit} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold">
                        <AmountLink accountId={r.account.id} from={EPOCH} to={period.to} unit={r.account.businessUnit} value={r.endBalance} />
                      </td>
                    </tr>
                  ))}
                {isComparing &&
                  activeAccounts.map((acc) => (
                    <tr key={acc.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                      <td className="px-3 py-2.5">
                        {acc.name}
                        {unit === "consolidated" && <UnitBadge unit={acc.businessUnit} />}
                      </td>
                      {columns.map((col, i) => {
                        const row = columnMaps[i].get(acc.id);
                        return (
                          <td key={col.period.from + col.period.to} className="px-3 py-2.5 text-right font-semibold">
                            {row ? <AmountLink accountId={acc.id} from={EPOCH} to={col.period.to} unit={acc.businessUnit} value={row.endBalance} /> : formatRupiah(0)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                {!(isComparing ? activeAccounts.length : primaryData.accounts.length) && (
                  <tr>
                    <td colSpan={isComparing ? 1 + columns.length : 5} className="px-3 py-10 text-center text-sm text-zinc-400">
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
