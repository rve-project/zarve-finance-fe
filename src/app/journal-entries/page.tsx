"use client";

import { Fragment, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { BusinessUnit, JournalEntryDetail, JournalEntrySummary } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { BusinessUnitToggle } from "@/components/ui/BusinessUnitToggle";

const LIMIT = 20;

function JournalEntriesPageInner() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [unit, setUnit] = useState<BusinessUnit>((searchParams.get("unit") as BusinessUnit) || "b2b");
  const [entries, setEntries] = useState<JournalEntrySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [expanded, setExpanded] = useState<Record<number, JournalEntryDetail>>({});

  function load(p = 1) {
    setLoading(true);
    api
      .journalEntriesForUnit(unit, p, LIMIT)
      .then((res) => {
        setEntries(res.data);
        setTotal(res.total);
        setPage(res.page);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setExpanded({});
    load();
  }, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleExpand(id: number) {
    if (expanded[id]) {
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    const detail = await api.getJournalEntryForUnit(unit, id);
    setExpanded((prev) => ({ ...prev, [id]: detail }));
  }

  async function handleReverse(id: number) {
    await api.reverseJournalEntryForUnit(unit, id);
    load(page);
  }

  return (
    <div>
      <PageHeader
        title={t("journalEntries.title")}
        subtitle={t("journalEntries.subtitle")}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <BusinessUnitToggle value={unit} onChange={setUnit} />
            <Link
              href={`/journal-entries/new?unit=${unit}`}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t("journalEntries.newButton")}
            </Link>
          </div>
        }
      />

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
                            <th className="py-1 font-medium">{t("journalEntries.table.lineDescription")}</th>
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
                              <td className="py-1 text-zinc-500">{l.description ?? "-"}</td>
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

export default function JournalEntriesPage() {
  return (
    <Suspense fallback={null}>
      <JournalEntriesPageInner />
    </Suspense>
  );
}
