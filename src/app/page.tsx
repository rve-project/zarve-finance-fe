"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  TrendingUp,
  Car,
  Receipt,
  AlertTriangle,
  Wallet,
  TrendingDown,
  Landmark,
  Users,
  Truck,
  HandCoins,
  Banknote,
} from "lucide-react";
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
import { DriverRevenueRecap, VehicleCategoryOption, SaleDocument, PurchaseDocument, Expense, CashBankAccount } from "@/lib/types";

// Palette: sequential blue for magnitude/trend (single series -> one hue, no legend
// needed since the title names it). Day-composition / invoice-status segments reuse
// the same status-style colors already established on the Revenue Recap page, for
// consistency across the app (same concept = same color everywhere). Each of the three
// sections below (Gabungan/Zarve/B2B) also gets one signature accent hue, applied to its
// header icon AND its own magnitude charts -- a quick visual anchor for "which section
// am I in" that reads before you've parsed a single number.
const BLUE = "#2a78d6"; // Zarve's signature hue
const ORANGE = "#eb6834"; // B2B's signature hue
const INDIGO = "#4a3aa7"; // Gabungan's signature hue
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
// Fixed categorical order -- same slots regardless of which entries are present, so one
// entry's color never shifts if another drops out of the filter. Validated (4 slots,
// light mode): lightness band / chroma floor / CVD separation / normal-vision floor all
// PASS; the one contrast WARN (the green) is covered by SegmentedBar's always-on text
// legend, which is the required relief.
const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#4a3aa7"];
const OTHER_GRAY = "#9a9a9a"; // "Lainnya" bucket -- identity carried by its legend label, not the chip alone.

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

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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

function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function pctDelta(curr: number, prev: number): number | undefined {
  if (prev === 0) return curr === 0 ? undefined : 100;
  return ((curr - prev) / prev) * 100;
}

/** Groups a list into "top N by value" + a single "Lainnya" bucket for the remainder --
 * keeps any breakdown chart to at most N+1 categorical slots regardless of how many
 * distinct entries exist underneath (per the "9th series folds into Other" rule). */
function topNWithOther(
  entries: [string, number][],
  n: number,
  otherLabel: string
): { label: string; value: number; color: string }[] {
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, n);
  const otherTotal = sorted.slice(n).reduce((sum, [, v]) => sum + v, 0);
  return [
    ...top.map(([label, value], i) => ({ label, value, color: CATEGORICAL[i % CATEGORICAL.length] })),
    ...(otherTotal > 0 ? [{ label: otherLabel, value: otherTotal, color: OTHER_GRAY }] : []),
  ];
}

/** Consistent section chrome: a signature-colored icon chip, a bold title, and an
 * optional right-aligned action -- repeated identically for Gabungan/Zarve/B2B so the
 * three sections read as one system instead of three differently-styled blocks. */
function SectionHeader({
  icon: Icon,
  title,
  accent,
  action,
}: {
  icon: LucideIcon;
  title: string;
  accent: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-base font-bold text-zinc-900">{title}</p>
      </div>
      {action}
    </div>
  );
}

