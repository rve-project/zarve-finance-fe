"use client";

import { Moon, Sun } from "lucide-react";
import clsx from "clsx";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

// `onBrand` is for the emerald login brand panel, matching its LanguageSwitch.
export function ThemeToggle({ variant = "default" }: { variant?: "default" | "onBrand" }) {
  const { isDark, toggle } = useTheme();
  const { t } = useLanguage();
  const label = isDark ? t("theme.switchToLight") : t("theme.switchToDark");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={clsx(
        "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
        variant === "onBrand"
          ? "on-brand border-white/25 bg-white/10 text-white/80 backdrop-blur-sm hover:text-white"
          : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:text-zinc-800"
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
