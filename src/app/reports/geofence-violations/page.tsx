"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah, defaultReportRange } from "@/lib/format";
import { GeofenceViolationsResult } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { SegmentedBar } from "@/components/ui/SegmentedBar";
import { DatePicker } from "@/components/ui/DatePicker";
import { Pagination } from "@/components/ui/Pagination";

const LIMIT = 20;

const STATUS_LABEL_KEY: Record<string, string> = {
  OPEN: "geofenceViolations.status.open",
  INVOICED: "geofenceViolations.status.invoiced",
  WAIVED: "geofenceViolations.status.waived",
};
const STATUS_COLOR: Record<string, string> = { OPEN: "text-amber-600 bg-amber-50", INVOICED: "text-emerald-600 bg-emerald-50", WAIVED: "text-zinc-500 bg-zinc-100" };

function formatWita(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

export default function GeofenceViolationsPage() {
  const { t } = useLanguage();
  const [range, setRange] = useState(defaultReportRange());
  const [page, setPage] = useState(1);
  const [data, setData] = useState<GeofenceViolationsResult | null>(null);
  const [loading, setLoading] = useState(true);

  function load(p = 1) {
    setLoading(true);
    api
      .geofenceViolations(range.from, range.to, p, LIMIT)
      .then((res) => {
        setData(res);
        setPage(res.page);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader
        title={t("geofenceViolations.title")}
        subtitle={t("geofenceViolations.subtitle")}
      />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("geofenceViolations.from")}</span>
          <DatePicker value={range.from} onChange={(v) => setRange((r) => ({ ...r, from: v }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("geofenceViolations.to")}</span>
          <DatePicker value={range.to} onChange={(v) => setRange((r) => ({ ...r, to: v }))} maxDate={new Date().toISOString().slice(0, 10)} />
        </label>
        <button
          onClick={() => load(1)}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? t("common.loading") : t("geofenceViolations.show")}
        </button>
      </div>

      {data && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatTile
              icon={AlertTriangle}
              iconClass="bg-amber-50 text-amber-600"
              label={`${t("geofenceViolations.status.open")} (${data.summary.open.count})`}
              value={formatRupiah(data.summary.open.amount)}
              valueClass="text-amber-600"
            />
            <StatTile
              icon={CheckCircle2}
              iconClass="bg-emerald-50 text-emerald-600"
              label={`${t("geofenceViolations.status.invoiced")} (${data.summary.invoiced.count})`}
              value={formatRupiah(data.summary.invoiced.amount)}
              valueClass="text-emerald-600"
            />
            <StatTile
              icon={XCircle}
              iconClass="bg-zinc-100 text-zinc-500"
              label={`${t("geofenceViolations.status.waived")} (${data.summary.waived.count})`}
              value={formatRupiah(data.summary.waived.amount)}
            />
            <StatTile
              icon={Wallet}
              iconClass="bg-blue-50 text-blue-600"
              label={`${t("geofenceViolations.totalFine")} (${data.summary.total.count})`}
              value={formatRupiah(data.summary.total.amount)}
            />
          </div>

          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
            <SegmentedBar
              title={t("geofenceViolations.compositionTitle")}
              segments={[
                { label: t("geofenceViolations.status.invoiced"), value: data.summary.invoiced.amount, color: "#0ca30c" },
                { label: t("geofenceViolations.status.open"), value: data.summary.open.amount, color: "#fab219" },
                { label: t("geofenceViolations.status.waived"), value: data.summary.waived.amount, color: "#9a9a9a" },
              ]}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-500">
                  <th className="px-4 py-2.5 font-medium">{t("geofenceViolations.date")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("geofenceViolations.vehicle")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("geofenceViolations.driver")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("geofenceViolations.area")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("geofenceViolations.exit")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("geofenceViolations.returned")}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t("geofenceViolations.fine")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("geofenceViolations.statusColumn")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("geofenceViolations.invoiceNo")}</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((v) => (
                  <tr key={v.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-4 py-2.5">{v.violationDate}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{v.vehiclePlate ?? "-"}</td>
                    <td className="px-4 py-2.5">{v.driverName ?? "-"}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{v.geofenceName ?? "-"}</td>
                    <td className="px-4 py-2.5">{formatWita(v.detectedAt)}</td>
                    <td className="px-4 py-2.5">{v.returnedAt ? formatWita(v.returnedAt) : <span className="text-zinc-400">{t("geofenceViolations.notDetectedYet")}</span>}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{formatRupiah(v.price)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[v.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                        {STATUS_LABEL_KEY[v.status] ? t(STATUS_LABEL_KEY[v.status]) : v.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {v.invoiceId && v.invoiceNumber ? (
                        <Link href={`/invoices/${v.invoiceId}`} className="text-emerald-600 hover:underline">
                          {v.invoiceNumber}
                        </Link>
                      ) : (
                        v.invoiceNumber ?? "-"
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && data.data.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-zinc-400">
                      {t("geofenceViolations.emptyState")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} limit={LIMIT} total={data.total} onChange={load} loading={loading} itemLabel={t("geofenceViolations.itemLabel")} />
        </>
      )}
    </div>
  );
}
