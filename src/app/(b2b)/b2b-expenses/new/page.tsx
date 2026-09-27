"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { CreateExpenseInput } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default function NewExpensePage() {
  const { t } = useLanguage();
  const router = useRouter();

  async function handleSubmit(input: CreateExpenseInput) {
    await api.createExpense(input);
    router.push("/b2b-expenses");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumb items={[{ label: t("expenses.title"), href: "/b2b-expenses" }, { label: t("expenseNew.title") }]} />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{t("expenseNew.title")}</h1>
      <ExpenseForm cancelHref="/b2b-expenses" submitLabel={t("expenseNew.save")} savingLabel={t("expenseNew.saving")} onSubmit={handleSubmit} />
    </div>
  );
}
