"use client";

import { FormEvent, useEffect, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatRupiah } from "@/lib/format";
import {
  Product,
  ProductCategory,
  ProductListResult,
  StockAdjustment,
  StockAdjustmentCategory,
  StockAdjustmentType,
  Warehouse,
  WarehouseTransfer,
} from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";

type TopTab = "goods" | "warehouse";
type GoodsSubTab = "list" | "adjustments" | "approval";
type WarehouseSubTab = "list" | "transfer" | "approval";

function TindakanDropdown({
  onAddProduct,
  onAddWarehouse,
  onAddStockAdjustment,
  onAddWarehouseTransfer,
}: {
  onAddProduct: () => void;
  onAddWarehouse: () => void;
  onAddStockAdjustment: () => void;
  onAddWarehouseTransfer: () => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  function pick(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        {t("produk.actions")}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-zinc-200 bg-white py-2 shadow-lg">
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("produk.actions.sectionProduct")}</p>
            <button type="button" onClick={() => pick(onAddProduct)} className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50">
              {t("produk.actions.addProduct")}
            </button>

            <p className="mt-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("produk.actions.sectionWarehouse")}</p>
            <button type="button" onClick={() => pick(onAddWarehouse)} className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50">
              {t("produk.actions.addWarehouse")}
            </button>
            <button type="button" onClick={() => pick(onAddStockAdjustment)} className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50">
              {t("produk.actions.stockOpname")}
            </button>
            <button type="button" onClick={() => pick(onAddWarehouseTransfer)} className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50">
              {t("produk.actions.warehouseTransfer")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CategoryModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.productCategories(true).then(setCategories).catch(() => {});
  }

  useEffect(load, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await api.createProductCategory(name.trim());
      setName("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">{t("produk.category.title")}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="mb-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("produk.category.addPlaceholder")}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {t("produk.category.add")}
          </button>
        </form>

        <div className="max-h-56 space-y-1 overflow-y-auto">
          {categories.map((c) => (
            <div key={c.id} className="rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
              {c.name}
            </div>
          ))}
          {!categories.length && <p className="px-3 py-2 text-sm text-zinc-400">{t("produk.category.empty")}</p>}
        </div>

        <button type="button" onClick={onClose} className="mt-4 w-full rounded-lg border border-zinc-200 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
          {t("produk.category.close")}
        </button>
      </div>
    </div>
  );
}

function ProductListTab({
  showCategoryModal,
  onCloseCategoryModal,
  reloadKey,
  onOpenCategoryModal,
}: {
  showCategoryModal: boolean;
  onCloseCategoryModal: () => void;
  reloadKey: number;
  onOpenCategoryModal: () => void;
}) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [data, setData] = useState<ProductListResult | null>(null);

  function load() {
    api.products({ search: search || undefined, includeArchived: showArchived }).then(setData).catch(() => {});
  }

  useEffect(load, [showArchived, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const products: Product[] = data?.products ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            onBlur={load}
            placeholder={t("produk.searchPlaceholder")}
            className="w-full rounded-lg border border-zinc-200 py-1.5 pl-9 pr-3 text-sm"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
          {t("produk.showArchived")}
        </label>

        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onOpenCategoryModal} className="rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50">
            {t("produk.manageCategories")}
          </button>
          <a
            href="/b2b-produk/new"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + {t("produk.addProduct")}
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("produk.colName")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.colCode")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.colCategory")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.colType")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("produk.colStock")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("produk.colMinStock")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.colUnit")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("produk.colPurchasePrice")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("produk.colSellingPrice")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-2.5 font-medium text-zinc-800">{p.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{p.code}</td>
                <td className="px-4 py-2.5 text-zinc-500">{p.categoryName ?? "-"}</td>
                <td className="px-4 py-2.5 text-zinc-500">{t(p.type === "barang" ? "produk.typeBarang" : "produk.typeJasa")}</td>
                <td className="px-4 py-2.5 text-right">{p.trackInventory && p.currentStock !== null ? p.currentStock : "-"}</td>
                <td className="px-4 py-2.5 text-right">{p.trackInventory && p.minStock !== null ? p.minStock : "-"}</td>
                <td className="px-4 py-2.5">{p.unit ?? "-"}</td>
                <td className="px-4 py-2.5 text-right">{formatRupiah(p.purchasePrice)}</td>
                <td className="px-4 py-2.5 text-right">{formatRupiah(p.sellingPrice)}</td>
                <td className="px-4 py-2.5">
                  <span className={p.isActive ? "text-emerald-600" : "text-zinc-400"}>{t(p.isActive ? "produk.active" : "produk.archived")}</span>
                </td>
              </tr>
            ))}
            {data && !products.length && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-zinc-400">
                  {t("produk.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCategoryModal && <CategoryModal onClose={onCloseCategoryModal} />}
    </div>
  );
}

const ADJUSTMENT_TYPE_KEYS: Record<StockAdjustmentType, string> = {
  count: "produk.adjustments.typeCount",
  in_out: "produk.adjustments.typeInOut",
};

const ADJUSTMENT_CATEGORY_KEYS: Record<StockAdjustmentCategory, string> = {
  general: "produk.adjustments.categoryGeneral",
  damaged: "produk.adjustments.categoryDamaged",
  production: "produk.adjustments.categoryProduction",
  opening_quantity: "produk.adjustments.categoryOpeningQuantity",
};

function StockAdjustmentsTab({ reloadKey }: { reloadKey: number }) {
  const { t } = useLanguage();
  const [adjustments, setAdjustments] = useState<StockAdjustment[] | null>(null);

  useEffect(() => {
    api.stockAdjustments().then(setAdjustments).catch(() => {});
  }, [reloadKey]);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <a
          href="/b2b-produk/stock-adjustments/new"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + {t("produk.adjustments.add")}
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("produk.adjustments.colNumber")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.adjustments.colDate")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.adjustments.colType")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.adjustments.colCategory")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.adjustments.colWarehouse")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.adjustments.colProducts")}</th>
            </tr>
          </thead>
          <tbody>
            {adjustments?.map((a) => (
              <tr key={a.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-2.5 font-mono text-xs">{a.adjustmentNumber}</td>
                <td className="px-4 py-2.5 text-zinc-500">{a.adjustmentDate}</td>
                <td className="px-4 py-2.5 text-zinc-500">{t(ADJUSTMENT_TYPE_KEYS[a.type])}</td>
                <td className="px-4 py-2.5 text-zinc-500">{t(ADJUSTMENT_CATEGORY_KEYS[a.category])}</td>
                <td className="px-4 py-2.5 text-zinc-500">{a.warehouseName ?? t("produk.adjustments.unassigned")}</td>
                <td className="px-4 py-2.5 text-zinc-500">{a.lines.map((l) => l.productName).join(", ")}</td>
              </tr>
            ))}
            {adjustments && !adjustments.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  {t("produk.adjustments.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WarehouseTransfersTab({ reloadKey }: { reloadKey: number }) {
  const { t } = useLanguage();
  const [transfers, setTransfers] = useState<WarehouseTransfer[] | null>(null);

  useEffect(() => {
    api.warehouseTransfers().then(setTransfers).catch(() => {});
  }, [reloadKey]);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <a
          href="/b2b-produk/warehouse-transfers/new"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + {t("produk.warehouse.transfer.add")}
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("produk.warehouse.transfer.colNumber")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.warehouse.transfer.colDate")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.warehouse.transfer.colFrom")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.warehouse.transfer.colTo")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.warehouse.transfer.colProducts")}</th>
            </tr>
          </thead>
          <tbody>
            {transfers?.map((tr) => (
              <tr key={tr.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-2.5 font-mono text-xs">{tr.transferNumber}</td>
                <td className="px-4 py-2.5 text-zinc-500">{tr.transferDate}</td>
                <td className="px-4 py-2.5 text-zinc-500">{tr.fromWarehouseName ?? t("produk.adjustments.unassigned")}</td>
                <td className="px-4 py-2.5 text-zinc-500">{tr.toWarehouseName ?? t("produk.adjustments.unassigned")}</td>
                <td className="px-4 py-2.5 text-zinc-500">{tr.lines.map((l) => l.productName).join(", ")}</td>
              </tr>
            ))}
            {transfers && !transfers.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  {t("produk.warehouse.transfer.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WarehouseListTab({ reloadKey }: { reloadKey: number }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[] | null>(null);

  function load() {
    api.warehouses({ search: search || undefined, includeArchived: showArchived }).then(setWarehouses).catch(() => {});
  }

  useEffect(load, [showArchived, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
          {t("produk.warehouse.showArchived")}
        </label>

        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            onBlur={load}
            placeholder={t("produk.warehouse.searchPlaceholder")}
            className="w-full rounded-lg border border-zinc-200 py-1.5 pl-9 pr-3 text-sm"
          />
        </div>

        <a
          href="/b2b-produk/warehouses/new"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + {t("produk.actions.addWarehouse")}
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-4 py-3 font-medium">{t("produk.warehouse.colCode")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.warehouse.colName")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.warehouse.colPic")}</th>
              <th className="px-4 py-3 font-medium">{t("produk.warehouse.colAddress")}</th>
            </tr>
          </thead>
          <tbody>
            {warehouses?.map((w) => (
              <tr key={w.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-2.5 font-mono text-xs">{w.code}</td>
                <td className="px-4 py-2.5 font-medium text-zinc-800">{w.name}</td>
                <td className="px-4 py-2.5">
                  {w.pics.length ? (
                    <div className="flex flex-wrap gap-1">
                      {w.pics.map((pic) => (
                        <span key={pic.id} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                          {pic.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-zinc-500">{w.address ?? "-"}</td>
              </tr>
            ))}
            {warehouses && !warehouses.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                  {t("produk.warehouse.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ProdukPage() {
  const { t } = useLanguage();
  const [topTab, setTopTab] = useState<TopTab>("goods");
  const [goodsSubTab, setGoodsSubTab] = useState<GoodsSubTab>("list");
  const [warehouseSubTab, setWarehouseSubTab] = useState<WarehouseSubTab>("list");
  const [summary, setSummary] = useState<ProductListResult["summary"] | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [productsReloadKey, setProductsReloadKey] = useState(0);
  const [warehousesReloadKey, setWarehousesReloadKey] = useState(0);
  const [adjustmentsReloadKey, setAdjustmentsReloadKey] = useState(0);
  const [transfersReloadKey, setTransfersReloadKey] = useState(0);

  function loadSummary() {
    api.products().then((res) => setSummary(res.summary)).catch(() => {});
  }

  useEffect(loadSummary, [productsReloadKey, warehousesReloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Product/warehouse creation now open in a new browser tab (not a modal), so this tab
  // has no way to know when something was saved there -- refetch whenever the user
  // comes back.
  useEffect(() => {
    function onFocus() {
      setProductsReloadKey((k) => k + 1);
      setWarehousesReloadKey((k) => k + 1);
      setAdjustmentsReloadKey((k) => k + 1);
      setTransfersReloadKey((k) => k + 1);
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <div>
      <PageHeader
        title={t("produk.title")}
        action={
          <TindakanDropdown
            onAddProduct={() => window.open("/b2b-produk/new", "_blank", "noopener,noreferrer")}
            onAddWarehouse={() => window.open("/b2b-produk/warehouses/new", "_blank", "noopener,noreferrer")}
            onAddStockAdjustment={() => window.open("/b2b-produk/stock-adjustments/new", "_blank", "noopener,noreferrer")}
            onAddWarehouseTransfer={() => window.open("/b2b-produk/warehouse-transfers/new", "_blank", "noopener,noreferrer")}
          />
        }
      />

      <div className="mb-4 flex gap-1 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setTopTab("goods")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            topTab === "goods" ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          {t("produk.tabGoodsServices")}
        </button>
        <button
          type="button"
          onClick={() => setTopTab("warehouse")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            topTab === "warehouse" ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          {t("produk.tabWarehouse")}
        </button>
      </div>

      {summary && (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-emerald-200 bg-white p-4">
            <p className="text-sm font-medium text-zinc-700">{t("produk.summary.available")}</p>
            <p className="mt-3 text-xs text-zinc-500">{t("produk.summary.totalProduct")}</p>
            <p className="text-lg font-bold text-zinc-900">{summary.available}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-white p-4">
            <p className="text-sm font-medium text-zinc-700">{t("produk.summary.lowStock")}</p>
            <p className="mt-3 text-xs text-zinc-500">{t("produk.summary.totalProduct")}</p>
            <p className="text-lg font-bold text-zinc-900">{summary.lowStock}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-white p-4">
            <p className="text-sm font-medium text-zinc-700">{t("produk.summary.outOfStock")}</p>
            <p className="mt-3 text-xs text-zinc-500">{t("produk.summary.totalProduct")}</p>
            <p className="text-lg font-bold text-zinc-900">{summary.outOfStock}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-white p-4">
            <p className="text-sm font-medium text-zinc-700">{t("produk.summary.warehouse")}</p>
            <p className="mt-3 text-xs text-zinc-500">{t("produk.summary.registered")}</p>
            <p className="text-lg font-bold text-zinc-900">{summary.warehousesRegistered}</p>
          </div>
        </div>
      )}

      {topTab === "goods" && (
        <>
          <div className="mb-4 flex gap-1 border-b border-zinc-200">
            {(["list", "adjustments", "approval"] as const).map((tb) => (
              <button
                key={tb}
                type="button"
                onClick={() => setGoodsSubTab(tb)}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  goodsSubTab === tb ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {t(tb === "list" ? "produk.subTabList" : tb === "adjustments" ? "produk.subTabAdjustments" : "produk.subTabApproval")}
              </button>
            ))}
          </div>

          {goodsSubTab === "list" && (
            <ProductListTab
              showCategoryModal={showCategoryModal}
              onCloseCategoryModal={() => setShowCategoryModal(false)}
              reloadKey={productsReloadKey}
              onOpenCategoryModal={() => setShowCategoryModal(true)}
            />
          )}
          {goodsSubTab === "adjustments" && <StockAdjustmentsTab reloadKey={adjustmentsReloadKey} />}
          {goodsSubTab === "approval" && (
            <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center">
              <p className="font-medium text-zinc-700">{t("produk.approval.empty")}</p>
              <p className="mt-1 text-xs text-zinc-400">{t("produk.approval.emptyHint")}</p>
            </div>
          )}
        </>
      )}

      {topTab === "warehouse" && (
        <>
          <div className="mb-4 flex gap-1 border-b border-zinc-200">
            {(["list", "transfer", "approval"] as const).map((tb) => (
              <button
                key={tb}
                type="button"
                onClick={() => setWarehouseSubTab(tb)}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  warehouseSubTab === tb ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {t(tb === "list" ? "produk.warehouseSubTabList" : tb === "transfer" ? "produk.warehouseSubTabTransfer" : "produk.warehouseSubTabApproval")}
              </button>
            ))}
          </div>

          {warehouseSubTab === "list" && <WarehouseListTab reloadKey={warehousesReloadKey} />}
          {warehouseSubTab === "transfer" && <WarehouseTransfersTab reloadKey={transfersReloadKey} />}
          {warehouseSubTab === "approval" && (
            <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center">
              <p className="font-medium text-zinc-700">{t("produk.warehouse.approval.empty")}</p>
              <p className="mt-1 text-xs text-zinc-400">{t("produk.warehouse.approval.emptyHint")}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
