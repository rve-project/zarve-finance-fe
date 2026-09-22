"use client";

import { useEffect, useState } from "react";
import { Landmark, Scale, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah } from "@/lib/format";
import { BalanceSheetResult } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { SegmentedBar } from "@/components/ui/SegmentedBar";
import { DatePicker } from "@/components/ui/DatePicker";

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

export default function BalanceSheetPage() {
  const { t } = useLanguage();
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<BalanceSheetResult | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .balanceSheet(asOf)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  function section(title: string, rows: BalanceSheetResult["assets"], total: number) {
    const active = rows.filter((r) => r.endBalance !== 0);
    return (
      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
        <table className="w-full text-sm">
          <tbody>
            {active.map((r) => (
              <tr key={r.account.id} className="border-b border-zinc-50">
                <td className="py-1.5">{r.account.name}</td>
                <td className="py-1.5 text-right">{formatRupiah(r.endBalance)}</td>
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
              <td className="pt-2">{t("balanceSheet.totalPrefix")} {title}</td>
              <td className="pt-2 text-right">{formatRupiah(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  const isBalanced = data ? data.totalAssets === data.totalLiabilities + data.totalEquity : true;

  return (
    <div>
      <PageHeader title={t("balanceSheet.title")} subtitle={t("balanceSheet.subtitle")} />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("balanceSheet.asOfLabel")}</span>
          <DatePicker value={asOf} onChange={setAsOf} maxDate={new Date().toISOString().slice(0, 10)} />
        </label>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("balanceSheet.showButton")}
        </button>
      </div>

      {data && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile icon={Landmark} iconClass="bg-blue-50 text-blue-600" label={t("balanceSheet.totalAssets")} value={formatRupiah(data.totalAssets)} />
            <StatTile
              icon={Scale}
              iconClass="bg-violet-50 text-violet-600"
              label={t("balanceSheet.liabilitiesPlusEquity")}
              value={formatRupiah(data.totalLiabilities + data.totalEquity)}
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
              <SegmentedBar title={t("balanceSheet.assetComposition")} segments={topSegments(data.assets, t("home.otherBranch"))} />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
              <SegmentedBar title={t("balanceSheet.liabilitiesEquityComposition")} segments={topSegments([...data.liabilities, ...data.equity], t("home.otherBranch"))} />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
            {section(t("balanceSheet.assetsSection"), data.assets, data.totalAssets)}
            {section(t("balanceSheet.liabilitiesSection"), data.liabilities, data.totalLiabilities)}
            {section(t("balanceSheet.equitySection"), data.equity, data.totalEquity)}

            <div className="flex items-center justify-between border-t border-zinc-200 pt-4 text-sm text-zinc-500">
              <span>{t("balanceSheet.totalLiabilitiesEquity")}</span>
              <span className="font-semibold text-zinc-900">{formatRupiah(data.totalLiabilities + data.totalEquity)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
