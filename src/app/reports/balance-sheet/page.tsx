"use client";

import { useEffect, useState } from "react";
import { Landmark, Scale, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah, EPOCH } from "@/lib/format";
import { BalanceSheetResult, BusinessUnit } from "@/lib/types";
import { Period, ComparisonMode, thisMonthPeriod, expandComparison, periodLabel } from "@/lib/periods";
import { activeAccountsAcrossColumns, buildColumnMaps } from "@/lib/reportColumns";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { SegmentedBar } from "@/components/ui/SegmentedBar";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { ComparisonPicker } from "@/components/ui/ComparisonPicker";
import { BusinessUnitToggle } from "@/components/ui/BusinessUnitToggle";
import { AmountLink } from "@/components/ui/AmountLink";

// Fixed categorical order, validated (see dataviz skill) -- never cycled. Anything
// past the 5th-largest account folds into "Lainnya" (gray) instead of reusing a hue.
const COMPOSITION_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#4a3aa7", "#c026a3"];
const OTHER_COLOR = "#9a9a9a";

function topSegments(rows: { account: { name: string }; endBalance: number }[], otherLabel: string) {
  const active = rows.filter((r) => r.endBalance > 0).sort((a, b) => b.endBalance - a.endBalance);
  const top = active.slice(0, 5).map((r, i) => ({ label: r.account.name, value: r.endBalance, color: COMPOSITION_COLORS[i] }));
  const restTotal = active.slice(5).reduce((sum, r) => sum + r.endBalance, 0);
  return restTotal > 0 ? [...top, { label: otherLabel, value: restTotal, color: OTHER_COLOR }] : top;
}

interface Column {
  period: Period;
  data: BalanceSheetResult;
}

