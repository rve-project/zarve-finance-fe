"use client";

import { useEffect, useState } from "react";
import { Download, MapPinOff, MapPin, HelpCircle } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { DriverRecapCellViolation, DriverRevenueRecap, VehicleCategoryOption } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { Dropdown } from "@/components/ui/Dropdown";
import { useLanguage } from "@/lib/i18n";

// Pinned (sticky) column widths -- kept as constants so the header/body cells for
// each pinned column line up exactly via matching `left` offsets.
const COL_NO_WIDTH = 40;
const COL_DRIVER_WIDTH = 170;
const COL_PLATE_WIDTH = 110;

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatWita(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

function ViolationTooltip({ violation }: { violation: DriverRecapCellViolation }) {
  const { t } = useLanguage();
  const area = violation.geofenceName ?? t("revenueRecap.violation.defaultArea");
  return (
    <div className="space-y-2">
      <p className="mb-1 text-xs font-semibold text-zinc-800">
        {t("revenueRecap.violation.title")} -- {area}
      </p>
      <div className="flex items-start gap-2">
        <MapPinOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
        <div>
          <p className="text-zinc-500">{t("revenueRecap.violation.exitedLabel")}</p>
          <p className="font-medium text-zinc-800">{formatWita(violation.detectedAt)} WIB</p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        {violation.returnedAt ? (
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
        ) : (
          <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        )}
        <div>
          <p className="text-zinc-500">{t("revenueRecap.violation.returnLabel")}</p>
          <p className="font-medium text-zinc-800">
            {violation.returnedAt ? `${formatWita(violation.returnedAt)} WIB` : t("revenueRecap.violation.notDetected")}
          </p>
        </div>
      </div>
      <p className="border-t border-zinc-100 pt-2 text-zinc-500">
        {t("revenueRecap.violation.penalty")} <span className="font-medium text-zinc-800">{formatRupiah(violation.price)}</span>
      </p>
    </div>
  );
}

/** One day cell in the recap table. Owns its own hover state so the tooltip trigger
 * is the whole cell -- not just the small violation dot -- while the dot stays as a
 * visual flag, not the only hoverable target. */
function RecapCell({
  style,
  title,
  violation,
  children,
}: {
  style?: React.CSSProperties;
  title?: string;
  violation?: DriverRecapCellViolation;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <td
      title={title}
      style={{ ...style, position: "relative" }}
      className="whitespace-nowrap border-b border-l border-zinc-100 px-2.5 py-1.5 text-right tabular-nums"
      onMouseEnter={violation ? () => setHovered(true) : undefined}
      onMouseLeave={violation ? () => setHovered(false) : undefined}
    >
      {violation && (
        <>
          <span className="absolute right-0.5 top-0.5 block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#4a3aa7" }} />
          {hovered && (
            <div className="absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[240px] -translate-x-1/2 rounded-xl border border-zinc-200 bg-white p-3 text-left text-xs font-normal normal-case text-zinc-700 shadow-lg">
              <ViolationTooltip violation={violation} />
              <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-zinc-200 bg-white" />
            </div>
          )}
        </>
      )}
      {children}
    </td>
  );
}

