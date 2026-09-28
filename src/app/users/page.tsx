"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";
import { ManagedUser } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";

export default function UsersPage() {
  const { t } = useLanguage();
  const { user: me } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api
      .users()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createUser({ email, name: name || undefined });
      setEmail("");
      setName("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("users.errorSaving"));
    }
  }

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("users.errorSaving"));
    }
  }

  function handleDelete(u: ManagedUser) {
    if (!window.confirm(t("users.confirmDelete").replace("{email}", u.email))) return;
    run(() => api.deleteUser(u.id));
  }

  return (
    <div>
      <PageHeader
        title={t("users.title")}
        subtitle={t("users.subtitle")}
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {showForm ? t("users.cancel") : t("users.addUser")}
          </button>
        }
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-5 sm:p-5">
          <input
            required
            type="email"
            placeholder={t("users.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            placeholder={t("users.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:col-span-2"
          />
          <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            {t("users.save")}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("users.colName")}</th>
              <th className="px-4 py-3 font-medium">{t("users.colEmail")}</th>
              <th className="px-4 py-3 font-medium">{t("users.colStatus")}</th>
              <th className="px-4 py-3 font-medium">{t("users.colZarve")}</th>
              <th className="px-4 py-3 font-medium">{t("users.colActivityLog")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("users.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isMe = u.id === me?.id;
              return (
                <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-4 py-2.5 font-medium text-zinc-900">
                    {u.name} {isMe && <span className="text-xs font-normal text-zinc-400">{t("users.you")}</span>}
                  </td>
                  <td className="px-4 py-2.5">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        u.aktif ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700" : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500"
                      }
                    >
                      {u.aktif ? t("users.active") : t("users.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">{u.zarveUserId ? t("users.linked") : t("users.notLinked")}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => run(() => api.updateUser(u.id, { canViewActivityLog: !u.canViewActivityLog }))}
                      className={
                        u.canViewActivityLog
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-100"
                          : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-200"
                      }
                    >
                      {u.canViewActivityLog ? t("users.activityLogGranted") : t("users.activityLogNotGranted")}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {!isMe && (
                      <>
                        <button
                          onClick={() => run(() => api.updateUser(u.id, { aktif: !u.aktif }))}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                        >
                          {u.aktif ? t("users.deactivate") : t("users.activate")}
                        </button>
                        <button onClick={() => handleDelete(u)} className="ml-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                          {t("users.delete")}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                  {t("users.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
