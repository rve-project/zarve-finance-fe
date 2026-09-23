// Translation dictionary for the B2B "Pemenuhan" (order fulfillment) board. Merge
// into the main dict in src/lib/i18n.tsx.
export const dictPemenuhan: Record<string, Record<"id" | "en", string>> = {
  "pemenuhan.title": { id: "Pemenuhan", en: "Fulfillment" },
  "pemenuhan.tabSales": { id: "Penjualan", en: "Sales" },
  "pemenuhan.tabPurchases": { id: "Pembelian", en: "Purchases" },
  "pemenuhan.reload": { id: "Muat ulang", en: "Reload" },
  "pemenuhan.searchPlaceholder": { id: "Cari transaksi", en: "Search transactions" },
  "pemenuhan.addOrder": { id: "Tambah Pesanan", en: "Add Order" },

  "pemenuhan.dateRange.today": { id: "Hari ini", en: "Today" },
  "pemenuhan.dateRange.7d": { id: "7 hari terakhir", en: "Last 7 days" },
  "pemenuhan.dateRange.30d": { id: "30 hari terakhir", en: "Last 30 days" },
  "pemenuhan.dateRange.all": { id: "Semua", en: "All" },

  "pemenuhan.status.new": { id: "Pesanan baru", en: "New orders" },
  "pemenuhan.status.processing": { id: "Sedang diproses", en: "Processing" },
  "pemenuhan.status.shipping": { id: "Sedang dikirim", en: "Shipping" },
  "pemenuhan.status.completed": { id: "Selesai", en: "Completed" },
  "pemenuhan.status.cancelled": { id: "Dibatalkan", en: "Cancelled" },

  "pemenuhan.moveTo": { id: "Pindahkan ke", en: "Move to" },
  "pemenuhan.emptyColumn": { id: "Belum ada pesanan", en: "No orders yet" },

  "pemenuhan.form.partyNameSale": { id: "Nama Pelanggan", en: "Customer Name" },
  "pemenuhan.form.partyNamePurchase": { id: "Nama Supplier", en: "Supplier Name" },
  "pemenuhan.form.orderNumber": { id: "No. Pesanan", en: "Order No." },
  "pemenuhan.form.orderNumberPlaceholder": { id: "Otomatis kalau dikosongkan", en: "Auto-filled if left blank" },
  "pemenuhan.form.orderDate": { id: "Tanggal Pesanan", en: "Order Date" },
  "pemenuhan.form.amount": { id: "Jumlah", en: "Amount" },
  "pemenuhan.form.notes": { id: "Catatan", en: "Notes" },
  "pemenuhan.form.cancel": { id: "Batal", en: "Cancel" },
  "pemenuhan.form.save": { id: "Simpan", en: "Save" },
  "pemenuhan.form.saving": { id: "Menyimpan...", en: "Saving..." },
  "pemenuhan.form.errorSave": { id: "Gagal menyimpan pesanan", en: "Failed to save order" },

  "pemenuhan.note": {
    id: "Papan ini cuma buat lacak status pengiriman/penerimaan pesanan -- status dipindah manual, tidak ada posting jurnal dari sini.",
    en: "This board is only for tracking order shipping/receiving status -- status moves manually, no journal entry is posted from here.",
  },
};
