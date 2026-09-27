"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Printer, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { ExpenseDetail, JournalEntryDetail } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export default function ExpenseDetailPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [journalExpanded, setJournalExpanded] = useState(false);
  const [journal, setJournal] = useState<JournalEntryDetail | null>(null);
  const [journalLoading, setJournalLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .getExpense(Number(id))
      .then(setExpense)
      .catch((err) => setError(err instanceof Error ? err.message : t("expenseDetail.errorLoading")));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleJournal() {
    if (journalExpanded) {
      setJournalExpanded(false);
      return;
    }
    setJournalExpanded(true);
    if (!journal && expense?.journalEntryId) {
      setJournalLoading(true);
      api
        .getJournalEntry(expense.journalEntryId)
        .then(setJournal)
        .catch(() => {})
        .finally(() => setJournalLoading(false));
    }
  }

  async function handleDelete() {
    if (!expense || !window.confirm(t("expenseDetail.confirmDelete").replace("{number}", expense.number))) return;
    setDeleting(true);
    try {
      await api.deleteExpense(expense.id);
      router.push("/b2b-expenses");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("expenseDetail.errorDelete"));
      setDeleting(false);
    }
  }

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!expense) return <p className="text-sm text-zinc-400">{t("common.loading")}</p>;

  const subtotal = expense.lines.reduce((sum, l) => sum + l.amount, 0);
  const totalTax = expense.lines.reduce((sum, l) => sum + l.taxAmount, 0);
  const amountPaid = expense.payLater ? 0 : expense.totalAmount;
  const primaryTaxLine = expense.lines.find((l) => l.taxRate !== null && l.taxRate > 0);

  return (
    <div>
      <div className="print:hidden">
        <Breadcrumb items={[{ label: t("expenses.title"), href: "/b2b-expenses" }, { label: expense.number }]} />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-start justify-between px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs text-zinc-400">{t("expenseDetail.transactionLabel")}</p>
            <h1 className="text-lg font-bold text-zinc-900 sm:text-xl">{expense.number}</h1>
          </div>
          <span className={`text-sm font-semibold ${expense.payLater ? "text-amber-600" : "text-emerald-600"}`}>
            {t(expense.payLater ? "expenses.statusUnpaid" : "expenses.statusPaid")}
          </span>
        </div>

        <div className="flex flex-col gap-2 rounded-none border-y border-emerald-100 bg-emerald-50/50 px-6 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-8">
          <div className="text-sm">
            <p className="text-xs text-zinc-500">{t("expenseNew.payFrom")}</p>
            <p className="font-medium text-zinc-900">{expense.payLater ? t("expenseDetail.accountsPayable") : expense.bankAccountName ?? "-"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500">
              {t("expenseDetail.outstandingLabel")} <span className="text-lg font-bold text-zinc-900">{formatRupiah(expense.outstanding)}</span>
            </p>
            {expense.journalEntryId && (
              <button type="button" onClick={toggleJournal} className="mt-1 text-xs font-medium text-emerald-600 hover:underline">
                {t("expenseDetail.viewJournalEntry")}
              </button>
            )}
          </div>
        </div>

        {journalExpanded && (
          <div className="border-b border-zinc-100 bg-zinc-50/60 px-6 py-4 sm:px-8">
            {journalLoading && <p className="text-xs text-zinc-400">{t("common.loading")}</p>}
            {!journalLoading && journal && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-zinc-400">
                    <th className="px-2 py-1.5 font-medium">{t("journalEntries.table.account")}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{t("journalEntries.form.debitPlaceholder")}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{t("journalEntries.form.creditPlaceholder")}</th>
                  </tr>
                </thead>
                <tbody>
                  {journal.lines.map((l) => (
                    <tr key={l.id} className="border-t border-zinc-100">
                      <td className="px-2 py-1.5">
                        {l.accountCode} - {l.accountName}
                      </td>
                      <td className="px-2 py-1.5 text-right">{l.debit ? formatRupiah(l.debit) : "-"}</td>
                      <td className="px-2 py-1.5 text-right">{l.credit ? formatRupiah(l.credit) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 sm:px-8">
          <div>
            <p className="text-xs text-zinc-400">{t("expenseNew.payee")}</p>
            <p className="font-medium text-zinc-900">{expense.contactName ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">{t("expenseNew.date")}</p>
            <p className="font-medium text-zinc-900">{formatDate(expense.expenseDate)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">{t("expenseNew.number")}</p>
            <p className="font-medium text-zinc-900">{expense.number}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">{t("expenseNew.billingAddress")}</p>
            <p className="font-medium text-zinc-900">{expense.billingAddress || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">{t("expenseNew.paymentMethod")}</p>
            <p className="font-medium text-zinc-900">{expense.paymentMethod || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">{t("expenseNew.tag")}</p>
            <p className="font-medium text-zinc-900">{expense.tag || "-"}</p>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-zinc-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-zinc-500">
                <th className="px-6 py-2.5 font-medium sm:px-8">{t("expenseNew.colAccount")}</th>
                <th className="px-4 py-2.5 font-medium">{t("expenseNew.colDescription")}</th>
                <th className="px-4 py-2.5 font-medium">{t("expenseNew.colTax")}</th>
                <th className="px-4 py-2.5 pr-6 text-right font-medium sm:pr-8">{t("expenses.colTotal")}</th>
              </tr>
            </thead>
            <tbody>
              {expense.lines.map((line) => (
                <tr key={line.id} className="border-b border-zinc-50">
                  <td className="px-6 py-2.5 sm:px-8">{line.accountName}</td>
                  <td className="px-4 py-2.5 text-zinc-600">{line.description ?? "-"}</td>
                  <td className="px-4 py-2.5 text-zinc-600">{line.taxName ?? "-"}</td>
                  <td className="px-4 py-2.5 pr-6 text-right sm:pr-8">{formatRupiah(line.amount + line.taxAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end px-6 py-6 sm:px-8">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">{t("expenseNew.subtotal")}</span>
              <span className="font-medium text-zinc-900">{formatRupiah(subtotal)}</span>
            </div>
            {totalTax > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">
                  {t("expenseDetail.includesTax")} {primaryTaxLine?.taxName ?? ""} {primaryTaxLine?.taxRate ?? ""}%
                </span>
                <span className="font-medium text-zinc-900">{formatRupiah(totalTax)}</span>
              </div>
            )}
            {expense.discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">{t("expenseNew.discountAmount")}</span>
                <span className="font-medium text-zinc-900">-{formatRupiah(expense.discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-zinc-200 pt-2">
              <span className="font-semibold text-zinc-800">{t("expenseNew.total")}</span>
              <span className="font-semibold text-zinc-900">{formatRupiah(expense.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">{t("expenseDetail.amountPaid")}</span>
              <span className="font-medium text-zinc-900">{formatRupiah(amountPaid)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-200 pt-2">
              <span className="font-bold text-zinc-900">{t("expenses.colOutstanding")}</span>
              <span className={`text-lg font-bold ${expense.outstanding > 0 ? "text-red-600" : "text-zinc-900"}`}>{formatRupiah(expense.outstanding)}</span>
            </div>
          </div>
        </div>

        <p className="border-t border-zinc-100 px-6 py-3 text-right text-xs text-zinc-400 sm:px-8">
          {t("expenseDetail.createdAt")} {formatDate(expense.createdAt)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" /> {t("expenseDetail.delete")}
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <Printer className="h-4 w-4" /> {t("expenseDetail.print")}
          </button>
          <Link
            href={`/b2b-expenses/${expense.id}/edit`}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            {t("expenseDetail.edit")}
          </Link>
        </div>
      </div>
    </div>
  );
}
