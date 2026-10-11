"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Package } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah } from "@/lib/format";
import { Account, ProductDetail, TaxCode } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-zinc-500">{label}</p>
      <p className="text-sm text-zinc-800">{children}</p>
    </div>
  );
}

export default function ProductDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const id = Number(params.id);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [taxes, setTaxes] = useState<TaxCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.getProduct(id), api.accounts(), api.taxes()])
      .then(([p, accs, tx]) => {
        setProduct(p);
        setAccounts(accs);
        setTaxes(tx);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("produk.detail.errorLoading")))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleArchive() {
    if (!product) return;
    setArchiving(true);
    try {
      const updated = await api.updateProduct(product.id, { isActive: !product.isActive });
      setProduct({ ...product, isActive: updated.isActive });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("produk.detail.errorArchive"));
    } finally {
      setArchiving(false);
    }
  }

  function accountLabel(accountId: number | null) {
    if (!accountId) return "-";
    const a = accounts.find((acc) => acc.id === accountId);
    return a ? `${a.code} - ${a.name}` : "-";
  }

  function taxLabel(taxId: number | null) {
    if (!taxId) return "-";
    const tax = taxes.find((tx) => tx.id === taxId);
    return tax ? `${tax.name} (${tax.rate}%)` : "-";
  }

  if (loading) return <p className="text-sm text-zinc-400">{t("common.loading")}</p>;
  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!product) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <Breadcrumb items={[{ label: t("produk.title"), href: "/b2b-produk" }, { label: product.name }]} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">{product.name}</h1>
        <button
          type="button"
          onClick={toggleArchive}
          disabled={archiving}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          {t(product.isActive ? "produk.detail.archive" : "produk.detail.unarchive")}
        </button>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionHeading icon={Package} title={t("produk.form.sectionInfo")} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[9rem_1fr]">
            <div className="h-36 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${API_ORIGIN}${product.imageUrl}`} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-300">
                  <Package className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label={t("produk.form.type")}>{t(product.type === "barang" ? "produk.typeBarang" : "produk.typeJasa")}</Field>
              <Field label={t("produk.form.productType")}>{t(product.productType === "bundle" ? "produk.typeBundle" : "produk.typeSingle")}</Field>
              <Field label={t("produk.form.code")}>{product.code}</Field>
              <Field label={t("produk.form.barcode")}>{product.barcode ?? "-"}</Field>
              <Field label={t("produk.form.category")}>{product.categoryName ?? "-"}</Field>
              <Field label={t("produk.form.unit")}>{product.unit ?? "-"}</Field>
              <Field label={t("produk.colStatus")}>
                <span className={product.isActive ? "text-emerald-600" : "text-zinc-400"}>{t(product.isActive ? "produk.active" : "produk.archived")}</span>
              </Field>
              {product.description && (
                <div className="sm:col-span-2">
                  <Field label={t("produk.form.description")}>{product.description}</Field>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionHeading icon={Package} title={t("produk.form.sectionPricing")} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium text-zinc-700">{t("produk.form.trackPurchase")}</p>
              {product.trackPurchase ? (
                <div className="space-y-3 pl-1">
                  <Field label={t("produk.form.purchasePrice")}>{formatRupiah(product.purchasePrice)}</Field>
                  <Field label={t("produk.form.purchaseAccount")}>{accountLabel(product.purchaseAccountId)}</Field>
                  <Field label={t("produk.form.purchaseTax")}>{taxLabel(product.purchaseTaxId)}</Field>
                </div>
              ) : (
                <p className="text-sm text-zinc-400">-</p>
              )}
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-zinc-700">{t("produk.form.trackSale")}</p>
              {product.trackSale ? (
                <div className="space-y-3 pl-1">
                  <Field label={t("produk.form.sellingPrice")}>{formatRupiah(product.sellingPrice)}</Field>
                  <Field label={t("produk.form.saleAccount")}>{accountLabel(product.saleAccountId)}</Field>
                  <Field label={t("produk.form.saleTax")}>{taxLabel(product.saleTaxId)}</Field>
                </div>
              ) : (
                <p className="text-sm text-zinc-400">-</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionHeading icon={Package} title={t("produk.form.sectionInventoryTracking")} />
          {product.trackInventory ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Field label={t("produk.form.currentStock")}>{product.currentStock ?? "-"}</Field>
              <Field label={t("produk.form.minStockShort")}>{product.minStock ?? "-"}</Field>
              <Field label={t("produk.form.inventoryAccount")}>{accountLabel(product.inventoryAccountId)}</Field>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">{t("produk.form.trackingModeNone")}</p>
          )}
        </section>

        {product.productType === "bundle" && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <SectionHeading icon={Package} title={t("produk.detail.bundleComponentsTitle")} />
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <div className="grid grid-cols-[1fr_6rem_6rem] gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5 text-xs font-medium text-zinc-500">
                <span>{t("produk.form.colProductName")}</span>
                <span>{t("produk.form.colQty")}</span>
                <span>{t("produk.form.colUnit")}</span>
              </div>
              {product.bundleComponents?.map((c) => (
                <div key={c.productId} className="grid grid-cols-[1fr_6rem_6rem] gap-3 border-b border-zinc-50 px-4 py-3 text-sm last:border-b-0">
                  <span className="text-zinc-800">
                    {c.code} - {c.name}
                  </span>
                  <span className="text-zinc-500">{c.qty}</span>
                  <span className="text-zinc-500">{c.unit ?? "-"}</span>
                </div>
              ))}
              {!product.bundleComponents?.length && <p className="px-4 py-6 text-center text-sm text-zinc-400">-</p>}
            </div>
            {product.bundleExtraCostAccountId && (
              <div className="mt-4">
                <Field label={t("produk.form.bundleExtraCostAccount")}>{accountLabel(product.bundleExtraCostAccountId)}</Field>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