export default function BalanceSheetPage() {
  const { t } = useLanguage();
  const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => t(`date.month${i}`));
  const [unit, setUnit] = useState<BusinessUnit>("b2b");
  const [period, setPeriod] = useState<Period>(thisMonthPeriod());
  const [comparison, setComparison] = useState<ComparisonMode>({ type: "none" });
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    const periods = expandComparison(period, comparison);
    Promise.all(periods.map((p) => api.balanceSheetForUnit(p.to, unit).then((data) => ({ period: p, data }))))
      .then(setColumns)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await api.exportBalanceSheet(period.to, unit);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : t("common.exportError"));
    } finally {
      setExporting(false);
    }
  }

  const primaryData = columns[0]?.data ?? null;
  const isComparing = columns.length > 1;
  const columnMaps = {
    assets: buildColumnMaps(columns.map((c) => ({ rows: c.data.assets }))),
    liabilities: buildColumnMaps(columns.map((c) => ({ rows: c.data.liabilities }))),
    equity: buildColumnMaps(columns.map((c) => ({ rows: c.data.equity }))),
  };
  const activeAccounts = {
    assets: activeAccountsAcrossColumns(columns.map((c) => ({ rows: c.data.assets }))),
    liabilities: activeAccountsAcrossColumns(columns.map((c) => ({ rows: c.data.liabilities }))),
    equity: activeAccountsAcrossColumns(columns.map((c) => ({ rows: c.data.equity }))),
  };

  function section(title: string, key: "assets" | "liabilities" | "equity", total: number) {
    if (!isComparing) {
      const rows = primaryData ? primaryData[key] : [];
      const active = rows.filter((r) => r.endBalance !== 0);
      return (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
          <table className="w-full text-sm">
            <tbody>
              {active.map((r) => (
                <tr key={r.account.id} className="border-b border-zinc-50">
                  <td className="py-1.5">{r.account.name}</td>
                  <td className="py-1.5 text-right">
                    {/* account.id 0 is the synthetic "Laba Ditahan (Berjalan)" row (net
                        income rolled into equity) -- not a real account, nothing to drill into. */}
                    {r.account.id ? (
                      <AmountLink accountId={r.account.id} from={EPOCH} to={period.to} unit={unit} value={r.endBalance} />
                    ) : (
                      formatRupiah(r.endBalance)
                    )}
                  </td>
                </tr>
              ))}
              {!active.length && (
                <tr>
                  <td colSpan={2} className="py-3 text-zinc-400">
                    {t("balanceSheet.noDataPrefix")} {title.toLowerCase()}.
                  </td>
                </tr>
              )}
              <tr className="font-semibold">
                <td className="pt-2">
                  {t("balanceSheet.totalPrefix")} {title}
                </td>
                <td className="pt-2 text-right">{formatRupiah(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    const accounts = activeAccounts[key];
    const maps = columnMaps[key];
    const totals = columns.map((c) => c.data[key === "equity" ? "totalEquity" : key === "assets" ? "totalAssets" : "totalLiabilities"]);
    return (
      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
        <table className="w-full text-sm">
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id} className="border-b border-zinc-50">
                <td className="py-1.5">{acc.name}</td>
                {columns.map((col, i) => {
                  const row = maps[i].get(acc.id);
                  const value = row?.endBalance ?? 0;
                  return (
                    <td key={col.period.from + col.period.to} className="py-1.5 text-right">
                      {acc.id ? <AmountLink accountId={acc.id} from={EPOCH} to={col.period.to} unit={unit} value={value} /> : formatRupiah(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {!accounts.length && (
              <tr>
                <td colSpan={1 + columns.length} className="py-3 text-zinc-400">
                  {t("balanceSheet.noDataPrefix")} {title.toLowerCase()}.
                </td>
              </tr>
            )}
            <tr className="font-semibold">
              <td className="pt-2">
                {t("balanceSheet.totalPrefix")} {title}
              </td>
              {totals.map((tot, i) => (
                <td key={i} className="pt-2 text-right">
                  {formatRupiah(tot)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  const isBalanced = primaryData ? primaryData.totalAssets === primaryData.totalLiabilities + primaryData.totalEquity : true;

  return (
    <div>
      <PageHeader title={t("balanceSheet.title")} subtitle={t("balanceSheet.subtitle")} action={<BusinessUnitToggle value={unit} onChange={setUnit} />} />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <PeriodPicker value={period} onChange={setPeriod} />
        <ComparisonPicker value={comparison} onChange={setComparison} />
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("balanceSheet.showButton")}
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
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile icon={Landmark} iconClass="bg-blue-50 text-blue-600" label={t("balanceSheet.totalAssets")} value={formatRupiah(primaryData.totalAssets)} />
            <StatTile
              icon={Scale}
              iconClass="bg-violet-50 text-violet-600"
              label={t("balanceSheet.liabilitiesPlusEquity")}
              value={formatRupiah(primaryData.totalLiabilities + primaryData.totalEquity)}
            />
            <StatTile
              icon={isBalanced ? CheckCircle2 : AlertTriangle}
              iconClass={isBalanced ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}
              label={t("balanceSheet.status")}
              value={isBalanced ? t("balanceSheet.balanced") : t("balanceSheet.notBalanced")}
              valueClass={isBalanced ? "text-emerald-600" : "text-red-600"}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
              <SegmentedBar title={t("balanceSheet.assetComposition")} segments={topSegments(primaryData.assets, t("home.otherBranch"))} />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
              <SegmentedBar
                title={t("balanceSheet.liabilitiesEquityComposition")}
                segments={topSegments([...primaryData.liabilities, ...primaryData.equity], t("home.otherBranch"))}
              />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
            {isComparing && (
              <div className="mb-4 flex text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <div className="flex-1" />
                {columns.map((col) => (
                  <div key={col.period.from + col.period.to} className="flex-1 text-right">
                    {periodLabel(col.period, MONTH_LABELS)}
                  </div>
                ))}
              </div>
            )}
            {section(t("balanceSheet.assetsSection"), "assets", primaryData.totalAssets)}
            {section(t("balanceSheet.liabilitiesSection"), "liabilities", primaryData.totalLiabilities)}
            {section(t("balanceSheet.equitySection"), "equity", primaryData.totalEquity)}

            <div className="flex items-center justify-between border-t border-zinc-200 pt-4 text-sm text-zinc-500">
              <span>{t("balanceSheet.totalLiabilitiesEquity")}</span>
              <span className="font-semibold text-zinc-900">{formatRupiah(primaryData.totalLiabilities + primaryData.totalEquity)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
