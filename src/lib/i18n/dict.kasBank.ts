// Translation dictionary for the B2B "Kas & Bank" page. Merge into the main dict in
// src/lib/i18n.tsx alongside the other page dictionaries.
export const dictKasBank: Record<string, Record<"id" | "en", string>> = {
  "kasBank.title": { id: "Kas & Bank", en: "Cash & Bank" },
  "kasBank.subtitle": { id: "Ringkasan saldo kas dan bank bisnis B2B", en: "Cash and bank balance summary for the B2B business" },
  "kasBank.pemasukanMendatang": { id: "Pemasukan 30 hari mendatang", en: "Inflow, next 30 days" },
  "kasBank.pengeluaranMendatang": { id: "Pengeluaran 30 hari mendatang", en: "Outflow, next 30 days" },
  "kasBank.saldoKasBank": { id: "Saldo kas & bank", en: "Cash & bank balance" },
  "kasBank.saldoKartuKredit": { id: "Saldo kartu kredit", en: "Credit card balance" },
  "kasBank.total": { id: "Total", en: "Total" },
  "kasBank.showArchived": { id: "Tampilkan akun yang diarsipkan", en: "Show archived accounts" },
  "kasBank.groupHeader": { id: "Kas & bank", en: "Cash & bank" },
  "kasBank.colCode": { id: "Kode akun", en: "Account code" },
  "kasBank.colName": { id: "Nama akun", en: "Account name" },
  "kasBank.colSaldoBank": { id: "Saldo bank", en: "Bank balance" },
  "kasBank.colSaldoJurnal": { id: "Saldo di Jurnal", en: "Ledger balance" },
  "kasBank.importStatement": { id: "Impor rekening koran", en: "Import bank statement" },
  "kasBank.downloadTemplate": { id: "Unduh template", en: "Download template" },
  "kasBank.importing": { id: "Mengimpor...", en: "Importing..." },
  "kasBank.importSuccess": { id: "Rekening koran berhasil diimpor", en: "Bank statement imported successfully" },
  "kasBank.rows": { id: "baris", en: "rows" },
  "kasBank.importError": { id: "Gagal mengimpor rekening koran", en: "Failed to import bank statement" },
  "kasBank.emptyState": { id: "Belum ada akun kas/bank.", en: "No cash/bank accounts yet." },
};
