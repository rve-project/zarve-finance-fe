"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Receipt, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { Expense, ExpenseStats } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";

export default function B2bExpensesPage() {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.expenses(), api.expenseStats()])
      .then(([e, s]) => {
        setExpenses(e);
        setStats(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter(
      (e) => e.number.toLowerCase().includes(q) || (e.contactName ?? "").toLowerCase().includes(q) || (e.tag ?? "").toLowerCase().includes(q)
    );
  }, [expenses, search]);

  return (
    <div>
      <PageHeader
        title={t("expenses.title")}
        subtitle={t("expenses.subtitle")}
        action={
          <Link
            href="/b2b-expenses/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> {t("expenses.addNew")}
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={Receipt} iconClass="bg-sky-50 text-sky-600" label={t("expenses.statMonth")} value={formatRupiah(stats?.monthTotal ?? 0)} />
        <StatTile icon={Receipt} iconClass="bg-amber-50 text-amber-600" label={t("expenses.statLast30")} value={formatRupiah(stats?.last30Total ?? 0)} />
        <StatTile icon={Receipt} iconClass="bg-red-50 text-red-600" label={t("expenses.statUnpaid")} value={formatRupiah(stats?.unpaidTotal ?? 0)} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-sm font-semibold text-zinc-800">{t("expenses.listTitle")}</p>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("expenses.searchPlaceholder")}
              className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-500">
                <th className="px-4 py-2.5 font-medium">{t("expenses.colDate")}</th>
                <th className="px-4 py-2.5 font-medium">{t("expenses.colNumber")}</th>
                <th className="px-4 py-2.5 font-medium">{t("expenses.colCategory")}</th>
                <th className="px-4 py-2.5 font-medium">{t("expenses.colPayee")}</th>
                <th className="px-4 py-2.5 font-medium">{t("expenses.colStatus")}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t("expenses.colOutstanding")}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t("expenses.colTotal")}</th>
                <th className="px-4 py-2.5 font-medium">{t("expenses.colTag")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => (
                <tr key={exp.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-4 py-2.5 text-zinc-500">{formatDate(exp.expenseDate)}</td>
                  <td className="px-4 py-2.5 font-medium">
                    <Link href={`/b2b-expenses/${exp.id}`} className="text-emerald-700 hover:underline">
                      {exp.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{exp.categoryName ?? "-"}</td>
                  <td className="px-4 py-2.5">{exp.contactName ?? "-"}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        exp.payLater ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {t(exp.payLater ? "expenses.statusUnpaid" : "expenses.statusPaid")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-red-600">{exp.outstanding ? formatRupiah(exp.outstanding) : "-"}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{formatRupiah(exp.totalAmount)}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{exp.tag ?? "-"}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <p className="mb-4 text-sm text-zinc-400">{t("expenses.emptyState")}</p>
                    <Link
                      href="/b2b-expenses/new"
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" /> {t("expenses.addNew")}
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
