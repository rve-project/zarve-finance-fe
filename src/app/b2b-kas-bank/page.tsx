"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ChevronDown, Download, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah } from "@/lib/format";
import { CashBankAccount, CashBankSummary } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";

function SummaryCard({
  label,
  value,
  count,
  totalLabel,
  borderClass,
  badgeClass,
}: {
  label: string;
  value: number;
  count: number;
  totalLabel: string;
  borderClass: string;
  badgeClass: string;
}) {
  return (
    <div className={`rounded-xl border bg-white p-4 ${borderClass}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700">{label}</p>
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${badgeClass}`}>
          {count}
        </span>
      </div>
      <p className="mt-4 text-xs text-zinc-500">{totalLabel}</p>
      <p className="text-lg font-bold text-zinc-900">{formatRupiah(value)}</p>
    </div>
  );
}

/** Button + caret opening "Impor rekening koran" (upload) / "Unduh template" for one
 * account. No live bank connection exists -- import is a manually-uploaded file, per
 * the format cashBank.controller.ts's importStatement expects. */
function ImportMenu({ account, onImported }: { account: CashBankAccount; onImported: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const result = await api.importBankStatement(account.id, file);
      window.alert(`${t("kasBank.importSuccess")} (${result.totalLines} ${t("kasBank.rows")})`);
      onImported();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t("kasBank.importError"));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div ref={containerRef} className="relative inline-flex">
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={importing}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-60"
      >
        {importing ? t("kasBank.importing") : t("kasBank.importStatement")}
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              fileInputRef.current?.click();
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Upload className="h-4 w-4" /> {t("kasBank.importStatement")}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              api.downloadCashBankTemplate();
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Download className="h-4 w-4" /> {t("kasBank.downloadTemplate")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function B2bKasBankPage() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<CashBankSummary | null>(null);
  const [accounts, setAccounts] = useState<CashBankAccount[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([api.cashBankSummary(), api.cashBankAccounts(showArchived)])
      .then(([s, a]) => {
        setSummary(s);
        setAccounts(a);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [showArchived]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader title={t("kasBank.title")} subtitle={t("kasBank.subtitle")} />

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label={t("kasBank.pemasukanMendatang")}
            value={summary.pemasukanMendatang}
            count={summary.pemasukanMendatangCount}
            totalLabel={t("kasBank.total")}
            borderClass="border-emerald-200"
            badgeClass="bg-emerald-600"
          />
          <SummaryCard
            label={t("kasBank.pengeluaranMendatang")}
            value={summary.pengeluaranMendatang}
            count={summary.pengeluaranMendatangCount}
            totalLabel={t("kasBank.total")}
            borderClass="border-red-200"
            badgeClass="bg-red-600"
          />
          <SummaryCard
            label={t("kasBank.saldoKasBank")}
            value={summary.saldoKasBank}
            count={summary.saldoKasBankCount}
            totalLabel={t("kasBank.total")}
            borderClass="border-indigo-200"
            badgeClass="bg-indigo-600"
          />
          <SummaryCard
            label={t("kasBank.saldoKartuKredit")}
            value={summary.saldoKartuKredit}
            count={summary.saldoKartuKreditCount}
            totalLabel={t("kasBank.total")}
            borderClass="border-indigo-200"
            badgeClass="bg-indigo-600"
          />
        </div>
      )}

      <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        {t("kasBank.showArchived")}
      </label>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("kasBank.colCode")}</th>
              <th className="px-4 py-3 font-medium">{t("kasBank.colName")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("kasBank.colSaldoBank")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("kasBank.colSaldoJurnal")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.length > 0 && (
              <tr>
                <td colSpan={5} className="bg-zinc-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t("kasBank.groupHeader")}
                </td>
              </tr>
            )}
            {accounts.map((account) => (
              <tr key={account.id} className="border-b border-zinc-50">
                <td className="px-4 py-2.5 font-mono text-xs text-emerald-700">{account.code}</td>
                <td className="px-4 py-2.5">{account.name}</td>
                <td className="px-4 py-2.5 text-right">{formatRupiah(account.saldoBank)}</td>
                <td className="px-4 py-2.5 text-right">{formatRupiah(account.saldoJurnal)}</td>
                <td className="px-4 py-2.5 text-right">
                  <ImportMenu account={account} onImported={load} />
                </td>
              </tr>
            ))}
            {!loading && !accounts.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  {t("kasBank.emptyState")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
