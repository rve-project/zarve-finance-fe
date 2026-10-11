"use client";

import { useEffect, useState } from "react";
import { PiggyBank, TrendingUp, Landmark, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah, EPOCH, dayBefore } from "@/lib/format";
import { BusinessUnit, EquityChangesResult } from "@/lib/types";
import { Period, ComparisonMode, thisMonthPeriod, expandComparison, periodLabel } from "@/lib/periods";
import { activeAccountsAcrossColumns, buildColumnMaps } from "@/lib/reportColumns";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { ComparisonPicker } from "@/components/ui/ComparisonPicker";
import { BusinessUnitToggle } from "@/components/ui/BusinessUnitToggle";
import { AmountLink } from "@/components/ui/AmountLink";

interface Column {
  period: Period;
  data: EquityChangesResult;
}

export default function EquityChangesPage() {
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
    Promise.all(periods.map((p) => api.equityChangesForUnit(p.from, p.to, unit).then((data) => ({ period: p, data }))))
      .then(setColumns)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await api.exportEquityChanges(period.from, period.to, unit);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : t("common.exportError"));
    } finally {
      setExporting(false);
    }
  }

  const primaryData = columns[0]?.data ?? null;
  const isComparing = columns.length > 1;
  const primaryRows = primaryData?.rows.filter((r) => r.initialBalance !== 0 || r.endBalance !== 0) ?? [];
  const activeAccounts = activeAccountsAcrossColumns(columns.map((c) => ({ rows: c.data.rows })));
  const columnMaps = buildColumnMaps(columns.map((c) => ({ rows: c.data.rows })));

  return (
    <div>
      <PageHeader title={t("equityChanges.title")} subtitle={t("equityChanges.subtitle")} action={<BusinessUnitToggle value={unit} onChange={setUnit} />} />

      <div className="relative z-40 mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <PeriodPicker value={period} onChange={setPeriod} />
        <ComparisonPicker value={comparison} onChange={setComparison} />
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("equityChanges.showButton")}
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
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile icon={PiggyBank} iconClass="bg-blue-50 text-blue-600" label={t("equityChanges.totalBeginning")} value={formatRupiah(primaryData.totalBeginning)} />
          <StatTile
            icon={TrendingUp}
            iconClass={primaryData.totalMovement >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}
            label={t("equityChanges.totalMovement")}
            value={formatRupiah(primaryData.totalMovement)}
            valueClass={primaryData.totalMovement >= 0 ? "text-emerald-600" : "text-red-600"}
          />
          <StatTile icon={Landmark} iconClass="bg-violet-50 text-violet-600" label={t("equityChanges.totalEnding")} value={formatRupiah(primaryData.totalEnding)} />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-3 py-2.5 font-medium">{t("equityChanges.colCode")}</th>
              <th className="px-3 py-2.5 font-medium">{t("equityChanges.colAccountName")}</th>
              {isComparing ? (
                columns.map((col) => (
                  <th key={col.period.from + col.period.to} className="px-3 py-2.5 text-right font-medium">
                    {periodLabel(col.period, MONTH_LABELS)}
                  </th>
                ))
              ) : (
                <>
                  <th className="px-3 py-2.5 text-right font-medium">{t("equityChanges.colBeginning")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("equityChanges.colMovement")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("equityChanges.colEnding")}</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {!isComparing &&
              primaryRows.map((r) => (
                <tr key={r.account.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-3 py-2.5 font-mono text-xs text-zinc-500">{r.account.code}</td>
                  <td className="px-3 py-2.5">{r.account.name}</td>
                  {/* account.id 0 is the synthetic "Laba Ditahan (Berjalan)" row (net income
                      rolled into equity) -- not a real account, nothing to drill into. */}
                  {r.account.id ? (
                    <>
                      <td className="px-3 py-2.5 text-right text-zinc-500">
                        <AmountLink accountId={r.account.id} from={EPOCH} to={dayBefore(period.from)} unit={unit} value={r.initialBalance} />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <AmountLink accountId={r.account.id} from={period.from} to={period.to} unit={unit} value={r.endBalance - r.initialBalance} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold">
                        <AmountLink accountId={r.account.id} from={EPOCH} to={period.to} unit={unit} value={r.endBalance} />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 text-right text-zinc-500">{formatRupiah(r.initialBalance)}</td>
                      <td className="px-3 py-2.5 text-right">{formatRupiah(r.endBalance - r.initialBalance)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{formatRupiah(r.endBalance)}</td>
                    </>
                  )}
                </tr>
              ))}
            {isComparing &&
              activeAccounts.map((acc) => (
                <tr key={acc.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-3 py-2.5 font-mono text-xs text-zinc-500">{acc.code}</td>
                  <td className="px-3 py-2.5">{acc.name}</td>
                  {columns.map((col, i) => {
                    const row = columnMaps[i].get(acc.id);
                    const value = row?.endBalance ?? 0;
                    return (
                      <td key={col.period.from + col.period.to} className="px-3 py-2.5 text-right font-semibold">
                        {acc.id ? <AmountLink accountId={acc.id} from={EPOCH} to={col.period.to} unit={unit} value={value} /> : formatRupiah(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            {primaryData && (
              <tr className="border-t border-zinc-200 font-semibold">
                <td className="px-3 py-2.5" colSpan={2}>
                  {t("equityChanges.totalRow")}
                </td>
                {isComparing ? (
                  columns.map((col) => (
                    <td key={col.period.from + col.period.to} className="px-3 py-2.5 text-right">
                      {formatRupiah(col.data.totalEnding)}
                    </td>
                  ))
                ) : (
                  <>
                    <td className="px-3 py-2.5 text-right">{formatRupiah(primaryData.totalBeginning)}</td>
                    <td className="px-3 py-2.5 text-right">{formatRupiah(primaryData.totalMovement)}</td>
                    <td className="px-3 py-2.5 text-right">{formatRupiah(primaryData.totalEnding)}</td>
                  </>
                )}
              </tr>
            )}
            {!(isComparing ? activeAccounts.length : primaryRows.length) && !primaryData && (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-sm text-zinc-400">
                  {loading ? t("common.loading") : t("equityChanges.emptyState")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
