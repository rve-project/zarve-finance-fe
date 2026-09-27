"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, TrendingDown } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Account } from "@/lib/types";
import { pickDefaultAccount } from "@/lib/accountDefaults";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";
import { HelpHint } from "@/components/ui/HelpHint";

function SectionHeading({ icon: Icon, title }: { icon: typeof FileText; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function NewFixedAssetPageInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const sourceJournalLineId = searchParams.get("sourceJournalLineId");
  const isFromPending = !!sourceJournalLineId;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState(searchParams.get("name") ?? "");
  const [assetNumber, setAssetNumber] = useState("");
  const [categoryAccountId, setCategoryAccountId] = useState(searchParams.get("categoryAccountId") ?? "");
  const [acquisitionDate, setAcquisitionDate] = useState(searchParams.get("date") ?? today());
  const [acquisitionCost, setAcquisitionCost] = useState(searchParams.get("amount") ?? "");
  const [creditAccountId, setCreditAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [isNonDepreciating, setIsNonDepreciating] = useState(false);
  const [methods, setMethods] = useState<string[]>([]);
  const [depreciationMethod, setDepreciationMethod] = useState("");
  const [usefulLifeYears, setUsefulLifeYears] = useState("");
  const [depreciationExpenseAccountId, setDepreciationExpenseAccountId] = useState("");
  const [accumulatedDepreciationAccountId, setAccumulatedDepreciationAccountId] = useState("");
  const [openingAccumulated, setOpeningAccumulated] = useState("");
  const [openingAccumulatedDate, setOpeningAccumulatedDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Every account is selectable (not just the "expected" type) -- the user picks, we
    // just pre-fill a sensible default so the common case needs no extra clicks.
    api.accounts().then((list) => {
      setAccounts(list);
      setAssetNumber(String(10001));

      const fixedAssetDefault =
        list.find((a) => a.type === "asset" && a.code.startsWith("15") && !/akumulasi|accumulated/i.test(a.name)) ??
        pickDefaultAccount(list, { codePrefix: "15", type: "asset" });
      if (fixedAssetDefault) setCategoryAccountId((cur) => cur || String(fixedAssetDefault.id));

      const cashDefault = pickDefaultAccount(list, { nameIncludes: "kas", codePrefix: "11", type: "asset" });
      if (cashDefault) setCreditAccountId((cur) => cur || String(cashDefault.id));

      const expenseDefault = pickDefaultAccount(list, { codePrefix: "52", type: "expense" });
      if (expenseDefault) setDepreciationExpenseAccountId((cur) => cur || String(expenseDefault.id));

      const accumulatedDefault = pickDefaultAccount(list, { nameIncludes: "akumulasi", codePrefix: "15", type: "asset" });
      if (accumulatedDefault) setAccumulatedDepreciationAccountId((cur) => cur || String(accumulatedDefault.id));
    });
    api.fixedAssetsDepreciationMethods().then((list) => {
      setMethods(list);
      if (list.length) setDepreciationMethod(list[0]);
    });
  }, []);

  const ratePercent = usefulLifeYears && Number(usefulLifeYears) > 0 ? (100 / Number(usefulLifeYears)).toFixed(1) : "";

  function handleRateChange(value: string) {
    const rate = Number(value);
    if (rate > 0) setUsefulLifeYears((100 / rate).toFixed(2));
    else setUsefulLifeYears("");
  }

  const anyAccountOptions = accounts.map((a) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }));
  // Only "straight_line" has a translated label today -- an unrecognized future value
  // still shows up (raw), it just won't be pretty until a label is added here.
  const methodLabel = (value: string) => (value === "straight_line" ? t("fixedAssets.depreciation.methodStraightLine") : value);
  const methodOptions = methods.map((m) => ({ value: m, label: methodLabel(m) }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createFixedAsset({
        name,
        assetNumber: assetNumber || undefined,
        categoryAccountId: Number(categoryAccountId),
        acquisitionDate,
        acquisitionCost: Number(acquisitionCost),
        creditAccountId: isFromPending ? undefined : Number(creditAccountId),
        description: description || undefined,
        isNonDepreciating,
        depreciationMethod: isNonDepreciating ? undefined : (depreciationMethod as "straight_line") || undefined,
        usefulLifeYears: isNonDepreciating ? undefined : Number(usefulLifeYears) || undefined,
        depreciationExpenseAccountId: isNonDepreciating ? undefined : Number(depreciationExpenseAccountId) || undefined,
        accumulatedDepreciationAccountId: isNonDepreciating ? undefined : Number(accumulatedDepreciationAccountId) || undefined,
        openingAccumulatedDepreciation: isNonDepreciating ? undefined : Number(openingAccumulated) || undefined,
        openingAccumulatedDepreciationDate: isNonDepreciating ? undefined : openingAccumulatedDate || undefined,
        sourceJournalLineId: sourceJournalLineId ? Number(sourceJournalLineId) : undefined,
      });
      router.push("/b2b-fixed-assets");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("fixedAssets.new.errorSave"));
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400";

  return (
    <div className="mx-auto max-w-5xl">
      <Breadcrumb items={[{ label: t("fixedAssets.breadcrumb"), href: "/b2b-fixed-assets" }, { label: t("fixedAssets.new.title") }]} />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{t("fixedAssets.new.title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {isFromPending && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{t("fixedAssets.new.fromPending")}</p>}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionHeading icon={FileText} title={t("fixedAssets.new.sectionDetail")} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("fixedAssets.new.name")} *</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("fixedAssets.new.acquisitionDate")}</span>
              <DatePicker value={acquisitionDate} onChange={setAcquisitionDate} maxDate={today()} />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
                {t("fixedAssets.new.assetNumber")} <HelpHint text={t("fixedAssets.new.hint.assetNumber")} />
              </span>
              <input value={assetNumber} onChange={(e) => setAssetNumber(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("fixedAssets.new.acquisitionCost")} *</span>
              <input
                required
                type="number"
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
                {t("fixedAssets.new.categoryAccount")} * <HelpHint text={t("fixedAssets.new.hint.categoryAccount")} />
              </span>
              <Dropdown value={categoryAccountId} onChange={setCategoryAccountId} options={anyAccountOptions} />
            </label>
            {!isFromPending && (
              <label className="block text-sm">
                <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
                  {t("fixedAssets.new.creditAccount")} * <HelpHint text={t("fixedAssets.new.hint.creditAccount")} />
                </span>
                <Dropdown value={creditAccountId} onChange={setCreditAccountId} options={anyAccountOptions} />
              </label>
            )}

            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("fixedAssets.new.description")}</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionHeading icon={TrendingDown} title={t("fixedAssets.new.sectionDepreciation")} />

          <label className="mb-5 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isNonDepreciating}
              onChange={(e) => setIsNonDepreciating(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-zinc-700">{t("fixedAssets.new.nonDepreciating")}</span>
          </label>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
                {t("fixedAssets.new.method")} <HelpHint text={t("fixedAssets.new.hint.method")} />
              </span>
              <Dropdown value={depreciationMethod} onChange={setDepreciationMethod} disabled={isNonDepreciating} options={methodOptions} />
            </label>
            <div />

            <label className="block text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
                {t("fixedAssets.new.usefulLife")} ({t("fixedAssets.new.usefulLifeUnit")}) <HelpHint text={t("fixedAssets.new.hint.usefulLife")} />
              </span>
              <input
                disabled={isNonDepreciating}
                type="number"
                min={0}
                value={usefulLifeYears}
                onChange={(e) => setUsefulLifeYears(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
                {t("fixedAssets.new.ratePerYear")} ({t("fixedAssets.new.ratePercent")}) <HelpHint text={t("fixedAssets.new.hint.ratePerYear")} />
              </span>
              <input disabled={isNonDepreciating} type="number" min={0} value={ratePercent} onChange={(e) => handleRateChange(e.target.value)} className={inputClass} />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
                {t("fixedAssets.new.depreciationAccount")} <HelpHint text={t("fixedAssets.new.hint.depreciationAccount")} />
              </span>
              <Dropdown
                value={depreciationExpenseAccountId}
                onChange={setDepreciationExpenseAccountId}
                disabled={isNonDepreciating}
                options={anyAccountOptions}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
                {t("fixedAssets.new.accumulatedAccount")} <HelpHint text={t("fixedAssets.new.hint.accumulatedAccount")} />
              </span>
              <Dropdown
                value={accumulatedDepreciationAccountId}
                onChange={setAccumulatedDepreciationAccountId}
                disabled={isNonDepreciating}
                options={anyAccountOptions}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("fixedAssets.new.openingAccumulated")}</span>
              <input
                disabled={isNonDepreciating}
                type="number"
                min={0}
                value={openingAccumulated}
                onChange={(e) => setOpeningAccumulated(e.target.value)}
                className={inputClass}
              />
              <span className="mt-1 block text-xs text-zinc-400">{t("fixedAssets.new.openingAccumulatedHint")}</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
                {t("fixedAssets.new.openingAccumulatedDate")} <HelpHint text={t("fixedAssets.new.hint.openingAccumulatedDate")} />
              </span>
              <DatePicker value={openingAccumulatedDate} onChange={setOpeningAccumulatedDate} maxDate={today()} />
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <Link href="/b2b-fixed-assets" className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            {t("fixedAssets.new.cancel")}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? t("fixedAssets.new.saving") : t("fixedAssets.new.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewFixedAssetPage() {
  return (
    <Suspense fallback={null}>
      <NewFixedAssetPageInner />
    </Suspense>
  );
}
