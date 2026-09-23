"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ContactType } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Dropdown } from "@/components/ui/Dropdown";

function NewContactPageInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");

  const [type, setType] = useState<ContactType>(
    initialType === "vendor" || initialType === "employee" || initialType === "other" ? initialType : "customer"
  );
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [phone, setPhone] = useState("");
  const [npwp, setNpwp] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createContact({
        type,
        name,
        companyName: companyName || undefined,
        address: address || undefined,
        email: email || undefined,
        mobilePhone: mobilePhone || undefined,
        phone: phone || undefined,
        npwp: npwp || undefined,
        notes: notes || undefined,
      });
      router.push("/b2b-contacts");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("contacts.new.errorSave"));
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumb items={[{ label: t("contacts.title"), href: "/b2b-contacts" }, { label: t("contacts.new.title") }]} />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{t("contacts.new.title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.type")} *</span>
          <Dropdown
            value={type}
            onChange={(v) => setType(v as ContactType)}
            options={[
              { value: "customer", label: t("contacts.tabCustomer") },
              { value: "vendor", label: t("contacts.tabVendor") },
              { value: "employee", label: t("contacts.tabEmployee") },
              { value: "other", label: t("contacts.tabOther") },
            ]}
          />
        </label>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.name")} *</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.company")}</span>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.email")}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.npwp")}</span>
            <input value={npwp} onChange={(e) => setNpwp(e.target.value)} className={inputClass} />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.mobilePhone")}</span>
            <input value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.phone")}</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.address")}</span>
          <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputClass} resize-none`} />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.notes")}</span>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-none`} />
        </label>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/b2b-contacts" className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            {t("contacts.new.cancel")}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? t("contacts.new.saving") : t("contacts.new.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewContactPage() {
  return (
    <Suspense fallback={null}>
      <NewContactPageInner />
    </Suspense>
  );
}
