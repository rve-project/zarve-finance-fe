"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ZarveMirrorSyncStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return `${new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  })} WIB`;
}

export default function ImportPage() {
  const { t } = useLanguage();
  const [mirrorStatus, setMirrorStatus] = useState<ZarveMirrorSyncStatus | null>(null);
  const [mirrorError, setMirrorError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function loadMirrorStatus() {
    api.zarveMirrorStatus().then(setMirrorStatus).catch(() => {});
  }

  // Load once on mount, then poll every 5s only while a sync is actually running --
  // this isn't the "auto-refresh display data" pattern we deliberately avoid elsewhere,
  // it's watching the progress of one explicit, user-triggered job until it finishes.
  useEffect(() => {
    loadMirrorStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (mirrorStatus?.status === "running" && !pollRef.current) {
      pollRef.current = setInterval(loadMirrorStatus, 5000);
    } else if (mirrorStatus?.status !== "running" && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [mirrorStatus?.status]);

  async function handleStartSync() {
    setMirrorError(null);
    setStarting(true);
    try {
      await api.syncZarveMirrorNow();
      loadMirrorStatus();
    } catch (err) {
      setMirrorError(err instanceof Error ? err.message : t("import.errorStartFailed"));
    } finally {
      setStarting(false);
    }
  }

  const isRunning = mirrorStatus?.status === "running";

  return (
    <div>
      <PageHeader
        title={t("nav.sinkronisasiData")}
        subtitle={t("import.subtitle")}
      />

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <p className="mb-4 text-sm text-zinc-500">
          {t("import.description")}
        </p>

        {mirrorError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{mirrorError}</p>}

        {isRunning ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-800">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-700" />
              {t("import.syncingLabel")}
            </div>
            <p className="text-xs text-emerald-700">{mirrorStatus?.phase ?? t("import.processingFallback")}</p>
          </div>
        ) : (
          <button
            onClick={handleStartSync}
            disabled={starting}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {starting ? t("import.starting") : t("import.startNow")}
          </button>
        )}

        {mirrorStatus?.status === "done" && mirrorStatus.phase && (
          <p className="mt-3 text-xs text-zinc-500">{mirrorStatus.phase}</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-500 sm:grid-cols-4">
          <div>
            <p className="text-zinc-400">{t("import.lastSync")}</p>
            <p className="font-medium text-zinc-700">
              {mirrorStatus?.status === "done" ? formatDateTime(mirrorStatus.finishedAt) : mirrorStatus ? "-" : t("import.never")}
            </p>
          </div>
          {mirrorStatus?.status === "done" && (
            <>
              <div>
                <p className="text-zinc-400">{t("import.totalInvoices")}</p>
                <p className="font-medium text-zinc-700">{mirrorStatus.totalInvoices.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-zinc-400">{t("import.totalVehicles")}</p>
                <p className="font-medium text-zinc-700">{mirrorStatus.totalVehicles.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-zinc-400">{t("import.statusHistories")}</p>
                <p className="font-medium text-zinc-700">{mirrorStatus.totalStatusHistories.toLocaleString("id-ID")}</p>
              </div>
            </>
          )}
          {mirrorStatus?.status === "error" && (
            <div className="col-span-3">
              <p className="text-red-400">{t("import.lastError")}</p>
              <p className="font-medium text-red-600">{mirrorStatus.errorMessage}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
