export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";
export type AccountAccessMode = "all" | "some";

export interface Account {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  parentId: number | null;
  isActive: boolean;
  description: string | null;
  categoryId: number | null;
  taxId: number | null;
  bankName: string | null;
  accessMode: AccountAccessMode;
}

/** Returned only by GET/POST/PUT /accounts/:id -- the plain list endpoint doesn't
 * include this to avoid an extra query per row for something the list view never
 * shows. */
export interface AccountDetail extends Account {
  accessUserIds: number[];
}

export interface AccountCategory {
  id: number;
  value: string;
  label: string;
  type: AccountType;
  codeHint: string | null;
  isActive: boolean;
}

export interface TaxCode {
  id: number;
  name: string;
  rate: number;
  isActive: boolean;
}

/** "Nama bank" list for the Kas & Bank account create form -- editable via Settings,
 * same pattern as TaxCode. */
export interface Bank {
  id: number;
  name: string;
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
  accountCode: string;
  accountName: string;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

export interface InvoiceSourceZarveInvoice {
  zarveInvoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  total: number;
  amountPaid: number;
  status: string;
}

export interface InvoiceDetail extends Invoice {
  partnerName: string;
  vehiclePlateNumber: string | null;
  amountPaid: number;
  outstanding: number;
  lines: InvoiceLine[];
  /** The individual outstanding Zarve daily invoices this monthly recap line stands in
   * for (see zarveSync.controller.ts) -- lets staff cross-reference against the
   * invoice numbers the driver actually sees in Zarve, since this invoice's own number
   * never matches anything there. Reconstructed by driver+vehicle+month, not a stored
   * link, so it only ever lists the ones still unpaid/partial. */
  sourceInvoices: InvoiceSourceZarveInvoice[];
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
  description?: string | null;
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
  description: string | null;
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
export type AgedReceivableBucket = "current" | "d1to30" | "d31to60" | "d61to90" | "d90plus";

export interface AgedReceivableInvoice {
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  paid: number;
  outstanding: number;
  bucket: AgedReceivableBucket;
}

export interface AgedReceivablePartner {
  partnerId: number;
  partnerName: string;
  current: number;
  d1to30: number;
  d31to60: number;
  d61to90: number;
  d90plus: number;
  total: number;
  invoices: AgedReceivableInvoice[];
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

// Kas & Bank -- cash/bank accounts with a ledger balance (always accurate) alongside
// whatever was last imported from a bank statement file (no live bank connection).
export interface CashBankAccount {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  saldoJurnal: number;
  saldoBank: number;
}

export interface CashBankLedgerLine {
  lineId: number;
  date: string;
  ref: string | null;
  narration: string | null;
  sourceType: string;
  docNumber: string | null;
  docKind: "purchase" | "sale" | "expense" | null;
  docId: number | null;
  lineDescription: string | null;
  contactName: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface CashBankLedgerResult {
  accountId: number;
  total: number;
  page: number;
  limit: number;
  endBalance: number;
  lines: CashBankLedgerLine[];
}

export interface CashBankSummary {
  asOf: string;
  pemasukanMendatang: number;
  pemasukanMendatangCount: number;
  pengeluaranMendatang: number;
  pengeluaranMendatangCount: number;
  saldoKasBank: number;
  saldoKasBankCount: number;
  saldoKartuKredit: number;
  saldoKartuKreditCount: number;
}

export interface BankStatementImportResult {
  importId: number;
  totalLines: number;
  endingBalance: number;
}

// Fixed assets (B2B). Buying an asset posts a real journal entry; depreciation is
// straight-line, computed on read (book value / schedule), not auto-posted.
export type DepreciationMethod = "straight_line";
export type FixedAssetStatus = "active" | "disposed";

export interface FixedAsset {
  id: number;
  assetNumber: string;
  name: string;
  description: string | null;
  categoryAccountId: number;
  categoryAccountCode: string;
  categoryAccountName: string;
  acquisitionDate: string;
  acquisitionCost: number;
  creditAccountId: number | null;
  isNonDepreciating: boolean;
  depreciationMethod: DepreciationMethod | null;
  usefulLifeYears: number | null;
  depreciationExpenseAccountId: number | null;
  accumulatedDepreciationAccountId: number | null;
  openingAccumulatedDepreciation: number;
  openingAccumulatedDepreciationDate: string | null;
  status: FixedAssetStatus;
  disposalDate: string | null;
  disposalAmount: number | null;
  disposalJournalEntryId: number | null;
  purchaseJournalEntryId: number | null;
  createdAt: string;
}

export interface ActiveFixedAsset extends FixedAsset {
  accumulatedDepreciation: number;
  bookValue: number;
}

export interface DisposedFixedAsset extends FixedAsset {
  bookValueAtDisposal: number;
  gainLoss: number;
}

export interface PendingFixedAsset {
  journalLineId: number;
  journalEntryId: number;
  date: string;
  ref: string | null;
  description: string | null;
  accountId: number;
  accountCode: string;
  accountName: string;
  amount: number;
}

export interface DepreciationScheduleRow {
  assetId: number;
  assetNumber: string;
  assetName: string;
  period: string;
  method: DepreciationMethod;
  value: number;
  amount: number;
}

export interface DepreciationScheduleResult {
  month: string;
  data: DepreciationScheduleRow[];
}

export interface DisposeAssetResult {
  disposalJournalEntryId: number;
  bookValueAtDisposal: number;
  gainLoss: number;
}

// "Pemenuhan" (order fulfillment) board -- operational/logistics tracker, not wired
// into the ledger. Status moves manually (no live courier integration), matching
// Mekari Jurnal's own board.
export type OrderType = "sale" | "purchase";
export type OrderStatus = "new" | "processing" | "shipping" | "completed" | "cancelled";

export interface Order {
  id: number;
  type: OrderType;
  orderNumber: string;
  partyName: string;
  orderDate: string;
  amount: number;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OrdersByStatus = Record<OrderStatus, Order[]>;

// "Produk" -- Barang & Jasa tab only for now (Gudang/warehouse is deferred, Aturan
// Harga was dropped entirely). Stock is a plain manual number, no warehouse ledger
// yet. A product can independently be bought, sold, or both, each linked to its own
// account/tax -- matching Mekari's own "Tambah produk baru" form.
export type ProductType = "barang" | "jasa";

// "Tipe Produk" from Mekari's form -- Single (one unit) or Bundle (a package).
// Hardcoded (not Settings-managed) since there are only ever these two values. Bundle
// composition isn't implemented -- this is a label only for now.
export type ProductKind = "single" | "bundle";

export interface ProductCategory {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  type: ProductType;
  name: string;
  code: string;
  barcode: string | null;
  categoryId: number | null;
  categoryName: string | null;
  unit: string | null;
  description: string | null;
  trackPurchase: boolean;
  purchasePrice: number;
  purchaseAccountId: number | null;
  purchaseTaxId: number | null;
  trackSale: boolean;
  sellingPrice: number;
  saleAccountId: number | null;
  saleTaxId: number | null;
  imageUrl: string | null;
  productType: ProductKind;
  inventoryAccountId: number | null;
  bundleExtraCostAccountId: number | null;
  trackInventory: boolean;
  currentStock: number | null;
  minStock: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProductSummary {
  available: number;
  lowStock: number;
  outOfStock: number;
  warehousesRegistered: number;
}

export interface ProductListResult {
  products: Product[];
  summary: ProductSummary;
}

// "Gudang" -- Daftar gudang only (list + create). Stock stays one flat number on the
// product row, not split per warehouse -- so no transfer/approval data exists yet.
export interface Warehouse {
  id: number;
  code: string;
  name: string;
  pics: { id: number; name: string }[];
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

// "Penyesuaian Stok" -- pick a type/category/account/date/warehouse, then list which
// products change and by how much. Each line's before/after is that product's
// allocation in the chosen warehouse specifically; posts a journal entry only for
// lines whose product has a default inventory account set. "Kategori penyesuaian" is a
// fixed, hardcoded list -- not Settings-managed.
export type StockAdjustmentType = "count" | "in_out";
export type StockAdjustmentCategory = "general" | "damaged" | "production" | "opening_quantity";

export interface StockAdjustmentLine {
  id: number;
  productId: number;
  productName: string;
  productUnit: string | null;
  stockBefore: number;
  stockAfter: number;
}

export interface StockAdjustment {
  id: number;
  adjustmentNumber: string;
  type: StockAdjustmentType;
  category: StockAdjustmentCategory;
  accountId: number | null;
  warehouseId: number | null;
  warehouseName: string | null;
  adjustmentDate: string;
  memo: string | null;
  journalEntryId: number | null;
  lines: StockAdjustmentLine[];
  createdAt: string;
}

// "Transfer Gudang" -- moves qty of qty-tracked products between two warehouse
// allocations. Doesn't change a product's total stock across every warehouse -- only
// the per-warehouse split.
export interface WarehouseTransferLine {
  id: number;
  productId: number;
  productName: string;
  productUnit: string | null;
  qtyBefore: number;
  qtyAfter: number;
  qtyTransferred: number;
}

export interface WarehouseTransferAttachment {
  id: number;
  fileName: string;
  url: string;
}

export interface WarehouseTransfer {
  id: number;
  transferNumber: string;
  fromWarehouseId: number | null;
  fromWarehouseName: string | null;
  toWarehouseId: number | null;
  toWarehouseName: string | null;
  transferDate: string;
  memo: string | null;
  lines: WarehouseTransferLine[];
  attachments: WarehouseTransferAttachment[];
  createdAt: string;
}

// "Kontak" -- a B2B-only contact book (Pelanggan/Supplier/Karyawan/Lainnya). No AR/AP
// balance tracking exists for B2B yet, so "Saldo" is always 0 for now.
export type ContactType = "customer" | "vendor" | "employee" | "other";

export type Citizenship = "wni" | "wna";

export interface ContactBankAccount {
  id: number;
  bankName: string | null;
  branch: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
}

export interface Contact {
  id: number;
  types: ContactType[];
  name: string;
  salutation: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  companyName: string | null;
  address: string | null;
  shippingAddress: string | null;
  email: string | null;
  mobilePhone: string | null;
  phone: string | null;
  fax: string | null;
  citizenship: Citizenship;
  npwp: string | null;
  idType: string | null;
  idNumber: string | null;
  nitku: string | null;
  paymentTerm: string | null;
  receivableAccountId: number | null;
  payableAccountId: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  bankAccounts: ContactBankAccount[];
}

export interface ExpenseLine {
  id: number;
  accountId: number;
  accountName: string;
  description: string | null;
  taxId: number | null;
  taxName: string | null;
  taxRate: number | null;
  amount: number;
  taxAmount: number;
}

export interface Expense {
  id: number;
  number: string;
  contactId: number | null;
  contactName: string | null;
  expenseDate: string;
  paymentMethod: string | null;
  bankAccountId: number | null;
  bankAccountName: string | null;
  payLater: boolean;
  billingAddress: string | null;
  tag: string | null;
  memo: string | null;
  discountAmount: number;
  totalAmount: number;
  outstanding: number;
  categoryName?: string | null;
  createdAt: string;
}

export interface ExpenseDetail extends Expense {
  journalEntryId: number | null;
  lines: ExpenseLine[];
}

export interface ExpenseStats {
  monthTotal: number;
  monthCount: number;
  last30Total: number;
  last30Count: number;
  unpaidTotal: number;
  unpaidCount: number;
}

export interface CreateExpenseLineInput {
  accountId: number;
  description?: string;
  taxId?: number;
  amount: number;
  taxAmount: number;
}

export interface CreateExpenseInput {
  contactId?: number;
  expenseDate: string;
  paymentMethod?: string;
  bankAccountId?: number;
  payLater: boolean;
  billingAddress?: string;
  tag?: string;
  memo?: string;
  discountAmount: number;
  lines: CreateExpenseLineInput[];
}

// "Pembelian" (Purchases) -- the procurement pipeline: Permintaan -> Penawaran ->
// Pemesanan -> Faktur (the only stage that posts to the ledger), plus Tukar Faktur and
// Pengiriman as side documents. See rve-finance-be's migrations/038_purchases.sql.
export type PurchaseDocType = "request" | "quotation" | "order" | "invoice" | "exchange" | "shipment";
export type PurchaseStatus = "draft" | "pending_approval" | "approved" | "rejected";

export interface PurchaseLine {
  id: number;
  productId: number | null;
  productName: string | null;
  accountId: number | null;
  accountName: string | null;
  description: string | null;
  qty: number;
  unitPrice: number;
  taxId: number | null;
  taxName: string | null;
  taxRate: number | null;
  amount: number;
  taxAmount: number;
  targetDocumentId: number | null;
  targetDocumentNumber: string | null;
}

export interface PurchasePayment {
  id: number;
  bankAccountId: number;
  bankAccountName: string;
  amount: number;
  paymentDate: string;
  memo: string | null;
  createdAt: string;
}

export interface PurchaseDocument {
  id: number;
  docType: PurchaseDocType;
  number: string;
  status: PurchaseStatus;
  contactId: number | null;
  contactName: string | null;
  documentDate: string;
  dueDate: string | null;
  reference: string | null;
  memo: string | null;
  email: string | null;
  billingAddress: string | null;
  supplierRef: string | null;
  tag: string | null;
  customerNote: string | null;
  paymentTerm: string | null;
  warehouseId: number | null;
  warehouseName: string | null;
  discountAmount: number;
  approverUserId: number | null;
  approverEmail: string | null;
  urgency: string | null;
  budgetYear: string | null;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  amountPaid: number;
  amountCredited: number;
  outstanding: number;
  isOverdue: boolean;
  convertedFromId: number | null;
  submittedBy: number | null;
  approvedBy: number | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
}

export interface PurchaseDocumentDetail extends PurchaseDocument {
  journalEntryId: number | null;
  lines: PurchaseLine[];
  payments: PurchasePayment[];
}

export interface PurchaseStats {
  unpaidTotal: number;
  overdueTotal: number;
  last30PaidTotal: number;
}

export interface CreatePurchaseLineInput {
  productId?: number;
  accountId?: number;
  targetDocumentId?: number;
  description?: string;
  qty: number;
  unitPrice: number;
  taxId?: number;
  amount: number;
  taxAmount: number;
}

export interface CreatePurchaseInput {
  contactId?: number;
  documentDate: string;
  dueDate?: string;
  reference?: string;
  memo?: string;
  email?: string;
  billingAddress?: string;
  supplierRef?: string;
  tag?: string;
  customerNote?: string;
  paymentTerm?: string;
  warehouseId?: number;
  approverUserId?: number;
  approverEmail?: string;
  urgency?: string;
  budgetYear?: string;
  discountAmount: number;
  submitForApproval: boolean;
  lines: CreatePurchaseLineInput[];
}

// "Penjualan" (Sales) -- mirrors the Purchases types above but for the revenue side
// (no "request" doc type -- that's an internal-only concept on the buy side).
// See rve-finance-be's migrations/039_sales.sql and 044_sale_exchange.sql.
export type SaleDocType = "quotation" | "order" | "invoice" | "shipment" | "exchange";
export type SaleStatus = "draft" | "pending_approval" | "approved" | "rejected";

export interface SaleLine {
  id: number;
  productId: number | null;
  productName: string | null;
  accountId: number | null;
  accountName: string | null;
  description: string | null;
  qty: number;
  unitPrice: number;
  taxId: number | null;
  taxName: string | null;
  taxRate: number | null;
  amount: number;
  taxAmount: number;
  targetDocumentId: number | null;
  targetDocumentNumber: string | null;
}

export interface SalePayment {
  id: number;
  bankAccountId: number;
  bankAccountName: string;
  amount: number;
  paymentDate: string;
  memo: string | null;
  createdAt: string;
}

export interface SaleDocument {
  id: number;
  docType: SaleDocType;
  number: string;
  status: SaleStatus;
  contactId: number | null;
  contactName: string | null;
  documentDate: string;
  dueDate: string | null;
  reference: string | null;
  memo: string | null;
  email: string | null;
  billingAddress: string | null;
  customerRef: string | null;
  tag: string | null;
  customerNote: string | null;
  paymentTerm: string | null;
  warehouseId: number | null;
  warehouseName: string | null;
  discountAmount: number;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  amountPaid: number;
  amountCredited: number;
  outstanding: number;
  isOverdue: boolean;
  convertedFromId: number | null;
  submittedBy: number | null;
  approvedBy: number | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
}

export interface SaleDocumentDetail extends SaleDocument {
  journalEntryId: number | null;
  lines: SaleLine[];
  payments: SalePayment[];
}

export interface SaleStats {
  unpaidTotal: number;
  overdueTotal: number;
  last30PaidTotal: number;
}

export interface CreateSaleLineInput {
  productId?: number;
  accountId?: number;
  description?: string;
  qty: number;
  unitPrice: number;
  taxId?: number;
  amount: number;
  taxAmount: number;
  targetDocumentId?: number;
}

export interface CreateSaleInput {
  contactId?: number;
  documentDate: string;
  dueDate?: string;
  reference?: string;
  memo?: string;
  email?: string;
  billingAddress?: string;
  customerRef?: string;
  tag?: string;
  customerNote?: string;
  paymentTerm?: string;
  warehouseId?: number;
  discountAmount: number;
  submitForApproval: boolean;
  lines: CreateSaleLineInput[];
}
