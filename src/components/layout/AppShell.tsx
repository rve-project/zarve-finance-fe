"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    // Bounce-to-/login disabled for now (dev request) -- was kicking back to the login
    // screen whenever /auth/me failed transiently (e.g. the dev DB container being down),
    // not just when actually logged out.
    // if (!user && !isLoginPage) {
    //   router.replace("/login");
    //   return;
    // }
    if (user && isLoginPage) {
      router.replace("/");
    }
  }, [loading, user, isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return <div className="flex min-h-screen flex-1 items-center justify-center text-sm text-zinc-400">{t("common.loading")}</div>;
  }

  return (
    <div className="flex min-h-full w-full">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex flex-1 flex-col overflow-x-hidden p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
