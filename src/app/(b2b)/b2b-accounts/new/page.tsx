"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Account, AccountAccessMode, AccountCategory, Bank, ManagedUser, TaxCode } from "@/lib/types";
import { Dropdown } from "@/components/ui/Dropdown";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { HelpHint } from "@/components/ui/HelpHint";

function SectionHeading({ icon: Icon, title }: { icon: typeof FileText; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>
    </div>
  );
}

export default function NewB2bAccountPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [isSubAccount, setIsSubAccount] = useState(false);
  const [parentId, setParentId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankName, setBankName] = useState<string>("");
  const [taxes, setTaxes] = useState<TaxCode[]>([]);
  const [taxId, setTaxId] = useState<string>("");
  const [accessMode, setAccessMode] = useState<AccountAccessMode>("all");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [accessUserIds, setAccessUserIds] = useState<Set<number>>(new Set());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.accounts().then(setAccounts).catch(() => {});
    api.taxes().then(setTaxes).catch(() => {});
    api.banks().then(setBanks).catch(() => {});
    api.users().then(setUsers).catch(() => {});
    api.accountCategories().then((list) => {
      setCategories(list);
      if (list.length) setCategoryId(String(list[0].id));
    });
  }, []);

  const category = categories.find((c) => String(c.id) === categoryId);

  function toggleAccessUser(id: number) {
    setAccessUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createAccount({
        name,
        code,
        categoryId: categoryId ? Number(categoryId) : undefined,
        parentId: isSubAccount && parentId ? Number(parentId) : undefined,
        description: description || undefined,
        bankName: category?.value === "cash_bank" && bankName ? bankName : undefined,
        taxId: taxId ? Number(taxId) : undefined,
        accessMode,
        accessUserIds: accessMode === "some" ? Array.from(accessUserIds) : undefined,
      });
      router.push("/b2b-accounts");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("b2bAccounts.new.errorSave"));
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumb items={[{ label: t("b2bAccounts.new.breadcrumb"), href: "/b2b-accounts" }, { label: t("b2bAccounts.new.title") }]} />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{t("b2bAccounts.new.title")}</h1>

      <form onSubmit={handleSubmit}>
        {error && <p className="mb-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionHeading icon={FileText} title={t("b2bAccounts.new.sectionInfo")} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("b2bAccounts.new.name")} *</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("b2bAccounts.new.code")}</span>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={category?.codeHint ?? undefined}
                className={inputClass}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("b2bAccounts.new.category")}</span>
              <Dropdown value={categoryId} onChange={setCategoryId} options={categories.map((c) => ({ value: String(c.id), label: c.label }))} />
            </label>

            {category?.value === "cash_bank" && (
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-700">{t("b2bAccounts.new.bankName")}</span>
                <Dropdown
                  value={bankName}
                  onChange={setBankName}
                  options={banks.map((b) => ({ value: b.name, label: b.name }))}
                  placeholder={t("b2bAccounts.new.bankNamePlaceholder")}
                />
              </label>
            )}

            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isSubAccount}
                  onChange={(e) => setIsSubAccount(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-zinc-700">{t("b2bAccounts.new.isSubAccount")}</span>
                <HelpHint text={t("b2bAccounts.new.hint.isSubAccount")} />
              </label>

              {isSubAccount && (
                <div className="mt-3 ml-6 border-l-2 border-emerald-100 pl-4">
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-zinc-700">{t("b2bAccounts.new.parentAccount")}</span>
                    <Dropdown
                      value={parentId}
                      onChange={setParentId}
                      options={accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))}
                    />
                  </label>
                </div>
              )}
            </div>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("b2bAccounts.new.tax")}</span>
              <Dropdown
                value={taxId}
                onChange={setTaxId}
                placeholder={t("b2bAccounts.new.taxPlaceholder")}
                options={taxes.map((tax) => ({ value: String(tax.id), label: `${tax.name} (${tax.rate}%)` }))}
              />
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("b2bAccounts.new.description")}</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("b2bAccounts.new.descriptionPlaceholder")}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionHeading icon={ShieldCheck} title={t("b2bAccounts.new.sectionAccess")} />

          <p className="mb-3 text-sm font-medium text-zinc-700">{t("b2bAccounts.new.accessLabel")}</p>
          <div className="grid grid-cols-1 gap-3">
            {(["all", "some"] as const).map((mode) => (
              <label
                key={mode}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  accessMode === mode ? "border-emerald-500 bg-emerald-50/60" : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <input
                  type="radio"
                  checked={accessMode === mode}
                  onChange={() => setAccessMode(mode)}
                  className="mt-0.5 h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-zinc-800">{t(`b2bAccounts.new.access${mode === "all" ? "All" : "Some"}`)}</span>
              </label>
            ))}
          </div>

          {accessMode === "some" && (
            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
              <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <UsersIcon className="h-3.5 w-3.5" />
                {t("b2bAccounts.new.accessLabel")}
              </div>
              <div className="max-h-56 divide-y divide-zinc-50 overflow-y-auto">
                {users.map((u) => (
                  <label key={u.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={accessUserIds.has(u.id)}
                      onChange={() => toggleAccessUser(u.id)}
                      className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                      {u.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      <span className="font-medium text-zinc-800">{u.name}</span>{" "}
                      <span className="text-zinc-400">({u.email})</span>
                    </span>
                  </label>
                ))}
                {!users.length && <p className="px-4 py-3 text-sm text-zinc-400">{t("common.loading")}</p>}
              </div>
            </div>
          )}
        </section>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Link href="/b2b-accounts" className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            {t("b2bAccounts.new.cancel")}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? t("b2bAccounts.new.saving") : t("b2bAccounts.new.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
