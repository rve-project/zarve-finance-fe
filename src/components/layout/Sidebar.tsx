"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import clsx from "clsx";
import { navSections, type NavItem } from "./nav-items";
import { useLanguage } from "@/lib/i18n";

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const { t } = useLanguage();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      {t(item.labelKey)}
    </Link>
  );
}

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const content = (
    <>
      <div className="flex items-center gap-2.5 px-6 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="RVE" className="h-7 w-auto shrink-0" />
        <div className="leading-tight">
          <p className="text-lg font-bold tracking-tight text-zinc-900">Finance</p>
          <p className="text-[10px] font-medium tracking-wide text-zinc-400">{t("common.accountingSystem")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.closeMenu")}
          className="ml-auto rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {navSections.map((section) => (
          <div key={section.titleKey}>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t(section.titleKey)}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} pathname={pathname} onNavigate={onClose} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex print:hidden">{content}</aside>

      {mobileOpen && (
        // z-[100]/z-[110]: deliberately far above any in-page z-index (filter bars use
        // z-40, dropdown/date-picker popovers and tooltips use z-50) so the mobile menu
        // always wins the stack regardless of what a given page does internally --
        // matching z-40 here once let a page's filter bar visually poke through the
        // open drawer.
        <div className="fixed inset-0 z-[100] md:hidden print:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 z-[110] flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
