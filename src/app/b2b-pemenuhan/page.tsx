"use client";

import { FormEvent, useEffect, useState } from "react";
import { RefreshCw, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { Order, OrdersByStatus, OrderStatus, OrderType } from "@/lib/types";
import { Dropdown } from "@/components/ui/Dropdown";

type DateRangeKey = "today" | "7d" | "30d" | "all";

const STATUS_COLUMNS: { key: OrderStatus; headerClass: string }[] = [
  { key: "new", headerClass: "bg-indigo-50 text-indigo-800" },
  { key: "processing", headerClass: "bg-amber-50 text-amber-800" },
  { key: "shipping", headerClass: "bg-cyan-50 text-cyan-800" },
  { key: "completed", headerClass: "bg-emerald-50 text-emerald-800" },
  { key: "cancelled", headerClass: "bg-zinc-100 text-zinc-600" },
];

const DATE_RANGES: DateRangeKey[] = ["today", "7d", "30d", "all"];

function dateRangeToFrom(key: DateRangeKey): string | undefined {
  const now = new Date();
  if (key === "today") return now.toISOString().slice(0, 10);
  if (key === "7d") {
    now.setDate(now.getDate() - 6);
    return now.toISOString().slice(0, 10);
  }
  if (key === "30d") {
    now.setDate(now.getDate() - 29);
    return now.toISOString().slice(0, 10);
  }
  return undefined;
}

function OrderCard({ order, onMoved }: { order: Order; onMoved: () => void }) {
  const { t } = useLanguage();
  const [moving, setMoving] = useState(false);

  async function move(status: OrderStatus) {
    if (status === order.status) return;
    setMoving(true);
    try {
      await api.updateOrderStatus(order.id, status);
      onMoved();
    } finally {
      setMoving(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-zinc-500">{order.orderNumber}</span>
        <span className="text-xs text-zinc-400">{formatDate(order.orderDate)}</span>
      </div>
      <p className="mt-1 truncate text-sm font-medium text-zinc-800">{order.partyName}</p>
      <p className="text-sm font-semibold text-zinc-900">{formatRupiah(order.amount)}</p>
      {order.notes && <p className="mt-1 truncate text-xs text-zinc-400">{order.notes}</p>}

      <div className="mt-2">
        <Dropdown
          value={order.status}
          onChange={(v) => move(v as OrderStatus)}
          disabled={moving}
          className="text-xs"
          options={STATUS_COLUMNS.map((c) => ({ value: c.key, label: t(`pemenuhan.status.${c.key}`) }))}
        />
      </div>
    </div>
  );
}

function AddOrderModal({ type, onClose, onCreated }: { type: OrderType; onClose: () => void; onCreated: () => void }) {
  const { t } = useLanguage();
  const [partyName, setPartyName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createOrder({
        type,
        orderNumber: orderNumber || undefined,
        partyName,
        orderDate,
        amount: Number(amount) || 0,
        notes: notes || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pemenuhan.form.errorSave"));
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">{t("pemenuhan.addOrder")}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">{t(type === "sale" ? "pemenuhan.form.partyNameSale" : "pemenuhan.form.partyNamePurchase")} *</span>
            <input required value={partyName} onChange={(e) => setPartyName(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">{t("pemenuhan.form.orderNumber")}</span>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder={t("pemenuhan.form.orderNumberPlaceholder")}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">{t("pemenuhan.form.orderDate")} *</span>
            <input required type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">{t("pemenuhan.form.amount")}</span>
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">{t("pemenuhan.form.notes")}</span>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              {t("pemenuhan.form.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? t("pemenuhan.form.saving") : t("pemenuhan.form.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FulfillmentBoard({ type }: { type: OrderType }) {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRangeKey>("7d");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<OrdersByStatus | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    api
      .orders(type, { from: dateRangeToFrom(dateRange), search: search || undefined })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [type, dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Dropdown value={dateRange} onChange={(v) => setDateRange(v as DateRangeKey)} options={DATE_RANGES.map((r) => ({ value: r, label: t(`pemenuhan.dateRange.${r}`) }))} />
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> {t("pemenuhan.reload")}
        </button>

        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            onBlur={load}
            placeholder={t("pemenuhan.searchPlaceholder")}
            className="w-full rounded-lg border border-zinc-200 py-1.5 pl-9 pr-3 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + {t("pemenuhan.addOrder")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STATUS_COLUMNS.map((col) => {
          const orders = data?.[col.key] ?? [];
          return (
            <div key={col.key} className="min-w-[220px] rounded-xl border border-zinc-200 bg-zinc-50">
              <div className={`flex items-center justify-between rounded-t-xl px-3 py-2.5 text-sm font-semibold ${col.headerClass}`}>
                <span>{t(`pemenuhan.status.${col.key}`)}</span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/70 px-1.5 text-xs">{orders.length}</span>
              </div>
              <div className="space-y-2 p-2">
                {orders.map((o) => (
                  <OrderCard key={o.id} order={o} onMoved={load} />
                ))}
                {!orders.length && <p className="px-2 py-4 text-center text-xs text-zinc-400">{t("pemenuhan.emptyColumn")}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-zinc-400">{t("pemenuhan.note")}</p>

      {showAddModal && (
        <AddOrderModal
          type={type}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function PemenuhanPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<OrderType>("sale");

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-zinc-900 sm:text-2xl">{t("pemenuhan.title")}</h1>

      <div className="mb-4 flex gap-1 border-b border-zinc-200">
        {(["sale", "purchase"] as const).map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => setTab(tb)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === tb ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t(tb === "sale" ? "pemenuhan.tabSales" : "pemenuhan.tabPurchases")}
          </button>
        ))}
      </div>

      <FulfillmentBoard type={tab} />
    </div>
  );
}
