"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { CreatePurchaseInput, PurchaseDocumentDetail } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PurchaseForm } from "@/components/purchases/PurchaseForm";
import { PurchaseRequestForm } from "@/components/purchases/PurchaseRequestForm";
import { PurchaseExchangeForm } from "@/components/purchases/PurchaseExchangeForm";

export default function EditPurchasePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [doc, setDoc] = useState<PurchaseDocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPurchase(Number(id))
      .then(setDoc)
      .catch((err) => setError(err instanceof Error ? err.message : t("purchases.errorLoading")));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(input: CreatePurchaseInput) {
    await api.updatePurchase(Number(id), input);
    router.push(`/b2b-purchases/${id}`);
  }

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!doc) return <p className="text-sm text-zinc-400">{t("common.loading")}</p>;

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumb
        items={[
          { label: t("purchases.title"), href: "/b2b-purchases" },
          { label: doc.number, href: `/b2b-purchases/${id}` },
          { label: t("purchases.new.editTitle") },
        ]}
      />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">
        {t("purchases.new.editTitle")} {doc.number}
      </h1>
      {doc.docType === "request" ? (
        <PurchaseRequestForm initial={doc} cancelHref={`/b2b-purchases/${id}`} onSubmit={handleSubmit} />
      ) : doc.docType === "exchange" ? (
        <PurchaseExchangeForm initial={doc} cancelHref={`/b2b-purchases/${id}`} onSubmit={handleSubmit} />
      ) : (
        <PurchaseForm docType={doc.docType} initial={doc} cancelHref={`/b2b-purchases/${id}`} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
