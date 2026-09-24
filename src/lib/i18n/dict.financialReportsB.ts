import { Lang } from "@/lib/i18n";

// Translation keys for the "B" batch of financial report pages:
// Cash Flow, Aged Receivables, Vehicle Profitability, Geofence Violations (Keluar Kota).
// Namespaced by page so keys never collide with other dict files being merged later.
export const dictFinancialReportsB: Record<string, Record<Lang, string>> = {
  // ---- Cash Flow (Arus Kas) ----
  "cashFlow.title": { id: "Arus Kas", en: "Cash Flow" },
  "cashFlow.subtitle": {
    id: "Versi sederhana -- pergerakan bersih akun Bank/Kas dalam periode (belum dipecah operating/investing/financing)",
    en: "Simplified version -- net movement of Bank/Cash accounts within the period (not yet split into operating/investing/financing)",
  },
  "cashFlow.from": { id: "Dari", en: "From" },
  "cashFlow.to": { id: "Sampai", en: "To" },
  "cashFlow.show": { id: "Tampilkan", en: "Show" },
  "cashFlow.beginningBalance": { id: "Saldo Awal", en: "Beginning Balance" },
  "cashFlow.endingBalance": { id: "Saldo Akhir", en: "Ending Balance" },
  "cashFlow.cashIn": { id: "Kas Masuk", en: "Cash In" },
  "cashFlow.cashOut": { id: "Kas Keluar", en: "Cash Out" },
  "cashFlow.cashInVsOut": { id: "Kas Masuk vs Kas Keluar", en: "Cash In vs Cash Out" },
  "cashFlow.endingBalanceByAccount": { id: "Saldo Akhir per Akun", en: "Ending Balance by Account" },
  "cashFlow.account": { id: "Akun", en: "Account" },
  "cashFlow.in": { id: "Masuk", en: "In" },
  "cashFlow.out": { id: "Keluar", en: "Out" },
  "cashFlow.emptyAccounts": {
    id: "Tidak ada akun Bank/Kas dengan mutasi di periode ini.",
    en: "No Bank/Cash accounts with movement in this period.",
  },

  // ---- Aged Receivables (Piutang Jatuh Tempo) ----
  "agedReceivables.title": { id: "Piutang Jatuh Tempo", en: "Aged Receivables" },
  "agedReceivables.subtitle": {
    id: "Piutang belum tertagih, dikelompokkan berdasarkan umur sejak tanggal invoice",
    en: "Uncollected receivables, grouped by age since the invoice date",
  },
  "agedReceivables.asOfDate": { id: "Per Tanggal", en: "As of Date" },
  "agedReceivables.show": { id: "Tampilkan", en: "Show" },
  "agedReceivables.bucket.current": { id: "Current", en: "Current" },
  "agedReceivables.bucket.d1to30": { id: "1-30 Hari", en: "1-30 Days" },
  "agedReceivables.bucket.d31to60": { id: "31-60 Hari", en: "31-60 Days" },
  "agedReceivables.bucket.d61to90": { id: "61-90 Hari", en: "61-90 Days" },
  "agedReceivables.bucket.d90plus": { id: "90+ Hari", en: "90+ Days" },
  "agedReceivables.top10Title": { id: "Top 10 Piutang by Umur", en: "Top 10 Receivables by Age" },
  "agedReceivables.driverCustomer": { id: "Driver / Customer", en: "Driver / Customer" },
  "agedReceivables.total": { id: "Total", en: "Total" },
  "agedReceivables.emptyState": { id: "Tidak ada piutang belum tertagih.", en: "No uncollected receivables." },
  "agedReceivables.colInvoice": { id: "Invoice", en: "Invoice" },
  "agedReceivables.colDate": { id: "Tanggal", en: "Date" },
  "agedReceivables.colBucket": { id: "Umur", en: "Age" },
  "agedReceivables.colTotalAmount": { id: "Total Invoice", en: "Invoice Total" },
  "agedReceivables.colPaid": { id: "Dibayar", en: "Paid" },
  "agedReceivables.colOutstanding": { id: "Sisa", en: "Outstanding" },
  "agedReceivables.viewInvoice": { id: "Lihat invoice", en: "View invoice" },

  // ---- Vehicle Profitability (Profitabilitas per Kendaraan) ----
  "vehicleProfitability.title": { id: "Profitabilitas per Kendaraan", en: "Profitability by Vehicle" },
  "vehicleProfitability.subtitle": {
    id: "Pendapatan (dari invoice) vs beban (dari tagihan vendor yang ditandai ke kendaraan tertentu) -- kendaraan mana yang paling untung",
    en: "Income (from invoices) vs expense (from vendor bills tagged to a specific vehicle) -- which vehicles are the most profitable",
  },
  "vehicleProfitability.from": { id: "Dari", en: "From" },
  "vehicleProfitability.to": { id: "Sampai", en: "To" },
  "vehicleProfitability.show": { id: "Tampilkan", en: "Show" },
  "vehicleProfitability.totalIncome": { id: "Total Pendapatan", en: "Total Income" },
  "vehicleProfitability.totalTaggedExpense": { id: "Total Beban Bertanda Kendaraan", en: "Total Vehicle-Tagged Expense" },
  "vehicleProfitability.vehicleCount": { id: "Jumlah Kendaraan", en: "Vehicle Count" },
  "vehicleProfitability.expenseNote": {
    id: "Beban hanya muncul kalau baris tagihan vendor ditandai ke kendaraan tertentu saat dibuat -- kalau belum ada yang ditandai, kolom Beban akan 0.",
    en: "Expense only shows up when a vendor bill line was tagged to a specific vehicle when created -- if none are tagged yet, the Expense column will be 0.",
  },
  "vehicleProfitability.top10Title": { id: "Top 10 Kendaraan by Profit", en: "Top 10 Vehicles by Profit" },
  "vehicleProfitability.plateNumber": { id: "Plat Nomor", en: "Plate Number" },
  "vehicleProfitability.vehicle": { id: "Kendaraan", en: "Vehicle" },
  "vehicleProfitability.income": { id: "Pendapatan", en: "Income" },
  "vehicleProfitability.expense": { id: "Beban", en: "Expense" },
  "vehicleProfitability.profit": { id: "Profit", en: "Profit" },
  "vehicleProfitability.emptyState": { id: "Tidak ada data untuk periode ini.", en: "No data for this period." },

  // ---- Geofence Violations / Keluar Kota ----
  "geofenceViolations.title": { id: "Keluar Kota (Geofence)", en: "Out of Town (Geofence)" },
  "geofenceViolations.subtitle": {
    id: "Rekap biaya unit yang keluar dari area kerja -- mana yang sudah ditagih, mana yang belum",
    en: "Summary of costs for units that left the work area -- which have been billed, which haven't",
  },
  "geofenceViolations.from": { id: "Dari", en: "From" },
  "geofenceViolations.to": { id: "Sampai", en: "To" },
  "geofenceViolations.show": { id: "Tampilkan", en: "Show" },
  "geofenceViolations.status.open": { id: "Belum Ditagih", en: "Not Yet Billed" },
  "geofenceViolations.status.invoiced": { id: "Sudah Ditagih", en: "Billed" },
  "geofenceViolations.status.waived": { id: "Diabaikan", en: "Waived" },
  "geofenceViolations.totalFine": { id: "Total Denda Keluar Kota", en: "Total Out-of-Town Fine" },
  "geofenceViolations.compositionTitle": { id: "Komposisi Nominal", en: "Amount Composition" },
  "geofenceViolations.date": { id: "Tanggal", en: "Date" },
  "geofenceViolations.vehicle": { id: "Kendaraan", en: "Vehicle" },
  "geofenceViolations.driver": { id: "Driver", en: "Driver" },
  "geofenceViolations.area": { id: "Area", en: "Area" },
  "geofenceViolations.exit": { id: "Keluar", en: "Exit" },
  "geofenceViolations.returned": { id: "Kembali", en: "Returned" },
  "geofenceViolations.fine": { id: "Denda", en: "Fine" },
  "geofenceViolations.statusColumn": { id: "Status", en: "Status" },
  "geofenceViolations.invoiceNo": { id: "No. Invoice", en: "Invoice No." },
  "geofenceViolations.notDetectedYet": { id: "belum terdeteksi", en: "not yet detected" },
  "geofenceViolations.emptyState": {
    id: "Tidak ada pelanggaran keluar area pada periode ini.",
    en: "No out-of-area violations in this period.",
  },
  "geofenceViolations.itemLabel": { id: "pelanggaran", en: "violations" },
};
