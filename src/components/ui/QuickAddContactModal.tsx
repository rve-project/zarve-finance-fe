"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Contact, ContactType } from "@/lib/types";
import { Dropdown } from "@/components/ui/Dropdown";

interface QuickAddContactModalProps {
  /** Which type(s) start checked -- the caller already knows the likely type from context
   * (e.g. "vendor" from an Expense/Purchase picker, "customer" from a Sales picker), but
   * the checkboxes stay editable since a real contact can be more than one type at once. */
  type: ContactType;
  initialName?: string;
  onClose: () => void;
  onCreated: (contact: Contact) => void;
}

const CONTACT_TYPE_OPTIONS: { value: ContactType; labelKey: string }[] = [
  { value: "customer", labelKey: "contacts.tabCustomer" },
  { value: "vendor", labelKey: "contacts.tabVendor" },
  { value: "employee", labelKey: "contacts.tabEmployee" },
  { value: "other", labelKey: "contacts.tabOther" },
];

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400";

export function QuickAddContactModal({ type, initialName, onClose, onCreated }: QuickAddContactModalProps) {
  const { t } = useLanguage();
  const [types, setTypes] = useState<Set<ContactType>>(new Set([type]));
  const [name, setName] = useState(initialName ?? "");
  const [companyName, setCompanyName] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [npwp, setNpwp] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentTermOptions = [
    { value: t("contacts.new.paymentTermCod"), label: t("contacts.new.paymentTermCod") },
    { value: t("contacts.new.paymentTermNet7"), label: t("contacts.new.paymentTermNet7") },
    { value: t("contacts.new.paymentTermNet14"), label: t("contacts.new.paymentTermNet14") },
    { value: t("contacts.new.paymentTermNet30"), label: t("contacts.new.paymentTermNet30") },
    { value: t("contacts.new.paymentTermNet60"), label: t("contacts.new.paymentTermNet60") },
  ];

  function toggleType(value: ContactType) {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !types.size) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createContact({
        types: Array.from(types),
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        mobilePhone: mobilePhone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        npwp: npwp.trim() || undefined,
        paymentTerm: paymentTerm || undefined,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("quickAdd.contactError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">{t("quickAdd.contactTitle")}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-4 overflow-y-auto px-5 py-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

          <div>
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("contacts.new.type")} <span className="text-red-500">*</span>
            </span>
            <div className="flex flex-wrap gap-4">
              {CONTACT_TYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={types.has(opt.value)}
                    onChange={() => toggleType(opt.value)}
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {t(opt.labelKey)}
                </label>
              ))}
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">
              {t("quickAdd.name")} <span className="text-red-500">*</span>
            </span>
            <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.company")}</span>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("quickAdd.phone")}</span>
              <input value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("quickAdd.email")}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.billingAddress")}</span>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("contacts.new.addressPlaceholder")}
              className={`${inputClass} resize-none`}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.npwpNik")}</span>
              <input value={npwp} onChange={(e) => setNpwp(e.target.value)} maxLength={16} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.paymentTerm")}</span>
              <Dropdown
                value={paymentTerm}
                onChange={setPaymentTerm}
                placeholder={t("contacts.new.paymentTermPlaceholder")}
                options={paymentTermOptions}
              />
            </label>
          </div>
          <p className="text-xs text-zinc-400">{t("quickAdd.editLater")}</p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
              {t("quickAdd.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !types.size}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? t("quickAdd.saving") : t("quickAdd.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