function formatRelativeTime(iso: string | null, now: number, t: (key: string) => string): string {
  if (!iso) return t("revenueRecap.relative.never");
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 10) return t("revenueRecap.relative.justNow");
  if (seconds < 60) return `${seconds} ${t("revenueRecap.relative.secondsAgo")}`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} ${t("revenueRecap.relative.minutesAgo")}`;
  const hours = Math.round(minutes / 60);
  return `${hours} ${t("revenueRecap.relative.hoursAgo")}`;
}

export default function RevenueRecapPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<VehicleCategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<DriverRevenueRecap | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  function loadCategories() {
    setCategoriesLoading(true);
    setCategoriesError(null);
    api
      .vehicleCategories()
      .then((list) => {
        setCategories(list);
        if (list.length) {
          setCategoryId(list[0].id);
          loadRecap(list[0].id, month);
        }
      })
      .catch((err) => setCategoriesError(err instanceof Error ? err.message : t("revenueRecap.unitTypeLoadError")))
      .finally(() => setCategoriesLoading(false));
  }

  // Fires once when this page mounts -- i.e. every time the user navigates into
  // "Rekap Revenue" from the sidebar. No background timer: refreshing only happens on
  // an actual entry point (open this page, switch the filter, or hit "Muat Ulang")
  // instead of hitting the external API on a fixed clock regardless of anyone looking.
  useEffect(loadCategories, []);

  async function loadRecap(id: string, m: string) {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.driverRevenueRecap(id, m);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("revenueRecap.loadError"));
    } finally {
      setLoading(false);
    }
  }

  // Ticks the "X menit yang lalu" label -- purely local, no network call.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(interval);
  }, []);

  function handleLoad() {
    loadRecap(categoryId, month);
  }

  async function handleExport() {
    if (!data) return;
    setExporting(true);
    setError(null);
    try {
      await api.exportDriverRevenueRecap(categoryId, month, data.categoryName);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("revenueRecap.exportError"));
    } finally {
      setExporting(false);
    }
  }

  const grandTotal = data?.rows.reduce((sum, r) => sum + r.totalRevenue, 0) ?? 0;
  const grandTotalKeluarKota = data?.rows.reduce((sum, r) => sum + r.totalKeluarKota, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title={t("revenueRecap.title")}
        subtitle={t("revenueRecap.subtitle")}
      />

      <div className="relative z-40 mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("revenueRecap.unitType")}</span>
          {categoriesError ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">{t("revenueRecap.unitTypeLoadError")}</span>
              <button
                onClick={loadCategories}
                className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                {t("revenueRecap.retry")}
              </button>
            </div>
          ) : (
            <Dropdown
              className="min-w-[260px]"
              value={categoryId}
              onChange={(id) => {
                setCategoryId(id);
                loadRecap(id, month);
              }}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              loading={categoriesLoading}
              disabled={loading}
            />
          )}
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-600">{t("revenueRecap.period")}</span>
          <MonthPicker
            value={month}
            onChange={(m) => {
              setMonth(m);
              loadRecap(categoryId, m);
            }}
            disabled={loading}
          />
        </label>
        <button
          onClick={handleLoad}
          disabled={loading || !categoryId}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {loading ? t("common.loading") : t("revenueRecap.reload")}
        </button>
        {data && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="ml-auto flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {exporting ? t("revenueRecap.downloading") : t("revenueRecap.exportExcel")}
          </button>
        )}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {loading && (
        <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
          <p className="mb-2 text-sm text-zinc-500">{t("revenueRecap.loadingData")}</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-emerald-500" />
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="mb-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4">
            <div>
              <p className="text-sm text-zinc-500">
                {data.categoryName} &middot; {data.rows.length} {t("revenueRecap.rows")}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                {t("revenueRecap.lastSynced")} {formatRelativeTime(data.fetchedAt, now, t)}
                {data.fetchedAt && (
                  <>
                    {" · "}
                    {new Date(data.fetchedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta" })} WIB
                  </>
                )}
              </p>
            </div>
            <div className="flex items-start gap-6">
              <div className="text-right">
                <p className="text-sm text-zinc-500">{t("home.totalRevenue")}</p>
                <p className="text-xl font-bold text-emerald-600">{formatRupiah(grandTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-500">{t("revenueRecap.geofencePenalty")}</p>
                <p className="text-xl font-bold text-rose-600">{formatRupiah(grandTotalKeluarKota)}</p>
              </div>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#FFF9C4" }} /> {t("revenueRecap.legendIdle")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#FFCC80" }} /> {t("home.maintenance")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#EF9A9A" }} /> {t("revenueRecap.legendCuti")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#9E9D24" }} /> {t("revenueRecap.legendPartial")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#4a3aa7" }} /> {t("revenueRecap.legendGeofence")}
            </span>
          </div>

          <div className="max-h-[600px] overflow-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="text-left text-zinc-600">
                  <th
                    className="sticky top-0 left-0 z-30 whitespace-nowrap border-b-2 border-emerald-500 bg-zinc-100 px-2 py-2.5 text-center font-semibold uppercase tracking-wide"
                    style={{ width: COL_NO_WIDTH, left: 0 }}
                  >
                    {t("revenueRecap.colNo")}
                  </th>
                  <th
                    className="sticky top-0 z-30 whitespace-nowrap border-b-2 border-emerald-500 bg-zinc-100 px-2 py-2.5 text-left font-semibold uppercase tracking-wide"
                    style={{ width: COL_DRIVER_WIDTH, left: COL_NO_WIDTH }}
                  >
                    {t("revenueRecap.colDriverName")}
                  </th>
                  <th
                    className="sticky top-0 z-30 whitespace-nowrap border-b-2 border-emerald-500 border-r border-r-zinc-300 bg-zinc-100 px-2 py-2.5 text-left font-semibold uppercase tracking-wide"
                    style={{ width: COL_PLATE_WIDTH, left: COL_NO_WIDTH + COL_DRIVER_WIDTH }}
                  >
                    {t("revenueRecap.colPlate")}
                  </th>
                  {Array.from({ length: data.daysInMonth }, (_, i) => i + 1).map((d) => (
                    <th
                      key={d}
                      className="sticky top-0 z-20 whitespace-nowrap border-b-2 border-emerald-500 border-l border-zinc-200 bg-zinc-100 px-2.5 py-2.5 text-right font-semibold"
                    >
                      {d}
                    </th>
                  ))}
                  <th className="sticky top-0 z-20 whitespace-nowrap border-b-2 border-l-2 border-emerald-500 bg-zinc-100 px-3 py-2.5 text-right font-semibold uppercase tracking-wide">
                    {t("revenueRecap.colRevenueAmount")}
                  </th>
                  <th className="sticky top-0 z-20 whitespace-nowrap border-b-2 border-l border-emerald-500 bg-zinc-100 px-3 py-2.5 text-right font-semibold uppercase tracking-wide">
                    {t("revenueRecap.geofencePenalty")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r, i) => {
                  const zebra = i % 2 === 0 ? "bg-white" : "bg-zinc-50/70";
                  return (
                    <tr key={`${r.vehiclePlate}-${i}`} className={clsx("group", zebra)}>
                      <td
                        className={clsx("sticky left-0 z-10 whitespace-nowrap border-b border-zinc-100 px-2 py-1.5 text-center text-zinc-500 group-hover:bg-emerald-50", zebra)}
                        style={{ width: COL_NO_WIDTH, left: 0 }}
                      >
                        {i + 1}
                      </td>
                      <td
                        className={clsx("sticky z-10 whitespace-nowrap border-b border-zinc-100 px-2 py-1.5 font-medium text-zinc-900 group-hover:bg-emerald-50", zebra)}
                        style={{ width: COL_DRIVER_WIDTH, left: COL_NO_WIDTH }}
                      >
                        {r.driverName}
                      </td>
                      <td
                        className={clsx("sticky z-10 whitespace-nowrap border-b border-r border-r-zinc-300 border-b-zinc-100 px-2 py-1.5 font-mono text-zinc-700 group-hover:bg-emerald-50", zebra)}
                        style={{ width: COL_PLATE_WIDTH, left: COL_NO_WIDTH + COL_DRIVER_WIDTH }}
                      >
                        {r.vehiclePlate}
                      </td>
                      {r.cells.map((cell) => {
                        const isLeave = cell.kind === "revenue" && !cell.amount;
                        const isPartial = cell.kind === "revenue" && cell.amount && cell.partial;
                        const style =
                          cell.kind === "idle"
                            ? { backgroundColor: "#FFF9C4" }
                            : cell.kind === "maintenance"
                              ? { backgroundColor: "#FFCC80" }
                              : isLeave
                                ? { backgroundColor: "#EF9A9A" }
                                : isPartial
                                  ? { backgroundColor: "#9E9D24", color: "white" }
                                  : undefined;
                        const baseTitle = isLeave ? t("revenueRecap.legendCuti") : cell.note;
                        return (
                          <RecapCell key={cell.day} style={style} title={baseTitle} violation={cell.violation}>
                            {cell.kind === "idle" && t("revenueRecap.legendIdle")}
                            {cell.kind === "maintenance" && t("revenueRecap.cellMaintenance")}
                            {cell.kind === "revenue" && (cell.amount ?? 0).toLocaleString("id-ID")}
                          </RecapCell>
                        );
                      })}
                      <td className="whitespace-nowrap border-b border-l-2 border-zinc-100 border-l-emerald-200 bg-emerald-50/40 px-3 py-1.5 text-right font-semibold tabular-nums text-emerald-800">
                        {formatRupiah(r.totalRevenue)}
                      </td>
                      <td className="whitespace-nowrap border-b border-l border-zinc-100 bg-violet-50/40 px-3 py-1.5 text-right font-semibold tabular-nums text-violet-700">
                        {r.totalKeluarKota ? formatRupiah(r.totalKeluarKota) : <span className="font-normal text-zinc-400">-</span>}
                      </td>
                    </tr>
                  );
                })}
                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={5 + data.daysInMonth} className="px-2 py-6 text-center text-zinc-400">
                      {t("revenueRecap.noData")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
