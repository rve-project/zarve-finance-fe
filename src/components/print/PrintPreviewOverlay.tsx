"use client";

import { ChangeEvent, ReactNode, useEffect, useState } from "react";
import { Banknote, Building2, Eye, ImagePlus, Printer, StickyNote, X } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { DocumentSettings } from "@/lib/types";
import { DocumentPrintTemplate, PrintDocumentData } from "./DocumentPrintTemplate";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api").replace(/\/api\/?$/, "");

const DEFAULT_SETTINGS: DocumentSettings = {
  companyName: "",
  address: "",
  phone: "",
  email: "",
  logoUrl: null,
  bankName: "",
  bankAccountNumber: "",
  bankAccountHolder: "",
  showLogo: true,
  showBankInfo: true,
  showPaymentTerm: true,
  showNotes: true,
  footerNote: "",
};

const TOGGLES = [
  ["showLogo", "documentSettings.showLogo"],
  ["showBankInfo", "documentSettings.showBankInfo"],
  ["showPaymentTerm", "documentSettings.showPaymentTerm"],
  ["showNotes", "documentSettings.showNotes"],
] as const;

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

function SidebarSection({ icon: Icon, title, children }: { icon: typeof Eye; title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      </div>
      {children}
    </section>
  );
}

/**
 * Opened from a document detail page's "Cetak" button instead of calling window.print()
 * directly -- shows the branded print template live on screen in a side-panel layout
 * (controls on the left, scrollable preview on the right), with EVERYTHING about it
 * (company profile, logo, bank account, which sections show, footer note) editable right
 * here. There is deliberately no separate "Template Dokumen" settings page anymore --
 * this overlay IS where that lives, wherever it's opened from. "Simpan sebagai default"
 * persists the current edits to document_settings so the next print (any document, any
 * page) starts from them; closing without saving discards the tweak.
 */
export function PrintPreviewOverlay({ doc, onClose }: { doc: PrintDocumentData; onClose: () => void }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<DocumentSettings | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .documentSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS));
  }, []);

  function patch(p: Partial<DocumentSettings>) {
    setSettings((prev) => (prev ? { ...prev, ...p } : prev));
    setSaved(false);
  }

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadDocumentLogo(file);
      patch({ logoUrl: res.url });
    } catch {
      // Upload failure just leaves the logo as it was -- a missing logo is low-stakes
      // compared to the document itself, so this stays quiet rather than adding an
      // error slot to an already-dense sidebar.
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveDefault() {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await api.updateDocumentSettings(settings);
      setSettings(updated);
      setSaved(true);
    } catch {
      // Same reasoning as the logo upload -- this is a convenience save, not required to print.
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-zinc-100 print:static print:block print:bg-white md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-zinc-200 bg-white print:hidden md:h-full md:w-80 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">{t("documentSettings.previewTitle")}</h2>
          <button type="button" onClick={onClose} aria-label={t("quickAdd.cancel")} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {settings && (
            <SidebarSection icon={Eye} title={t("documentSettings.sectionSections")}>
              <div className="space-y-2.5">
                {TOGGLES.map(([key, labelKey]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    {t(labelKey)}
                    <input
                      type="checkbox"
                      checked={settings[key]}
                      onChange={(e) => patch({ [key]: e.target.checked })}
                      className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                ))}
              </div>
            </SidebarSection>
          )}

          {settings && (
            <SidebarSection icon={Building2} title={t("documentSettings.sectionCompany")}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                    {settings.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`${API_ORIGIN}${settings.logoUrl}`} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <ImagePlus className="h-4 w-4 text-zinc-300" />
                    )}
                  </div>
                  <label className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                    {uploading ? t("documentSettings.logoUploading") : t("documentSettings.logoUpload")}
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} disabled={uploading} className="hidden" />
                  </label>
                  {settings.logoUrl && (
                    <button type="button" onClick={() => patch({ logoUrl: null })} className="text-xs font-medium text-red-600 hover:underline">
                      {t("documentSettings.logoRemove")}
                    </button>
                  )}
                </div>
                <input placeholder={t("documentSettings.companyName")} value={settings.companyName} onChange={(e) => patch({ companyName: e.target.value })} className={inputClass} />
                <input placeholder={t("documentSettings.address")} value={settings.address} onChange={(e) => patch({ address: e.target.value })} className={inputClass} />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder={t("documentSettings.phone")} value={settings.phone} onChange={(e) => patch({ phone: e.target.value })} className={inputClass} />
                  <input type="email" placeholder={t("documentSettings.email")} value={settings.email} onChange={(e) => patch({ email: e.target.value })} className={inputClass} />
                </div>
              </div>
            </SidebarSection>
          )}

          {settings?.showBankInfo && (
            <SidebarSection icon={Banknote} title={t("documentSettings.sectionBank")}>
              <div className="space-y-3">
                <input placeholder={t("documentSettings.bankName")} value={settings.bankName} onChange={(e) => patch({ bankName: e.target.value })} className={inputClass} />
                <input
                  placeholder={t("documentSettings.bankAccountNumber")}
                  value={settings.bankAccountNumber}
                  onChange={(e) => patch({ bankAccountNumber: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder={t("documentSettings.bankAccountHolder")}
                  value={settings.bankAccountHolder}
                  onChange={(e) => patch({ bankAccountHolder: e.target.value })}
                  className={inputClass}
                />
              </div>
            </SidebarSection>
          )}

          {settings?.showNotes && (
            <SidebarSection icon={StickyNote} title={t("documentSettings.footerNote")}>
              <textarea
                rows={3}
                value={settings.footerNote}
                onChange={(e) => patch({ footerNote: e.target.value })}
                placeholder={t("documentSettings.footerNotePlaceholder")}
                className={`${inputClass} resize-none`}
              />
            </SidebarSection>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-5 py-4">
          <button
            type="button"
            onClick={handleSaveDefault}
            disabled={saving || !settings}
            className="rounded-lg border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            {saving ? t("documentSettings.saving") : t("documentSettings.save")}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Printer className="h-4 w-4" /> {t("purchases.action.print")}
          </button>
        </div>
        {saved && <p className="px-5 pb-3 text-xs text-emerald-600">{t("documentSettings.saved")}</p>}
      </aside>

      <div className="flex-1 overflow-auto p-6 print:overflow-visible print:p-0 md:p-10">
        {settings ? (
          <DocumentPrintTemplate doc={doc} settings={settings} />
        ) : (
          <p className="py-10 text-center text-sm text-zinc-400">{t("common.loading")}</p>
        )}
      </div>
    </div>
  );
}
