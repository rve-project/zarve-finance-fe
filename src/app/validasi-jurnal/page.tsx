"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { JournalValidationResult } from "@/lib/types";

// D'Consulting audit gaps #6/#7: a runnable "trial test" over every transaction type
// (Zarve + B2B, manual + synced) -- structurally these checks should always pass, since
// every transaction posts its journal entry in the same DB write. This page is the
// safety net that actually proves it, instead of just trusting the code.

function StatusCard({ ok, title, children }: { ok: boolean; title: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${ok ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50/40"}`}>
      <div className="mb-2 flex items-center gap-2">
        {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
        <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function JournalValidationPage() {
  const { t } = useLanguage();
  const [result, setResult] = useState<JournalValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    api
      .journalValidation()
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : t("journalValidation.errorLoading")))
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const orphanCount = result?.orphanTransactions.length ?? 0;
  const allBalanced = result?.trialBalance.every((r) => r.balanced) ?? true;
  const mismatchCount = result?.subledgerMismatches.length ?? 0;

  return (
    <div>
      <PageHeader
        title={t("journalValidation.title")}
        subtitle={t("journalValidation.subtitle")}
        action={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? t("journalValidation.checking") : t("journalValidation.runCheck")}
          </button>
        }
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="space-y-4">
          <StatusCard ok={orphanCount === 0} title={t("journalValidation.orphanTitle")}>
            {orphanCount === 0 ? (
              <p className="text-sm text-zinc-500">{t("journalValidation.orphanOk")}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-zinc-500">
                      <th className="px-3 py-2 font-medium">{t("journalValidation.colType")}</th>
                      <th className="px-3 py-2 font-medium">{t("journalValidation.colId")}</th>
                      <th className="px-3 py-2 font-medium">{t("journalValidation.colRef")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.orphanTransactions.map((o, i) => (
                      <tr key={`${o.type}-${o.id}-${i}`} className="border-b border-zinc-50">
                        <td className="px-3 py-2">{o.type}</td>
                        <td className="px-3 py-2">{o.id}</td>
                        <td className="px-3 py-2 font-mono text-xs">{o.ref ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </StatusCard>

          <StatusCard ok={allBalanced} title={t("journalValidation.trialBalanceTitle")}>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-zinc-500">
                    <th className="px-3 py-2 font-medium">{t("journalValidation.colBusinessUnit")}</th>
                    <th className="px-3 py-2 text-right font-medium">{t("journalValidation.colTotalDebit")}</th>
                    <th className="px-3 py-2 text-right font-medium">{t("journalValidation.colTotalCredit")}</th>
                    <th className="px-3 py-2 text-center font-medium">{t("journalValidation.colStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trialBalance.map((r) => (
                    <tr key={r.businessUnit} className="border-b border-zinc-50">
                      <td className="px-3 py-2 uppercase">{r.businessUnit}</td>
                      <td className="px-3 py-2 text-right">{formatRupiah(r.totalDebit)}</td>
                      <td className="px-3 py-2 text-right">{formatRupiah(r.totalCredit)}</td>
                      <td className="px-3 py-2 text-center">
                        {r.balanced ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{t("journalValidation.balanced")}</span>
                        ) : (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">{t("journalValidation.notBalanced")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </StatusCard>

          <StatusCard ok={mismatchCount === 0} title={t("journalValidation.subledgerTitle")}>
            {mismatchCount === 0 ? (
              <p className="text-sm text-zinc-500">{t("journalValidation.subledgerOk")}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-zinc-500">
                      <th className="px-3 py-2 font-medium">{t("journalValidation.colAccount")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("journalValidation.colSubledgerTotal")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("journalValidation.colGlTotal")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("journalValidation.colDifference")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subledgerMismatches.map((m) => (
                      <tr key={m.label} className="border-b border-zinc-50">
                        <td className="px-3 py-2">{m.label}</td>
                        <td className="px-3 py-2 text-right">{formatRupiah(m.subledgerTotal)}</td>
                        <td className="px-3 py-2 text-right">{formatRupiah(m.glTotal)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-red-600">{formatRupiah(m.difference)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </StatusCard>
        </div>
      )}
    </div>
  );
}
