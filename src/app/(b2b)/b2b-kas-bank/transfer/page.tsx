"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Account } from "@/lib/types";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";

function today() {
  return new Date().toISOString().slice(0, 10);
}

// "Transfer Uang" moves cash between two of the business's own cash/bank accounts --
// a balanced 2-line manual journal entry (debit "Setor Ke", credit "Transfer Dari"),
// posted through the existing generic POST /journal-entries endpoint.
function TransferMoneyPageInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetAccountId = searchParams.get("accountId") ?? "";

  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [fromAccountId, setFromAccountId] = useState(presetAccountId);
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.accounts(undefined, "cash_bank").then(setBankAccounts).catch(() => {});
  }, []);

  const bankOptions = bankAccounts.map((a) => ({ value: String(a.id), label: `(${a.code}) - ${a.name}` }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNum = Number(amount);
    if (!fromAccountId || !toAccountId || !amountNum || amountNum <= 0 || !date || fromAccountId === toAccountId) {
      setError(t("kasBank.errorFillFields"));
      return;
    }

    setSaving(true);
    try {
      await api.createJournalEntry({
        date,
        ref: number || undefined,
        narration: `${t("kasBank.transferPageTitle")}${memo ? ` - ${memo}` : ""}`,
        lines: [
          { accountId: Number(toAccountId), debit: amountNum, credit: 0 },
          { accountId: Number(fromAccountId), debit: 0, credit: amountNum },
        ],
      });
      router.push("/b2b-kas-bank");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("kasBank.errorSave"));
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="mx-auto max-w-5xl">
      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5 sm:px-8">
          <p className="text-xs text-zinc-400">{t("kasBank.transaction")}</p>
          <h1 className="text-lg font-bold text-emerald-700 sm:text-xl">{t("kasBank.transferPageTitle")}</h1>
        </div>

        {error && <p className="mx-6 mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:mx-8">{error}</p>}

        <div className="grid grid-cols-1 gap-5 border-b border-zinc-100 bg-sky-50/50 px-6 py-6 sm:grid-cols-3 sm:px-8">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("kasBank.fromAccount")}</span>
            <Dropdown value={fromAccountId} onChange={setFromAccountId} options={bankOptions} placeholder={t("kasBank.accountPlaceholder")} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("kasBank.toAccount")}</span>
            <Dropdown value={toAccountId} onChange={setToAccountId} options={bankOptions} placeholder={t("kasBank.accountPlaceholder")} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("kasBank.amount")}</span>
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 sm:px-8">
          <label className="block text-sm sm:col-span-2 lg:col-span-1">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("kasBank.memo")}</span>
            <textarea rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} className={`${inputClass} resize-none`} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("kasBank.number")}</span>
            <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={t("kasBank.numberAuto")} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("kasBank.date")}</span>
            <DatePicker value={date} onChange={setDate} />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50 px-6 py-4 sm:px-8">
          <Link href="/b2b-kas-bank" className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
            {t("kasBank.cancel")}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40"
          >
            {saving ? t("kasBank.saving") : t("kasBank.createTransfer")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TransferMoneyPage() {
  return (
    <Suspense fallback={null}>
      <TransferMoneyPageInner />
    </Suspense>
  );
}
