"use client";

import { Fragment, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatDate, formatRupiah } from "@/lib/format";
import { Account, ActiveFixedAsset, DepreciationScheduleRow, DisposedFixedAsset, FixedAssetRevaluation, PendingFixedAsset } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dropdown } from "@/components/ui/Dropdown";
import { MonthPicker } from "@/components/ui/MonthPicker";

type Tab = "pending" | "active" | "disposed" | "depreciation";

/** Empty-state message for Pending/Active/Depreciation tabs -- "Tambahkan di sini"
 * isn't wired to anything yet (no purchase-invoice flow to link it to), but "Simpan
 * di sini" is real: it goes straight to the create-asset form. */
function EmptyAssetHint({ heading }: { heading: string }) {
  const { t } = useLanguage();
  return (
    <div className="py-1">
      <p className="font-medium text-emerald-700">{heading}</p>
      <p className="mt-1.5 text-xs text-zinc-500">
        {t("fixedAssets.emptyHint.addNewPrefix")} <span className="text-zinc-400">{t("fixedAssets.emptyHint.addNewLink")}</span>
      </p>
      <p className="text-xs text-zinc-500">
        {t("fixedAssets.emptyHint.saveFromJournalPrefix")}{" "}
        <Link href="/b2b-fixed-assets/new" className="font-medium text-emerald-600 hover:underline">
          {t("fixedAssets.emptyHint.saveFromJournalLink")}
        </Link>
      </p>
    </div>
  );
}

