"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Paperclip, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Product, Warehouse } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";

interface TransferLineRow {
  productId: string;
  qty: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewWarehouseTransferPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockByProduct, setStockByProduct] = useState<Record<number, number>>({});

  const [date, setDate] = useState(today());
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<TransferLineRow[]>([{ productId: "", qty: "" }]);

  const [attachments, setAttachments] = useState<{ fileName: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.warehouses().then(setWarehouses).catch(() => {});
    api
      .products()
      .then((res) => setProducts(res.products.filter((p) => p.trackInventory)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .productWarehouseStock(fromWarehouseId ? Number(fromWarehouseId) : undefined)
      .then((rows) => setStockByProduct(Object.fromEntries(rows.map((r) => [r.productId, r.qty]))))
      .catch(() => {});
  }, [fromWarehouseId]);

  function updateLine(index: number, patch: Partial<TransferLineRow>) {
    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addLine() {
    setLines((rows) => [...rows, { productId: "", qty: "" }]);
  }

  function removeLine(index: number) {
    setLines((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded = await api.uploadWarehouseTransferAttachments(files);
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("produk.warehouse.transfer.new.errorSave"));
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (fromWarehouseId === toWarehouseId) {
      setError(t("produk.warehouse.transfer.new.errorSameWarehouse"));
      return;
    }
    const validLines = lines.filter((l) => l.productId && Number(l.qty) > 0);
    if (!validLines.length) {
      setError(t("produk.warehouse.transfer.new.errorNoLines"));
      return;
    }

    setSubmitting(true);
    try {
      await api.createWarehouseTransfer({
        fromWarehouseId: fromWarehouseId ? Number(fromWarehouseId) : undefined,
        toWarehouseId: toWarehouseId ? Number(toWarehouseId) : undefined,
        transferDate: date,
        memo: memo || undefined,
        lines: validLines.map((l) => ({ productId: Number(l.productId), qty: Number(l.qty) })),
        attachments: attachments.length ? attachments : undefined,
      });
      router.push("/b2b-produk");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("produk.warehouse.transfer.new.errorSave"));
      setSubmitting(false);
    }
  }

  const warehouseOptions = [
    { value: "", label: t("produk.adjustments.unassigned") },
    ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
  ];
  const fromWarehouseName = warehouseOptions.find((o) => o.value === fromWarehouseId)?.label ?? t("produk.adjustments.unassigned");

  return (
    <div className="mx-auto max-w-4xl">
      <Breadcrumb items={[{ label: t("produk.title"), href: "/b2b-produk" }, { label: t("produk.warehouse.transfer.new.title") }]} />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{t("produk.warehouse.transfer.new.title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">
                {t("produk.warehouse.transfer.new.number")} <span className="text-red-500">*</span>
              </span>
              <input
                disabled
                placeholder={t("produk.warehouse.transfer.new.numberAuto")}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-400"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.warehouse.transfer.new.date")}</span>
              <DatePicker value={date} onChange={setDate} maxDate={today()} />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.warehouse.transfer.new.from")}</span>
              <Dropdown value={fromWarehouseId} onChange={setFromWarehouseId} options={warehouseOptions} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.warehouse.transfer.new.to")}</span>
              <Dropdown value={toWarehouseId} onChange={setToWarehouseId} options={warehouseOptions} />
            </label>
          </div>

          <label className="mt-5 block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.warehouse.transfer.new.memo")}</span>
            <textarea
              rows={3}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full resize-none rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1fr_7rem_6rem_6rem_7rem_2.5rem] gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5 text-xs font-medium text-zinc-500 sm:grid">
            <span>{t("produk.warehouse.transfer.new.colProduct")}</span>
            <span>{t("produk.warehouse.transfer.new.colWarehouse")}</span>
            <span>{t("produk.warehouse.transfer.new.colStockBefore")}</span>
            <span>{t("produk.warehouse.transfer.new.colStockAfter")}</span>
            <span>{t("produk.warehouse.transfer.new.colTotal")}</span>
            <span />
          </div>

          {lines.map((line, index) => {
            const productId = line.productId ? Number(line.productId) : null;
            const stockBefore = productId ? (stockByProduct[productId] ?? 0) : null;
            const qty = Number(line.qty) || 0;
            const stockAfter = stockBefore !== null ? stockBefore - qty : null;
            return (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 border-b border-zinc-50 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_7rem_6rem_6rem_7rem_2.5rem] sm:items-center"
              >
                <Dropdown
                  value={line.productId}
                  onChange={(v) => updateLine(index, { productId: v })}
                  placeholder={t("produk.warehouse.transfer.new.selectProduct")}
                  options={products.map((p) => ({ value: String(p.id), label: p.name }))}
                />
                <span className="text-sm text-zinc-500">{fromWarehouseName}</span>
                <span className="text-sm text-zinc-500">{stockBefore ?? "-"}</span>
                <span className={stockAfter !== null && stockAfter < 0 ? "text-sm font-medium text-red-600" : "text-sm text-zinc-500"}>
                  {stockAfter ?? "-"}
                </span>
                <input
                  type="number"
                  min={0}
                  value={line.qty}
                  onChange={(e) => updateLine(index, { qty: e.target.value })}
                  disabled={!line.productId}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:bg-zinc-50"
                />
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  disabled={lines.length === 1}
                  className="justify-self-start text-zinc-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 sm:justify-self-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          <div className="px-4 py-3">
            <button type="button" onClick={addLine} className="text-xs font-semibold text-emerald-600 hover:underline">
              + {t("produk.warehouse.transfer.new.addLine")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <span className="mb-2 block text-sm font-medium text-zinc-700">{t("produk.warehouse.transfer.new.attachments")}</span>
          <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.jpeg,.png" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || attachments.length >= 5}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("produk.warehouse.transfer.new.chooseFile")}
            </button>
            <span className="text-sm text-zinc-400">{uploading ? "..." : t("produk.warehouse.transfer.new.dropHint")}</span>
          </div>
          <p className="mt-2 text-xs text-zinc-400">{t("produk.warehouse.transfer.new.fileHint")}</p>

          {attachments.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {attachments.map((a, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <span className="flex-1 truncate text-zinc-700">{a.fileName}</span>
                  <button type="button" onClick={() => removeAttachment(index)} className="text-zinc-400 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex items-center justify-end gap-3">
          <Link href="/b2b-produk" className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            {t("produk.warehouse.transfer.new.cancel")}
          </Link>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? t("produk.warehouse.transfer.new.submitting") : t("produk.warehouse.transfer.new.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
