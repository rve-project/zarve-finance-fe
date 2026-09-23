"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Account, Product, StockAdjustmentCategory, StockAdjustmentType, Warehouse } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";

interface AdjustmentLineRow {
  productId: string;
  value: string;
}

const CATEGORY_KEYS: Record<StockAdjustmentCategory, string> = {
  general: "produk.adjustments.categoryGeneral",
  damaged: "produk.adjustments.categoryDamaged",
  production: "produk.adjustments.categoryProduction",
  opening_quantity: "produk.adjustments.categoryOpeningQuantity",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewStockAdjustmentPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [type, setType] = useState<StockAdjustmentType>("count");
  const [category, setCategory] = useState<StockAdjustmentCategory>("general");
  const [accountId, setAccountId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [date, setDate] = useState(today());

  const [lines, setLines] = useState<AdjustmentLineRow[]>([{ productId: "", value: "" }]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.accounts().then(setAccounts).catch(() => {});
    api.warehouses().then(setWarehouses).catch(() => {});
    api
      .products()
      .then((res) => setProducts(res.products.filter((p) => p.trackInventory)))
      .catch(() => {});
  }, []);

  function updateLine(index: number, patch: Partial<AdjustmentLineRow>) {
    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addLine() {
    setLines((rows) => [...rows, { productId: "", value: "" }]);
  }

  function removeLine(index: number) {
    setLines((rows) => rows.filter((_, i) => i !== index));
  }

  function handleContinue(e: FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validLines = lines.filter((l) => l.productId && l.value !== "");
    if (!validLines.length) {
      setError(t("produk.adjustments.new.errorNoLines"));
      return;
    }

    setSubmitting(true);
    try {
      await api.createStockAdjustment({
        type,
        category,
        accountId: accountId ? Number(accountId) : undefined,
        warehouseId: warehouseId ? Number(warehouseId) : undefined,
        adjustmentDate: date,
        lines: validLines.map((l) => ({ productId: Number(l.productId), value: Number(l.value) })),
      });
      router.push("/b2b-produk");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("produk.adjustments.new.errorSave"));
      setSubmitting(false);
    }
  }

  const warehouseOptions = [
    { value: "", label: t("produk.adjustments.unassigned") },
    ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
  ];
  const productsById = new Map(products.map((p) => [String(p.id), p]));

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumb items={[{ label: t("produk.title"), href: "/b2b-produk" }, { label: t("produk.adjustments.new.title") }]} />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{t("produk.adjustments.new.title")}</h1>

      {step === 1 && (
        <form onSubmit={handleContinue} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <span className="mb-2 block text-sm font-medium text-zinc-700">{t("produk.adjustments.new.type")}</span>
            <div className="space-y-2">
              {(["count", "in_out"] as const).map((v) => (
                <label key={v} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="radio"
                    name="adjustmentType"
                    checked={type === v}
                    onChange={() => setType(v)}
                    className="h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-zinc-700">{t(v === "count" ? "produk.adjustments.typeCount" : "produk.adjustments.typeInOut")}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.adjustments.new.category")}</span>
              <Dropdown
                value={category}
                onChange={(v) => setCategory(v as StockAdjustmentCategory)}
                options={(Object.keys(CATEGORY_KEYS) as StockAdjustmentCategory[]).map((c) => ({ value: c, label: t(CATEGORY_KEYS[c]) }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.adjustments.new.account")}</span>
              <Dropdown value={accountId} onChange={setAccountId} options={accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))} />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.adjustments.new.date")}</span>
              <DatePicker value={date} onChange={setDate} maxDate={today()} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.adjustments.new.warehouse")}</span>
              <Dropdown value={warehouseId} onChange={setWarehouseId} options={warehouseOptions} />
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-zinc-500">
              {t("produk.adjustments.new.importHint")}{" "}
              <span title={t("produk.comingSoon")} className="cursor-not-allowed text-zinc-300">
                {t("produk.adjustments.new.importLink")}
              </span>
            </p>
            <div className="flex items-center gap-3">
              <Link href="/b2b-produk" className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                {t("produk.adjustments.new.cancel")}
              </Link>
              <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                {t("produk.adjustments.new.continue")}
              </button>
            </div>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[1fr_7rem_7rem_7rem_2.5rem] gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5 text-xs font-medium text-zinc-500 sm:grid">
              <span>{t("produk.adjustments.new.colProduct")}</span>
              <span>{t("produk.adjustments.new.colStockBefore")}</span>
              <span>{t(type === "count" ? "produk.adjustments.new.newStockLabel" : "produk.adjustments.new.deltaLabel")}</span>
              <span>{t("produk.adjustments.new.colDelta")}</span>
              <span />
            </div>

            {lines.map((line, index) => {
              const product = productsById.get(line.productId);
              const stockBefore = product?.currentStock ?? 0;
              const value = Number(line.value) || 0;
              const stockAfter = line.value === "" ? null : type === "count" ? value : stockBefore + value;
              const delta = stockAfter === null ? null : stockAfter - stockBefore;
              return (
                <div key={index} className="grid grid-cols-1 gap-3 border-b border-zinc-50 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_7rem_7rem_7rem_2.5rem] sm:items-center">
                  <Dropdown
                    value={line.productId}
                    onChange={(v) => updateLine(index, { productId: v })}
                    placeholder={t("produk.adjustments.new.selectProduct")}
                    options={products.map((p) => ({ value: String(p.id), label: p.name }))}
                  />
                  <span className="text-sm text-zinc-500">{product ? stockBefore : "-"}</span>
                  <input
                    type="number"
                    value={line.value}
                    onChange={(e) => updateLine(index, { value: e.target.value })}
                    disabled={!line.productId}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:bg-zinc-50"
                  />
                  <span className={delta === null ? "text-sm text-zinc-400" : delta === 0 ? "text-sm text-zinc-500" : delta > 0 ? "text-sm font-medium text-emerald-600" : "text-sm font-medium text-red-600"}>
                    {delta === null ? "-" : delta > 0 ? `+${delta}` : delta}
                  </span>
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
                {t("produk.adjustments.new.addLine")}
              </button>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              {t("produk.adjustments.new.back")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? t("produk.adjustments.new.saving") : t("produk.adjustments.new.save")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
