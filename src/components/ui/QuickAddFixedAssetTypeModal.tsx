"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { FixedAssetTypeOption } from "@/lib/types";

interface QuickAddFixedAssetTypeModalProps {
  initialName?: string;
  onClose: () => void;
  onCreated: (type: FixedAssetTypeOption) => void;
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400";

export function QuickAddFixedAssetTypeModal({ initialName, onClose, onCreated }: QuickAddFixedAssetTypeModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(initialName ?? "");
  const [requiresPlateNumber, setRequiresPlateNumber] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createFixedAssetType({ name: name.trim(), requiresPlateNumber });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("quickAdd.fixedAssetTypeError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">{t("quickAdd.fixedAssetTypeTitle")}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">
              {t("quickAdd.name")} <span className="text-red-500">*</span>
            </span>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("quickAdd.fixedAssetTypeNamePlaceholder")}
              className={inputClass}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requiresPlateNumber}
              onChange={(e) => setRequiresPlateNumber(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-zinc-700">{t("quickAdd.fixedAssetTypeRequiresPlateNumber")}</span>
          </label>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
              {t("quickAdd.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? t("quickAdd.saving") : t("quickAdd.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
