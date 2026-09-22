import type { Lang } from "@/lib/i18n";

// Translation keys for the Revenue Recap and Settings pages.
// Namespaced as "revenueRecap.*" and "settings.*".
export const dictRevenueSettings: Record<string, Record<Lang, string>> = {
  // Revenue Recap -- page header / filters
  "revenueRecap.title": { id: "Rekap Revenue Harian Driver", en: "Daily Driver Revenue Recap" },
  "revenueRecap.subtitle": {
    id: "Data hasil sinkronisasi dari sistem operasional (Zarve) -- per kendaraan, per driver, termasuk status Unit Idle / Maintenance",
    en: "Data synced from the operations system (Zarve) -- per vehicle, per driver, including Idle Unit / Maintenance status",
  },
  "revenueRecap.unitType": { id: "Tipe Unit", en: "Unit Type" },
  "revenueRecap.unitTypeLoadError": { id: "Gagal memuat daftar tipe unit", en: "Failed to load unit type list" },
  "revenueRecap.retry": { id: "Coba Lagi", en: "Try Again" },
  "revenueRecap.period": { id: "Periode", en: "Period" },
  "revenueRecap.reload": { id: "Muat Ulang", en: "Reload" },
  "revenueRecap.downloading": { id: "Mengunduh...", en: "Downloading..." },
  "revenueRecap.exportExcel": { id: "Export ke Excel", en: "Export to Excel" },
  "revenueRecap.loadError": { id: "Gagal memuat data", en: "Failed to load data" },
  "revenueRecap.exportError": { id: "Gagal export", en: "Export failed" },
  "revenueRecap.loadingData": { id: "Memuat data...", en: "Loading data..." },

  // Revenue Recap -- summary card
  "revenueRecap.rows": { id: "baris", en: "rows" },
  "revenueRecap.lastSynced": { id: "Sinkron terakhir:", en: "Last synced:" },
  "revenueRecap.geofencePenalty": { id: "Denda Keluar Kota", en: "Out-of-Town Penalty" },

  // Revenue Recap -- legend
  "revenueRecap.legendIdle": { id: "Unit Idle", en: "Idle Unit" },
  "revenueRecap.legendCuti": { id: "Cuti / Tidak Masuk", en: "Leave / Absent" },
  "revenueRecap.legendPartial": { id: "Bayar Sebagian", en: "Partial Payment" },
  "revenueRecap.legendGeofence": {
    id: "Keluar Geofence (hover untuk jam keluar/kembali)",
    en: "Left Geofence (hover for exit/return time)",
  },

  // Revenue Recap -- table headers / cells
  "revenueRecap.colNo": { id: "No", en: "No." },
  "revenueRecap.colDriverName": { id: "Nama Driver", en: "Driver Name" },
  "revenueRecap.colPlate": { id: "Nopol", en: "Plate No." },
  "revenueRecap.colRevenueAmount": { id: "Jumlah Revenue", en: "Total Revenue" },
  "revenueRecap.cellMaintenance": { id: "maintenance", en: "maintenance" },
  "revenueRecap.noData": { id: "Tidak ada data untuk tipe unit/periode ini.", en: "No data for this unit type/period." },

  // Revenue Recap -- geofence violation tooltip
  "revenueRecap.violation.defaultArea": { id: "area kerja", en: "work area" },
  "revenueRecap.violation.title": { id: "Keluar Geofence", en: "Left Geofence" },
  "revenueRecap.violation.exitedLabel": { id: "Keluar area", en: "Exited area" },
  "revenueRecap.violation.returnLabel": { id: "Kembali", en: "Returned" },
  "revenueRecap.violation.notDetected": { id: "Belum terdeteksi", en: "Not yet detected" },
  "revenueRecap.violation.penalty": { id: "Denda:", en: "Penalty:" },

  // Revenue Recap -- relative time captions (helper keeps the actual numbers/logic)
  "revenueRecap.relative.never": { id: "belum pernah disinkron", en: "never synced" },
  "revenueRecap.relative.justNow": { id: "baru saja", en: "just now" },
  "revenueRecap.relative.secondsAgo": { id: "detik yang lalu", en: "seconds ago" },
  "revenueRecap.relative.minutesAgo": { id: "menit yang lalu", en: "minutes ago" },
  "revenueRecap.relative.hoursAgo": { id: "jam yang lalu", en: "hours ago" },

  // Settings page
  "settings.subtitle": {
    id: "Konfigurasi default untuk proses sinkronisasi data rental dari Zarve",
    en: "Default configuration for syncing rental data from Zarve",
  },
  "settings.loadError": { id: "Gagal memuat pengaturan", en: "Failed to load settings" },
  "settings.saveError": { id: "Gagal menyimpan pengaturan", en: "Failed to save settings" },
  "settings.loading": { id: "Memuat pengaturan...", en: "Loading settings..." },
  "settings.saved": { id: "Pengaturan tersimpan.", en: "Settings saved." },

  "settings.incomeAccountSectionTitle": { id: "Akun Pendapatan Default", en: "Default Income Account" },
  "settings.incomeAccountDesc": {
    id: "Akun ini dipakai untuk invoice sewa dari kendaraan baru yang dibuat otomatis saat sinkronisasi (kategori EV/Bensin diambil langsung dari data Zarve). Akun pendapatan yang sudah diset langsung di halaman Kendaraan tetap diprioritaskan.",
    en: "This account is used for rental invoices from new vehicles created automatically during sync (EV/Fuel category is taken directly from Zarve data). An income account already set directly on the Vehicles page still takes priority.",
  },
  "settings.evVehicleLabel": { id: "Kendaraan Listrik (EV)", en: "Electric Vehicle (EV)" },
  "settings.fuelVehicleLabel": { id: "Kendaraan Bensin", en: "Fuel Vehicle" },
  "settings.useSystemDefault": { id: "(pakai default sistem)", en: "(use system default)" },

  "settings.syncOptionsTitle": { id: "Opsi Sinkronisasi", en: "Sync Options" },
  "settings.autoCreatePaymentLabel": { id: "Buat Pembayaran Otomatis", en: "Auto-Create Payment" },
  "settings.autoCreatePaymentDesc": {
    id: "Jika aktif, setiap hari dengan pembayaran di Zarve otomatis dibuatkan catatan pembayaran saat sinkronisasi. Jika nonaktif, sinkronisasi hanya membuat invoice -- pembayaran harus dicatat manual.",
    en: "When enabled, every day with a payment in Zarve automatically gets a payment record during sync. When disabled, sync only creates invoices -- payments must be recorded manually.",
  },

  "settings.ppnSectionTitle": { id: "PPN (Pajak Pertambahan Nilai)", en: "VAT (Value Added Tax)" },
  "settings.ppnEnableLabel": { id: "Aktifkan PPN di Invoice", en: "Enable VAT on Invoices" },
  "settings.ppnEnableDesc": {
    id: "Nonaktif secara default -- baru aktifkan kalau perusahaan sudah dipastikan PKP (wajib pungut PPN). Kalau aktif, setiap invoice baru dari sinkronisasi otomatis dapat baris PPN Keluaran sebesar tarif di bawah, dicatat sebagai utang pajak sampai disetor.",
    en: "Disabled by default -- only enable it once the company is confirmed as a taxable entity (PKP, required to collect VAT). When enabled, every new invoice from sync automatically gets an Output VAT line at the rate below, recorded as a tax liability until remitted.",
  },
  "settings.ppnRateLabel": { id: "Tarif PPN", en: "VAT Rate" },

  "settings.saving": { id: "Menyimpan...", en: "Saving..." },
  "settings.savePengaturan": { id: "Simpan Pengaturan", en: "Save Settings" },
};
