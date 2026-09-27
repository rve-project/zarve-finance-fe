"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { CreateSaleInput, SaleDocumentDetail } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SaleForm } from "@/components/sales/SaleForm";
import { SaleExchangeForm } from "@/components/sales/SaleExchangeForm";

export default function EditSalePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [doc, setDoc] = useState<SaleDocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSale(Number(id))
      .then(setDoc)
      .catch((err) => setError(err instanceof Error ? err.message : t("sales.errorLoading")));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(input: CreateSaleInput) {
    await api.updateSale(Number(id), input);
    router.push(`/b2b-sales/${id}`);
  }

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!doc) return <p className="text-sm text-zinc-400">{t("common.loading")}</p>;

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumb
        items={[
          { label: t("sales.title"), href: "/b2b-sales" },
          { label: doc.number, href: `/b2b-sales/${id}` },
          { label: t("sales.new.editTitle") },
        ]}
      />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">
        {t("sales.new.editTitle")} {doc.number}
      </h1>
      {doc.docType === "exchange" ? (
        <SaleExchangeForm initial={doc} cancelHref={`/b2b-sales/${id}`} onSubmit={handleSubmit} />
      ) : (
        <SaleForm docType={doc.docType} initial={doc} cancelHref={`/b2b-sales/${id}`} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
