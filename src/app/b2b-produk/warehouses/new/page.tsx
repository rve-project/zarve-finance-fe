"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ManagedUser } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { HelpHint } from "@/components/ui/HelpHint";
import { MultiSelect } from "@/components/ui/MultiSelect";

const NAME_MAX_LENGTH = 255;
const MAX_PICS = 5;

export default function NewWarehousePage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [picUserIds, setPicUserIds] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.users().then(setUsers).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createWarehouse({
        name,
        code: code || undefined,
        picUserIds: picUserIds.length ? picUserIds.map(Number) : undefined,
        address: address || undefined,
        notes: notes || undefined,
      });
      router.push("/b2b-produk");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("produk.warehouseForm.errorSave"));
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumb items={[{ label: t("produk.title"), href: "/b2b-produk" }, { label: t("produk.warehouseForm.title") }]} />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{t("produk.warehouseForm.title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <label className="block text-sm">
          <span className="mb-1.5 flex items-center justify-between">
            <span className="font-medium text-zinc-700">
              {t("produk.warehouseForm.name")} <span className="text-red-500">*</span>
            </span>
            <span className="text-xs text-zinc-400">
              {name.length}/{NAME_MAX_LENGTH}
            </span>
          </span>
          <input required maxLength={NAME_MAX_LENGTH} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.warehouseForm.code")}</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("produk.warehouseForm.codePlaceholder")} className={inputClass} />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
            {t("produk.warehouseForm.pic")} ({picUserIds.length}/{MAX_PICS}) <HelpHint text={t("produk.warehouseForm.picHint")} />
          </span>
          <MultiSelect
            values={picUserIds}
            onChange={setPicUserIds}
            max={MAX_PICS}
            placeholder={t("produk.warehouseForm.picPlaceholder")}
            options={users.map((u) => ({ value: String(u.id), label: u.name, sublabel: u.email }))}
          />
          <span className="mt-1.5 block text-xs text-zinc-400">{t("produk.warehouseForm.picHint")}</span>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.warehouseForm.address")}</span>
          <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputClass} resize-none`} />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.warehouseForm.notes")}</span>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-none`} />
        </label>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/b2b-produk" className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            {t("produk.warehouseForm.cancel")}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? t("produk.warehouseForm.saving") : t("produk.warehouseForm.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
