"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Account, Bank, TaxCode } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dropdown } from "@/components/ui/Dropdown";
import { useLanguage } from "@/lib/i18n";
import { useForceBusinessUnit } from "@/lib/business-unit";

// Taxes are B2B-only (see migration 017_account_categories_and_taxes.sql -- Zarve's
// plain accounts page and its WELL_KNOWN_ACCOUNTS convention don't use them), so this
// tab quietly switches the business unit to b2b for as long as it's mounted.
function TaxesTab() {
  useForceBusinessUnit("b2b");
  const { t } = useLanguage();
  const [taxes, setTaxes] = useState<TaxCode[]>([]);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.taxes(true).then(setTaxes).catch(() => {});
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || rate === "") return;
    try {
      await api.createTax({ name: name.trim(), rate: Number(rate) });
      setName("");
      setRate("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("b2bSettings.taxes.errorSave"));
    }
  }

  async function toggleActive(tax: TaxCode) {
    await api.updateTax(tax.id, { isActive: !tax.isActive });
    load();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-4 sm:p-5">
        {error && <p className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <input
          required
          placeholder={t("b2bSettings.taxes.addName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          required
          type="number"
          step="0.01"
          min={0}
          placeholder={t("b2bSettings.taxes.addRate")}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          {t("b2bSettings.taxes.add")}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("b2bSettings.taxes.colName")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("b2bSettings.taxes.colRate")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bSettings.taxes.colStatus")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {taxes.map((tax) => (
              <tr key={tax.id} className="border-b border-zinc-50">
                <td className="px-4 py-2.5">{tax.name}</td>
                <td className="px-4 py-2.5 text-right">{tax.rate}%</td>
                <td className="px-4 py-2.5">
                  <span className={tax.isActive ? "text-emerald-600" : "text-zinc-400"}>
                    {tax.isActive ? t("b2bSettings.active") : t("b2bSettings.inactive")}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => toggleActive(tax)} className="text-xs font-medium text-zinc-500 hover:underline">
                    {tax.isActive ? t("b2bSettings.archive") : t("b2bSettings.unarchive")}
                  </button>
                </td>
              </tr>
            ))}
            {!taxes.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  {t("b2bSettings.taxes.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Banks are B2B-only (the "Nama bank" picker only shows up for Kas & Bank accounts on
// that business's create-account form), so this tab quietly switches the business unit
// to b2b for as long as it's mounted, same reasoning as TaxesTab above.
function BanksTab() {
  useForceBusinessUnit("b2b");
  const { t } = useLanguage();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.banks(true).then(setBanks).catch(() => {});
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    try {
      await api.createBank({ name: name.trim() });
      setName("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("b2bSettings.banks.errorSave"));
    }
  }

  async function toggleActive(bank: Bank) {
    await api.updateBank(bank.id, { isActive: !bank.isActive });
    load();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-4 sm:p-5">
        {error && <p className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <input
          required
          placeholder={t("b2bSettings.banks.addName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:col-span-3"
        />
        <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          {t("b2bSettings.banks.add")}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("b2bSettings.banks.colName")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bSettings.banks.colStatus")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {banks.map((bank) => (
              <tr key={bank.id} className="border-b border-zinc-50">
                <td className="px-4 py-2.5">{bank.name}</td>
                <td className="px-4 py-2.5">
                  <span className={bank.isActive ? "text-emerald-600" : "text-zinc-400"}>
                    {bank.isActive ? t("b2bSettings.active") : t("b2bSettings.inactive")}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => toggleActive(bank)} className="text-xs font-medium text-zinc-500 hover:underline">
                    {bank.isActive ? t("b2bSettings.archive") : t("b2bSettings.unarchive")}
                  </button>
                </td>
              </tr>
            ))}
            {!banks.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
                  {t("b2bSettings.banks.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GeneralTab() {
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

export default function SettingsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"general" | "taxes" | "banks">("general");

  const TAB_LABEL_KEY = {
    general: "settings.tabUmum",
    taxes: "b2bSettings.tabTaxes",
    banks: "b2bSettings.tabBanks",
  } as const;

  return (
    <div>
      <PageHeader title={t("nav.pengaturan")} subtitle={t("settings.subtitle")} />

      <div className="mb-4 flex gap-1 border-b border-zinc-200">
        {(["general", "taxes", "banks"] as const).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setTab(tabKey)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === tabKey ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t(TAB_LABEL_KEY[tabKey])}
          </button>
        ))}
      </div>

      {tab === "general" && <GeneralTab />}
      {tab === "taxes" && <TaxesTab />}
      {tab === "banks" && <BanksTab />}
    </div>
  );
}
