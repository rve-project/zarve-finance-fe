"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Vehicle } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";

const LIMIT = 20;

export default function VehiclesPage() {
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.vehicles().then(setVehicles).catch(() => {});
  }, []);

  // Master data bounded by fleet size (a couple hundred vehicles at most) -- paginated
  // client-side rather than adding server-side page/limit plumbing for a dataset this
  // small and non-growing.
  const pageItems = vehicles.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div>
      <PageHeader title={t("vehicles.title")} subtitle={t("vehicles.subtitle")} />

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("vehicles.colPlate")}</th>
              <th className="px-4 py-3 font-medium">{t("vehicles.colName")}</th>
              <th className="px-4 py-3 font-medium">{t("vehicles.colCategory")}</th>
              <th className="px-4 py-3 font-medium">{t("vehicles.colBranch")}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((v) => (
              <tr key={v.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-2.5 font-mono text-xs">{v.platNumber}</td>
                <td className="px-4 py-2.5 font-medium text-zinc-900">{v.name}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      v.category === "ev" ? "rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700" : "rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                    }
                  >
                    {v.category === "ev" ? t("vehicles.categoryEv") : t("vehicles.categoryFuel")}
                  </span>
                </td>
                <td className="px-4 py-2.5">{v.branch ?? "-"}</td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  {t("vehicles.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={LIMIT} total={vehicles.length} onChange={setPage} itemLabel={t("vehicles.itemLabel")} />
    </div>
  );
}
