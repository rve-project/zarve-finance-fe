"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { PaymentTerm } from "@/lib/types";

interface QuickAddPaymentTermModalProps {
  initialName?: string;
  onClose: () => void;
  onCreated: (term: PaymentTerm) => void;
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400";

export function QuickAddPaymentTermModal({ initialName, onClose, onCreated }: QuickAddPaymentTermModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(initialName ?? "");
  const [days, setDays] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createPaymentTerm({ name: name.trim(), days: days === "" ? null : Number(days) });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("quickAdd.paymentTermError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">{t("quickAdd.paymentTermTitle")}</h2>
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
            <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder={t("quickAdd.paymentTermNamePlaceholder")} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("quickAdd.paymentTermDays")}</span>
            <input type="number" min={0} value={days} onChange={(e) => setDays(e.target.value)} placeholder={t("quickAdd.paymentTermDaysPlaceholder")} className={inputClass} />
          </label>
          <p className="text-xs text-zinc-400">{t("quickAdd.paymentTermDaysHint")}</p>
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
