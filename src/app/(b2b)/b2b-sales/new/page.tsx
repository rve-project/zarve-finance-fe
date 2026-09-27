"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { CreateSaleInput, SaleDocType } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SaleForm } from "@/components/sales/SaleForm";
import { SaleExchangeForm } from "@/components/sales/SaleExchangeForm";

const DOC_TYPE_TITLE_KEY: Record<SaleDocType, string> = {
  quotation: "sales.docTypeQuotation",
  order: "sales.docTypeOrder",
  invoice: "sales.docTypeInvoice",
  shipment: "sales.docTypeShipment",
  exchange: "sales.docTypeExchange",
};

function NewSalePageInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const docType = (Object.keys(DOC_TYPE_TITLE_KEY).includes(searchParams.get("type") ?? "")
    ? searchParams.get("type")
    : "invoice") as SaleDocType;

  async function handleSubmit(input: CreateSaleInput) {
    const doc = await api.createSale(docType, input);
    router.push(`/b2b-sales/${doc.id}`);
  }

  const title = `${t("purchases.new.title")} ${t(DOC_TYPE_TITLE_KEY[docType])}`;

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumb items={[{ label: t("sales.title"), href: "/b2b-sales" }, { label: title }]} />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{title}</h1>
      {docType === "exchange" ? (
        <SaleExchangeForm cancelHref="/b2b-sales" onSubmit={handleSubmit} />
      ) : (
        <SaleForm docType={docType} cancelHref="/b2b-sales" onSubmit={handleSubmit} />
      )}
    </div>
  );
}

export default function NewSalePage() {
  return (
    <Suspense fallback={null}>
      <NewSalePageInner />
    </Suspense>
  );
}
