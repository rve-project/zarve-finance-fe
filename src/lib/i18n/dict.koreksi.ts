// Tutup Buku (close period) + Permintaan Koreksi. Merge into the main dict in src/lib/i18n.tsx.
export const dictKoreksi: Record<string, Record<"id" | "en", string>> = {
  "koreksi.modalTitle": { id: "Ajukan Permintaan Koreksi", en: "Submit Correction Request" },
  "koreksi.lockedNotice": {
    id: "Transaksi tanggal {date} sudah melewati batas tutup buku. Ajukan permintaan koreksi dengan alasan di bawah -- Anda bisa coba lagi setelah disetujui.",
    en: "The {date} transaction is past the close-period cutoff. Submit a correction request with your reason below -- you can retry once it's approved.",
  },
  "koreksi.reasonLabel": { id: "Alasan Koreksi", en: "Reason" },
  "koreksi.reasonPlaceholder": { id: "Jelaskan kenapa transaksi ini perlu dikoreksi...", en: "Explain why this transaction needs correcting..." },
  "koreksi.submitButton": { id: "Ajukan", en: "Submit" },
  "koreksi.submitting": { id: "Mengirim...", en: "Submitting..." },
  "koreksi.submitSuccess": {
    id: "Permintaan koreksi terkirim. Pantau statusnya di menu Permintaan Koreksi.",
    en: "Correction request submitted. Track its status under Correction Requests.",
  },
  "koreksi.submitError": { id: "Gagal mengajukan permintaan koreksi.", en: "Failed to submit correction request." },
  "koreksi.close": { id: "Tutup", en: "Close" },
  "koreksi.ajukanButton": { id: "Ajukan Koreksi", en: "Request Correction" },

  "koreksi.pageTitle": { id: "Permintaan Koreksi", en: "Correction Requests" },
  "koreksi.pageSubtitle": {
    id: "Permintaan untuk mengoreksi transaksi yang sudah melewati batas tutup buku.",
    en: "Requests to correct transactions past the close-period cutoff.",
  },
  "koreksi.colResourceType": { id: "Jenis Transaksi", en: "Transaction Type" },
  "koreksi.colDate": { id: "Tanggal Transaksi", en: "Transaction Date" },
  "koreksi.colReason": { id: "Alasan", en: "Reason" },
  "koreksi.colRequestedBy": { id: "Diajukan Oleh", en: "Requested By" },
  "koreksi.colStatus": { id: "Status", en: "Status" },
  "koreksi.statusPendingApproval": { id: "Menunggu Persetujuan", en: "Pending Approval" },
  "koreksi.statusApproved": { id: "Disetujui", en: "Approved" },
  "koreksi.statusRejected": { id: "Ditolak", en: "Rejected" },
  "koreksi.usedYes": { id: "Sudah dipakai", en: "Used" },
  "koreksi.usedNo": { id: "Belum dipakai", en: "Not used yet" },
  "koreksi.approveButton": { id: "Setujui", en: "Approve" },
  "koreksi.rejectButton": { id: "Tolak", en: "Reject" },
  "koreksi.confirmReject": { id: "Alasan menolak permintaan ini?", en: "Reason for rejecting this request?" },
  "koreksi.rejectedReasonLabel": { id: "Alasan ditolak", en: "Rejection reason" },
  "koreksi.emptyState": { id: "Belum ada permintaan koreksi.", en: "No correction requests yet." },
  "koreksi.resourceType.journal_entry": { id: "Jurnal Manual", en: "Manual Journal Entry" },
  "koreksi.resourceType.expense": { id: "Pengeluaran", en: "Expense" },
  "koreksi.resourceType.fixed_asset_revaluation": { id: "Revaluasi Aset Tetap", en: "Fixed Asset Revaluation" },
  "koreksi.resourceType.sale_invoice_approval": { id: "Approve Faktur Penjualan", en: "Sales Invoice Approval" },
  "koreksi.resourceType.purchase_invoice_approval": { id: "Approve Faktur Pembelian", en: "Purchase Invoice Approval" },

  "settings.tabTutupBuku": { id: "Tutup Buku", en: "Close Period" },
  "settings.periodLockDaysLabel": { id: "Batas Koreksi (Hari)", en: "Correction Window (Days)" },
  "settings.periodLockDaysDesc": {
    id: "Transaksi yang lebih tua dari jumlah hari ini tidak bisa lagi diedit/dihapus langsung -- harus lewat Permintaan Koreksi.",
    en: "A transaction older than this many days can no longer be edited/deleted directly -- it must go through a Correction Request.",
  },

  "users.colCanApproveCorrections": { id: "Approve Koreksi", en: "Approve Corrections" },
  "users.canApproveCorrectionsGranted": { id: "Bisa Approve", en: "Can Approve" },
  "users.canApproveCorrectionsNotGranted": { id: "Tidak Bisa Approve", en: "No Access" },

  "nav.permintaanKoreksi": { id: "Permintaan Koreksi", en: "Correction Requests" },
};
