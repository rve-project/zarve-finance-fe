"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, LayoutGrid, Search, Store, UserRound, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Contact, ContactType } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";

type ContactTab = ContactType | "all";

const TABS: { value: ContactTab; labelKey: string; icon: typeof UsersRound }[] = [
  { value: "customer", labelKey: "contacts.tabCustomer", icon: UsersRound },
  { value: "vendor", labelKey: "contacts.tabVendor", icon: Store },
  { value: "employee", labelKey: "contacts.tabEmployee", icon: Briefcase },
  { value: "other", labelKey: "contacts.tabOther", icon: UserRound },
  { value: "all", labelKey: "contacts.tabAll", icon: LayoutGrid },
];

const TYPE_BADGE: Record<ContactType, { labelKey: string; className: string }> = {
  customer: { labelKey: "contacts.tabCustomer", className: "bg-amber-50 text-amber-700" },
  vendor: { labelKey: "contacts.tabVendor", className: "bg-violet-50 text-violet-700" },
  employee: { labelKey: "contacts.tabEmployee", className: "bg-teal-50 text-teal-700" },
  other: { labelKey: "contacts.tabOther", className: "bg-emerald-50 text-emerald-700" },
};

export default function ContactsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<ContactTab>("customer");
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[] | null>(null);

  function load() {
    api
      .contacts({ type: tab === "all" ? undefined : tab, search: search || undefined })
      .then(setContacts)
      .catch(() => {});
  }

  useEffect(load, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader
        title={t("contacts.title")}
        action={
          <Link
            href={tab === "all" ? "/b2b-contacts/new" : `/b2b-contacts/new?type=${tab}`}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            {t("contacts.createButton")}
          </Link>
        }
      />

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-zinc-200">
        {TABS.map((tb) => (
          <button
            key={tb.value}
            type="button"
            onClick={() => setTab(tb.value)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === tb.value ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <tb.icon className="h-4 w-4" />
            {t(tb.labelKey)}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              onBlur={load}
              placeholder={t("contacts.searchPlaceholder")}
              className="w-full rounded-lg border border-zinc-200 py-1.5 pl-9 pr-3 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-zinc-500">
                <th className="px-4 py-3 font-medium">{t("contacts.colName")}</th>
                <th className="px-4 py-3 font-medium">{t("contacts.colCompany")}</th>
                <th className="px-4 py-3 font-medium">{t("contacts.colAddress")}</th>
                <th className="px-4 py-3 font-medium">{t("contacts.colEmail")}</th>
                <th className="px-4 py-3 font-medium">{t("contacts.colMobilePhone")}</th>
                <th className="px-4 py-3 font-medium">{t("contacts.colPhone")}</th>
                <th className="px-4 py-3 font-medium">{t("contacts.colNpwp")}</th>
                <th className="px-4 py-3 font-medium">{t("contacts.colNotes")}</th>
              </tr>
            </thead>
            <tbody>
              {contacts?.map((c) => {
                return (
                  <tr key={c.id} className="border-b border-zinc-50 transition-colors hover:bg-zinc-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                          {c.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-zinc-800">{c.name}</p>
                          {tab === "all" && (
                            <div className="mt-0.5 flex flex-wrap gap-1">
                              {c.types.map((type) => (
                                <span key={type} className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_BADGE[type].className}`}>
                                  {t(TYPE_BADGE[type].labelKey)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{c.companyName ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-500">{c.address ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-500">{c.email ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-500">{c.mobilePhone ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-500">{c.phone ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-500">{c.npwp ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-500">{c.notes ?? "-"}</td>
                  </tr>
                );
              })}
              {contacts && !contacts.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                      <UsersRound className="h-6 w-6 text-zinc-400" />
                    </div>
                    <p className="font-medium text-zinc-700">{t("contacts.empty")}</p>
                    <p className="mt-1 text-xs text-zinc-400">{t("contacts.emptyHint")}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
