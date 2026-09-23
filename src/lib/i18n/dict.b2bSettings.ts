// Translation dictionary for the B2B "Pengaturan" page (Kategori Akun + Pajak
// management). Merge into the main dict in src/lib/i18n.tsx.
export const dictB2bSettings: Record<string, Record<"id" | "en", string>> = {
  "b2bSettings.title": { id: "Pengaturan", en: "Settings" },
  "b2bSettings.subtitle": { id: "Kelola kategori akun dan pajak untuk bisnis B2B", en: "Manage account categories and taxes for the B2B business" },
  "b2bSettings.tabCategories": { id: "Kategori Akun", en: "Account Categories" },
  "b2bSettings.tabTaxes": { id: "Pajak", en: "Taxes" },

  "b2bSettings.categories.colLabel": { id: "Label", en: "Label" },
  "b2bSettings.categories.colType": { id: "Tipe", en: "Type" },
  "b2bSettings.categories.colCodeHint": { id: "Awalan Kode", en: "Code Prefix" },
  "b2bSettings.categories.colStatus": { id: "Status", en: "Status" },
  "b2bSettings.categories.addLabel": { id: "Nama kategori (mis. Cash & Bank)", en: "Category name (e.g. Cash & Bank)" },
  "b2bSettings.categories.addCodeHint": { id: "Awalan kode (mis. 11)", en: "Code prefix (e.g. 11)" },
  "b2bSettings.categories.add": { id: "Tambah Kategori", en: "Add Category" },
  "b2bSettings.categories.empty": { id: "Belum ada kategori.", en: "No categories yet." },
  "b2bSettings.categories.errorSave": { id: "Gagal menyimpan kategori", en: "Failed to save category" },

  "b2bSettings.taxes.colName": { id: "Nama Pajak", en: "Tax Name" },
  "b2bSettings.taxes.colRate": { id: "Tarif (%)", en: "Rate (%)" },
  "b2bSettings.taxes.colStatus": { id: "Status", en: "Status" },
  "b2bSettings.taxes.addName": { id: "Nama pajak (mis. PPN 11%)", en: "Tax name (e.g. VAT 11%)" },
  "b2bSettings.taxes.addRate": { id: "Tarif %", en: "Rate %" },
  "b2bSettings.taxes.add": { id: "Tambah Pajak", en: "Add Tax" },
  "b2bSettings.taxes.empty": { id: "Belum ada pajak.", en: "No taxes yet." },
  "b2bSettings.taxes.errorSave": { id: "Gagal menyimpan pajak", en: "Failed to save tax" },

  "b2bSettings.active": { id: "Aktif", en: "Active" },
  "b2bSettings.inactive": { id: "Nonaktif", en: "Inactive" },
  "b2bSettings.archive": { id: "Arsipkan", en: "Archive" },
  "b2bSettings.unarchive": { id: "Aktifkan", en: "Activate" },
};
