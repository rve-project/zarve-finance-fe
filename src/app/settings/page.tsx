"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Account, Bank, FixedAssetTypeOption, PaymentTerm, TaxCode } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dropdown } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { useLanguage } from "@/lib/i18n";
import { useForceBusinessUnit } from "@/lib/business-unit";

// Taxes are B2B-only (see migration 017_account_categories_and_taxes.sql -- Zarve's
// plain accounts page and its WELL_KNOWN_ACCOUNTS convention don't use them), so this
// tab quietly switches the business unit to b2b for as long as it's mounted.
interface ComponentDraft {
  taxId: string;
  sign: "add" | "subtract";
}

function emptyComponent(): ComponentDraft {
  return { taxId: "", sign: "add" };
}

function TaxesTab() {
  useForceBusinessUnit("b2b");
  const { t } = useLanguage();
  const [taxes, setTaxes] = useState<TaxCode[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [taxMode, setTaxMode] = useState<"simple" | "compound">("simple");
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [components, setComponents] = useState<ComponentDraft[]>([emptyComponent(), emptyComponent()]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  function load() {
    api.taxes(true).then(setTaxes).catch(() => {});
    api.accounts().then(setAccounts).catch(() => {});
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pageTaxes = taxes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const accountOptions = accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }));
  const simpleTaxOptions = taxes.filter((tx) => !tx.isCompound && tx.isActive).map((tx) => ({ value: String(tx.id), label: `${tx.name} (${tx.rate}%)` }));

  const netRatePreview = components.reduce((sum, c) => {
    const tx = taxes.find((t) => String(t.id) === c.taxId);
    if (!tx) return sum;
    return sum + (c.sign === "subtract" ? -1 : 1) * tx.rate;
  }, 0);

  function updateComponent(i: number, patch: Partial<ComponentDraft>) {
    setComponents((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function resetForm() {
    setName("");
    setRate("");
    setAccountId("");
    setComponents([emptyComponent(), emptyComponent()]);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    try {
      if (taxMode === "compound") {
        const validComponents = components.filter((c) => c.taxId);
        if (validComponents.length < 2) {
          setError(t("b2bSettings.taxes.errorCompoundMinComponents"));
          return;
        }
        await api.createTax({
          name: name.trim(),
          isCompound: true,
          components: validComponents.map((c) => ({ taxId: Number(c.taxId), sign: c.sign })),
        });
      } else {
        if (rate === "") return;
        await api.createTax({ name: name.trim(), rate: Number(rate), accountId: accountId ? Number(accountId) : undefined });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("b2bSettings.taxes.errorSave"));
    }
  }

  async function toggleActive(tax: TaxCode) {
    await api.updateTax(tax.id, { isActive: !tax.isActive });
    load();
  }

  async function changeAccount(tax: TaxCode, newAccountId: string) {
    await api.updateTax(tax.id, { accountId: newAccountId ? Number(newAccountId) : undefined });
    load();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 text-sm">
          {(["simple", "compound"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTaxMode(mode)}
              className={`rounded-lg border px-3 py-1.5 font-medium transition-colors ${
                taxMode === mode ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {mode === "simple" ? t("b2bSettings.taxes.modeSimple") : t("b2bSettings.taxes.modeCompound")}
            </button>
          ))}
        </div>

        {taxMode === "simple" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
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
            <Dropdown value={accountId} onChange={setAccountId} options={accountOptions} placeholder={t("b2bSettings.taxes.addAccount")} />
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              {t("b2bSettings.taxes.add")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              required
              placeholder={t("b2bSettings.taxes.addCompoundNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
            <div className="space-y-2">
              {components.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex shrink-0 overflow-hidden rounded-lg border border-zinc-200">
                    {(["add", "subtract"] as const).map((sign) => (
                      <button
                        key={sign}
                        type="button"
                        onClick={() => updateComponent(i, { sign })}
                        className={`px-2.5 py-2 text-xs font-semibold transition-colors ${
                          c.sign === sign ? "bg-emerald-600 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"
                        }`}
                      >
                        {sign === "add" ? "+" : "−"}
                      </button>
                    ))}
                  </div>
                  <Dropdown
                    value={c.taxId}
                    onChange={(v) => updateComponent(i, { taxId: v })}
                    options={simpleTaxOptions}
                    placeholder={t("b2bSettings.taxes.addComponentPlaceholder")}
                    className="flex-1"
                  />
                  {components.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setComponents((prev) => prev.filter((_, idx) => idx !== i))}
                      className="shrink-0 text-xs font-medium text-zinc-400 hover:text-red-600"
                    >
                      {t("b2bSettings.taxes.removeComponent")}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setComponents((prev) => [...prev, emptyComponent()])} className="text-xs font-semibold text-emerald-600 hover:underline">
                {t("b2bSettings.taxes.addComponent")}
              </button>
              <p className="text-xs text-zinc-500">
                {t("b2bSettings.taxes.netRatePreview")}: <span className="font-semibold text-zinc-700">{netRatePreview}%</span>
              </p>
            </div>
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              {t("b2bSettings.taxes.add")}
            </button>
          </div>
        )}
      </form>
      <p className="mb-4 text-xs text-zinc-400">{t("b2bSettings.taxes.addAccountHint")}</p>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("b2bSettings.taxes.colName")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("b2bSettings.taxes.colRate")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bSettings.taxes.colAccount")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bSettings.taxes.colStatus")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pageTaxes.map((tax) => (
              <tr key={tax.id} className="border-b border-zinc-50">
                <td className="px-4 py-2.5">
                  <span>{tax.name}</span>
                  {tax.isCompound && (
                    <span className="ml-2 inline-block rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                      {t("b2bSettings.taxes.modeCompound")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">{tax.rate}%</td>
                <td className="px-4 py-2.5">
                  {tax.isCompound ? (
                    <p className="text-xs text-zinc-500">
                      {tax.components.map((c) => `${c.name} (${c.sign === "subtract" ? "−" : "+"}${c.rate}%)`).join(", ")}
                    </p>
                  ) : (
                    <Dropdown
                      value={tax.accountId ? String(tax.accountId) : ""}
                      onChange={(v) => changeAccount(tax, v)}
                      options={accountOptions}
                      placeholder={t("b2bSettings.taxes.addAccount")}
                    />
                  )}
                </td>
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
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  {t("b2bSettings.taxes.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} limit={PAGE_SIZE} total={taxes.length} onChange={setPage} itemLabel={t("b2bSettings.taxes.itemLabel")} />
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

function PaymentTermsTab() {
  useForceBusinessUnit("b2b");
  const { t } = useLanguage();
  const [terms, setTerms] = useState<PaymentTerm[]>([]);
  const [name, setName] = useState("");
  const [days, setDays] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.paymentTerms(true).then(setTerms).catch(() => {});
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    try {
      await api.createPaymentTerm({ name: name.trim(), days: days === "" ? null : Number(days) });
      setName("");
      setDays("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("b2bSettings.paymentTerms.errorSave"));
    }
  }

  async function toggleActive(term: PaymentTerm) {
    await api.updatePaymentTerm(term.id, { isActive: !term.isActive });
    load();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-4 sm:p-5">
        {error && <p className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <input
          required
          placeholder={t("b2bSettings.paymentTerms.addName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          type="number"
          min={0}
          placeholder={t("b2bSettings.paymentTerms.addDays")}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          {t("b2bSettings.paymentTerms.add")}
        </button>
      </form>
      <p className="mb-4 text-xs text-zinc-400">{t("b2bSettings.paymentTerms.addDaysHint")}</p>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("b2bSettings.paymentTerms.colName")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bSettings.paymentTerms.colDays")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bSettings.paymentTerms.colStatus")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {terms.map((term) => (
              <tr key={term.id} className="border-b border-zinc-50">
                <td className="px-4 py-2.5">{term.name}</td>
                <td className="px-4 py-2.5 text-zinc-500">{term.days === null ? t("b2bSettings.paymentTerms.custom") : term.days}</td>
                <td className="px-4 py-2.5">
                  <span className={term.isActive ? "text-emerald-600" : "text-zinc-400"}>
                    {term.isActive ? t("b2bSettings.active") : t("b2bSettings.inactive")}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => toggleActive(term)} className="text-xs font-medium text-zinc-500 hover:underline">
                    {term.isActive ? t("b2bSettings.archive") : t("b2bSettings.unarchive")}
                  </button>
                </td>
              </tr>
            ))}
            {!terms.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  {t("b2bSettings.paymentTerms.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FixedAssetTypesTab() {
  useForceBusinessUnit("b2b");
  const { t } = useLanguage();
  const [types, setTypes] = useState<FixedAssetTypeOption[]>([]);
  const [name, setName] = useState("");
  const [requiresPlateNumber, setRequiresPlateNumber] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.fixedAssetTypes(true).then(setTypes).catch(() => {});
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    try {
      await api.createFixedAssetType({ name: name.trim(), requiresPlateNumber });
      setName("");
      setRequiresPlateNumber(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("b2bSettings.fixedAssetTypes.errorSave"));
    }
  }

  async function toggleActive(type: FixedAssetTypeOption) {
    await api.updateFixedAssetType(type.id, { isActive: !type.isActive });
    load();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-4 sm:p-5">
        {error && <p className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <input
          required
          placeholder={t("b2bSettings.fixedAssetTypes.addName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:col-span-2"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={requiresPlateNumber}
            onChange={(e) => setRequiresPlateNumber(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          {t("b2bSettings.fixedAssetTypes.addRequiresPlateNumber")}
        </label>
        <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          {t("b2bSettings.fixedAssetTypes.add")}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("b2bSettings.fixedAssetTypes.colName")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bSettings.fixedAssetTypes.colPlateNumber")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bSettings.fixedAssetTypes.colStatus")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <tr key={type.id} className="border-b border-zinc-50">
                <td className="px-4 py-2.5">{type.name}</td>
                <td className="px-4 py-2.5 text-zinc-500">{type.requiresPlateNumber ? t("b2bSettings.yes") : t("b2bSettings.no")}</td>
                <td className="px-4 py-2.5">
                  <span className={type.isActive ? "text-emerald-600" : "text-zinc-400"}>
                    {type.isActive ? t("b2bSettings.active") : t("b2bSettings.inactive")}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => toggleActive(type)} className="text-xs font-medium text-zinc-500 hover:underline">
                    {type.isActive ? t("b2bSettings.archive") : t("b2bSettings.unarchive")}
                  </button>
                </td>
              </tr>
            ))}
            {!types.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  {t("b2bSettings.fixedAssetTypes.empty")}
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
  const [tab, setTab] = useState<"general" | "taxes" | "banks" | "paymentTerms" | "fixedAssetTypes">("general");

  const TAB_LABEL_KEY = {
    general: "settings.tabUmum",
    taxes: "b2bSettings.tabTaxes",
    banks: "b2bSettings.tabBanks",
    paymentTerms: "b2bSettings.tabPaymentTerms",
    fixedAssetTypes: "b2bSettings.tabFixedAssetTypes",
  } as const;

  return (
    <div>
      <PageHeader title={t("nav.pengaturan")} subtitle={t("settings.subtitle")} />

      <div className="mb-4 flex gap-1 border-b border-zinc-200">
        {(["general", "taxes", "banks", "paymentTerms", "fixedAssetTypes"] as const).map((tabKey) => (
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
      {tab === "paymentTerms" && <PaymentTermsTab />}
      {tab === "fixedAssetTypes" && <FixedAssetTypesTab />}
    </div>
  );
}
