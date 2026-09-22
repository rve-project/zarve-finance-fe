// Bilingual strings for the financial report pages: General Ledger, Profit & Loss,
// and Balance Sheet. Keys are namespaced per page. Account names, and any other
// values that come from the chart of accounts (i.e. actual data), are NOT included
// here -- only fixed UI copy (labels, headings, buttons, table headers, etc).
// Merge this into the shared `dict` in src/lib/i18n.tsx.
export const dictFinancialReportsA: Record<string, Record<"id" | "en", string>> = {
  // General Ledger page
  "generalLedger.title": { id: "General Ledger", en: "General Ledger" },
  "generalLedger.subtitle": { id: "Mutasi detail per akun", en: "Detailed transactions per account" },
  "generalLedger.accountLabel": { id: "Akun", en: "Account" },
  "generalLedger.fromLabel": { id: "Dari", en: "From" },
  "generalLedger.toLabel": { id: "Sampai", en: "To" },
  "generalLedger.showButton": { id: "Tampilkan", en: "Show" },
  "generalLedger.totalDebit": { id: "Total Debit", en: "Total Debit" },
  "generalLedger.totalCredit": { id: "Total Kredit", en: "Total Credit" },
  "generalLedger.balancePrefix": { id: "Saldo", en: "Balance" },
  "generalLedger.accountBalance": { id: "Saldo Akun", en: "Account Balance" },
  "generalLedger.runningBalanceTrend": { id: "Tren Saldo Berjalan (halaman ini)", en: "Running Balance Trend (this page)" },
  "generalLedger.colDate": { id: "Tanggal", en: "Date" },
  "generalLedger.colRef": { id: "Ref", en: "Ref" },
  "generalLedger.colPartner": { id: "Partner", en: "Partner" },
  "generalLedger.colDescription": { id: "Keterangan", en: "Description" },
  "generalLedger.colDebit": { id: "Debit", en: "Debit" },
  "generalLedger.colCredit": { id: "Kredit", en: "Credit" },
  "generalLedger.colBalance": { id: "Saldo", en: "Balance" },
  "generalLedger.emptyState": { id: "Tidak ada mutasi untuk akun/periode ini.", en: "No transactions for this account/period." },
  "generalLedger.itemLabel": { id: "mutasi", en: "entries" },

  // Profit & Loss page
  "profitLoss.title": { id: "Laba Rugi", en: "Profit & Loss" },
  "profitLoss.subtitle": { id: "Pendapatan dan beban dalam periode", en: "Income and expenses for the period" },
  "profitLoss.fromLabel": { id: "Dari", en: "From" },
  "profitLoss.toLabel": { id: "Sampai", en: "To" },
  "profitLoss.showButton": { id: "Tampilkan", en: "Show" },
  "profitLoss.totalIncome": { id: "Total Pendapatan", en: "Total Income" },
  "profitLoss.totalExpense": { id: "Total Beban", en: "Total Expenses" },
  "profitLoss.netProfit": { id: "Laba Bersih", en: "Net Profit" },
  "profitLoss.incomeComposition": { id: "Komposisi Pendapatan", en: "Income Composition" },
  "profitLoss.expenseComposition": { id: "Komposisi Beban", en: "Expense Composition" },
  "profitLoss.incomeSection": { id: "Pendapatan", en: "Income" },
  "profitLoss.expenseSection": { id: "Beban", en: "Expenses" },
  "profitLoss.noIncome": { id: "Tidak ada pendapatan pada periode ini.", en: "No income for this period." },
  "profitLoss.noExpense": { id: "Tidak ada beban pada periode ini.", en: "No expenses for this period." },

  // Balance Sheet page
  "balanceSheet.title": { id: "Neraca", en: "Balance Sheet" },
  "balanceSheet.subtitle": {
    id: "Posisi aset, liabilitas, dan ekuitas per tanggal",
    en: "Statement of assets, liabilities, and equity as of a date",
  },
  "balanceSheet.asOfLabel": { id: "Per Tanggal", en: "As of Date" },
  "balanceSheet.showButton": { id: "Tampilkan", en: "Show" },
  "balanceSheet.totalAssets": { id: "Total Aset", en: "Total Assets" },
  "balanceSheet.liabilitiesPlusEquity": { id: "Liabilitas + Ekuitas", en: "Liabilities + Equity" },
  "balanceSheet.status": { id: "Status", en: "Status" },
  "balanceSheet.balanced": { id: "Balance", en: "Balanced" },
  "balanceSheet.notBalanced": { id: "Tidak Balance", en: "Not Balanced" },
  "balanceSheet.assetComposition": { id: "Komposisi Aset", en: "Asset Composition" },
  "balanceSheet.liabilitiesEquityComposition": {
    id: "Komposisi Liabilitas + Ekuitas",
    en: "Liabilities + Equity Composition",
  },
  "balanceSheet.assetsSection": { id: "Aset", en: "Assets" },
  "balanceSheet.liabilitiesSection": { id: "Liabilitas", en: "Liabilities" },
  "balanceSheet.equitySection": { id: "Ekuitas", en: "Equity" },
  "balanceSheet.totalLiabilitiesEquity": { id: "Total Liabilitas + Ekuitas", en: "Total Liabilities + Equity" },
  "balanceSheet.noDataPrefix": { id: "Tidak ada", en: "No" },
  "balanceSheet.totalPrefix": { id: "Total", en: "Total" },
};