function PendingTab() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<PendingFixedAsset[] | null>(null);

  useEffect(() => {
    api.fixedAssetsPending().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-zinc-900">{t("fixedAssets.pending.heading")}</h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sky-100 bg-sky-50 text-left text-zinc-600">
              <th className="px-4 py-3 font-medium">{t("fixedAssets.pending.colDate")}</th>
              <th className="px-4 py-3 font-medium">{t("fixedAssets.pending.colItem")}</th>
              <th className="px-4 py-3 font-medium">{t("fixedAssets.pending.colRef")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("fixedAssets.pending.colCost")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.journalLineId} className="border-b border-zinc-50">
                <td className="px-4 py-2.5">{formatDate(r.date)}</td>
                <td className="px-4 py-2.5">
                  {r.description ?? `${r.accountCode} - ${r.accountName}`}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{r.ref ?? "-"}</td>
                <td className="px-4 py-2.5 text-right">{formatRupiah(r.amount)}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/b2b-fixed-assets/new?sourceJournalLineId=${r.journalLineId}&name=${encodeURIComponent(
                      r.description ?? r.accountName
                    )}&categoryAccountId=${r.accountId}&amount=${r.amount}&date=${r.date}`}
                    className="text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    {t("fixedAssets.pending.activate")}
                  </Link>
                </td>
              </tr>
            ))}
            {rows && !rows.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <EmptyAssetHint heading={t("fixedAssets.pending.empty")} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DisposeForm({ asset, onDone, onCancel }: { asset: ActiveFixedAsset; onDone: () => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [disposalDate, setDisposalDate] = useState(new Date().toISOString().slice(0, 10));
  const [disposalAmount, setDisposalAmount] = useState("");
  const [receivedAccountId, setReceivedAccountId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.accounts().then(setAccounts).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.disposeFixedAsset(asset.id, {
        disposalDate,
        disposalAmount: Number(disposalAmount),
        receivedAccountId: Number(receivedAccountId),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("fixedAssets.dispose.errorSave"));
      setSubmitting(false);
    }
  }

  return (
    <tr className="border-b border-zinc-50 bg-zinc-50">
      <td colSpan={6} className="px-4 py-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-4">{error}</p>}
          <p className="text-xs text-zinc-500 sm:col-span-4">
            {t("fixedAssets.dispose.bookValuePreview")}: <strong>{formatRupiah(asset.bookValue)}</strong>
          </p>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">{t("fixedAssets.dispose.dateLabel")}</span>
            <input
              required
              type="date"
              value={disposalDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDisposalDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">{t("fixedAssets.dispose.amountLabel")}</span>
            <input
              required
              type="number"
              value={disposalAmount}
              onChange={(e) => setDisposalAmount(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">{t("fixedAssets.dispose.accountLabel")}</span>
            <Dropdown value={receivedAccountId} onChange={setReceivedAccountId} options={accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))} />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? t("fixedAssets.dispose.submitting") : t("fixedAssets.dispose.submit")}
            </button>
            <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
              {t("fixedAssets.active.cancel")}
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

function RevalueForm({ asset, onDone, onCancel }: { asset: ActiveFixedAsset; onDone: () => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [revaluationDate, setRevaluationDate] = useState(new Date().toISOString().slice(0, 10));
  const [newValue, setNewValue] = useState("");
  const [adjustmentAccountId, setAdjustmentAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.accounts().then(setAccounts).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.revalueFixedAsset(asset.id, {
        revaluationDate,
        newValue: Number(newValue),
        adjustmentAccountId: Number(adjustmentAccountId),
        notes: notes || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("fixedAssets.revalue.errorSave"));
      setSubmitting(false);
    }
  }

  return (
    <tr className="border-b border-zinc-50 bg-zinc-50">
      <td colSpan={6} className="px-4 py-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-4">{error}</p>}
          <p className="text-xs text-zinc-500 sm:col-span-4">
            {t("fixedAssets.revalue.bookValuePreview")}: <strong>{formatRupiah(asset.bookValue)}</strong>
          </p>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">{t("fixedAssets.revalue.dateLabel")}</span>
            <input
              required
              type="date"
              value={revaluationDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setRevaluationDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">{t("fixedAssets.revalue.newValueLabel")}</span>
            <input
              required
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">{t("fixedAssets.revalue.accountLabel")}</span>
            <Dropdown
              value={adjustmentAccountId}
              onChange={setAdjustmentAccountId}
              options={accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">{t("fixedAssets.revalue.notesLabel")}</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? t("fixedAssets.revalue.submitting") : t("fixedAssets.revalue.submit")}
            </button>
            <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
              {t("fixedAssets.active.cancel")}
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

function RevaluationHistory({ assetId }: { assetId: number }) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<FixedAssetRevaluation[] | null>(null);

  useEffect(() => {
    api.fixedAssetRevaluations(assetId).then(setRows).catch(() => setRows([]));
  }, [assetId]);

  if (!rows || !rows.length) return null;

  return (
    <tr className="border-b border-zinc-50 bg-zinc-50/60">
      <td colSpan={6} className="px-4 py-3">
        <p className="mb-2 text-xs font-semibold text-zinc-600">{t("fixedAssets.revalue.historyHeading")}</p>
        <table className="w-full text-xs">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100">
                <td className="py-1.5 text-zinc-500">{formatDate(r.revaluationDate)}</td>
                <td className="py-1.5 text-zinc-500">
                  {formatRupiah(r.previousBookValue)} → {formatRupiah(r.newValue)}
                </td>
                <td className={`py-1.5 text-right font-medium ${r.adjustmentAmount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatRupiah(r.adjustmentAmount)}
                </td>
                <td className="py-1.5 text-right text-zinc-400">{r.createdByName ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}

function ActiveTab() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ActiveFixedAsset[] | null>(null);
  const [disposingId, setDisposingId] = useState<number | null>(null);
  const [revaluingId, setRevaluingId] = useState<number | null>(null);
  const [historyId, setHistoryId] = useState<number | null>(null);

  function load() {
    api.fixedAssetsActive().then(setRows).catch(() => setRows([]));
  }

  useEffect(load, []);

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-zinc-900">{t("fixedAssets.active.heading")}</h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sky-100 bg-sky-50 text-left text-zinc-600">
              <th className="px-4 py-3 font-medium">{t("fixedAssets.active.colDate")}</th>
              <th className="px-4 py-3 font-medium">{t("fixedAssets.active.colDetail")}</th>
              <th className="px-4 py-3 font-medium">{t("fixedAssets.active.colAccount")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("fixedAssets.active.colCost")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("fixedAssets.active.colBookValue")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((a) => (
              <Fragment key={a.id}>
                <tr className="border-b border-zinc-50">
                  <td className="px-4 py-2.5">{formatDate(a.acquisitionDate)}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-zinc-800">{a.name}</span>{" "}
                    <span className="font-mono text-xs text-zinc-400">#{a.assetNumber}</span>
                    {a.assetType === "vehicle" && (
                      <>
                        {" "}
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-600">
                          {t("fixedAssets.assetTypeVehicleBadge")} · {a.plateNumber}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">{a.categoryAccountCode} - {a.categoryAccountName}</td>
                  <td className="px-4 py-2.5 text-right">{formatRupiah(a.acquisitionCost)}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatRupiah(a.bookValue)}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setHistoryId(historyId === a.id ? null : a.id)}
                      className="mr-3 text-xs font-semibold text-zinc-500 hover:underline"
                    >
                      {t("fixedAssets.revalue.historyToggle")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevaluingId(revaluingId === a.id ? null : a.id)}
                      className="mr-3 text-xs font-semibold text-sky-600 hover:underline"
                    >
                      {t("fixedAssets.revalue.action")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisposingId(disposingId === a.id ? null : a.id)}
                      className="text-xs font-semibold text-amber-600 hover:underline"
                    >
                      {t("fixedAssets.active.dispose")}
                    </button>
                  </td>
                </tr>
                {historyId === a.id && <RevaluationHistory assetId={a.id} />}
                {revaluingId === a.id && (
                  <RevalueForm
                    asset={a}
                    onCancel={() => setRevaluingId(null)}
                    onDone={() => {
                      setRevaluingId(null);
                      load();
                    }}
                  />
                )}
                {disposingId === a.id && (
                  <DisposeForm
                    asset={a}
                    onCancel={() => setDisposingId(null)}
                    onDone={() => {
                      setDisposingId(null);
                      load();
                    }}
                  />
                )}
              </Fragment>
            ))}
            {rows && !rows.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <EmptyAssetHint heading={t("fixedAssets.active.empty")} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DisposedTab() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<DisposedFixedAsset[] | null>(null);

  useEffect(() => {
    api.fixedAssetsDisposed().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-zinc-900">{t("fixedAssets.disposed.heading")}</h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sky-100 bg-sky-50 text-left text-zinc-600">
              <th className="px-4 py-3 font-medium">{t("fixedAssets.disposed.colDate")}</th>
              <th className="px-4 py-3 font-medium">{t("fixedAssets.disposed.colDetail")}</th>
              <th className="px-4 py-3 font-medium">{t("fixedAssets.disposed.colRef")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("fixedAssets.disposed.colSalePrice")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("fixedAssets.disposed.colGainLoss")}</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((a) => (
              <tr key={a.id} className="border-b border-zinc-50">
                <td className="px-4 py-2.5">{a.disposalDate ? formatDate(a.disposalDate) : "-"}</td>
                <td className="px-4 py-2.5">
                  <span className="font-medium text-zinc-800">{a.name}</span>{" "}
                  <span className="font-mono text-xs text-zinc-400">#{a.assetNumber}</span>
                  {a.assetType === "vehicle" && (
                    <>
                      {" "}
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-600">
                        {t("fixedAssets.assetTypeVehicleBadge")} · {a.plateNumber}
                      </span>
                    </>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{a.disposalJournalEntryId ? `LEPAS-${a.assetNumber}` : "-"}</td>
                <td className="px-4 py-2.5 text-right">{a.disposalAmount !== null ? formatRupiah(a.disposalAmount) : "-"}</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${a.gainLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatRupiah(a.gainLoss)}
                </td>
              </tr>
            ))}
            {rows && !rows.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <p className="font-medium text-emerald-700">{t("fixedAssets.disposed.empty")}</p>
                  <p className="mt-1.5 text-xs text-zinc-500">{t("fixedAssets.disposed.emptyHint")}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DepreciationTab() {
  const { t } = useLanguage();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<DepreciationScheduleRow[] | null>(null);

  useEffect(() => {
    setRows(null);
    api.fixedAssetsDepreciationSchedule(month).then((res) => setRows(res.data)).catch(() => setRows([]));
  }, [month]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">{t("fixedAssets.tabDepreciation")}</h2>
        <MonthPicker value={month} onChange={setMonth} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sky-100 bg-sky-50 text-left text-zinc-600">
              <th className="px-4 py-3 font-medium">{t("fixedAssets.depreciation.colDetail")}</th>
              <th className="px-4 py-3 font-medium">{t("fixedAssets.depreciation.colPeriod")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("fixedAssets.depreciation.colValue")}</th>
              <th className="px-4 py-3 font-medium">{t("fixedAssets.depreciation.colMethod")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("fixedAssets.depreciation.colAmount")}</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.assetId} className="border-b border-zinc-50">
                <td className="px-4 py-2.5">
                  <span className="font-medium text-zinc-800">{r.assetName}</span>{" "}
                  <span className="font-mono text-xs text-zinc-400">#{r.assetNumber}</span>
                </td>
                <td className="px-4 py-2.5">{r.period}</td>
                <td className="px-4 py-2.5 text-right">{formatRupiah(r.value)}</td>
                <td className="px-4 py-2.5">{t("fixedAssets.depreciation.methodStraightLine")}</td>
                <td className="px-4 py-2.5 text-right font-medium">{formatRupiah(r.amount)}</td>
              </tr>
            ))}
            {rows && !rows.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <EmptyAssetHint heading={t("fixedAssets.depreciation.empty")} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-zinc-400">{t("fixedAssets.depreciation.note")}</p>
    </div>
  );
}

export default function FixedAssetsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("active");

  const tabs: { key: Tab; labelKey: string }[] = [
    { key: "pending", labelKey: "fixedAssets.tabPending" },
    { key: "active", labelKey: "fixedAssets.tabActive" },
    { key: "disposed", labelKey: "fixedAssets.tabDisposed" },
    { key: "depreciation", labelKey: "fixedAssets.tabDepreciation" },
  ];

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{t("fixedAssets.breadcrumb")}</p>
      <PageHeader
        title={t("fixedAssets.title")}
        action={
          <Link href="/b2b-fixed-assets/new" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            + {t("fixedAssets.addAsset")}
          </Link>
        }
      />

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex gap-1 border-b border-zinc-200">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              type="button"
              onClick={() => setTab(tb.key)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === tb.key ? "border-emerald-600 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {t(tb.labelKey)}
            </button>
          ))}
        </div>

        {tab === "pending" && <PendingTab />}
        {tab === "active" && <ActiveTab />}
        {tab === "disposed" && <DisposedTab />}
        {tab === "depreciation" && <DepreciationTab />}
      </div>
    </div>
  );
}
