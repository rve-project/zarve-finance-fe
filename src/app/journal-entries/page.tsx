"use client";

import { Fragment, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { Account, JournalEntryDetail, JournalEntrySummary } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dropdown } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { DatePicker } from "@/components/ui/DatePicker";

const LIMIT = 20;

interface LineDraft {
  accountId: string;
  debit: string;
  credit: string;
}

function emptyLine(): LineDraft {
  return { accountId: "", debit: "", credit: "" };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function JournalEntriesPage() {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntrySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [expanded, setExpanded] = useState<Record<number, JournalEntryDetail>>({});

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(today());
  const [ref, setRef] = useState("");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine(), emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.accounts().then(setAccounts).catch(() => {});
  }, []);

  function load(p = 1) {
    setLoading(true);
    api
      .journalEntries(p, LIMIT)
      .then((res) => {
        setEntries(res.data);
        setTotal(res.total);
        setPage(res.page);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []); // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleSubmit(e: React.FormEvent) {
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
          .map((l) => ({ accountId: Number(l.accountId), debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
      });
      setDate(today());
      setRef("");
      setNarration("");
      setLines([emptyLine(), emptyLine()]);
      setShowForm(false);
      load(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("journalEntries.error.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleExpand(id: number) {
    if (expanded[id]) {
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    const detail = await api.getJournalEntry(id);
    setExpanded((prev) => ({ ...prev, [id]: detail }));
  }

  async function handleReverse(id: number) {
    await api.reverseJournalEntry(id);
    load(page);
  }

  const accountOptions = accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }));

  return (
    <div>
      <PageHeader
        title={t("journalEntries.title")}
        subtitle={t("journalEntries.subtitle")}
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {showForm ? t("journalEntries.cancelButton") : t("journalEntries.newButton")}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="relative z-40 mb-6 rounded-xl border border-zinc-200 bg-white p-5">
          {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="mb-4 flex flex-wrap gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">{t("journalEntries.form.dateLabel")}</span>
              <DatePicker value={date} onChange={setDate} maxDate={today()} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">{t("journalEntries.form.refLabel")}</span>
              <input value={ref} onChange={(e) => setRef(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
            </label>
            <label className="flex-1 text-sm">
              <span className="mb-1 block text-zinc-600">{t("journalEntries.form.narrationLabel")}</span>
              <input
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder={t("journalEntries.form.narrationPlaceholder")}
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
              />
            </label>
          </div>

          <div className="mb-3 space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <Dropdown
                  className="min-w-[260px] flex-1"
                  value={line.accountId}
                  onChange={(v) => updateLine(i, { accountId: v })}
                  options={accountOptions}
                  placeholder={t("journalEntries.form.accountPlaceholder")}
                />
                <input
                  type="number"
                  placeholder={t("journalEntries.form.debitPlaceholder")}
                  value={line.debit}
                  onChange={(e) => updateLine(i, { debit: e.target.value, credit: e.target.value ? "" : line.credit })}
                  className="w-32 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-right"
                />
                <input
                  type="number"
                  placeholder={t("journalEntries.form.creditPlaceholder")}
                  value={line.credit}
                  onChange={(e) => updateLine(i, { credit: e.target.value, debit: e.target.value ? "" : line.debit })}
                  className="w-32 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-right"
                />
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={lines.length <= 2}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addLine} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700">
            <Plus className="h-4 w-4" /> {t("journalEntries.form.addLine")}
          </button>

          <div className="mb-4 flex items-center gap-6 rounded-lg bg-zinc-50 px-4 py-2.5 text-sm">
            <span>
              {t("journalEntries.form.totalDebit")} <strong>{formatRupiah(totalDebit)}</strong>
            </span>
            <span>
              {t("journalEntries.form.totalCredit")} <strong>{formatRupiah(totalCredit)}</strong>
            </span>
            <span className={isBalanced ? "font-medium text-emerald-600" : "font-medium text-red-600"}>{isBalanced ? t("journalEntries.form.balanced") : t("journalEntries.form.notBalanced")}</span>
          </div>

          <button
            type="submit"
            disabled={submitting || !isBalanced}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? t("journalEntries.form.saving") : t("journalEntries.form.submit")}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("journalEntries.table.date")}</th>
              <th className="px-4 py-3 font-medium">{t("journalEntries.table.ref")}</th>
              <th className="px-4 py-3 font-medium">{t("journalEntries.table.narration")}</th>
              <th className="px-4 py-3 font-medium">{t("journalEntries.table.source")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("journalEntries.table.amount")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <Fragment key={entry.id}>
                <tr className="cursor-pointer border-b border-zinc-50 hover:bg-zinc-50" onClick={() => toggleExpand(entry.id)}>
                  <td className="px-4 py-2.5">{formatDate(entry.date)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{entry.ref ?? "-"}</td>
                  <td className="px-4 py-2.5">{entry.narration ?? "-"}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{entry.sourceType}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatRupiah(entry.totalAmount)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {entry.sourceType === "manual" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReverse(entry.id);
                        }}
                        className="text-xs font-medium text-amber-600 hover:underline"
                      >
                        {t("journalEntries.table.reverse")}
                      </button>
                    )}
                  </td>
                </tr>
                {expanded[entry.id] && (
                  <tr className="border-b border-zinc-50 bg-zinc-50">
                    <td colSpan={6} className="px-4 py-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-zinc-500">
                            <th className="py-1 font-medium">{t("journalEntries.table.account")}</th>
                            <th className="py-1 font-medium">{t("journalEntries.table.partner")}</th>
                            <th className="py-1 text-right font-medium">{t("journalEntries.table.debit")}</th>
                            <th className="py-1 text-right font-medium">{t("journalEntries.table.credit")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expanded[entry.id].lines.map((l) => (
                            <tr key={l.id}>
                              <td className="py-1">
                                {l.accountCode} - {l.accountName}
                              </td>
                              <td className="py-1">{l.partnerName ?? "-"}</td>
                              <td className="py-1 text-right">{l.debit ? formatRupiah(l.debit) : ""}</td>
                              <td className="py-1 text-right">{l.credit ? formatRupiah(l.credit) : ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                  {t("journalEntries.table.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={LIMIT} total={total} onChange={load} loading={loading} itemLabel={t("journalEntries.pagination.itemLabel")} />
    </div>
  );
}
