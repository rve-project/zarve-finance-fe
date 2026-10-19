"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Vehicle } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { EditVehicleAccountModal } from "@/components/ui/EditVehicleAccountModal";

const LIMIT = 20;

export default function VehiclesPage() {
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [page, setPage] = useState(1);
  // id -> "code - name", for both income and liability accounts -- a vehicle's
  // incomeAccountId can point to either (see EditVehicleAccountModal's doc comment).
  const [accountLabels, setAccountLabels] = useState<Map<number, string>>(new Map());
  const [editing, setEditing] = useState<Vehicle | null>(null);

  function loadAccountLabels() {
    Promise.all([api.accounts("income"), api.accounts("liability")])
      .then(([income, liability]) => {
        const map = new Map<number, string>();
        for (const a of [...income, ...liability]) map.set(a.id, `${a.code} - ${a.name}`);
        setAccountLabels(map);
      })
      .catch(() => {});
  }

  useEffect(() => {
    api.vehicles().then(setVehicles).catch(() => {});
    loadAccountLabels();
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
              <th className="px-4 py-3 font-medium">{t("vehicles.colAccount")}</th>
              <th className="px-4 py-3 font-medium" />
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
                <td className="px-4 py-2.5 text-zinc-600">
                  {v.incomeAccountId ? accountLabels.get(v.incomeAccountId) ?? "-" : t("vehicles.accountDefault")}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => setEditing(v)}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t("vehicles.editAccountButton")}
                  </button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                  {t("vehicles.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={LIMIT} total={vehicles.length} onChange={setPage} itemLabel={t("vehicles.itemLabel")} />

      {editing && (
        <EditVehicleAccountModal
          vehicle={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
            loadAccountLabels();
          }}
        />
      )}
    </div>
  );
}
