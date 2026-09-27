"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { AccountBalanceRow, AccountCategory, TaxCode } from "@/lib/types";
import { categorizeAccount } from "@/lib/accountCategory";
import { PageHeader } from "@/components/ui/PageHeader";

const EPOCH = "1970-01-01";

export default function B2bAccountsPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<AccountBalanceRow[]>([]);
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [taxes, setTaxes] = useState<TaxCode[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [actionsOpen, setActionsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  function load() {
    setLoading(true);
    api
      .trialBalance(EPOCH, today)
      .then((res) => setRows(res.rows))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    api.accountCategories(true).then(setCategories).catch(() => {});
    api.taxes(true).then(setTaxes).catch(() => {});
  }, []);

  const categoryById = new Map(categories.map((c) => [c.id, c.label]));
  const taxById = new Map(taxes.map((tx) => [tx.id, tx]));

  const visibleRows = rows.filter((r) => showArchived || r.account.isActive);

  function toggleSelected(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === visibleRows.length ? new Set() : new Set(visibleRows.map((r) => r.account.id))));
  }

  async function archiveSelected(isActive: boolean) {
    setActionsOpen(false);
    if (!selected.size) return;
    await Promise.all(Array.from(selected).map((id) => api.updateAccount(id, { isActive })));
    setSelected(new Set());
    load();
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{t("b2bAccounts.breadcrumb")}</p>
      <PageHeader
        title={t("b2bAccounts.title")}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/journal-entries"
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              + {t("b2bAccounts.createJournalEntry")}
            </Link>
            <Link
              href="/b2b-accounts/new"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              + {t("b2bAccounts.addAccount")}
            </Link>
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          {t("b2bAccounts.showArchived")}
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setActionsOpen((o) => !o)}
            disabled={!selected.size}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {t("b2bAccounts.actions")}
            <ChevronDown className="h-4 w-4" />
          </button>
          {actionsOpen && !!selected.size && (
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={() => archiveSelected(false)}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              >
                {t("b2bAccounts.archiveSelected")}
              </button>
              <button
                type="button"
                onClick={() => archiveSelected(true)}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              >
                {t("b2bAccounts.unarchiveSelected")}
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mb-2 text-right text-xs text-zinc-400">
        {t("b2bAccounts.balanceNotePrefix")} {formatDate(today)}, {t("b2bAccounts.balanceNoteSuffix")}
      </p>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-sky-50 text-left text-zinc-600">
              <th className="w-8 px-4 py-3">
                <input
                  type="checkbox"
                  checked={!!visibleRows.length && selected.size === visibleRows.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-zinc-300"
                />
              </th>
              <th className="px-2 py-3 font-medium">{t("b2bAccounts.colLock")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bAccounts.colCode")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bAccounts.colName")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bAccounts.colCategory")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bAccounts.colUsers")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bAccounts.colTax")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("b2bAccounts.colBalance")}</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.account.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(row.account.id)}
                    onChange={() => toggleSelected(row.account.id)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                </td>
                <td className="px-2 py-2.5 text-center text-zinc-300">–</td>
                <td className="px-4 py-2.5 font-mono text-xs">{row.account.code}</td>
                <td className="px-4 py-2.5">
                  <span className={row.account.isActive ? "text-emerald-700" : "text-zinc-400"}>{row.account.name}</span>
                </td>
                <td className="px-4 py-2.5 text-zinc-600">
                  {(row.account.categoryId && categoryById.get(row.account.categoryId)) || categorizeAccount(row.account)}
                </td>
                <td className="px-4 py-2.5 text-zinc-500">
                  {row.account.accessMode === "some" ? t("b2bAccounts.new.accessSome") : t("b2bAccounts.allUsers")}
                </td>
                <td className="px-4 py-2.5 text-zinc-500">
                  {row.account.taxId && taxById.get(row.account.taxId)
                    ? `${taxById.get(row.account.taxId)!.name} (${taxById.get(row.account.taxId)!.rate}%)`
                    : <span className="text-center text-zinc-300">–</span>}
                </td>
                <td className="px-4 py-2.5 text-right">{formatRupiah(row.endBalance)}</td>
              </tr>
            ))}
            {!loading && !visibleRows.length && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-400">
                  {t("b2bAccounts.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
