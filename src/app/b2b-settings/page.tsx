"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { AccountCategory, AccountType, TaxCode } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dropdown } from "@/components/ui/Dropdown";

const TYPE_LABEL_KEY: Record<AccountType, string> = {
  asset: "accounts.typeAsset",
  liability: "accounts.typeLiability",
  equity: "accounts.typeEquity",
  income: "accounts.typeIncome",
  expense: "accounts.typeExpense",
};

function CategoriesTab() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<AccountType>("asset");
  const [codeHint, setCodeHint] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.accountCategories(true).then(setCategories).catch(() => {});
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!label.trim()) return;
    const value = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    try {
      await api.createAccountCategory({ value, label: label.trim(), type, codeHint: codeHint.trim() || undefined });
      setLabel("");
      setCodeHint("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("b2bSettings.categories.errorSave"));
    }
  }

  async function toggleActive(category: AccountCategory) {
    await api.updateAccountCategory(category.id, { isActive: !category.isActive });
    load();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-4 sm:p-5">
        {error && <p className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <input
          required
          placeholder={t("b2bSettings.categories.addLabel")}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:col-span-2"
        />
        <Dropdown value={type} onChange={(v) => setType(v as AccountType)} options={Object.entries(TYPE_LABEL_KEY).map(([value, key]) => ({ value, label: t(key) }))} />
        <input
          placeholder={t("b2bSettings.categories.addCodeHint")}
          value={codeHint}
          onChange={(e) => setCodeHint(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 sm:col-span-4">
          {t("b2bSettings.categories.add")}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("b2bSettings.categories.colLabel")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bSettings.categories.colType")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bSettings.categories.colCodeHint")}</th>
              <th className="px-4 py-3 font-medium">{t("b2bSettings.categories.colStatus")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-zinc-50">
                <td className="px-4 py-2.5">{c.label}</td>
                <td className="px-4 py-2.5">{t(TYPE_LABEL_KEY[c.type])}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{c.codeHint ?? "-"}</td>
                <td className="px-4 py-2.5">
                  <span className={c.isActive ? "text-emerald-600" : "text-zinc-400"}>
                    {c.isActive ? t("b2bSettings.active") : t("b2bSettings.inactive")}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => toggleActive(c)} className="text-xs font-medium text-zinc-500 hover:underline">
                    {c.isActive ? t("b2bSettings.archive") : t("b2bSettings.unarchive")}
                  </button>
                </td>
              </tr>
            ))}
            {!categories.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  {t("b2bSettings.categories.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaxesTab() {
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

export default function B2bSettingsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"categories" | "taxes">("categories");

  return (
    <div>
      <PageHeader title={t("b2bSettings.title")} subtitle={t("b2bSettings.subtitle")} />

      <div className="mb-4 flex gap-1 border-b border-zinc-200">
        {(["categories", "taxes"] as const).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setTab(tabKey)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === tabKey ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tabKey === "categories" ? t("b2bSettings.tabCategories") : t("b2bSettings.tabTaxes")}
          </button>
        ))}
      </div>

      {tab === "categories" ? <CategoriesTab /> : <TaxesTab />}
    </div>
  );
}
