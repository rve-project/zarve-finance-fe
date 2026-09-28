"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";
import { ManagedUser } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { MODULE_KEYS, MODULE_LABELS } from "@/lib/permissions";

type AccountType = "zarve" | "local";

export default function UsersPage() {
  const { t } = useLanguage();
  const { user: me } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("zarve");
  const [password, setPassword] = useState("");
  const [allowedModules, setAllowedModules] = useState<Set<string>>(() => new Set(MODULE_KEYS));
  const [error, setError] = useState<string | null>(null);

  function load() {
    api
      .users()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function resetForm() {
    setEditingUser(null);
    setEmail("");
    setName("");
    setAccountType("zarve");
    setPassword("");
    setAllowedModules(new Set(MODULE_KEYS));
    setError(null);
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function toggleForm() {
    if (showForm) {
      resetForm();
      setShowForm(false);
    } else {
      openCreateForm();
    }
  }

  function openEditForm(u: ManagedUser) {
    setEditingUser(u);
    setEmail(u.email);
    setName(u.name);
    setAccountType(u.hasLocalPassword ? "local" : "zarve");
    setPassword("");
    setAllowedModules(new Set(u.allowedModules ?? MODULE_KEYS));
    setError(null);
    setShowForm(true);
  }

  function toggleModule(m: string) {
    setAllowedModules((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const allowedModulesArray = Array.from(allowedModules);
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          name: name || undefined,
          allowedModules: allowedModulesArray,
          ...(accountType === "local" && password ? { password } : {}),
        });
      } else {
        await api.createUser({
          email,
          name: name || undefined,
          allowedModules: allowedModulesArray,
          ...(accountType === "local" ? { password } : {}),
        });
      }
      resetForm();
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

  const moduleSummary = useMemo(
    () => (u: ManagedUser) => (u.allowedModules === null ? t("users.allModules") : `${u.allowedModules.length}/${MODULE_KEYS.length}`),
    [t]
  );

  return (
    <div>
      <PageHeader
        title={t("users.title")}
        subtitle={t("users.subtitle")}
        action={
          <button onClick={toggleForm} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            {showForm ? t("users.cancel") : t("users.addUser")}
          </button>
        }
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">{t("users.accountType")}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAccountType("zarve")}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                  accountType === "zarve" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-zinc-200 text-zinc-500"
                }`}
              >
                {t("users.accountTypeZarve")}
              </button>
              <button
                type="button"
                onClick={() => setAccountType("local")}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                  accountType === "local" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-zinc-200 text-zinc-500"
                }`}
              >
                {t("users.accountTypeLocal")}
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {accountType === "zarve" ? t("users.accountTypeZarveHint") : t("users.accountTypeLocalHint")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              required
              type="email"
              disabled={Boolean(editingUser)}
              placeholder={accountType === "zarve" ? t("users.emailPlaceholder") : t("users.emailPlaceholderLocal")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
            />
            <input
              placeholder={accountType === "zarve" ? t("users.namePlaceholder") : t("users.namePlaceholderLocal")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>

          {accountType === "local" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                {t("users.password")} {editingUser ? <span className="text-zinc-400">{t("users.passwordEditHint")}</span> : <span className="text-red-500">*</span>}
              </span>
              <input
                required={!editingUser}
                type="password"
                placeholder={t("users.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700">{t("users.moduleAccess")}</span>
              <div className="flex gap-2 text-xs font-medium">
                <button type="button" onClick={() => setAllowedModules(new Set(MODULE_KEYS))} className="text-emerald-600 hover:underline">
                  {t("users.selectAll")}
                </button>
                <button type="button" onClick={() => setAllowedModules(new Set())} className="text-zinc-400 hover:underline">
                  {t("users.selectNone")}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border border-zinc-200 p-3 sm:grid-cols-3">
              {MODULE_KEYS.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={allowedModules.has(m)}
                    onChange={() => toggleModule(m)}
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {MODULE_LABELS[m]}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-zinc-400">{t("users.moduleAccessHint")}</p>
          </div>

          <div className="flex items-center gap-2">
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              {t("users.save")}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              {t("users.cancel")}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("users.colName")}</th>
              <th className="px-4 py-3 font-medium">{t("users.colEmail")}</th>
              <th className="px-4 py-3 font-medium">{t("users.colStatus")}</th>
              <th className="px-4 py-3 font-medium">{t("users.colAccountType")}</th>
              <th className="px-4 py-3 font-medium">{t("users.colModules")}</th>
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
                  <td className="px-4 py-2.5 text-zinc-500">
                    {u.hasLocalPassword ? t("users.accountTypeLocal") : u.zarveUserId ? t("users.linked") : t("users.notLinked")}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">{moduleSummary(u)}</td>
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
                    <button
                      onClick={() => openEditForm(u)}
                      aria-label={t("users.edit")}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
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
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-400">
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
