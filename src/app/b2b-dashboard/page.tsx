"use client";

import { LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";

/** Placeholder for the B2B business unit -- kept empty on purpose for now. Real B2B
 * menus/reports get built out later; this page just marks the spot in the nav. */
export default function B2bDashboardPage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader title={t("b2bDashboard.title")} subtitle={t("b2bDashboard.subtitle")} />

      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
        <LayoutDashboard className="h-8 w-8 text-zinc-300" />
        <p className="text-sm text-zinc-400">{t("b2bDashboard.emptyState")}</p>
      </div>
    </div>
  );
}
