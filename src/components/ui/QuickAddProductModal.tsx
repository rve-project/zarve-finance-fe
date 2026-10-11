"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Product } from "@/lib/types";

interface QuickAddProductModalProps {
  initialName?: string;
  onClose: () => void;
  onCreated: (product: Product) => void;
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400";

export function QuickAddProductModal({ initialName, onClose, onCreated }: QuickAddProductModalProps) {
  const { t } = useLanguage();
  const [type, setType] = useState<"barang" | "jasa">("barang");
  const [name, setName] = useState(initialName ?? "");
  const [code, setCode] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createProduct({
        type,
        name: name.trim(),
        code: code.trim() || undefined,
        purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
        sellingPrice: sellingPrice ? Number(sellingPrice) : undefined,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("quickAdd.productError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">{t("quickAdd.productTitle")}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 text-sm">
            {(["barang", "jasa"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setType(v)}
                className={`flex-1 rounded-lg border px-3 py-2 font-medium transition-colors ${
                  type === v ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {v === "barang" ? t("quickAdd.productTypeBarang") : t("quickAdd.productTypeJasa")}
              </button>
            ))}
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">
              {t("quickAdd.name")} <span className="text-red-500">*</span>
            </span>
            <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("quickAdd.code")}</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("quickAdd.codeAuto")} className={inputClass} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("quickAdd.purchasePrice")}</span>
              <input type="number" min={0} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("quickAdd.sellingPrice")}</span>
              <input type="number" min={0} value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className={inputClass} />
            </label>
          </div>
          <p className="text-xs text-zinc-400">{t("quickAdd.editLater")}</p>
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
