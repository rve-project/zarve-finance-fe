"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Car, Receipt, AlertTriangle, Wallet, TrendingDown, Landmark } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { SegmentedBar } from "@/components/ui/SegmentedBar";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { Dropdown } from "@/components/ui/Dropdown";
import { DriverRevenueRecap, VehicleCategoryOption } from "@/lib/types";

// Palette: sequential blue for magnitude/trend (single series -> one hue, no legend
// needed since the title names it). Day-composition / invoice-status segments reuse
// the same status-style colors already established on the Revenue Recap page, for
// consistency across the app (same concept = same color everywhere).
const BLUE = "#2a78d6";
const COLOR = {
  full: "#0ca30c",
  partial: "#9E9D24",
  cuti: "#e34948",
  idle: "#eda100",
  maintenance: "#eb6834",
  paid: "#0ca30c",
  unpaid: "#d03b3b",
  compl: "#1baf7a",
  void_: "#9a9a9a",
  refunded: "#4a3aa7",
  ev: "#0ca30c",
  fuel: "#eb6834",
};
// Fixed categorical order for branches -- same two slots regardless of which branches
// are present, so a branch's color never shifts if the other drops out of the filter.
const BRANCH_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#4a3aa7"];

const STATUS_LABEL_KEY: Record<string, string> = {
  PAID: "home.statusPaid",
  PARTIAL: "home.statusPartial",
  UNPAID: "home.statusUnpaid",
  COMPLIMENTARY: "home.statusCompl",
  VOID: "home.statusVoid",
  REFUNDED: "home.statusRefunded",
};
const STATUS_COLOR: Record<string, string> = {
  PAID: COLOR.paid,
  PARTIAL: COLOR.partial,
  UNPAID: COLOR.unpaid,
  COMPLIMENTARY: COLOR.compl,
  VOID: COLOR.void_,
  REFUNDED: COLOR.refunded,
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthRange(month: string) {
  const now = new Date();
  const isCurrentMonth = month === currentMonth();
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    startDate: `${month}-01`,
    endDate: isCurrentMonth ? now.toISOString().slice(0, 10) : `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Combined Zarve+B2B summary at the top of Beranda, plus a dedicated "B2B" section
 * below it -- both business units' numbers on one page, no toggle. Fetches each unit's
 * P&L/cash-flow explicitly via `...ForUnit` (an explicit X-Business-Unit header per
 * call, not the global business-unit context) since both units' data is needed at once
 * on this one page. "Gabungan" is intentionally just 3 coarse totals: Zarve (car
 * rental) and B2B use unrelated charts of accounts, so anything more granular (e.g. a
 * combined P&L by account) would compare apples to oranges. */
function FinanceSummarySections() {
  const { t } = useLanguage();
  const [zarve, setZarve] = useState<{ income: number; expense: number; cash: number } | null>(null);
  const [b2b, setB2b] = useState<{ income: number; expense: number; cash: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { startDate, endDate } = monthRange(currentMonth());
    Promise.all([
      api.profitAndLossForUnit(startDate, endDate, "zarve"),
      api.cashFlowForUnit(startDate, endDate, "zarve"),
      api.profitAndLossForUnit(startDate, endDate, "b2b"),
      api.cashFlowForUnit(startDate, endDate, "b2b"),
    ])
      .then(([zarvePl, zarveCf, b2bPl, b2bCf]) => {
        setZarve({ income: zarvePl.totalIncome, expense: zarvePl.totalExpense, cash: zarveCf.endingBalance });
        setB2b({ income: b2bPl.totalIncome, expense: b2bPl.totalExpense, cash: b2bCf.endingBalance });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const combined =
    zarve && b2b
      ? { income: zarve.income + b2b.income, expense: zarve.expense + b2b.expense, cash: zarve.cash + b2b.cash }
      : null;

  return (
    <>
      <div className="mb-6">
        <p className="mb-3 text-sm font-semibold text-zinc-700">{t("home.combinedTitle")}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile icon={TrendingUp} iconClass="bg-emerald-50 text-emerald-600" label={t("profitLoss.totalIncome")} value={combined ? formatRupiah(combined.income) : loading ? "-" : formatRupiah(0)} />
          <StatTile icon={TrendingDown} iconClass="bg-red-50 text-red-600" label={t("profitLoss.totalExpense")} value={combined ? formatRupiah(combined.expense) : loading ? "-" : formatRupiah(0)} />
          <StatTile icon={Wallet} iconClass="bg-indigo-50 text-indigo-600" label={t("cashFlow.endingBalance")} value={combined ? formatRupiah(combined.cash) : loading ? "-" : formatRupiah(0)} />
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-700">{t("home.b2bSectionTitle")}</p>
          </div>
          <Link href="/b2b-kas-bank" className="text-xs font-medium text-emerald-600 hover:underline">
            {t("home.viewAll")} &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile icon={TrendingUp} iconClass="bg-emerald-50 text-emerald-600" label={t("profitLoss.totalIncome")} value={b2b ? formatRupiah(b2b.income) : loading ? "-" : formatRupiah(0)} />
          <StatTile icon={TrendingDown} iconClass="bg-red-50 text-red-600" label={t("profitLoss.totalExpense")} value={b2b ? formatRupiah(b2b.expense) : loading ? "-" : formatRupiah(0)} />
          <StatTile icon={Wallet} iconClass="bg-indigo-50 text-indigo-600" label={t("cashFlow.endingBalance")} value={b2b ? formatRupiah(b2b.cash) : loading ? "-" : formatRupiah(0)} />
        </div>
      </div>
    </>
  );
}

export default function HomePage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<VehicleCategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState(""); // "" until categories load -> defaults to "Semua Kendaraan"
  const [month, setMonth] = useState(currentMonth());

  const [recap, setRecap] = useState<DriverRevenueRecap | null>(null);
  const [statusSummary, setStatusSummary] = useState<{ status: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .vehicleCategories()
      .then((list) => {
        setCategories(list);
        if (list.length) setCategoryId(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    // `cancelled` guards against React Strict Mode's dev-only double-invoked effect
    // racing two responses and writing stale state.
    let cancelled = false;
    setLoading(true);
    setError(null);
    const { startDate, endDate } = monthRange(month);
    Promise.all([api.driverRevenueRecap(categoryId, month), api.invoiceStatusSummary(startDate, endDate)])
      .then(([recapRes, statusRes]) => {
        if (cancelled) return;
        setRecap(recapRes);
        setStatusSummary(statusRes);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("home.errorLoading"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, month]);

  function handleReload() {
    if (!categoryId) return;
    setLoading(true);
    setError(null);
    const { startDate, endDate } = monthRange(month);
    Promise.all([api.driverRevenueRecap(categoryId, month), api.invoiceStatusSummary(startDate, endDate)])
      .then(([recapRes, statusRes]) => {
        setRecap(recapRes);
        setStatusSummary(statusRes);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("home.errorLoading")))
      .finally(() => setLoading(false));
  }

  let stats: {
    grandTotal: number;
    activeVehicles: number;
    full: number;
    partial: number;
    cuti: number;
    idle: number;
    maintenance: number;
    dailyTrend: { day: number; revenue: number }[];
    topVehicles: { plate: string; total: number }[];
    topDrivers: { driver: string; total: number }[];
    byBranch: { branch: string; total: number }[];
    evRevenue: number;
    fuelRevenue: number;
  } | null = null;

  if (recap) {
    const grandTotal = recap.rows.reduce((sum, r) => sum + r.totalRevenue, 0);
    const activeVehicles = new Set(recap.rows.map((r) => r.vehiclePlate)).size;

    let full = 0, partial = 0, cuti = 0, idle = 0, maintenance = 0;
    const dailyTotals = new Map<number, number>();

    for (const row of recap.rows) {
      for (const cell of row.cells) {
        if (cell.kind === "idle") idle++;
        else if (cell.kind === "maintenance") maintenance++;
        else if (cell.kind === "revenue") {
          if (!cell.amount) cuti++;
          else if (cell.partial) partial++;
          else full++;
          if (cell.amount) dailyTotals.set(cell.day, (dailyTotals.get(cell.day) ?? 0) + cell.amount);
        }
      }
    }

    const dailyTrend = Array.from({ length: recap.daysInMonth }, (_, i) => ({
      day: i + 1,
      revenue: dailyTotals.get(i + 1) ?? 0,
    }));

    const byVehicle = new Map<string, number>();
    const byDriver = new Map<string, number>();
    const byBranchMap = new Map<string, number>();
    let evRevenue = 0;
    let fuelRevenue = 0;
    for (const row of recap.rows) {
      byVehicle.set(row.vehiclePlate, (byVehicle.get(row.vehiclePlate) ?? 0) + row.totalRevenue);
      byDriver.set(row.driverName || "-", (byDriver.get(row.driverName || "-") ?? 0) + row.totalRevenue);
      const branch = row.collector || t("home.otherBranch");
      byBranchMap.set(branch, (byBranchMap.get(branch) ?? 0) + row.totalRevenue);
      if (row.vehicleType === "ev") evRevenue += row.totalRevenue;
      else fuelRevenue += row.totalRevenue;
    }

    const topVehicles = Array.from(byVehicle.entries())
      .map(([plate, total]) => ({ plate, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .reverse();

    const topDrivers = Array.from(byDriver.entries())
      .map(([driver, total]) => ({ driver, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .reverse();

    const byBranch = Array.from(byBranchMap.entries())
      .map(([branch, total]) => ({ branch, total }))
      .sort((a, b) => b.total - a.total);

    stats = { grandTotal, activeVehicles, full, partial, cuti, idle, maintenance, dailyTrend, topVehicles, topDrivers, byBranch, evRevenue, fuelRevenue };
  }

  const unpaidCount = statusSummary.find((s) => s.status === "UNPAID")?.count ?? 0;
  const totalInvoices = statusSummary.reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      <PageHeader title={t("home.title")} subtitle={t("home.subtitle")} />

      <FinanceSummarySections />

      <p className="mb-3 text-sm font-semibold text-zinc-700">{t("home.zarveSectionTitle")}</p>

      <div className="relative z-40 mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("home.unitType")}</span>
          <Dropdown
            className="min-w-[220px]"
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            loading={!categories.length}
            disabled={loading}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("home.period")}</span>
          <MonthPicker value={month} onChange={setMonth} disabled={loading} />
        </label>
        <button
          onClick={handleReload}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("home.reload")}
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {loading && <p className="mb-4 text-sm text-zinc-400">{t("home.loadingData")}</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/revenue-recap" className="block transition-transform hover:-translate-y-0.5">
          <StatTile icon={TrendingUp} iconClass="bg-emerald-50 text-emerald-600" label={t("home.totalRevenue")} value={stats ? formatRupiah(stats.grandTotal) : "-"} />
        </Link>
        <Link href="/vehicles" className="block transition-transform hover:-translate-y-0.5">
          <StatTile icon={Car} iconClass="bg-blue-50 text-blue-600" label={t("home.activeVehicles")} value={stats ? stats.activeVehicles.toLocaleString("id-ID") : "-"} />
        </Link>
        <Link href="/invoices" className="block transition-transform hover:-translate-y-0.5">
          <StatTile icon={Receipt} iconClass="bg-violet-50 text-violet-600" label={t("home.totalInvoiceMonth")} value={totalInvoices.toLocaleString("id-ID")} />
        </Link>
        <Link href="/invoices?status=UNPAID" className="block transition-transform hover:-translate-y-0.5">
          <StatTile icon={AlertTriangle} iconClass="bg-red-50 text-red-600" label={t("home.unpaidInvoices")} value={unpaidCount.toLocaleString("id-ID")} />
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 lg:col-span-2">
          <p className="mb-4 text-sm font-semibold text-zinc-700">{t("home.dailyTrend")}</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats?.dailyTrend ?? []} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="dailyRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f0efec" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v)}
                width={40}
              />
              <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
              <Area type="monotone" dataKey="revenue" stroke={BLUE} strokeWidth={2} fill="url(#dailyRevenueFill)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
          <SegmentedBar
            title={t("home.evVsFuel")}
            segments={[
              { label: t("home.ev"), value: stats?.evRevenue ?? 0, color: COLOR.ev },
              { label: t("home.fuel"), value: stats?.fuelRevenue ?? 0, color: COLOR.fuel },
            ]}
          />
          <div className="mt-6">
            <SegmentedBar
              title={t("home.byBranch")}
              segments={(stats?.byBranch ?? []).map((b, i) => ({
                label: b.branch,
                value: b.total,
                color: BRANCH_COLORS[i % BRANCH_COLORS.length],
              }))}
            />
          </div>
          <div className="mt-6">
            <SegmentedBar
              title={t("home.dayComposition")}
              segments={[
                { label: t("home.payFull"), value: stats?.full ?? 0, color: COLOR.full },
                { label: t("home.partial"), value: stats?.partial ?? 0, color: COLOR.partial },
                { label: t("home.cuti"), value: stats?.cuti ?? 0, color: COLOR.cuti },
                { label: t("home.idle"), value: stats?.idle ?? 0, color: COLOR.idle },
                { label: t("home.maintenance"), value: stats?.maintenance ?? 0, color: COLOR.maintenance },
              ]}
            />
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-700">{t("home.invoiceStatus")}</p>
              <Link href="/invoices" className="text-xs font-medium text-emerald-600 hover:underline">
                {t("home.viewAll")} &rarr;
              </Link>
            </div>
            <SegmentedBar
              segments={statusSummary.map((s) => ({
                label: STATUS_LABEL_KEY[s.status] ? t(STATUS_LABEL_KEY[s.status]) : s.status,
                value: s.count,
                color: STATUS_COLOR[s.status] ?? "#9a9a9a",
              }))}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-700">{t("home.topVehicles")}</p>
            <Link href="/reports/vehicle-profitability" className="text-xs font-medium text-emerald-600 hover:underline">
              {t("home.viewAll")} &rarr;
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(220, (stats?.topVehicles.length ?? 0) * 34)}>
            <BarChart data={stats?.topVehicles ?? []} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="#f0efec" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v)} />
              <YAxis dataKey="plate" type="category" tick={{ fontSize: 11, fill: "#52514e" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
              <Bar dataKey="total" fill={BLUE} radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-700">{t("home.topDrivers")}</p>
            <Link href="/revenue-recap" className="text-xs font-medium text-emerald-600 hover:underline">
              {t("home.viewAll")} &rarr;
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(220, (stats?.topDrivers.length ?? 0) * 34)}>
            <BarChart data={stats?.topDrivers ?? []} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="#f0efec" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v)} />
              <YAxis dataKey="driver" type="category" tick={{ fontSize: 11, fill: "#52514e" }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
              <Bar dataKey="total" fill={BLUE} radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

