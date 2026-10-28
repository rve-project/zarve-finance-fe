"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface AjukanKoreksiModalProps {
  /** The transaction date that got blocked -- shown for context, not editable here. */
  requestedDate: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

/**
 * Shown whenever a write gets blocked with HTTP 423 (Tutup Buku -- see
 * rve-finance-be's utils/periodLock.ts). Submitting here files a koreksi_requests row;
 * the user has to come back and retry the original edit once it's approved -- this modal
 * itself never performs the edit, it only asks permission for it.
 */
export function AjukanKoreksiModal({ requestedDate, onClose, onSubmit }: AjukanKoreksiModalProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(reason.trim());
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("koreksi.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">{t("koreksi.modalTitle")}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        {done ? (
          <div className="space-y-4 px-5 py-5">
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{t("koreksi.submitSuccess")}</p>
            <button type="button" onClick={onClose} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              {t("koreksi.close")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {t("koreksi.lockedNotice").replace("{date}", requestedDate)}
            </p>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">
                {t("koreksi.reasonLabel")} <span className="text-red-500">*</span>
              </span>
              <textarea
                autoFocus
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("koreksi.reasonPlaceholder")}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </label>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
                {t("quickAdd.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting || !reason.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? t("koreksi.submitting") : t("koreksi.submitButton")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
