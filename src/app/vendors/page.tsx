"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Partner } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";

const LIMIT = 20;

export default function VendorsPage() {
  const { t } = useLanguage();
  const [vendors, setVendors] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load(p = 1) {
    setLoading(true);
    api
      .partners({ type: "vendor", page: p, limit: LIMIT })
      .then((res) => {
        setVendors(res.data);
        setTotal(res.total);
        setPage(res.page);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createPartner({ name, type: "vendor", phone: phone || undefined, email: email || undefined, notes: notes || undefined });
      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setShowForm(false);
      load(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("vendors.errorSaving"));
    }
  }

  return (
    <div>
      <PageHeader
        title={t("vendors.title")}
        subtitle={t("vendors.subtitle")}
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {showForm ? t("vendors.cancel") : t("vendors.addVendor")}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-4">
          {error && <p className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <input
            required
            placeholder={t("vendors.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:col-span-2"
          />
          <input placeholder={t("vendors.phonePlaceholder")} value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <input placeholder={t("vendors.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <input
            placeholder={t("vendors.notesPlaceholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:col-span-3"
          />
          <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            {t("vendors.save")}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("vendors.colName")}</th>
              <th className="px-4 py-3 font-medium">{t("vendors.colPhone")}</th>
              <th className="px-4 py-3 font-medium">{t("vendors.colEmail")}</th>
              <th className="px-4 py-3 font-medium">{t("vendors.colNotes")}</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-2.5 font-medium text-zinc-900">
                  <Link href={`/partners/${v.id}`} className="hover:text-emerald-600 hover:underline">
                    {v.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{v.phone ?? "-"}</td>
                <td className="px-4 py-2.5">{v.email ?? "-"}</td>
                <td className="px-4 py-2.5 text-zinc-500">{v.notes ?? "-"}</td>
              </tr>
            ))}
            {!loading && vendors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  {t("vendors.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={LIMIT} total={total} onChange={load} loading={loading} itemLabel={t("vendors.itemLabel")} />
    </div>
  );
}
