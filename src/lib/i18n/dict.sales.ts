// Translation dictionary for the "Penjualan" (Sales) feature.
// Merge this into the shared `dict` in src/lib/i18n.tsx.
export const dictSales: Record<string, Record<"id" | "en", string>> = {
  "nav.penjualan": { id: "Penjualan", en: "Sales" },

  "sales.title": { id: "Penjualan", en: "Sales" },
  "sales.createNew": { id: "Buat penjualan baru", en: "Create new sale" },
  "sales.docTypeQuotation": { id: "Penawaran Penjualan", en: "Sales quotation" },
  "sales.docTypeOrder": { id: "Pemesanan Penjualan", en: "Sales order" },
  "sales.docTypeInvoice": { id: "Penagihan Penjualan", en: "Sales invoice" },
  "sales.docTypeShipment": { id: "Pengiriman", en: "Shipment" },
  "sales.docTypeExchange": { id: "Tukar Faktur", en: "Sales exchange" },

  "sales.tabInvoice": { id: "Faktur", en: "Invoices" },
  "sales.tabExchange": { id: "Tukar faktur", en: "Exchanges" },
  "sales.tabShipment": { id: "Pengiriman", en: "Shipments" },
  "sales.tabOrder": { id: "Pesanan", en: "Orders" },
  "sales.tabQuotation": { id: "Penawaran", en: "Quotations" },
  "sales.tabPendingApproval": { id: "Membutuhkan persetujuan", en: "Needs approval" },
  "sales.tabRejected": { id: "Ditolak", en: "Rejected" },

  "sales.statUnpaid": { id: "Faktur belum dibayar", en: "Unpaid invoices" },
  "sales.statOverdue": { id: "Faktur telat dibayar", en: "Overdue invoices" },
  "sales.statLast30Paid": { id: "Pelunasan 30 hari terakhir", en: "Paid in the last 30 days" },

  "sales.allStatus": { id: "Semua status", en: "All statuses" },
  "sales.searchPlaceholder": { id: "Cari transaksi", en: "Search transactions" },

  "sales.colDate": { id: "Tanggal", en: "Date" },
  "sales.colNumber": { id: "Nomor", en: "Number" },
  "sales.colCustomer": { id: "Pelanggan", en: "Customer" },
  "sales.colStatus": { id: "Status", en: "Status" },
  "sales.colOutstanding": { id: "Sisa Tagihan (dalam IDR)", en: "Outstanding (in IDR)" },
  "sales.colTotal": { id: "Total (dalam IDR)", en: "Total (in IDR)" },

  "sales.statusDraft": { id: "Draft", en: "Draft" },
  "sales.statusPendingApproval": { id: "Menunggu Persetujuan", en: "Pending Approval" },
  "sales.statusApproved": { id: "Disetujui", en: "Approved" },
  "sales.statusRejected": { id: "Ditolak", en: "Ditolak" },

  "sales.emptyTitle": { id: "Belum ada transaksi", en: "No transactions yet" },
  "sales.emptyHint": { id: "Daftar transaksi akan muncul di sini.", en: "Your transaction list will show up here." },
  "sales.createButton": { id: "Buat transaksi", en: "Create transaction" },
  "sales.errorLoading": { id: "Gagal memuat data penjualan", en: "Failed to load sales" },

  "sales.new.customer": { id: "Pelanggan", en: "Customer" },
  "sales.new.customerPlaceholder": { id: "Pilih pelanggan", en: "Select customer" },
  "sales.new.customerRef": { id: "No. referensi pelanggan", en: "Customer reference number" },
  "sales.new.errorSave": { id: "Gagal menyimpan dokumen", en: "Failed to save document" },
  "sales.new.editTitle": { id: "Ubah", en: "Edit" },

  "sales.detail.customer": { id: "Pelanggan", en: "Customer" },
  "sales.detail.viewJournalEntry": { id: "lihat jurnal entry", en: "view journal entry" },
  "sales.detail.rejectedReason": { id: "Alasan penolakan", en: "Rejection reason" },

  "sales.action.recordPayment": { id: "Catat Pelunasan", en: "Record Payment" },

  "sales.confirmDelete": { id: "Hapus dokumen {number}?", en: "Delete document {number}?" },
  "sales.confirmReject": { id: "Alasan penolakan (opsional):", en: "Rejection reason (optional):" },
  "sales.errorAction": { id: "Aksi gagal dilakukan", en: "Action failed" },

  "sales.payment.title": { id: "Catat Pelunasan", en: "Record Payment" },
  "sales.payment.payTo": { id: "Terima Di", en: "Receive To" },
  "sales.payment.errorSave": { id: "Gagal menyimpan pembayaran", en: "Failed to save payment" },
  "sales.payment.history": { id: "Riwayat Pelunasan", en: "Payment History" },
};
