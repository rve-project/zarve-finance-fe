"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ActivityLogEntry } from "@/lib/types";

const METHOD_STYLE: Record<string, string> = {
  POST: "bg-emerald-50 text-emerald-700",
  PUT: "bg-sky-50 text-sky-600",
  PATCH: "bg-sky-50 text-sky-600",
  DELETE: "bg-red-50 text-red-600",
};

// D'Consulting audit gap #10: account security -- a view of who did what, gated to
// "key users" via users.canViewActivityLog (see rve-finance-be's activityLogs.controller.ts,
// which enforces this same check server-side -- this page is not the only guard).
export default function ActivityLogPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .activityLogs({ page, limit })
      .then((res) => {
        setRows(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("activityLog.errorLoading")))
      .finally(() => setLoading(false));
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader title={t("activityLog.title")} subtitle={t("activityLog.subtitle")} />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("activityLog.colTime")}</th>
              <th className="px-4 py-3 font-medium">{t("activityLog.colUser")}</th>
              <th className="px-4 py-3 font-medium">{t("activityLog.colAction")}</th>
              <th className="px-4 py-3 font-medium">{t("activityLog.colResource")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("activityLog.colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-50">
                <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-2.5">
                  <span className="font-medium text-zinc-800">{r.userName ?? "-"}</span>{" "}
                  <span className="text-xs text-zinc-400">{r.userEmail}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${METHOD_STYLE[r.method] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {r.method}
                  </span>{" "}
                  <span className="font-mono text-xs text-zinc-500">{r.path}</span>
                </td>
                <td className="px-4 py-2.5 text-zinc-500">
                  {r.resourceType ?? "-"}
                  {r.resourceId ? ` #${r.resourceId}` : ""}
                </td>
                <td className="px-4 py-2.5 text-right text-zinc-500">{r.responseStatus}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  {t("activityLog.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={limit} total={total} onChange={setPage} loading={loading} itemLabel={t("activityLog.itemLabel")} />
    </div>
  );
}
