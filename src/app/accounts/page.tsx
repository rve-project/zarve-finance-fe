"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Account, AccountType } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Dropdown } from "@/components/ui/Dropdown";

const LIMIT = 20;

const TYPE_LABEL_KEY: Record<AccountType, string> = {
  asset: "accounts.typeAsset",
  liability: "accounts.typeLiability",
  equity: "accounts.typeEquity",
  income: "accounts.typeIncome",
  expense: "accounts.typeExpense",
};

export default function AccountsPage() {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("expense");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  function load() {
    api.accounts().then(setAccounts).catch(() => {});
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createAccount({ code, name, type });
      setCode("");
      setName("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("accounts.errorSave"));
    }
  }

  // Fixed-size master data (chart of accounts, not a growing transactional list) --
  // paginated client-side rather than adding server-side page/limit plumbing.
  const pageItems = accounts.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div>
      <PageHeader
        title={t("accounts.title")}
        subtitle={t("accounts.subtitle")}
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {showForm ? t("accounts.cancel") : t("accounts.addAccount")}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleCreate} className="relative z-40 mb-6 grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-4">
          {error && <p className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <input
            required
            placeholder={t("accounts.codePlaceholder")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder={t("accounts.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:col-span-2"
          />
          <Dropdown
            value={type}
            onChange={(v) => setType(v as AccountType)}
            options={Object.entries(TYPE_LABEL_KEY).map(([value, labelKey]) => ({ value, label: t(labelKey) }))}
          />
          <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            {t("accounts.save")}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("accounts.colCode")}</th>
              <th className="px-4 py-3 font-medium">{t("accounts.colName")}</th>
              <th className="px-4 py-3 font-medium">{t("accounts.colType")}</th>
              <th className="px-4 py-3 font-medium">{t("accounts.colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((a) => (
              <tr key={a.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-2.5 font-mono text-xs">{a.code}</td>
                <td className="px-4 py-2.5">{a.name}</td>
                <td className="px-4 py-2.5">{t(TYPE_LABEL_KEY[a.type])}</td>
                <td className="px-4 py-2.5">
                  <span className={a.isActive ? "text-emerald-600" : "text-zinc-400"}>
                    {a.isActive ? t("accounts.active") : t("accounts.inactive")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={LIMIT} total={accounts.length} onChange={setPage} itemLabel={t("accounts.itemLabel")} />
    </div>
  );
}
