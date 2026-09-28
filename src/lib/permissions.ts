// Sidebar sections a user's access can be restricted to (mirrors src/config/modules.ts
// on the backend -- keep both in sync). "Beranda" is deliberately excluded: it's always
// reachable, same as every user needing some landing page after login.
export const MODULE_KEYS = ["b2b-utama", "b2b-operasional", "zarve", "laporan-keuangan", "administrasi"] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  "b2b-utama": "B2B - Utama",
  "b2b-operasional": "B2B - Operasional",
  zarve: "Zarve",
  "laporan-keuangan": "Laporan Keuangan",
  administrasi: "Administrasi",
};

/** Null/undefined `allowedModules` = full access (the default for every existing user
 * unless an admin explicitly narrows it down on the Manajemen User page). */
export function canAccessModule(user: { allowedModules?: string[] | null } | null | undefined, module: ModuleKey): boolean {
  if (!user) return false;
  const allowed = user.allowedModules;
  if (!allowed) return true;
  return allowed.includes(module);
}