function DailyTrendChart({ data, color }: { data: { day: number; revenue: number }[]; color: string }) {
  const gradientId = `dailyFill-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
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
        <Area type="monotone" dataKey="revenue" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TopBarChart({ data, dataKey, labelKey, color }: { data: Record<string, string | number>[]; dataKey: string; labelKey: string; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 0 }}>
        <CartesianGrid stroke="#f0efec" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v)}
        />
        <YAxis dataKey={labelKey} type="category" tick={{ fontSize: 11, fill: "#52514e" }} axisLine={false} tickLine={false} width={110} />
        <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
        <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Top-of-page "Ringkasan Gabungan" -- three KPI tiles (income/expense/ending cash)
 * summed across Zarve + B2B, each with a delta badge vs. the prior month. Deliberately
 * stays at coarse totals only (no combined chart): Zarve (car rental) and B2B use
 * unrelated charts of accounts, so anything more granular here would compare apples to
 * oranges -- the per-unit detail lives in the Zarve/B2B sections below instead. */
function FinanceSummarySections() {
  const { t } = useLanguage();
  const [curr, setCurr] = useState<{ zarve: { income: number; expense: number; cash: number }; b2b: { income: number; expense: number; cash: number } } | null>(null);
  const [prev, setPrev] = useState<{ zarveIncome: number; zarveExpense: number; b2bIncome: number; b2bExpense: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const thisMonth = currentMonth();
    const lastMonth = shiftMonth(thisMonth, -1);
    const { startDate, endDate } = monthRange(thisMonth);
    const prevRange = monthRange(lastMonth);
    Promise.all([
      api.profitAndLossForUnit(startDate, endDate, "zarve"),
      api.cashFlowForUnit(startDate, endDate, "zarve"),
      api.profitAndLossForUnit(startDate, endDate, "b2b"),
      api.cashFlowForUnit(startDate, endDate, "b2b"),
      api.profitAndLossForUnit(prevRange.startDate, prevRange.endDate, "zarve"),
      api.profitAndLossForUnit(prevRange.startDate, prevRange.endDate, "b2b"),
    ])
      .then(([zarvePl, zarveCf, b2bPl, b2bCf, zarvePlPrev, b2bPlPrev]) => {
        setCurr({
          zarve: { income: zarvePl.totalIncome, expense: zarvePl.totalExpense, cash: zarveCf.endingBalance },
          b2b: { income: b2bPl.totalIncome, expense: b2bPl.totalExpense, cash: b2bCf.endingBalance },
        });
        setPrev({
          zarveIncome: zarvePlPrev.totalIncome,
          zarveExpense: zarvePlPrev.totalExpense,
          b2bIncome: b2bPlPrev.totalIncome,
          b2bExpense: b2bPlPrev.totalExpense,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const combined = curr ? { income: curr.zarve.income + curr.b2b.income, expense: curr.zarve.expense + curr.b2b.expense, cash: curr.zarve.cash + curr.b2b.cash } : null;
  const combinedPrev = prev ? { income: prev.zarveIncome + prev.b2bIncome, expense: prev.zarveExpense + prev.b2bExpense } : null;

  return (
    <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <SectionHeader icon={Landmark} title={t("home.combinedTitle")} accent={INDIGO} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          icon={TrendingUp}
          iconClass="bg-emerald-50 text-emerald-600"
          label={t("profitLoss.totalIncome")}
          value={combined ? formatRupiah(combined.income) : loading ? "-" : formatRupiah(0)}
          delta={combined && combinedPrev ? pctDelta(combined.income, combinedPrev.income) : undefined}
          deltaGoodDirection="up"
        />
        <StatTile
          icon={TrendingDown}
          iconClass="bg-red-50 text-red-600"
          label={t("profitLoss.totalExpense")}
          value={combined ? formatRupiah(combined.expense) : loading ? "-" : formatRupiah(0)}
          delta={combined && combinedPrev ? pctDelta(combined.expense, combinedPrev.expense) : undefined}
          deltaGoodDirection="down"
        />
        <StatTile
          icon={Wallet}
          iconClass="bg-indigo-50 text-indigo-600"
          label={t("cashFlow.endingBalance")}
          value={combined ? formatRupiah(combined.cash) : loading ? "-" : formatRupiah(0)}
        />
      </div>
      <p className="mt-3 text-xs text-zinc-400">{t("home.deltaHint")}</p>
    </section>
  );
}

/** B2B section -- built to the same depth as Zarve below: KPI tiles (with AR/AP that
 * Zarve doesn't have, since Zarve's receivables live in the aged-receivables report
 * instead), a daily revenue trend, an expense breakdown, a cash & bank balance
 * breakdown, and top customers/suppliers. Pendapatan/Beban totals come from the same
 * profitAndLossForUnit report the combined section uses (the ledger's own number);
 * everything else is computed from the raw sales/purchases/expenses/accounts lists,
 * fetched once and filtered client-side per month -- these endpoints have no date
 * range parameter, and B2B's volume is small enough that this is cheap. */
function B2BSection({ month }: { month: string }) {
  const { t } = useLanguage();
  const [sales, setSales] = useState<SaleDocument[]>([]);
  const [purchases, setPurchases] = useState<PurchaseDocument[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<CashBankAccount[]>([]);
  const [pl, setPl] = useState<{ income: number; expense: number } | null>(null);
  const [plPrev, setPlPrev] = useState<{ income: number; expense: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.salesForUnit("b2b"), api.purchasesForUnit("b2b"), api.expensesForUnit("b2b"), api.cashBankAccountsForUnit("b2b")])
      .then(([s, p, e, a]) => {
        if (cancelled) return;
        setSales(s);
        setPurchases(p);
        setExpenses(e);
        setAccounts(a);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const { startDate, endDate } = monthRange(month);
    const prevRange = monthRange(shiftMonth(month, -1));
    Promise.all([
      api.profitAndLossForUnit(startDate, endDate, "b2b"),
      api.profitAndLossForUnit(prevRange.startDate, prevRange.endDate, "b2b"),
    ])
      .then(([curr, prev]) => {
        if (cancelled) return;
        setPl({ income: curr.totalIncome, expense: curr.totalExpense });
        setPlPrev({ income: prev.totalIncome, expense: prev.totalExpense });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [month]);

  const salesInMonth = sales.filter((s) => s.docType === "invoice" && s.status === "approved" && s.documentDate.slice(0, 7) === month);
  const purchasesInMonth = purchases.filter((p) => p.docType === "invoice" && p.status === "approved" && p.documentDate.slice(0, 7) === month);
  const expensesInMonth = expenses.filter((e) => e.expenseDate.slice(0, 7) === month);

  const arOutstanding = sales.filter((s) => s.docType === "invoice" && s.status === "approved").reduce((sum, s) => sum + s.outstanding, 0);
  const apOutstanding = purchases.filter((p) => p.docType === "invoice" && p.status === "approved").reduce((sum, p) => sum + p.outstanding, 0);

  const dInMonth = daysInMonth(month);
  const dailyTotals = new Map<number, number>();
  for (const s of salesInMonth) {
    const day = Number(s.documentDate.slice(8, 10));
    dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + s.totalAmount);
  }
  const dailyTrend = Array.from({ length: dInMonth }, (_, i) => ({ day: i + 1, revenue: dailyTotals.get(i + 1) ?? 0 }));

  const byCustomer = new Map<string, number>();
  for (const s of salesInMonth) {
    const name = s.contactName || t("home.noName");
    byCustomer.set(name, (byCustomer.get(name) ?? 0) + s.totalAmount);
  }
  const topCustomers = [...byCustomer.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .reverse()
    .map(([name, total]) => ({ name, total }));

  const bySupplier = new Map<string, number>();
  for (const p of purchasesInMonth) {
    const name = p.contactName || t("home.noName");
    bySupplier.set(name, (bySupplier.get(name) ?? 0) + p.totalAmount);
  }
  const topSuppliers = [...bySupplier.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .reverse()
    .map(([name, total]) => ({ name, total }));

  const byCategory = new Map<string, number>();
  for (const e of expensesInMonth) {
    const cat = e.categoryName || t("home.otherCategory");
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + e.totalAmount);
  }
  const expenseSegments = topNWithOther([...byCategory.entries()], 4, t("home.otherCategory"));

  const activeAccounts = [...accounts].filter((a) => a.isActive).map((a) => [a.name, Math.max(0, a.saldoBank)] as [string, number]);
  const accountSegments = topNWithOther(activeAccounts, 4, t("home.otherAccounts"));

  return (
    <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <SectionHeader
        icon={Landmark}
        title={t("home.b2bSectionTitle")}
        accent={ORANGE}
        action={
          <Link href="/b2b-kas-bank" className="text-xs font-medium text-emerald-600 hover:underline">
            {t("home.viewAll")} &rarr;
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={TrendingUp}
          iconClass="bg-emerald-50 text-emerald-600"
          label={t("profitLoss.totalIncome")}
          value={pl ? formatRupiah(pl.income) : loading ? "-" : formatRupiah(0)}
          delta={pl && plPrev ? pctDelta(pl.income, plPrev.income) : undefined}
          deltaGoodDirection="up"
        />
        <StatTile
          icon={TrendingDown}
          iconClass="bg-red-50 text-red-600"
          label={t("profitLoss.totalExpense")}
          value={pl ? formatRupiah(pl.expense) : loading ? "-" : formatRupiah(0)}
          delta={pl && plPrev ? pctDelta(pl.expense, plPrev.expense) : undefined}
          deltaGoodDirection="down"
        />
        <Link href="/reports/aged-receivables" className="block transition-transform hover:-translate-y-0.5">
          <StatTile icon={HandCoins} iconClass="bg-amber-50 text-amber-600" label={t("home.arOutstanding")} value={formatRupiah(arOutstanding)} />
        </Link>
        <StatTile icon={Banknote} iconClass="bg-rose-50 text-rose-600" label={t("home.apOutstanding")} value={formatRupiah(apOutstanding)} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5 lg:col-span-2">
          <p className="mb-4 text-sm font-semibold text-zinc-700">{t("home.dailyTrend")}</p>
          <DailyTrendChart data={dailyTrend} color={ORANGE} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
          <SegmentedBar title={t("home.expenseByCategory")} segments={expenseSegments} />
          <div className="mt-6">
            <SegmentedBar title={t("home.cashBankByAccount")} segments={accountSegments} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
              <Users className="h-3.5 w-3.5 text-zinc-400" /> {t("home.topCustomersB2b")}
            </p>
          </div>
          {topCustomers.length ? (
            <TopBarChart data={topCustomers} dataKey="total" labelKey="name" color={ORANGE} />
          ) : (
            <p className="py-10 text-center text-sm text-zinc-400">{t("home.noDataThisMonth")}</p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
              <Truck className="h-3.5 w-3.5 text-zinc-400" /> {t("home.topSuppliersB2b")}
            </p>
          </div>
          {topSuppliers.length ? (
            <TopBarChart data={topSuppliers} dataKey="total" labelKey="name" color={ORANGE} />
          ) : (
            <p className="py-10 text-center text-sm text-zinc-400">{t("home.noDataThisMonth")}</p>
          )}
        </div>
      </div>
    </section>
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

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
        <SectionHeader
          icon={Car}
          title={t("home.zarveSectionTitle")}
          accent={BLUE}
          action={
            <div className="relative z-40 flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-zinc-600">{t("home.unitType")}</span>
                <Dropdown
                  className="min-w-[200px]"
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
          }
        />

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
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5 lg:col-span-2">
            <p className="mb-4 text-sm font-semibold text-zinc-700">{t("home.dailyTrend")}</p>
            <DailyTrendChart data={stats?.dailyTrend ?? []} color={BLUE} />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
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
                  color: CATEGORICAL[i % CATEGORICAL.length],
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
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-700">{t("home.topVehicles")}</p>
              <Link href="/reports/vehicle-profitability" className="text-xs font-medium text-emerald-600 hover:underline">
                {t("home.viewAll")} &rarr;
              </Link>
            </div>
            <TopBarChart data={stats?.topVehicles ?? []} dataKey="total" labelKey="plate" color={BLUE} />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-700">{t("home.topDrivers")}</p>
              <Link href="/revenue-recap" className="text-xs font-medium text-emerald-600 hover:underline">
                {t("home.viewAll")} &rarr;
              </Link>
            </div>
            <TopBarChart data={stats?.topDrivers ?? []} dataKey="total" labelKey="driver" color={BLUE} />
          </div>
        </div>
      </section>

      <B2BSection month={month} />
    </div>
  );
}
