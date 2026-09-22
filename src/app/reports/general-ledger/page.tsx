"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Landmark } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah, defaultReportRange } from "@/lib/format";
import { Account, GeneralLedgerResult } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dropdown } from "@/components/ui/Dropdown";
import { StatTile } from "@/components/ui/StatTile";
import { Pagination } from "@/components/ui/Pagination";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { DatePicker } from "@/components/ui/DatePicker";

const BLUE = "#2a78d6";

const LIMIT = 50;

export default function GeneralLedgerPage() {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [range, setRange] = useState(defaultReportRange());
  const [page, setPage] = useState(1);
  const [data, setData] = useState<GeneralLedgerResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { from, to } = defaultReportRange();
    Promise.all([api.accounts(), api.trialBalance(from, to)]).then(([accountList, tb]) => {
      setAccounts(accountList);
      if (!accountList.length) return;
      // Default to whichever account actually has activity this year, instead of
      // just the first one by code (usually an untouched cash account) -- otherwise
      // this page looks empty every time someone opens it fresh.
      const mostActive = [...tb.rows].sort((a, b) => b.periodDebit + b.periodCredit - (a.periodDebit + a.periodCredit))[0];
      const defaultId = mostActive && mostActive.periodDebit + mostActive.periodCredit > 0 ? mostActive.account.id : accountList[0].id;
      setAccountId(defaultId);
    });
  }, []);

  function load(p = 1) {
    if (!accountId) return;
    setLoading(true);
    api
      .generalLedger(accountId, range.from, range.to, p, LIMIT)
      .then((res) => {
        setData(res);
        setPage(res.page);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (accountId) load(1);
  }, [accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <div>
      <PageHeader title={t("generalLedger.title")} subtitle={t("generalLedger.subtitle")} />

      <div className="relative z-40 mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("generalLedger.accountLabel")}</span>
          <Dropdown
            className="min-w-[260px]"
            value={accountId ? String(accountId) : ""}
            onChange={(v) => setAccountId(Number(v))}
            options={accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))}
            loading={!accounts.length}
            disabled={loading}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("generalLedger.fromLabel")}</span>
          <DatePicker value={range.from} onChange={(v) => setRange((r) => ({ ...r, from: v }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("generalLedger.toLabel")}</span>
          <DatePicker value={range.to} onChange={(v) => setRange((r) => ({ ...r, to: v }))} maxDate={new Date().toISOString().slice(0, 10)} />
        </label>
        <button
          onClick={() => load(1)}
          disabled={loading || !accountId}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("generalLedger.showButton")}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={TrendingUp} iconClass="bg-emerald-50 text-emerald-600" label={t("generalLedger.totalDebit")} value={formatRupiah(data?.totalDebit ?? 0)} />
        <StatTile icon={TrendingDown} iconClass="bg-red-50 text-red-600" label={t("generalLedger.totalCredit")} value={formatRupiah(data?.totalCredit ?? 0)} />
        <StatTile
          icon={Landmark}
          iconClass="bg-blue-50 text-blue-600"
          label={selectedAccount ? `${t("generalLedger.balancePrefix")} ${selectedAccount.name}` : t("generalLedger.accountBalance")}
          value={formatRupiah(data?.endBalance ?? 0)}
        />
      </div>

      {data && data.lines.length > 1 && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-zinc-700">{t("generalLedger.runningBalanceTrend")}</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.lines.map((l, i) => ({ i, date: formatDate(l.date), balance: l.runningBalance }))} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="glBalanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f0efec" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} minTickGap={30} />
              <YAxis
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v)}
                width={44}
              />
              <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
              <Area type="monotone" dataKey="balance" stroke={BLUE} strokeWidth={2} fill="url(#glBalanceFill)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-3 py-2.5 font-medium">{t("generalLedger.colDate")}</th>
              <th className="px-3 py-2.5 font-medium">{t("generalLedger.colRef")}</th>
              <th className="px-3 py-2.5 font-medium">{t("generalLedger.colPartner")}</th>
              <th className="px-3 py-2.5 font-medium">{t("generalLedger.colDescription")}</th>
              <th className="px-3 py-2.5 text-right font-medium">{t("generalLedger.colDebit")}</th>
              <th className="px-3 py-2.5 text-right font-medium">{t("generalLedger.colCredit")}</th>
              <th className="px-3 py-2.5 text-right font-medium">{t("generalLedger.colBalance")}</th>
            </tr>
          </thead>
          <tbody>
            {data?.lines.map((line, i) => (
              <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-3 py-2.5">{formatDate(line.date)}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-zinc-500">{line.ref ?? "-"}</td>
                <td className="px-3 py-2.5">{line.partnerName ?? "-"}</td>
                <td className="px-3 py-2.5">{line.narration ?? "-"}</td>
                <td className="px-3 py-2.5 text-right">{line.debit ? formatRupiah(line.debit) : ""}</td>
                <td className="px-3 py-2.5 text-right">{line.credit ? formatRupiah(line.credit) : ""}</td>
                <td className="px-3 py-2.5 text-right font-semibold">{formatRupiah(line.runningBalance)}</td>
              </tr>
            ))}
            {!data?.lines.length && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-zinc-400">
                  {loading ? t("common.loading") : t("generalLedger.emptyState")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={page} limit={LIMIT} total={data.total} onChange={load} loading={loading} itemLabel={t("generalLedger.itemLabel")} />}
    </div>
  );
}
