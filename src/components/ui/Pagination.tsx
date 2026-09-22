"use client";

import { useLanguage } from "@/lib/i18n";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
  loading?: boolean;
  itemLabel: string;
}

export function Pagination({ page, limit, total, onChange, loading, itemLabel }: PaginationProps) {
  const { t } = useLanguage();
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
      <span>
        {t("pagination.showing")} {(page - 1) * limit + 1}-{Math.min(page * limit, total)} {t("pagination.of")} {total.toLocaleString("id-ID")} {itemLabel}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1 || loading}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
        >
          {t("pagination.previous")}
        </button>
        <span className="px-2 py-1.5">
          {t("pagination.page")} {page} / {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages || loading}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
        >
          {t("pagination.next")}
        </button>
      </div>
    </div>
  );
}
