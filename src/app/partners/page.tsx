"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Partner } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";

const LIMIT = 20;

export default function PartnersPage() {
  const { t } = useLanguage();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  function load(query = q, p = 1) {
    setLoading(true);
    api
      .partners({ q: query || undefined, page: p, limit: LIMIT })
      .then((res) => {
        setPartners(res.data);
        setTotal(res.total);
        setPage(res.page);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader title={t("partners.title")} subtitle={t("partners.subtitle")} />

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q, 1)}
          placeholder={t("partners.searchPlaceholder")}
          className="w-full max-w-sm rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("partners.colName")}</th>
              <th className="px-4 py-3 font-medium">{t("partners.colKtp")}</th>
              <th className="px-4 py-3 font-medium">{t("partners.colPhone")}</th>
              <th className="px-4 py-3 font-medium">{t("partners.colEmail")}</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-2.5 font-medium text-zinc-900">
                  <Link href={`/partners/${p.id}`} className="hover:text-emerald-600 hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{p.ktpNumber ?? "-"}</td>
                <td className="px-4 py-2.5">{p.phone ?? "-"}</td>
                <td className="px-4 py-2.5">{p.email ?? "-"}</td>
              </tr>
            ))}
            {!loading && partners.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  {t("partners.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} limit={LIMIT} total={total} onChange={(p) => load(q, p)} loading={loading} itemLabel={t("partners.itemLabel")} />
    </div>
  );
}
