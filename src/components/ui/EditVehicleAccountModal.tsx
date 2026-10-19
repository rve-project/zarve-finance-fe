"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Vehicle } from "@/lib/types";
import { Dropdown } from "./Dropdown";

interface EditVehicleAccountModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSaved: (vehicle: Vehicle) => void;
}

/**
 * Lets a vehicle's revenue-posting account be overridden beyond the EV/Fuel default
 * picked at creation time (see vehicles.controller.ts's `update`, which already accepts
 * ANY account id with no type check). Offers both income accounts (e.g. a vehicle model
 * that needs its own dedicated revenue line, like "Pendapatan Sewa Innova") and
 * liability accounts (a vehicle owned by a third-party agent under a consignment
 * arrangement, where collected rent is owed back to them, not RVE's own revenue --
 * e.g. "Utang Pihak Ketiga - CV ..."). zarveSync reads this column directly when
 * posting a NEW invoice, so a change here only affects future postings, never
 * retroactively reprocesses already-posted journal entries.
 */
export function EditVehicleAccountModal({ vehicle, onClose, onSaved }: EditVehicleAccountModalProps) {
  const { t } = useLanguage();
  const [accountId, setAccountId] = useState(vehicle.incomeAccountId ? String(vehicle.incomeAccountId) : "");
  const [options, setOptions] = useState<{ value: string; label: string; description?: string }[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.accounts("income"), api.accounts("liability")])
      .then(([income, liability]) => {
        setOptions([
          ...income.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}`, description: t("vehicles.accountTypeIncome") })),
          ...liability.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}`, description: t("vehicles.accountTypeLiability") })),
        ]);
      })
      .catch(() => {})
      .finally(() => setLoadingAccounts(false));
  }, [t]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const updated = await api.updateVehicle(vehicle.id, { incomeAccountId: accountId === "" ? null : Number(accountId) });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("vehicles.editAccountError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{t("vehicles.editAccountTitle")}</h2>
            <p className="text-xs text-zinc-500">{vehicle.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("vehicles.editAccountLabel")}</span>
            <Dropdown
              value={accountId}
              onChange={setAccountId}
              loading={loadingAccounts}
              clearable
              placeholder={t("vehicles.editAccountDefaultPlaceholder")}
              options={options}
            />
            <span className="mt-1.5 block text-xs text-zinc-400">{t("vehicles.editAccountHint")}</span>
          </label>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
              {t("quickAdd.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? t("quickAdd.saving") : t("quickAdd.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
