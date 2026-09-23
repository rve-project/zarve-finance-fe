"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah } from "@/lib/format";
import { Account } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";

interface LineDraft {
  accountId: string;
  description: string;
  debit: string;
  credit: string;
}

function emptyLine(): LineDraft {
  return { accountId: "", description: "", debit: "", credit: "" };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewJournalEntryPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [date, setDate] = useState(today());
  const [ref, setRef] = useState("");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine(), emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.accounts().then(setAccounts).catch(() => {});
  }, []);

  function updateLine(i: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

  const accountOptions = accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isBalanced) {
      setError(t("journalEntries.validation.notBalanced"));
      return;
    }
    setSubmitting(true);
    try {
      await api.createJournalEntry({
        date,
        ref: ref || undefined,
        narration: narration || undefined,
        lines: lines
          .filter((l) => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0))
          .map((l) => ({
            accountId: Number(l.accountId),
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
            description: l.description || undefined,
          })),
      });
      router.push("/journal-entries");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("journalEntries.error.saveFailed"));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Breadcrumb items={[{ label: t("journalEntries.title"), href: "/journal-entries" }, { label: t("journalEntries.new.title") }]} />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{t("journalEntries.new.title")}</h1>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {error && <p className="mx-6 mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:mx-8">{error}</p>}

        <div className="grid grid-cols-1 gap-4 rounded-t-2xl border-b border-emerald-100 bg-emerald-50/50 px-6 py-5 sm:grid-cols-2 sm:px-8">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("journalEntries.new.refLabel")}</span>
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder={t("journalEntries.new.refPlaceholder")}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("journalEntries.form.dateLabel")}</span>
            <DatePicker value={date} onChange={setDate} maxDate={today()} />
          </label>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {/* A plain <table> here would need overflow-x-auto to stay usable on
              mobile, but that ancestor overflow also clips the Dropdown's popup
              vertically (an overflow-x/overflow-y CSS coupling quirk) -- a grid
              avoids that entirely, same as every other Dropdown usage in this app. */}
          <div className="hidden gap-3 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_140px_36px]">
            <span>{t("journalEntries.table.account")}</span>
            <span>{t("journalEntries.new.colDescription")}</span>
            <span className="text-right">{t("journalEntries.form.debitPlaceholder")}</span>
            <span className="text-right">{t("journalEntries.form.creditPlaceholder")}</span>
            <span />
          </div>

          <div className="mt-2 space-y-3 sm:space-y-2">
            {lines.map((line, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-100 p-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_140px_36px] sm:items-center sm:rounded-none sm:border-0 sm:p-0"
              >
                <Dropdown
                  value={line.accountId}
                  onChange={(v) => updateLine(i, { accountId: v })}
                  options={accountOptions}
                  placeholder={t("journalEntries.form.accountPlaceholder")}
                />
                <input
                  value={line.description}
                  onChange={(e) => updateLine(i, { description: e.target.value })}
                  placeholder={t("journalEntries.form.lineDescriptionPlaceholder")}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  placeholder={t("journalEntries.form.debitPlaceholder")}
                  value={line.debit}
                  onChange={(e) => updateLine(i, { debit: e.target.value, credit: e.target.value ? "" : line.credit })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-right text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  placeholder={t("journalEntries.form.creditPlaceholder")}
                  value={line.credit}
                  onChange={(e) => updateLine(i, { credit: e.target.value, debit: e.target.value ? "" : line.debit })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-right text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={lines.length <= 2}
                  className="justify-self-end rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 sm:justify-self-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addLine} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700">
            <Plus className="h-4 w-4" /> {t("journalEntries.form.addLine")}
          </button>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("journalEntries.form.narrationLabel")}</span>
              <textarea
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder={t("journalEntries.form.narrationPlaceholder")}
                rows={3}
                className="w-full resize-none rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </label>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">{t("journalEntries.form.totalDebit")}</span>
                <span className="font-semibold text-zinc-900">{formatRupiah(totalDebit)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-zinc-500">{t("journalEntries.form.totalCredit")}</span>
                <span className="font-semibold text-zinc-900">{formatRupiah(totalCredit)}</span>
              </div>
              <div className="mt-3 border-t border-zinc-200 pt-3 text-right">
                <span className={`text-xs font-semibold ${isBalanced ? "text-emerald-600" : "text-red-600"}`}>
                  {isBalanced ? t("journalEntries.form.balanced") : t("journalEntries.form.notBalanced")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-zinc-100 bg-zinc-50 px-6 py-4 sm:px-8">
          <Link href="/journal-entries" className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
            {t("journalEntries.cancelButton")}
          </Link>
          <button
            type="submit"
            disabled={submitting || !isBalanced}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? t("journalEntries.form.saving") : t("journalEntries.form.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
