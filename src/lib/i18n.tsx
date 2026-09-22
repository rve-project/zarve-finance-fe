"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { dictMasterData } from "./i18n/dict.masterData";
import { dictJournalVendorBills } from "./i18n/dict.journalVendorBills";
import { dictReconciliationSync } from "./i18n/dict.reconciliationSync";
import { dictFinancialReportsA } from "./i18n/dict.financialReportsA";
import { dictInvoices } from "./i18n/dict.invoices";
import { dictRevenueSettings } from "./i18n/dict.revenueSettings";
import { dictFinancialReportsB } from "./i18n/dict.financialReportsB";

export type Lang = "id" | "en";

const STORAGE_KEY = "rve_finance_lang";

// Flat key -> per-language string map. Keys are namespaced by area (nav.*, common.*,
// login.*, home.*) so unrelated pages can't accidentally collide on a short key.
const dict: Record<string, Record<Lang, string>> = {
  ...dictMasterData,
  ...dictJournalVendorBills,
  ...dictReconciliationSync,
  ...dictFinancialReportsA,
  ...dictInvoices,
  ...dictRevenueSettings,
  ...dictFinancialReportsB,

  // Sidebar sections
  "section.utama": { id: "Utama", en: "Main" },
  "section.masterData": { id: "Master Data", en: "Master Data" },
  "section.akuntansi": { id: "Akuntansi", en: "Accounting" },
  "section.laporanKeuangan": { id: "Laporan Keuangan", en: "Financial Reports" },
  "section.administrasi": { id: "Administrasi", en: "Administration" },

  // Sidebar items
  "nav.beranda": { id: "Beranda", en: "Home" },
  "nav.invoice": { id: "Invoice", en: "Invoices" },
  "nav.rekapRevenue": { id: "Rekap Revenue", en: "Revenue Recap" },
  "nav.driverPartner": { id: "Driver / Partner", en: "Driver / Partner" },
  "nav.vendorSupplier": { id: "Vendor / Supplier", en: "Vendor / Supplier" },
  "nav.kendaraan": { id: "Kendaraan", en: "Vehicles" },
  "nav.chartOfAccounts": { id: "Chart of Accounts", en: "Chart of Accounts" },
  "nav.jurnalManual": { id: "Jurnal Manual", en: "Manual Journal" },
  "nav.tagihanVendor": { id: "Tagihan Vendor", en: "Vendor Bills" },
  "nav.rekonsiliasiBank": { id: "Rekonsiliasi Bank", en: "Bank Reconciliation" },
  "nav.trialBalance": { id: "Trial Balance", en: "Trial Balance" },
  "nav.generalLedger": { id: "General Ledger", en: "General Ledger" },
  "nav.labaRugi": { id: "Laba Rugi", en: "Profit & Loss" },
  "nav.neraca": { id: "Neraca", en: "Balance Sheet" },
  "nav.arusKas": { id: "Arus Kas", en: "Cash Flow" },
  "nav.piutangJatuhTempo": { id: "Piutang Jatuh Tempo", en: "Aged Receivables" },
  "nav.profitabilitasKendaraan": { id: "Profitabilitas Kendaraan", en: "Vehicle Profitability" },
  "nav.keluarKota": { id: "Keluar Kota (Geofence)", en: "Out of Town (Geofence)" },
  "nav.sinkronisasiData": { id: "Sinkronisasi Data", en: "Data Sync" },
  "nav.pengaturan": { id: "Pengaturan", en: "Settings" },

  // Common
  "common.logout": { id: "Keluar", en: "Log out" },
  "common.openMenu": { id: "Buka menu", en: "Open menu" },
  "common.closeMenu": { id: "Tutup menu", en: "Close menu" },
  "common.loading": { id: "Memuat...", en: "Loading..." },
  "common.accountingSystem": { id: "SISTEM AKUNTANSI", en: "ACCOUNTING SYSTEM" },
  "common.accountingSystemInternal": { id: "SISTEM AKUNTANSI INTERNAL", en: "INTERNAL ACCOUNTING SYSTEM" },

  // Login page
  "login.welcome": { id: "Selamat datang kembali", en: "Welcome back" },
  "login.subtitle": { id: "Masuk pakai akun Zarve kamu untuk mengelola data keuangan.", en: "Sign in with your Zarve account to manage financial data." },
  "login.email": { id: "Email", en: "Email" },
  "login.password": { id: "Password", en: "Password" },
  "login.passwordPlaceholder": { id: "Masukkan password", en: "Enter your password" },
  "login.submit": { id: "Masuk", en: "Sign in" },
  "login.submitting": { id: "Memproses...", en: "Signing in..." },
  "login.noAccount": { id: "Belum punya akun Zarve? Hubungi admin operasional untuk didaftarkan.", en: "Don't have a Zarve account yet? Contact the operations admin to get registered." },
  "login.errorGeneric": { id: "Gagal login", en: "Sign in failed" },
  "login.showPassword": { id: "Tampilkan password", en: "Show password" },
  "login.hidePassword": { id: "Sembunyikan password", en: "Hide password" },
  "login.emailPlaceholder": { id: "nama@zarve.id", en: "name@zarve.id" },
  "login.companyName": { id: "PT Riline Velocity Express", en: "PT Riline Velocity Express" },
  "login.tagline": { id: "Satu sistem untuk operasional & keuangan armada.", en: "One system for fleet operations & finance." },
  "login.feature1.title": { id: "Sinkron otomatis dari Zarve", en: "Auto-synced from Zarve" },
  "login.feature1.desc": { id: "Data invoice, kendaraan, dan driver ter-update sendiri, tanpa import manual.", en: "Invoice, vehicle, and driver data update themselves -- no manual import." },
  "login.feature2.title": { id: "Laporan keuangan real-time", en: "Real-time financial reports" },
  "login.feature2.desc": { id: "Trial Balance, Laba Rugi, Neraca, sampai Arus Kas -- selalu up to date.", en: "Trial Balance, P&L, Balance Sheet, Cash Flow -- always up to date." },
  "login.feature3.title": { id: "Login pakai akun Zarve", en: "Sign in with your Zarve account" },
  "login.feature3.desc": { id: "Satu akun buat operasional dan keuangan, tidak perlu password terpisah.", en: "One account for operations and finance -- no separate password needed." },

  // Beranda / dashboard
  "home.title": { id: "Beranda", en: "Dashboard" },
  "home.subtitle": { id: "Ringkasan operasional & keuangan -- data hasil sinkronisasi dari Zarve", en: "Operational & financial summary -- data synced from Zarve" },
  "home.unitType": { id: "Tipe Unit", en: "Unit Type" },
  "home.period": { id: "Periode", en: "Period" },
  "home.reload": { id: "Muat Ulang", en: "Reload" },
  "home.loadingData": { id: "Memuat data...", en: "Loading data..." },
  "home.totalRevenue": { id: "Total Revenue", en: "Total Revenue" },
  "home.activeVehicles": { id: "Kendaraan Aktif", en: "Active Vehicles" },
  "home.totalInvoiceMonth": { id: "Total Invoice (Bulan Ini)", en: "Total Invoices (This Month)" },
  "home.unpaidInvoices": { id: "Invoice Belum Dibayar", en: "Unpaid Invoices" },
  "home.dailyTrend": { id: "Tren Revenue Harian", en: "Daily Revenue Trend" },
  "home.evVsFuel": { id: "Revenue Kendaraan Listrik vs Bensin", en: "EV vs Fuel Vehicle Revenue" },
  "home.ev": { id: "Listrik (EV)", en: "Electric (EV)" },
  "home.fuel": { id: "Bensin / Non-EV", en: "Fuel / Non-EV" },
  "home.byBranch": { id: "Revenue per Cabang", en: "Revenue by Branch" },
  "home.dayComposition": { id: "Komposisi Hari", en: "Day Composition" },
  "home.payFull": { id: "Bayar Full", en: "Paid in Full" },
  "home.partial": { id: "Sebagian", en: "Partial" },
  "home.cuti": { id: "Cuti", en: "Day Off" },
  "home.idle": { id: "Idle", en: "Idle" },
  "home.maintenance": { id: "Maintenance", en: "Maintenance" },
  "home.invoiceStatus": { id: "Status Invoice (Bulan Ini)", en: "Invoice Status (This Month)" },
  "home.viewAll": { id: "Lihat semua", en: "View all" },
  "home.topVehicles": { id: "Top 8 Kendaraan by Revenue", en: "Top 8 Vehicles by Revenue" },
  "home.topDrivers": { id: "Top 8 Driver by Revenue", en: "Top 8 Drivers by Revenue" },
  "home.statusPaid": { id: "Lunas", en: "Paid" },
  "home.statusPartial": { id: "Sebagian", en: "Partial" },
  "home.statusUnpaid": { id: "Belum Bayar", en: "Unpaid" },
  "home.statusCompl": { id: "Gratis", en: "Complimentary" },
  "home.statusVoid": { id: "Dibatalkan", en: "Void" },
  "home.statusRefunded": { id: "Refund", en: "Refunded" },
  "home.otherBranch": { id: "Lainnya", en: "Other" },
  "home.errorLoading": { id: "Gagal memuat data dashboard", en: "Failed to load dashboard data" },

  // Date/month pickers (shared components)
  "date.month0": { id: "Januari", en: "January" },
  "date.month1": { id: "Februari", en: "February" },
  "date.month2": { id: "Maret", en: "March" },
  "date.month3": { id: "April", en: "April" },
  "date.month4": { id: "Mei", en: "May" },
  "date.month5": { id: "Juni", en: "June" },
  "date.month6": { id: "Juli", en: "July" },
  "date.month7": { id: "Agustus", en: "August" },
  "date.month8": { id: "September", en: "September" },
  "date.month9": { id: "Oktober", en: "October" },
  "date.month10": { id: "November", en: "November" },
  "date.month11": { id: "Desember", en: "December" },
  "date.day0": { id: "Sen", en: "Mo" },
  "date.day1": { id: "Sel", en: "Tu" },
  "date.day2": { id: "Rab", en: "We" },
  "date.day3": { id: "Kam", en: "Th" },
  "date.day4": { id: "Jum", en: "Fr" },
  "date.day5": { id: "Sab", en: "Sa" },
  "date.day6": { id: "Min", en: "Su" },
  "date.today": { id: "Hari Ini", en: "Today" },
  "date.prevMonth": { id: "Bulan sebelumnya", en: "Previous month" },
  "date.nextMonth": { id: "Bulan berikutnya", en: "Next month" },
  "date.prevYear": { id: "Tahun sebelumnya", en: "Previous year" },
  "date.nextYear": { id: "Tahun berikutnya", en: "Next year" },
  "date.selectDate": { id: "Pilih tanggal", en: "Select date" },

  // Pagination (shared component)
  "pagination.showing": { id: "Menampilkan", en: "Showing" },
  "pagination.of": { id: "dari", en: "of" },
  "pagination.previous": { id: "Sebelumnya", en: "Previous" },
  "pagination.next": { id: "Berikutnya", en: "Next" },
  "pagination.page": { id: "Hal", en: "Page" },
};

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "id" || stored === "en") setLangState(stored);
    } catch {
      // ignore -- private browsing / storage disabled
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (key: string) => dict[key]?.[lang] ?? key,
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
