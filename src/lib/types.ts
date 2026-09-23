export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export interface Account {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  parentId: number | null;
  isActive: boolean;
}

export type PartnerType = "customer" | "vendor";

export interface Partner {
  id: number;
  name: string;
  type: PartnerType;
  ktpNumber: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PartnerPage {
  total: number;
  page: number;
  limit: number;
  data: Partner[];
}

export type VehicleCategory = "ev" | "fuel";

export interface Vehicle {
  id: number;
  platNumber: string;
  name: string;
  category: VehicleCategory;
  branch: string | null;
  incomeAccountId: number | null;
  analyticTag: string | null;
}

export type InvoiceState = "draft" | "posted";

export interface Invoice {
  id: number;
  number: string;
  partnerId: number;
  vehicleId: number | null;
  invoiceDate: string;
  state: InvoiceState;
  ref: string | null;
  totalAmount: number;
  createdAt: string;
}

export type InvoiceLineCategory = "DAILY" | "THR" | "REFF" | "ADMIN_FEE" | "OTHER";

export interface InvoiceLine {
  id: number;
  invoiceId: number;
  description: string;
  category: InvoiceLineCategory;
  accountId: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

export interface InvoiceDetail extends Invoice {
  lines: InvoiceLine[];
}

export interface Payment {
  id: number;
  partnerId: number;
  invoiceId: number | null;
  amount: number;
  date: string;
  method: string | null;
  memo: string | null;
  reconciliationId: number | null;
  createdAt: string;
}

export interface UnreconciledPayment {
  id: number;
  partnerId: number;
  partnerName: string | null;
  invoiceId: number | null;
  invoiceNumber: string | null;
  amount: number;
  date: string;
  method: string | null;
  memo: string | null;
}

export interface UnreconciledPaymentPage {
  total: number;
  totalAmount: number;
  page: number;
  limit: number;
  data: UnreconciledPayment[];
}

export interface ReconciliationRunResult {
  reconciliationId: number;
  totalAmount: number;
  paymentCount: number;
}

export interface ReconciliationHistoryEntry {
  id: number;
  bankAccountId: number;
  bankAccountCode: string;
  bankAccountName: string;
  date: string;
  totalAmount: number;
  paymentCount: number;
  createdAt: string;
}

export interface ReconciliationHistoryPage {
  total: number;
  page: number;
  limit: number;
  data: ReconciliationHistoryEntry[];
}

export interface ZarveMirrorSyncStatus {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  phase: string | null;
  totalInvoices: number;
  totalVehicles: number;
  totalStatusHistories: number;
  status: "running" | "done" | "error";
  errorMessage: string | null;
}

export type UserRole = "admin";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  aktif: boolean;
}

export interface ManagedUser extends User {
  zarveUserId: string | null;
  createdAt: string;
}

export interface AccountBalanceRow {
  account: Account;
  initialBalance: number;
  periodDebit: number;
  periodCredit: number;
  endBalance: number;
}

export interface TrialBalanceResult {
  from: string;
  to: string;
  rows: AccountBalanceRow[];
}

export interface GeneralLedgerLine {
  date: string;
  ref: string | null;
  narration: string | null;
  partnerName: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface GeneralLedgerResult {
  from: string;
  to: string;
  accountId: number;
  lines: GeneralLedgerLine[];
  total: number;
  page: number;
  limit: number;
  totalDebit: number;
  totalCredit: number;
  endBalance: number;
}

export interface ProfitAndLossResult {
  from: string;
  to: string;
  income: AccountBalanceRow[];
  expense: AccountBalanceRow[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export interface BalanceSheetResult {
  asOf: string;
  assets: AccountBalanceRow[];
  liabilities: AccountBalanceRow[];
  equity: AccountBalanceRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface CashFlowResult {
  from: string;
  to: string;
  accounts: AccountBalanceRow[];
  beginningBalance: number;
  cashIn: number;
  cashOut: number;
  netChange: number;
  endingBalance: number;
}

export interface RecapRow {
  bookingId: string;
  orderNumber: string;
  driver: string;
  nik: string;
  vehicle: string;
  vehiclePlate: string;
  collector: string;
  totalBill: number;
  totalPaid: number;
  totalUnpaid: number;
  dailyAmounts: Record<string, number>;
}

export interface RevenueRecap {
  from: string;
  to: string;
  dateColumns: string[];
  rows: RecapRow[];
  grandTotalBill: number;
  grandTotalPaid: number;
  grandTotalUnpaid: number;
}

export interface VehicleCategoryOption {
  id: string;
  name: string;
  companyName: string;
}

export type DriverRecapCellKind = "revenue" | "idle" | "maintenance" | "blank";

export interface DriverRecapCellViolation {
  detectedAt: string;
  returnedAt: string | null;
  geofenceName: string | null;
  price: number;
}

export interface DriverRecapCell {
  day: number;
  kind: DriverRecapCellKind;
  amount?: number;
  note?: string;
  partial?: boolean;
  violation?: DriverRecapCellViolation;
}

export interface DriverRecapRow {
  vehiclePlate: string;
  driverName: string;
  nik: string;
  collector: string;
  vehicleType: "ev" | "fuel";
  cells: DriverRecapCell[];
  totalRevenue: number;
  totalKeluarKota: number;
}

export interface DriverRevenueRecap {
  month: string;
  daysInMonth: number;
  categoryName: string;
  rows: DriverRecapRow[];
  fetchedAt: string | null;
}

// Live Zarve invoice data (Invoice menu) -- separate from the `Invoice`/`InvoiceDetail`
// types above, which are our own accounting ledger's invoices from the import feature.
export interface ZarveInvoiceDriver {
  id: string;
  name: string;
  phoneNumber?: string | null;
  nik?: string | null;
}

export interface ZarveInvoiceVehicle {
  id: string;
  plateNumber: string;
  category?: { id: string; name: string; engineType?: string } | null;
}

export interface ZarveInvoiceBooking {
  id: string;
  orderNumber: string;
  companyId: string;
  driver?: ZarveInvoiceDriver;
  vehicle?: ZarveInvoiceVehicle;
}

export interface ZarveInvoiceItem {
  id: string;
  type?: string | null;
  status?: string | null;
  description: string;
  qty: number;
  price: string | number;
  subtotal: string | number;
}

export interface ZarveInvoiceListItem {
  id: string;
  invoiceNumber?: string;
  bookingId: string;
  date: string;
  type: string;
  total: string | number;
  amountPaid: string | number;
  status: string;
  paymentMethod?: string | null;
  paidAt?: string | null;
  paymentTimeliness?: string;
  lateDays?: number;
  booking?: ZarveInvoiceBooking;
}

export interface ZarveInvoiceDetail extends ZarveInvoiceListItem {
  items?: ZarveInvoiceItem[];
  totalDiscount?: string | number;
  createdAt?: string;
}

export interface ZarveInvoicePage {
  total: number;
  page: number;
  limit: number;
  data: ZarveInvoiceListItem[];
}

export interface ZarveInvoiceType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface AppSettings {
  defaultIncomeAccountEvId: number | null;
  defaultIncomeAccountFuelId: number | null;
  autoCreatePayment: boolean;
  ppnEnabled: boolean;
  ppnRate: number;
}

// Manual journal entries -- accounting adjustments/corrections that don't come from
// invoices, payments, reconciliation, or vendor bills.
export interface JournalLineInput {
  accountId: number;
  partnerId?: number | null;
  debit: number;
  credit: number;
}

export interface JournalEntrySummary {
  id: number;
  date: string;
  ref: string | null;
  narration: string | null;
  sourceType: string;
  sourceId: number | null;
  totalAmount: number;
  createdAt: string;
}

export interface JournalEntryPage {
  total: number;
  page: number;
  limit: number;
  data: JournalEntrySummary[];
}

export interface JournalEntryLineDetail {
  id: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  partnerId: number | null;
  partnerName: string | null;
  debit: number;
  credit: number;
}

export interface JournalEntryDetail extends JournalEntrySummary {
  lines: JournalEntryLineDetail[];
}

// Vendor bills / vendor payments -- the accounts-payable side of the books.
export interface VendorBillLine {
  id: number;
  description: string;
  accountId: number;
  vehicleId: number | null;
  amount: number;
}

export interface VendorBill {
  id: number;
  number: string;
  vendorId: number;
  vendorName: string;
  billDate: string;
  ref: string | null;
  totalAmount: number;
  createdAt: string;
}

export interface VendorBillDetail extends VendorBill {
  lines: VendorBillLine[];
}

export interface VendorBillPage {
  total: number;
  page: number;
  limit: number;
  data: VendorBill[];
}

export interface VendorPayment {
  id: number;
  vendorId: number;
  vendorName: string;
  vendorBillId: number | null;
  bankAccountId: number;
  amount: number;
  date: string;
  method: string | null;
  memo: string | null;
  createdAt: string;
}

export interface VendorPaymentPage {
  total: number;
  page: number;
  limit: number;
  data: VendorPayment[];
}

// Reports: Aged Receivables & per-vehicle profitability
export interface AgedReceivablePartner {
  partnerId: number;
  partnerName: string;
  current: number;
  d1to30: number;
  d31to60: number;
  d61to90: number;
  d90plus: number;
  total: number;
}

export interface AgedReceivablesResult {
  asOf: string;
  partners: AgedReceivablePartner[];
  totals: Omit<AgedReceivablePartner, "partnerId" | "partnerName">;
}

export interface VehicleProfitabilityRow {
  vehicleId: number;
  platNumber: string;
  name: string;
  income: number;
  expense: number;
  profit: number;
}

export interface VehicleProfitabilityResult {
  from: string;
  to: string;
  vehicles: VehicleProfitabilityRow[];
}

// "Keluar kota" (geofence) billing -- what's already invoiced vs still unbilled.
export interface GeofenceViolationSummaryBucket {
  count: number;
  amount: number;
}

export interface GeofenceViolationSummary {
  open: GeofenceViolationSummaryBucket;
  invoiced: GeofenceViolationSummaryBucket;
  waived: GeofenceViolationSummaryBucket;
  total: GeofenceViolationSummaryBucket;
}

export interface GeofenceViolationRow {
  id: string;
  violationDate: string;
  detectedAt: string;
  returnedAt: string | null;
  vehiclePlate: string | null;
  driverName: string | null;
  geofenceName: string | null;
  price: number;
  status: "OPEN" | "INVOICED" | "WAIVED";
  invoiceId: string | null;
  invoiceNumber: string | null;
}

export interface InvoiceStatusSummaryRow {
  status: string;
  count: number;
  totalAmount: number;
  outstandingAmount: number;
}

export interface GeofenceViolationsResult {
  from: string;
  to: string;
  summary: GeofenceViolationSummary;
  total: number;
  page: number;
  limit: number;
  data: GeofenceViolationRow[];
}
