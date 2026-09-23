"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useBusinessUnit, BusinessUnit } from "@/lib/business-unit";
import { useLanguage } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface TopbarProps {
  onMenuClick?: () => void;
}

function BusinessUnitSwitch() {
  const { unit, setUnit } = useBusinessUnit();
  const router = useRouter();

  function handleSelect(u: BusinessUnit) {
    if (u === unit) return;
    setUnit(u);
    // A page the user is currently on may not exist in the other unit's nav (e.g.
    // /invoices in B2B mode) -- the dashboard is always valid in both.
    router.push("/");
  }

  return (
    <div className="flex items-center rounded-full border border-zinc-200 bg-zinc-50 p-0.5 text-xs font-semibold">
      {(["zarve", "b2b"] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => handleSelect(u)}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            unit === u ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          {u === "zarve" ? "Zarve" : "B2B"}
        </button>
      ))}
    </div>
  );
}

function LanguageSwitch() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center rounded-full border border-zinc-200 bg-zinc-50 p-0.5 text-xs font-semibold">
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            lang === l ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="flex h-[73px] items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 sm:px-8 print:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label={t("common.openMenu")}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
        <BusinessUnitSwitch />
        <ThemeToggle />
        <LanguageSwitch />
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full bg-emerald-600 py-1.5 pl-2 pr-2 text-white hover:bg-emerald-700 sm:pr-3"
          >
            <UserCircle className="h-6 w-6 shrink-0" />
            <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:inline">{user?.name ?? "..."}</span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                <div className="border-b border-zinc-100 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-zinc-900">{user?.name}</p>
                  <p className="truncate text-xs text-zinc-400">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  {t("common.logout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
