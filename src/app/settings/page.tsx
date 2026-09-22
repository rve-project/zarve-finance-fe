"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Account } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dropdown } from "@/components/ui/Dropdown";
import { useLanguage } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useLanguage();
  const [incomeAccounts, setIncomeAccounts] = useState<Account[]>([]);
  const [defaultIncomeAccountEvId, setDefaultIncomeAccountEvId] = useState<number | "">("");
  const [defaultIncomeAccountFuelId, setDefaultIncomeAccountFuelId] = useState<number | "">("");
  const [autoCreatePayment, setAutoCreatePayment] = useState(true);
  const [ppnEnabled, setPpnEnabled] = useState(false);
  const [ppnRate, setPpnRate] = useState(0.11);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([api.settings(), api.accounts("income")])
      .then(([settings, accounts]) => {
        setDefaultIncomeAccountEvId(settings.defaultIncomeAccountEvId ?? "");
        setDefaultIncomeAccountFuelId(settings.defaultIncomeAccountFuelId ?? "");
        setAutoCreatePayment(settings.autoCreatePayment);
        setPpnEnabled(settings.ppnEnabled);
        setPpnRate(settings.ppnRate);
        setIncomeAccounts(accounts);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("settings.loadError")))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateSettings({
        defaultIncomeAccountEvId: defaultIncomeAccountEvId === "" ? null : Number(defaultIncomeAccountEvId),
        defaultIncomeAccountFuelId: defaultIncomeAccountFuelId === "" ? null : Number(defaultIncomeAccountFuelId),
        autoCreatePayment,
        ppnEnabled,
        ppnRate,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("nav.pengaturan")} subtitle={t("settings.subtitle")} />

      {loading ? (
        <p className="text-sm text-zinc-400">{t("settings.loading")}</p>
      ) : (
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {saved && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{t("settings.saved")}</p>}

          <section className="relative z-40 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="mb-1 text-sm font-semibold text-zinc-800">{t("settings.incomeAccountSectionTitle")}</h2>
            <p className="mb-3 text-xs text-zinc-500">{t("settings.incomeAccountDesc")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-zinc-600">{t("settings.evVehicleLabel")}</span>
                <Dropdown
                  value={defaultIncomeAccountEvId === "" ? "" : String(defaultIncomeAccountEvId)}
                  onChange={(v) => setDefaultIncomeAccountEvId(v === "" ? "" : Number(v))}
                  options={[{ value: "", label: t("settings.useSystemDefault") }, ...incomeAccounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))]}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-zinc-600">{t("settings.fuelVehicleLabel")}</span>
                <Dropdown
                  value={defaultIncomeAccountFuelId === "" ? "" : String(defaultIncomeAccountFuelId)}
                  onChange={(v) => setDefaultIncomeAccountFuelId(v === "" ? "" : Number(v))}
                  options={[{ value: "", label: t("settings.useSystemDefault") }, ...incomeAccounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))]}
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800">{t("settings.syncOptionsTitle")}</h2>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={autoCreatePayment}
                onChange={(e) => setAutoCreatePayment(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300"
              />
              <span className="text-sm">
                <span className="block font-medium text-zinc-800">{t("settings.autoCreatePaymentLabel")}</span>
                <span className="block text-xs text-zinc-500">{t("settings.autoCreatePaymentDesc")}</span>
              </span>
            </label>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800">{t("settings.ppnSectionTitle")}</h2>
            <label className="mb-3 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={ppnEnabled}
                onChange={(e) => setPpnEnabled(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300"
              />
              <span className="text-sm">
                <span className="block font-medium text-zinc-800">{t("settings.ppnEnableLabel")}</span>
                <span className="block text-xs text-zinc-500">{t("settings.ppnEnableDesc")}</span>
              </span>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">{t("settings.ppnRateLabel")}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  disabled={!ppnEnabled}
                  value={ppnRate}
                  onChange={(e) => setPpnRate(Number(e.target.value))}
                  className="w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
                />
                <span className="text-sm text-zinc-500">({(ppnRate * 100).toFixed(0)}%)</span>
              </div>
            </label>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? t("settings.saving") : t("settings.savePengaturan")}
          </button>
        </form>
      )}
    </div>
  );
}
