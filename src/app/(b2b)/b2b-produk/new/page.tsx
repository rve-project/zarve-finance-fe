"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Package, ShoppingCart, Boxes, Layers, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Account, Product, ProductCategory, ProductKind, TaxCode } from "@/lib/types";
import { formatRupiah } from "@/lib/format";
import { pickDefaultAccount } from "@/lib/accountDefaults";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Dropdown } from "@/components/ui/Dropdown";
import { HelpHint } from "@/components/ui/HelpHint";

interface BundleComponentRow {
  productId: string;
  qty: string;
}

// The upload endpoint returns a path relative to the backend (e.g.
// "/uploads/products/xxx.png"), not the frontend -- prefix with the API's origin so
// <img> can actually load it.
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api").replace(/\/api\/?$/, "");

function SectionHeading({ icon: Icon, title }: { icon: typeof Package; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>
    </div>
  );
}

export default function NewProductPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [taxes, setTaxes] = useState<TaxCode[]>([]);

  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState<ProductKind>("single");

  const [trackPurchase, setTrackPurchase] = useState(true);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseAccountId, setPurchaseAccountId] = useState("");
  const [purchaseTaxId, setPurchaseTaxId] = useState("");

  const [trackSale, setTrackSale] = useState(true);
  const [sellingPrice, setSellingPrice] = useState("");
  const [saleAccountId, setSaleAccountId] = useState("");
  const [saleTaxId, setSaleTaxId] = useState("");

  const [stockTrackingMode, setStockTrackingMode] = useState<"track" | "none">("track");
  const [inventoryAccountId, setInventoryAccountId] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [minStock, setMinStock] = useState("");

  const [eligibleComponents, setEligibleComponents] = useState<Product[]>([]);
  const [components, setComponents] = useState<BundleComponentRow[]>([{ productId: "", qty: "1" }]);
  const [bundleExtraCostAccountId, setBundleExtraCostAccountId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.productCategories().then(setCategories).catch(() => {});
    api.taxes().then(setTaxes).catch(() => {});
    api
      .products()
      .then((res) => setEligibleComponents(res.products.filter((p) => p.trackInventory && p.productType === "single")))
      .catch(() => {});
    // Every account is selectable (not just the "expected" type) -- the user picks,
    // we just pre-fill a sensible default so the common case needs no extra clicks.
    api.accounts().then((list) => {
      setAccounts(list);
      const purchaseDefault = pickDefaultAccount(list, { codePrefix: "51", type: "expense" });
      if (purchaseDefault) setPurchaseAccountId((cur) => cur || String(purchaseDefault.id));
      const saleDefault = pickDefaultAccount(list, { codePrefix: "41", type: "income" });
      if (saleDefault) setSaleAccountId((cur) => cur || String(saleDefault.id));
      // No fallback to "any asset account" here -- unlike cash or fixed assets, there's
      // no safe generic guess for an inventory account (defaulting to e.g. "Kas" would
      // be actively misleading), so this stays empty until a matching account exists.
      const inventoryDefault = pickDefaultAccount(list, { nameIncludes: "persediaan", codePrefix: "13" });
      if (inventoryDefault) setInventoryAccountId((cur) => cur || String(inventoryDefault.id));
    });
  }, []);

  function updateComponent(index: number, patch: Partial<BundleComponentRow>) {
    setComponents((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addComponentRow() {
    setComponents((rows) => [...rows, { productId: "", qty: "1" }]);
  }

  function removeComponentRow(index: number) {
    setComponents((rows) => rows.filter((_, i) => i !== index));
  }

  function handleProductTypeChange(next: ProductKind) {
    setProductType(next);
    // A bundle is assembled from its components, not bought directly.
    if (next === "bundle") setTrackPurchase(false);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const res = await api.uploadProductImage(file);
      setImageUrl(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("produk.form.errorUpload"));
    } finally {
      setUploading(false);
    }
  }

  const trackInventory = stockTrackingMode === "track";
  const showBundleComponents = productType === "bundle";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validComponents = components.filter((c) => c.productId);
    if (showBundleComponents && !validComponents.length) {
      setError(t("produk.form.errorBundleComponents"));
      return;
    }

    setSubmitting(true);
    try {
      await api.createProduct({
        type: "barang",
        name,
        code: code || undefined,
        barcode: barcode || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        unit: unit || undefined,
        description: description || undefined,
        trackPurchase,
        purchasePrice: trackPurchase ? Number(purchasePrice) || 0 : undefined,
        purchaseAccountId: trackPurchase && purchaseAccountId ? Number(purchaseAccountId) : undefined,
        purchaseTaxId: trackPurchase && purchaseTaxId ? Number(purchaseTaxId) : undefined,
        trackSale,
        sellingPrice: trackSale ? Number(sellingPrice) || 0 : undefined,
        saleAccountId: trackSale && saleAccountId ? Number(saleAccountId) : undefined,
        saleTaxId: trackSale && saleTaxId ? Number(saleTaxId) : undefined,
        imageUrl: imageUrl || undefined,
        productType,
        inventoryAccountId: trackInventory && inventoryAccountId ? Number(inventoryAccountId) : undefined,
        bundleExtraCostAccountId: showBundleComponents && bundleExtraCostAccountId ? Number(bundleExtraCostAccountId) : undefined,
        bundleComponents: showBundleComponents
          ? validComponents.map((c) => ({ productId: Number(c.productId), qty: Number(c.qty) || 1 }))
          : undefined,
        trackInventory,
        currentStock: trackInventory ? Number(currentStock) || 0 : undefined,
        minStock: trackInventory ? Number(minStock) || 0 : undefined,
      });
      router.push("/b2b-produk");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("produk.form.errorSave"));
      setSubmitting(false);
    }
  }

  const taxOptions = taxes.map((tax) => ({ value: String(tax.id), label: `${tax.name} (${tax.rate}%)` }));
  const inputClass =
    "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="mx-auto max-w-5xl">
      <Breadcrumb items={[{ label: t("produk.title"), href: "/b2b-produk" }, { label: t("produk.form.title") }]} />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{t("produk.form.title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionHeading icon={Package} title={t("produk.form.sectionInfo")} />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[9rem_1fr]">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">{t("produk.form.imageLabel")}</span>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
              {imageUrl ? (
                <div className="relative h-36 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${API_ORIGIN}${imageUrl}`} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                    aria-label={t("produk.form.imageRemove")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-medium text-white hover:bg-black/70 disabled:opacity-60"
                  >
                    {uploading ? t("produk.form.imageUploading") : t("produk.form.imageChange")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex h-36 w-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 text-zinc-400 transition-colors hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-60"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="px-2 text-center text-xs font-medium">{uploading ? t("produk.form.imageUploading") : t("produk.form.imageLabel")}</span>
                </button>
              )}
              <p className="mt-1.5 max-w-[9rem] text-xs text-zinc-400">{t("produk.form.imageUploadHint")}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.form.name")} *</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.form.productType")} *</span>
                <Dropdown
                  value={productType}
                  onChange={(v) => handleProductTypeChange(v as ProductKind)}
                  options={[
                    { value: "single", label: t("produk.typeSingle"), description: t("produk.typeSingleDesc") },
                    { value: "bundle", label: t("produk.typeBundle"), description: t("produk.typeBundleDesc") },
                  ]}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.form.code")}</span>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("produk.form.codePlaceholder")} className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.form.barcode")}</span>
                <input value={barcode} onChange={(e) => setBarcode(e.target.value)} className={inputClass} />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.form.category")}</span>
                <Dropdown value={categoryId} onChange={setCategoryId} options={categories.map((c) => ({ value: String(c.id), label: c.name }))} />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.form.unit")}</span>
                <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={t("produk.form.unitPlaceholder")} className={inputClass} />
              </label>

              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.form.description")}</span>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} resize-none`} />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionHeading icon={ShoppingCart} title={t("produk.form.sectionPricing")} />

          <label className={`mb-2 flex items-center gap-2 text-sm ${productType === "bundle" ? "cursor-not-allowed" : "cursor-pointer"}`}>
            <input
              type="checkbox"
              checked={trackPurchase}
              disabled={productType === "bundle"}
              onChange={(e) => setTrackPurchase(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
            />
            <span className={productType === "bundle" ? "text-zinc-400" : "text-zinc-700"} title={productType === "bundle" ? t("produk.form.trackPurchaseBundleHint") : undefined}>
              {t("produk.form.trackPurchase")}
            </span>
          </label>
          {trackPurchase && (
            <div className="mb-4 grid grid-cols-1 gap-4 pl-6 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs text-zinc-500">{t("produk.form.purchasePrice")}</span>
                <input type="number" min={0} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs text-zinc-500">{t("produk.form.purchaseAccount")} *</span>
                <Dropdown value={purchaseAccountId} onChange={setPurchaseAccountId} options={accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))} />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs text-zinc-500">{t("produk.form.purchaseTax")}</span>
                <Dropdown value={purchaseTaxId} onChange={setPurchaseTaxId} placeholder={t("produk.form.taxPlaceholder")} options={taxOptions} />
              </label>
            </div>
          )}

          <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={trackSale}
              onChange={(e) => setTrackSale(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-zinc-700">{t("produk.form.trackSale")}</span>
          </label>
          {trackSale && (
            <div className="grid grid-cols-1 gap-4 pl-6 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs text-zinc-500">{t("produk.form.sellingPrice")}</span>
                <input type="number" min={0} value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs text-zinc-500">{t("produk.form.saleAccount")} *</span>
                <Dropdown value={saleAccountId} onChange={setSaleAccountId} options={accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))} />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs text-zinc-500">{t("produk.form.saleTax")}</span>
                <Dropdown value={saleTaxId} onChange={setSaleTaxId} placeholder={t("produk.form.taxPlaceholder")} options={taxOptions} />
              </label>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionHeading icon={Boxes} title={t("produk.form.sectionInventoryTracking")} />

            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="radio"
                  name="stockTrackingMode"
                  checked={stockTrackingMode === "track"}
                  onChange={() => setStockTrackingMode("track")}
                  className="mt-0.5 h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  <span className="block font-medium text-zinc-800">{t("produk.form.trackingModeTrack")}</span>
                  <span className="mt-0.5 block text-xs text-zinc-400">
                    {t(productType === "bundle" ? "produk.form.trackingModeTrackDescBundle" : "produk.form.trackingModeTrackDesc")}
                  </span>
                </span>
              </label>

              {stockTrackingMode === "track" && (
                <div className="ml-6 space-y-4 border-l border-zinc-100 pl-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.form.minStockShort")}</span>
                      <input type="number" min={0} value={minStock} onChange={(e) => setMinStock(e.target.value)} className={inputClass} />
                    </label>
                    <label className="block text-sm sm:col-span-2">
                      <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.form.inventoryAccount")}</span>
                      <Dropdown
                        value={inventoryAccountId}
                        onChange={setInventoryAccountId}
                        options={accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-zinc-700">{t("produk.form.currentStock")}</span>
                      <input type="number" min={0} value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} className={inputClass} />
                    </label>
                  </div>
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="radio"
                  name="stockTrackingMode"
                  checked={stockTrackingMode === "none"}
                  onChange={() => setStockTrackingMode("none")}
                  className="mt-0.5 h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  <span className="block font-medium text-zinc-800">{t("produk.form.trackingModeNone")}</span>
                  <span className="mt-0.5 block text-xs text-zinc-400">
                    {t(productType === "bundle" ? "produk.form.trackingModeNoneDescBundle" : "produk.form.trackingModeNoneDesc")}
                  </span>
                </span>
              </label>
            </div>
        </section>

        {showBundleComponents && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <SectionHeading icon={Layers} title={`${t("produk.form.sectionBundleComponents")} *`} />

            <p className="mb-4 flex items-start gap-2 rounded-lg bg-indigo-50 px-3.5 py-2.5 text-xs text-indigo-700">
              <span>{t("produk.form.bundleComponentsHint")}</span>
            </p>

            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <div className="hidden grid-cols-[1fr_6rem_6rem_8rem_2.5rem] gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5 text-xs font-medium text-zinc-500 sm:grid">
                <span>{t("produk.form.colProductName")}</span>
                <span>{t("produk.form.colQty")}</span>
                <span>{t("produk.form.colUnit")}</span>
                <span>{t("produk.form.colPrice")}</span>
                <span />
              </div>

              {components.map((row, index) => {
                const selected = eligibleComponents.find((p) => String(p.id) === row.productId);
                const price = selected ? selected.purchasePrice || selected.sellingPrice || 0 : 0;
                return (
                  <div key={index} className="grid grid-cols-1 gap-3 border-b border-zinc-50 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_6rem_6rem_8rem_2.5rem] sm:items-center">
                    <Dropdown
                      value={row.productId}
                      onChange={(v) => updateComponent(index, { productId: v })}
                      placeholder={t("produk.form.selectProduct")}
                      options={eligibleComponents.map((p) => ({ value: String(p.id), label: p.name }))}
                    />
                    <input
                      type="number"
                      min={1}
                      value={row.qty}
                      onChange={(e) => updateComponent(index, { qty: e.target.value })}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                    />
                    <span className="text-sm text-zinc-500">{selected?.unit ?? "-"}</span>
                    <span className="text-sm text-zinc-500">{selected ? formatRupiah(price) : "-"}</span>
                    <button
                      type="button"
                      onClick={() => removeComponentRow(index)}
                      disabled={components.length === 1}
                      className="justify-self-start text-zinc-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 sm:justify-self-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={addComponentRow} className="mt-3 text-xs font-semibold text-emerald-600 hover:underline">
              {t("produk.form.addComponent")}
            </button>

            <label className="mt-5 block max-w-sm text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
                {t("produk.form.bundleExtraCostAccount")} <HelpHint text={t("produk.form.bundleExtraCostAccountHint")} />
              </span>
              <Dropdown
                value={bundleExtraCostAccountId}
                onChange={setBundleExtraCostAccountId}
                options={accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))}
              />
            </label>
          </section>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link href="/b2b-produk" className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            {t("produk.form.cancel")}
          </Link>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? t("produk.form.saving") : t("produk.form.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
