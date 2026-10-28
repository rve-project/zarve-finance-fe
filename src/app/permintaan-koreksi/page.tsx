"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { BusinessUnit, KoreksiRequest } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { BusinessUnitToggle } from "@/components/ui/BusinessUnitToggle";

const STATUS_CLASS: Record<KoreksiRequest["status"], string> = {
  pending_approval: "bg-amber-50 text-amber-600",
  approved: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red-50 text-red-500",
};

export default function PermintaanKoreksiPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [unit, setUnit] = useState<BusinessUnit>("b2b");
  const [requests, setRequests] = useState<KoreksiRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const canApprove = !!user?.canApproveCorrections;

  function load() {
    api
      .koreksiRequestsForUnit(unit)
      .then(setRequests)
      .catch((err) => setError(err instanceof Error ? err.message : t("koreksi.pageSubtitle")));
  }

  useEffect(load, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleApprove(id: number) {
    setBusyId(id);
    try {
      await api.approveKoreksiRequestForUnit(unit, id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("koreksi.pageSubtitle"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: number) {
    const reason = window.prompt(t("koreksi.confirmReject")) ?? undefined;
    setBusyId(id);
    try {
      await api.rejectKoreksiRequestForUnit(unit, id, reason);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("koreksi.pageSubtitle"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title={t("koreksi.pageTitle")} subtitle={t("koreksi.pageSubtitle")} action={<BusinessUnitToggle value={unit} onChange={setUnit} />} />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-2.5 font-medium">{t("koreksi.colResourceType")}</th>
              <th className="px-4 py-2.5 font-medium">{t("koreksi.colDate")}</th>
              <th className="px-4 py-2.5 font-medium">{t("koreksi.colReason")}</th>
              <th className="px-4 py-2.5 font-medium">{t("koreksi.colRequestedBy")}</th>
              <th className="px-4 py-2.5 font-medium">{t("koreksi.colStatus")}</th>
              {canApprove && <th className="px-4 py-2.5 text-right font-medium">{t("users.colActions")}</th>}
            </tr>
          </thead>
          <tbody>
            {requests?.map((r) => (
              <tr key={r.id} className="border-b border-zinc-50 align-top">
                <td className="px-4 py-2.5 font-medium text-zinc-900">{t(`koreksi.resourceType.${r.resourceType}`)}</td>
                <td className="px-4 py-2.5 text-zinc-500">{formatDate(r.requestedDate)}</td>
                <td className="px-4 py-2.5 text-zinc-600">
                  {r.reason}
                  {r.status === "rejected" && r.rejectedReason && (
                    <p className="mt-1 text-xs text-red-500">
                      {t("koreksi.rejectedReasonLabel")}: {r.rejectedReason}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2.5 text-zinc-500">{r.requestedByName ?? "-"}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[r.status]}`}>{t(`koreksi.status${r.status === "pending_approval" ? "PendingApproval" : r.status === "approved" ? "Approved" : "Rejected"}`)}</span>
                  {r.status === "approved" && (
                    <span className="ml-1.5 text-xs text-zinc-400">{r.usedAt ? t("koreksi.usedYes") : t("koreksi.usedNo")}</span>
                  )}
                </td>
                {canApprove && (
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {r.status === "pending_approval" && (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => handleReject(r.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          {t("koreksi.rejectButton")}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => handleApprove(r.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {t("koreksi.approveButton")}
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {requests && !requests.length && (
              <tr>
                <td colSpan={canApprove ? 6 : 5} className="px-4 py-10 text-center text-sm text-zinc-400">
                  {t("koreksi.emptyState")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
