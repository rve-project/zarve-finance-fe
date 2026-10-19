"use client";

import { useEffect, useState } from "react";
import { Scale, TrendingUp, TrendingDown, Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah, EPOCH, dayBefore } from "@/lib/format";
import { AccountType, ReportUnit, TrialBalanceResult } from "@/lib/types";
import { Period, ComparisonMode, thisMonthPeriod, expandComparison, periodLabel } from "@/lib/periods";
import { activeAccountsAcrossColumns, buildColumnMaps } from "@/lib/reportColumns";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { ComparisonPicker } from "@/components/ui/ComparisonPicker";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { ReportUnitToggle } from "@/components/ui/ReportUnitToggle";
import { AmountLink } from "@/components/ui/AmountLink";
import { UnitBadge } from "@/components/ui/UnitBadge";

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

interface Column {
  period: Period;
  data: TrialBalanceResult;
}

export default function TrialBalancePage() {
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
    Promise.all(periods.map((p) => api.trialBalanceForUnit(p.from, p.to, unit).then((data) => ({ period: p, data }))))
      .then(setColumns)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await api.exportTrialBalance(period.from, period.to, unit);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : t("common.exportError"));
    } finally {
      setExporting(false);
    }
  }

  const primary = columns[0]?.data.rows.filter((r) => r.initialBalance !== 0 || r.periodDebit !== 0 || r.periodCredit !== 0 || r.endBalance !== 0) ?? [];
  const totalDebit = primary.reduce((sum, r) => sum + r.periodDebit, 0);
  const totalCredit = primary.reduce((sum, r) => sum + r.periodCredit, 0);
  const isComparing = columns.length > 1;
  const activeAccounts = activeAccountsAcrossColumns(columns.map((c) => c.data));
  const columnMaps = buildColumnMaps(columns.map((c) => c.data));

  return (
    <div>
      <PageHeader title={t("nav.trialBalance")} subtitle={t("trialBalance.subtitle")} action={<ReportUnitToggle value={unit} onChange={setUnit} />} />

      <div className="relative z-40 mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <PeriodPicker value={period} onChange={setPeriod} />
        <ComparisonPicker value={comparison} onChange={setComparison} />
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("trialBalance.show")}
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={TrendingUp} iconClass="bg-emerald-50 text-emerald-600" label={t("trialBalance.statTotalDebit")} value={formatRupiah(totalDebit)} />
        <StatTile icon={TrendingDown} iconClass="bg-red-50 text-red-600" label={t("trialBalance.statTotalCredit")} value={formatRupiah(totalCredit)} />
        <StatTile icon={Scale} iconClass="bg-blue-50 text-blue-600" label={t("trialBalance.statActiveAccounts")} value={primary.length.toLocaleString("id-ID")} />
      </div>

      {primary.length > 0 && (
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
            const top = [...primary]
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
              {isComparing ? (
                columns.map((col) => (
                  <th key={col.period.from + col.period.to} className="px-3 py-2.5 text-right font-medium">
                    {periodLabel(col.period, MONTH_LABELS)}
                  </th>
                ))
              ) : (
                <>
                  <th className="px-3 py-2.5 text-right font-medium">{t("trialBalance.colInitialBalance")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("trialBalance.colDebit")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("trialBalance.colCredit")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("trialBalance.colEndBalance")}</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {!isComparing &&
              primary.map((r) => (
                <tr key={r.account.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-3 py-2.5 font-mono text-xs text-zinc-500">{r.account.code}</td>
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
                  <td className="px-3 py-2.5 font-mono text-xs text-zinc-500">{acc.code}</td>
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
            {!loading && !(isComparing ? activeAccounts.length : primary.length) && (
              <tr>
                <td colSpan={isComparing ? 2 + columns.length : 6} className="px-3 py-10 text-center text-sm text-zinc-400">
                  {t("trialBalance.emptyState")}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={isComparing ? 2 + columns.length : 6} className="px-3 py-10 text-center text-sm text-zinc-400">
                  {t("common.loading")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
