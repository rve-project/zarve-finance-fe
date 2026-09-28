// Translation dictionary for the D'Consulting audit gap #6/#7 (Validasi Jurnal) and
// gap #10 (Log Aktivitas) pages. Merge into the main dict in src/lib/i18n.tsx.
export const dictAuditAndValidation: Record<string, Record<"id" | "en", string>> = {
  "journalValidation.title": { id: "Validasi Jurnal", en: "Journal Validation" },
  "journalValidation.subtitle": {
    id: "Uji coba transaksi (Zarve & B2B, manual & sinkronisasi) sampai ke laporan keuangan dan buku besar.",
    en: "Trial test of transactions (Zarve & B2B, manual & synced) all the way to the financial reports and general ledger.",
  },
  "journalValidation.runCheck": { id: "Jalankan Pengecekan", en: "Run Check" },
  "journalValidation.checking": { id: "Memeriksa...", en: "Checking..." },
  "journalValidation.errorLoading": { id: "Gagal memuat hasil validasi", en: "Failed to load validation results" },

  "journalValidation.orphanTitle": { id: "Transaksi Tanpa Jurnal", en: "Transactions Without a Journal Entry" },
  "journalValidation.orphanOk": { id: "Semua transaksi sudah terintegrasi ke jurnal.", en: "Every transaction is integrated into the ledger." },
  "journalValidation.colType": { id: "Jenis", en: "Type" },
  "journalValidation.colId": { id: "ID", en: "ID" },
  "journalValidation.colRef": { id: "Referensi", en: "Reference" },

  "journalValidation.trialBalanceTitle": { id: "Neraca Saldo (Debit = Kredit)", en: "Trial Balance (Debit = Credit)" },
  "journalValidation.colBusinessUnit": { id: "Unit Bisnis", en: "Business Unit" },
  "journalValidation.colTotalDebit": { id: "Total Debit", en: "Total Debit" },
  "journalValidation.colTotalCredit": { id: "Total Kredit", en: "Total Credit" },
  "journalValidation.colStatus": { id: "Status", en: "Status" },
  "journalValidation.balanced": { id: "Seimbang", en: "Balanced" },
  "journalValidation.notBalanced": { id: "Tidak Seimbang", en: "Not Balanced" },

  "journalValidation.subledgerTitle": { id: "Piutang/Utang vs Buku Besar", en: "AR/AP Subledger vs General Ledger" },
  "journalValidation.subledgerOk": {
    id: "Saldo piutang/utang sesuai dengan buku besar.",
    en: "Receivable/payable balances match the general ledger.",
  },
  "journalValidation.colAccount": { id: "Akun", en: "Account" },
  "journalValidation.colSubledgerTotal": { id: "Saldo Piutang/Utang", en: "Subledger Balance" },
  "journalValidation.colGlTotal": { id: "Saldo Buku Besar", en: "GL Balance" },
  "journalValidation.colDifference": { id: "Selisih", en: "Difference" },

  "activityLog.title": { id: "Log Aktivitas", en: "Activity Log" },
  "activityLog.subtitle": {
    id: "Jejak penginputan/aktivitas akun -- hanya terlihat oleh user yang diberi akses.",
    en: "Account input/activity trail -- only visible to users granted access.",
  },
  "activityLog.errorLoading": { id: "Gagal memuat log aktivitas", en: "Failed to load activity log" },
  "activityLog.colTime": { id: "Waktu", en: "Time" },
  "activityLog.colUser": { id: "User", en: "User" },
  "activityLog.colAction": { id: "Aksi", en: "Action" },
  "activityLog.colResource": { id: "Data", en: "Resource" },
  "activityLog.colStatus": { id: "Status", en: "Status" },
  "activityLog.empty": { id: "Belum ada aktivitas tercatat", en: "No activity recorded yet" },
  "activityLog.itemLabel": { id: "aktivitas", en: "activities" },
};
