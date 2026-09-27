"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { CreateExpenseInput, ExpenseDetail } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default function EditExpensePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getExpense(Number(id))
      .then(setExpense)
      .catch((err) => setError(err instanceof Error ? err.message : t("expenseDetail.errorLoading")));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(input: CreateExpenseInput) {
    await api.updateExpense(Number(id), input);
    router.push(`/b2b-expenses/${id}`);
  }

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!expense) return <p className="text-sm text-zinc-400">{t("common.loading")}</p>;

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumb
        items={[
          { label: t("expenses.title"), href: "/b2b-expenses" },
          { label: expense.number, href: `/b2b-expenses/${id}` },
          { label: t("expenseNew.editTitle") },
        ]}
      />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{t("expenseNew.editTitle")}</h1>
      <ExpenseForm
        initial={expense}
        cancelHref={`/b2b-expenses/${id}`}
        submitLabel={t("expenseNew.saveChanges")}
        savingLabel={t("expenseNew.saving")}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
