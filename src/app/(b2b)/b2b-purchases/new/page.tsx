"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { CreatePurchaseInput, PurchaseDocType } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PurchaseForm } from "@/components/purchases/PurchaseForm";
import { PurchaseRequestForm } from "@/components/purchases/PurchaseRequestForm";
import { PurchaseExchangeForm } from "@/components/purchases/PurchaseExchangeForm";

const DOC_TYPE_TITLE_KEY: Record<PurchaseDocType, string> = {
  request: "purchases.docTypeRequest",
  quotation: "purchases.docTypeQuotation",
  order: "purchases.docTypeOrder",
  invoice: "purchases.docTypeInvoice",
  exchange: "purchases.docTypeExchange",
  shipment: "purchases.docTypeShipment",
};

function NewPurchasePageInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const docType = (Object.keys(DOC_TYPE_TITLE_KEY).includes(searchParams.get("type") ?? "")
    ? searchParams.get("type")
    : "invoice") as PurchaseDocType;

  async function handleSubmit(input: CreatePurchaseInput) {
    const doc = await api.createPurchase(docType, input);
    router.push(`/b2b-purchases/${doc.id}`);
  }

  const title = `${t("purchases.new.title")} ${t(DOC_TYPE_TITLE_KEY[docType])}`;

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumb items={[{ label: t("purchases.title"), href: "/b2b-purchases" }, { label: title }]} />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{title}</h1>
      {docType === "request" ? (
        <PurchaseRequestForm cancelHref="/b2b-purchases" onSubmit={handleSubmit} />
      ) : docType === "exchange" ? (
        <PurchaseExchangeForm cancelHref="/b2b-purchases" onSubmit={handleSubmit} />
      ) : (
        <PurchaseForm docType={docType} cancelHref="/b2b-purchases" onSubmit={handleSubmit} />
      )}
    </div>
  );
}

export default function NewPurchasePage() {
  return (
    <Suspense fallback={null}>
      <NewPurchasePageInner />
    </Suspense>
  );
}
