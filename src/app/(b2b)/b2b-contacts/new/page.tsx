"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Landmark, Plus, Receipt, ShieldQuestion, Trash2, User } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Account, Citizenship, ContactType } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Dropdown } from "@/components/ui/Dropdown";
import { HelpHint } from "@/components/ui/HelpHint";

const CONTACT_TYPE_OPTIONS: { value: ContactType; labelKey: string }[] = [
  { value: "customer", labelKey: "contacts.tabCustomer" },
  { value: "vendor", labelKey: "contacts.tabVendor" },
  { value: "employee", labelKey: "contacts.tabEmployee" },
  { value: "other", labelKey: "contacts.tabOther" },
];

interface BankAccountDraft {
  bankName: string;
  branch: string;
  accountHolder: string;
  accountNumber: string;
}

function emptyBankAccount(): BankAccountDraft {
  return { bankName: "", branch: "", accountHolder: "", accountNumber: "" };
}

const BANK_OPTIONS = [
  "BCA",
  "Bank Mandiri",
  "BNI",
  "BRI",
  "CIMB Niaga",
  "Bank Permata",
  "Bank Danamon",
  "OCBC NISP",
  "Bank Panin",
  "Maybank Indonesia",
  "Lainnya",
];

function SectionHeading({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>
    </div>
  );
}

function NewContactPageInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");

  const [types, setTypes] = useState<Set<ContactType>>(
    new Set([initialType === "vendor" || initialType === "employee" || initialType === "other" ? initialType : "customer"])
  );

  // Info kontak
  const [name, setName] = useState("");

  // Info umum
  const [salutation, setSalutation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [emails, setEmails] = useState<string[]>([""]);
  const [companyName, setCompanyName] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [phone, setPhone] = useState("");
  const [fax, setFax] = useState("");

  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [otherInfo, setOtherInfo] = useState("");

  // Info perpajakan
  const [citizenship, setCitizenship] = useState<Citizenship>("wni");
  const [npwp, setNpwp] = useState("");
  const [nitku, setNitku] = useState("");

  // Info bank
  const [bankAccounts, setBankAccounts] = useState<BankAccountDraft[]>([]);

  // Pemetaan akun
  const [receivableAccounts, setReceivableAccounts] = useState<Account[]>([]);
  const [payableAccounts, setPayableAccounts] = useState<Account[]>([]);
  const [receivableAccountId, setReceivableAccountId] = useState("");
  const [payableAccountId, setPayableAccountId] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.accounts(undefined, "ar").then((accounts) => {
      setReceivableAccounts(accounts);
      const defaultAccount = accounts.find((a) => a.code === "1-10100") ?? accounts[0];
      if (defaultAccount) setReceivableAccountId(String(defaultAccount.id));
    });
    api.accounts(undefined, "ap").then((accounts) => {
      setPayableAccounts(accounts);
      const defaultAccount = accounts.find((a) => a.code === "2-20100") ?? accounts[0];
      if (defaultAccount) setPayableAccountId(String(defaultAccount.id));
    });
  }, []);

  useEffect(() => {
    if (sameAsBilling) setShippingAddress(billingAddress);
  }, [sameAsBilling, billingAddress]);

  function toggleType(value: ContactType) {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function updateBankAccount(i: number, patch: Partial<BankAccountDraft>) {
    setBankAccounts((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!types.size) {
      setError(t("contacts.new.errorSave"));
      return;
    }
    setSubmitting(true);
    try {
      await api.createContact({
        types: Array.from(types),
        name,
        salutation: salutation || undefined,
        firstName: firstName || undefined,
        middleName: middleName || undefined,
        lastName: lastName || undefined,
        idType: idType || undefined,
        idNumber: idNumber || undefined,
        companyName: companyName || undefined,
        address: billingAddress || undefined,
        shippingAddress: shippingAddress || undefined,
        email: emails.filter((e) => e.trim()).join(", ") || undefined,
        mobilePhone: mobilePhone || undefined,
        phone: phone || undefined,
        fax: fax || undefined,
        citizenship,
        npwp: npwp || undefined,
        nitku: nitku || undefined,
        paymentTerm: paymentTerm || undefined,
        receivableAccountId: receivableAccountId ? Number(receivableAccountId) : undefined,
        payableAccountId: payableAccountId ? Number(payableAccountId) : undefined,
        notes: otherInfo || undefined,
        bankAccounts: bankAccounts
          .filter((b) => b.bankName || b.branch || b.accountHolder || b.accountNumber)
          .map((b) => ({ bankName: b.bankName, branch: b.branch, accountHolder: b.accountHolder, accountNumber: b.accountNumber })),
      });
      router.push("/b2b-contacts");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("contacts.new.errorSave"));
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumb items={[{ label: t("contacts.title"), href: "/b2b-contacts" }, { label: t("contacts.new.title") }]} />
      <h1 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">{t("contacts.new.title")}</h1>

      <form onSubmit={handleSubmit}>
        {error && <p className="mb-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <SectionHeading icon={User} title={t("contacts.new.sectionContactInfo")} />
              <div className="space-y-5">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.displayName")} *</span>
                  <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </label>

                <div>
                  <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                    {t("contacts.new.type")} * <HelpHint text={t("contacts.new.typeHint")} />
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
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <SectionHeading icon={ShieldQuestion} title={t("contacts.new.sectionGeneral")} />
              <div className="space-y-5">
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-zinc-700">{t("contacts.new.fullName")}</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr_1fr_1fr]">
                    <Dropdown
                      value={salutation}
                      onChange={setSalutation}
                      options={[
                        { value: "", label: t("contacts.new.salutationEmpty") },
                        { value: t("contacts.new.salutationMr"), label: t("contacts.new.salutationMr") },
                        { value: t("contacts.new.salutationMrs"), label: t("contacts.new.salutationMrs") },
                        { value: t("contacts.new.salutationMs"), label: t("contacts.new.salutationMs") },
                      ]}
                    />
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("contacts.new.firstName")} className={inputClass} />
                    <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder={t("contacts.new.middleName")} className={inputClass} />
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t("contacts.new.lastName")} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr]">
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.identity")}</span>
                    <Dropdown
                      value={idType}
                      onChange={setIdType}
                      options={[
                        { value: "ktp", label: t("contacts.new.idTypeKtp") },
                        { value: "paspor", label: t("contacts.new.idTypePassport") },
                        { value: "sim", label: t("contacts.new.idTypeSim") },
                      ]}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.identityNumber")}</span>
                    <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder={t("contacts.new.identityPlaceholder")} className={inputClass} />
                  </label>
                </div>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-zinc-700">{t("contacts.new.email")}</span>
                  <div className="space-y-2">
                    {emails.map((value, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="email"
                          value={value}
                          onChange={(e) => setEmails((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                          className={inputClass}
                        />
                        {emails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEmails((prev) => prev.filter((_, idx) => idx !== i))}
                            className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setEmails((prev) => [...prev, ""])} className="mt-2 text-xs font-medium text-emerald-600 hover:underline">
                    {t("contacts.new.addEmail")}
                  </button>
                  <p className="mt-1 text-xs text-zinc-400">{t("contacts.new.emailHint")}</p>
                </div>

                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.company")}</span>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
                </label>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.mobilePhone")}</span>
                    <input value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} className={inputClass} />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.phone")}</span>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                  </label>
                </div>

                <label className="block text-sm sm:max-w-xs">
                  <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.fax")}</span>
                  <input value={fax} onChange={(e) => setFax(e.target.value)} className={inputClass} />
                </label>

                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.billingAddress")}</span>
                  <textarea
                    rows={2}
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder={t("contacts.new.addressPlaceholder")}
                    className={`${inputClass} resize-none`}
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.shippingAddress")}</span>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    disabled={sameAsBilling}
                    placeholder={t("contacts.new.addressPlaceholder")}
                    className={`${inputClass} resize-none disabled:bg-zinc-50 disabled:text-zinc-400`}
                  />
                </label>
                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={sameAsBilling}
                    onChange={(e) => setSameAsBilling(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {t("contacts.new.sameAsBilling")}
                </label>

                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.otherInfo")}</span>
                  <input value={otherInfo} onChange={(e) => setOtherInfo(e.target.value)} className={inputClass} />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <SectionHeading icon={Receipt} title={t("contacts.new.sectionTax")} />
              <div className="space-y-5">
                <div className="flex gap-6">
                  {(["wni", "wna"] as const).map((c) => (
                    <label key={c} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="radio"
                        checked={citizenship === c}
                        onChange={() => {
                          setCitizenship(c);
                          if (c === "wna") setNitku("");
                        }}
                        className="h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {t(c === "wni" ? "contacts.new.citizenshipWni" : "contacts.new.citizenshipWna")}
                    </label>
                  ))}
                </div>
                {citizenship === "wni" ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.npwpNik")}</span>
                      <input value={npwp} onChange={(e) => setNpwp(e.target.value)} maxLength={16} className={inputClass} />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
                        {t("contacts.new.nitku")} <HelpHint text={t("contacts.new.nitku")} />
                      </span>
                      <input value={nitku} onChange={(e) => setNitku(e.target.value)} maxLength={6} className={inputClass} />
                    </label>
                  </div>
                ) : (
                  <label className="block text-sm sm:max-w-xs">
                    <span className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700">
                      {t("contacts.new.taxIdNumber")} <HelpHint text={t("contacts.new.taxIdNumber")} />
                    </span>
                    <input value={npwp} onChange={(e) => setNpwp(e.target.value)} placeholder={t("contacts.new.taxIdNumberPlaceholder")} className={inputClass} />
                  </label>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <SectionHeading icon={Landmark} title={t("contacts.new.sectionBank")} />
              <div className="space-y-4">
                {bankAccounts.map((b, i) => (
                  <div key={i} className="rounded-xl border border-zinc-100 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-zinc-700">
                        {t("contacts.new.bankAccount")} {i + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => setBankAccounts((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label={t("contacts.new.removeBank")}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="block text-sm">
                        <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.bankName")}</span>
                        <Dropdown
                          value={b.bankName}
                          onChange={(v) => updateBankAccount(i, { bankName: v })}
                          options={BANK_OPTIONS.map((bank) => ({ value: bank, label: bank }))}
                          placeholder={t("contacts.new.bankNamePlaceholder")}
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.bankBranch")}</span>
                        <input value={b.branch} onChange={(e) => updateBankAccount(i, { branch: e.target.value })} className={inputClass} />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.bankHolder")}</span>
                        <input value={b.accountHolder} onChange={(e) => updateBankAccount(i, { accountHolder: e.target.value })} className={inputClass} />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.bankNumber")}</span>
                        <input value={b.accountNumber} onChange={(e) => updateBankAccount(i, { accountNumber: e.target.value })} className={inputClass} />
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setBankAccounts((prev) => [...prev, emptyBankAccount()])}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3.5 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                >
                  <Plus className="h-4 w-4" /> {t("contacts.new.addBank")}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <SectionHeading icon={Landmark} title={t("contacts.new.sectionAccountMapping")} />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.receivableAccount")}</span>
                  <Dropdown
                    value={receivableAccountId}
                    onChange={setReceivableAccountId}
                    options={receivableAccounts.map((a) => ({ value: String(a.id), label: `(${a.code}) ${a.name}` }))}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.payableAccount")}</span>
                  <Dropdown
                    value={payableAccountId}
                    onChange={setPayableAccountId}
                    options={payableAccounts.map((a) => ({ value: String(a.id), label: `(${a.code}) ${a.name}` }))}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-zinc-700">{t("contacts.new.paymentTerm")}</span>
                  <Dropdown
                    value={paymentTerm}
                    onChange={setPaymentTerm}
                    placeholder={t("contacts.new.paymentTermPlaceholder")}
                    options={[
                      { value: t("contacts.new.paymentTermCod"), label: t("contacts.new.paymentTermCod") },
                      { value: t("contacts.new.paymentTermNet7"), label: t("contacts.new.paymentTermNet7") },
                      { value: t("contacts.new.paymentTermNet14"), label: t("contacts.new.paymentTermNet14") },
                      { value: t("contacts.new.paymentTermNet30"), label: t("contacts.new.paymentTermNet30") },
                      { value: t("contacts.new.paymentTermNet60"), label: t("contacts.new.paymentTermNet60") },
                    ]}
                  />
                </label>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3">
              <Link href="/b2b-contacts" className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                {t("contacts.new.cancel")}
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? t("contacts.new.saving") : t("contacts.new.save")}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="mb-1.5 text-sm font-semibold text-zinc-800">{t("contacts.new.accountMappingNote")}</p>
            <p className="text-xs leading-relaxed text-zinc-500">{t("contacts.new.accountMappingNoteBody")}</p>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewContactPage() {
  return (
    <Suspense fallback={null}>
      <NewContactPageInner />
    </Suspense>
  );
}
