import {
  Account,
  AccountAccessMode,
  AccountCategory,
  AccountDetail,
  AccountType,
  ActivityLogPage,
  Citizenship,
  Contact,
  ContactType,
  ActiveFixedAsset,
  AgedReceivablesResult,
  AppSettings,
  BalanceSheetResult,
  BankStatementImportResult,
  CashBankAccount,
  CashBankLedgerResult,
  CashBankSummary,
  CashFlowResult,
  DepreciationScheduleResult,
  DisposedFixedAsset,
  DisposeAssetResult,
  FixedAssetRevaluation,
  FixedAssetType,
  RevalueAssetResult,
  JournalValidationResult,
  DriverRevenueRecap,
  Expense,
  ExpenseDetail,
  ExpenseStats,
  CreateExpenseInput,
  PurchaseDocType,
  PurchaseStatus,
  PurchaseDocument,
  PurchaseDocumentDetail,
  PurchaseStats,
  CreatePurchaseInput,
  SaleDocType,
  SaleStatus,
  SaleDocument,
  SaleDocumentDetail,
  SaleStats,
  CreateSaleInput,
  GeneralLedgerResult,
  GeofenceViolationsResult,
  Invoice,
  InvoiceDetail,
  InvoiceStatusSummaryRow,
  JournalEntryDetail,
  JournalEntryPage,
  JournalLineInput,
  ManagedUser,
  Order,
  OrdersByStatus,
  OrderStatus,
  OrderType,
  Partner,
  PartnerPage,
  Payment,
  PendingFixedAsset,
  Product,
  ProductCategory,
  ProductListResult,
  ProfitAndLossResult,
  ReconciliationHistoryPage,
  ReconciliationRunResult,
  RevenueRecap,
  StockAdjustment,
  StockAdjustmentCategory,
  StockAdjustmentType,
  TaxCode,
  Bank,
  WarehouseTransfer,
  TrialBalanceResult,
  UnreconciledPaymentPage,
  User,
  Vehicle,
  VehicleCategoryOption,
  VehicleProfitabilityResult,
  VendorBillDetail,
  VendorBillPage,
  VendorPaymentPage,
  Warehouse,
  ZarveInvoiceDetail,
  ZarveInvoicePage,
  ZarveInvoiceType,
  ZarveMirrorSyncStatus,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api";
const TOKEN_KEY = "rve_finance_token";

/** Same as a plain Error (every existing `err instanceof Error` catch still works
 * unchanged) but also carries the HTTP status, for the rare caller that needs to tell
 * "genuinely not found" apart from other failures instead of pattern-matching the
 * message string. */
export class ApiClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}
const UNIT_KEY = "rve_finance_business_unit";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

/** Which of the client's two separate businesses (Zarve rental / B2B) the app is
 * currently scoped to. Read here (a plain module, not a component) so `request()` can
 * attach it to every call; `lib/business-unit.tsx`'s `useForceBusinessUnit` is the
 * only writer (there's no user-facing switcher). */
export function getBusinessUnit(): "zarve" | "b2b" {
  if (typeof window === "undefined") return "zarve";
  return window.localStorage.getItem(UNIT_KEY) === "b2b" ? "b2b" : "zarve";
}

export function setBusinessUnit(unit: "zarve" | "b2b") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(UNIT_KEY, unit);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const { headers: initHeaders, ...restInit } = init ?? {};
  const isFormData = restInit.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...restInit,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Business-Unit": getBusinessUnit(),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiClientError(body?.message ?? `Gagal memanggil ${path} (${res.status})`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const get = <T>(path: string) => request<T>(path);

/** For the Beranda page's combined Zarve+B2B summary, which needs both business
 * units' numbers on the same page at the same time -- unlike everywhere else, an
 * explicit unit here must NOT go through `getBusinessUnit()`/the global
 * BusinessUnitProvider (that's one value for the whole app, and both sections' fetches
 * run concurrently), so this passes "X-Business-Unit" straight through instead. */
const getForUnit = <T>(path: string, unit: "zarve" | "b2b") => request<T>(path, { headers: { "X-Business-Unit": unit } });
const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined });
const put = <T>(path: string, data: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(data) });
const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

async function downloadFile(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Business-Unit": getBusinessUnit(),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Gagal mengunduh ${path} (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function qs(params: Record<string, string | number | undefined>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") s.set(k, String(v));
  }
  const str = s.toString();
  return str ? `?${str}` : "";
}

export const api = {
  login: (email: string, password: string) => post<{ token: string; user: User }>("/auth/login", { email, password }),
  googleLogin: (idToken: string) => post<{ token: string; user: User }>("/auth/google", { idToken }),
  logout: () => post<void>("/auth/logout"),
  me: () => get<User>("/auth/me"),

  users: () => get<ManagedUser[]>("/users"),
  createUser: (data: { email: string; name?: string }) => post<ManagedUser>("/users", data),
  updateUser: (id: number, data: { name?: string; aktif?: boolean; canViewActivityLog?: boolean }) =>
    put<ManagedUser>(`/users/${id}`, data),
  deleteUser: (id: number) => del<void>(`/users/${id}`),

  accounts: (type?: AccountType, category?: string) => get<Account[]>(`/accounts${qs({ type, category })}`),
  getAccount: (id: number) => get<AccountDetail>(`/accounts/${id}`),
  createAccount: (data: {
    code: string;
    name: string;
    type?: AccountType;
    categoryId?: number;
    parentId?: number;
    description?: string;
    taxId?: number;
    bankName?: string;
    accessMode?: AccountAccessMode;
    accessUserIds?: number[];
  }) => post<AccountDetail>("/accounts", data),
  updateAccount: (id: number, data: Partial<Account> & { accessUserIds?: number[] }) => put<AccountDetail>(`/accounts/${id}`, data),

  accountCategories: (includeArchived = false) =>
    get<AccountCategory[]>(`/account-categories${qs({ includeArchived: includeArchived ? "true" : undefined })}`),
  createAccountCategory: (data: { value: string; label: string; type: AccountType; codeHint?: string }) =>
    post<AccountCategory>("/account-categories", data),
  updateAccountCategory: (id: number, data: Partial<Pick<AccountCategory, "label" | "codeHint" | "isActive">>) =>
    put<AccountCategory>(`/account-categories/${id}`, data),

  taxes: (includeArchived = false) => get<TaxCode[]>(`/taxes${qs({ includeArchived: includeArchived ? "true" : undefined })}`),
  createTax: (data: { name: string; rate: number }) => post<TaxCode>("/taxes", data),
  updateTax: (id: number, data: Partial<Pick<TaxCode, "name" | "rate" | "isActive">>) => put<TaxCode>(`/taxes/${id}`, data),

  banks: (includeArchived = false) => get<Bank[]>(`/banks${qs({ includeArchived: includeArchived ? "true" : undefined })}`),
  createBank: (data: { name: string }) => post<Bank>("/banks", data),
  updateBank: (id: number, data: Partial<Pick<Bank, "name" | "isActive">>) => put<Bank>(`/banks/${id}`, data),

  partners: (params: { q?: string; page?: number; limit?: number; type?: "customer" | "vendor" }) =>
    get<PartnerPage>(`/partners${qs({ q: params.q, page: params.page, limit: params.limit, type: params.type })}`),
  getPartner: (id: number) => get<Partner>(`/partners/${id}`),
  createPartner: (data: { name: string; type?: "customer" | "vendor"; ktpNumber?: string; phone?: string; email?: string; notes?: string }) =>
    post<Partner>("/partners", data),
  updatePartner: (id: number, data: Partial<Partner>) => put<Partner>(`/partners/${id}`, data),

  vehicles: () => get<Vehicle[]>("/vehicles"),
  createVehicle: (data: { platNumber: string; name: string; category?: string; branch?: string; incomeAccountId?: number }) =>
    post<Vehicle>("/vehicles", data),
  updateVehicle: (id: number, data: Partial<Vehicle>) => put<Vehicle>(`/vehicles/${id}`, data),

  invoices: (params?: { partnerId?: number; from?: string; to?: string }) =>
    get<Invoice[]>(`/invoices${qs({ partnerId: params?.partnerId, from: params?.from, to: params?.to })}`),
  getInvoice: (id: number) => get<InvoiceDetail>(`/invoices/${id}`),

  payments: (params?: { partnerId?: number; invoiceId?: number }) =>
    get<Payment[]>(`/payments${qs({ partnerId: params?.partnerId, invoiceId: params?.invoiceId })}`),
  createPayment: (data: { partnerId: number; invoiceId?: number | null; amount: number; date: string; method?: string; memo?: string }) =>
    post<Payment>("/payments", data),

  syncZarveMirrorNow: () => post<{ started: boolean }>("/zarve-mirror/sync"),
  zarveMirrorStatus: () => get<ZarveMirrorSyncStatus | null>("/zarve-mirror/status"),

  unreconciledPayments: (page = 1, limit = 20) =>
    get<UnreconciledPaymentPage>(`/reconciliation/unreconciled${qs({ page, limit })}`),
  reconciliationBankAccounts: () => get<Account[]>("/reconciliation/bank-accounts"),
  runReconciliation: (body: { paymentIds?: number[]; all?: boolean; bankAccountId: number; date: string }) =>
    post<ReconciliationRunResult>("/reconciliation", body),
  reconciliationHistory: (page = 1, limit = 20) =>
    get<ReconciliationHistoryPage>(`/reconciliation/history${qs({ page, limit })}`),

  trialBalance: (from: string, to: string) => get<TrialBalanceResult>(`/reports/trial-balance${qs({ from, to })}`),
  generalLedger: (accountId: number, from: string, to: string, page = 1, limit = 50) =>
    get<GeneralLedgerResult>(`/reports/general-ledger${qs({ accountId, from, to, page, limit })}`),
  profitAndLoss: (from: string, to: string) => get<ProfitAndLossResult>(`/reports/profit-loss${qs({ from, to })}`),
  profitAndLossForUnit: (from: string, to: string, unit: "zarve" | "b2b") =>
    getForUnit<ProfitAndLossResult>(`/reports/profit-loss${qs({ from, to })}`, unit),
  balanceSheet: (asOf: string) => get<BalanceSheetResult>(`/reports/balance-sheet${qs({ asOf })}`),
  cashFlow: (from: string, to: string) => get<CashFlowResult>(`/reports/cash-flow${qs({ from, to })}`),
  cashFlowForUnit: (from: string, to: string, unit: "zarve" | "b2b") =>
    getForUnit<CashFlowResult>(`/reports/cash-flow${qs({ from, to })}`, unit),

  revenueRecap: (startDate: string, endDate: string) =>
    get<RevenueRecap>(`/revenue-recap${qs({ startDate, endDate })}`),
  exportRevenueRecap: (startDate: string, endDate: string) =>
    downloadFile(`/revenue-recap/export${qs({ startDate, endDate })}`, `Revenue Recap ${startDate} - ${endDate}.xlsx`),

  vehicleCategories: () => get<VehicleCategoryOption[]>("/driver-revenue-recap/categories"),
  driverRevenueRecap: (categoryId: string, month: string) =>
    get<DriverRevenueRecap>(`/driver-revenue-recap${qs({ categoryId, month })}`),
  exportDriverRevenueRecap: (categoryId: string, month: string, categoryName: string) =>
    downloadFile(
      `/driver-revenue-recap/export${qs({ categoryId, month })}`,
      `Rekap Revenue Harian Driver - ${categoryName} - ${month}.xlsx`
    ),

  zarveInvoices: (params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => get<ZarveInvoicePage>(`/zarve-invoices${qs(params)}`),
  zarveInvoiceTypes: () => get<ZarveInvoiceType[]>("/zarve-invoices/types"),
  zarveInvoiceDetail: (id: string) => get<ZarveInvoiceDetail>(`/zarve-invoices/${id}`),

  invoiceStatusSummary: (startDate?: string, endDate?: string) =>
    get<InvoiceStatusSummaryRow[]>(`/dashboard/invoice-status-summary${qs({ startDate, endDate })}`),

  settings: () => get<AppSettings>("/settings"),
  updateSettings: (data: Partial<AppSettings>) => put<AppSettings>("/settings", data),

  journalEntries: (page = 1, limit = 20, from?: string, to?: string) =>
    get<JournalEntryPage>(`/journal-entries${qs({ page, limit, from, to })}`),
  getJournalEntry: (id: number) => get<JournalEntryDetail>(`/journal-entries/${id}`),
  createJournalEntry: (data: { date: string; ref?: string; narration?: string; lines: JournalLineInput[] }) =>
    post<{ id: number }>("/journal-entries", data),
  reverseJournalEntry: (id: number) => post<{ id: number }>(`/journal-entries/${id}/reverse`),

  vendorBills: (params: { vendorId?: number; page?: number; limit?: number } = {}) =>
    get<VendorBillPage>(`/vendor-bills${qs(params)}`),
  getVendorBill: (id: number) => get<VendorBillDetail>(`/vendor-bills/${id}`),
  createVendorBill: (data: {
    vendorId: number;
    billDate: string;
    ref?: string;
    lines: { description: string; accountId: number; vehicleId?: number; amount: number }[];
  }) => post<VendorBillDetail>("/vendor-bills", data),

  vendorPayments: (params: { vendorId?: number; vendorBillId?: number; page?: number; limit?: number } = {}) =>
    get<VendorPaymentPage>(`/vendor-payments${qs(params)}`),
  createVendorPayment: (data: {
    vendorId: number;
    vendorBillId?: number;
    bankAccountId: number;
    amount: number;
    date: string;
    method?: string;
    memo?: string;
  }) => post<VendorPaymentPage["data"][number]>("/vendor-payments", data),

  agedReceivables: (asOf?: string, partnerId?: number) => get<AgedReceivablesResult>(`/reports/aged-receivables${qs({ asOf, partnerId })}`),
  vehicleProfitability: (from: string, to: string) =>
    get<VehicleProfitabilityResult>(`/reports/vehicle-profitability${qs({ from, to })}`),
  geofenceViolations: (from: string, to: string, page = 1, limit = 20) =>
    get<GeofenceViolationsResult>(`/reports/geofence-violations${qs({ from, to, page, limit })}`),

  cashBankAccounts: (includeArchived = false) =>
    get<CashBankAccount[]>(`/cash-bank/accounts${qs({ includeArchived: includeArchived ? "true" : undefined })}`),
  cashBankSummary: () => get<CashBankSummary>("/cash-bank/summary"),
  cashBankLedger: (accountId: number, params: { search?: string; page?: number; limit?: number } = {}) =>
    get<CashBankLedgerResult>(`/cash-bank/accounts/${accountId}/ledger${qs({ search: params.search, page: params.page, limit: params.limit })}`),
  downloadCashBankTemplate: () => downloadFile("/cash-bank/import-template", "Template Impor Rekening Koran.xlsx"),
  importBankStatement: (accountId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<BankStatementImportResult>(`/cash-bank/accounts/${accountId}/import`, { method: "POST", body: formData });
  },

  fixedAssetsDepreciationMethods: () => get<string[]>("/fixed-assets/depreciation-methods"),
  fixedAssetsPending: () => get<PendingFixedAsset[]>("/fixed-assets/pending"),
  fixedAssetsActive: () => get<ActiveFixedAsset[]>("/fixed-assets/active"),
  fixedAssetsDisposed: () => get<DisposedFixedAsset[]>("/fixed-assets/disposed"),
  fixedAssetsDepreciationSchedule: (month: string) =>
    get<DepreciationScheduleResult>(`/fixed-assets/depreciation-schedule${qs({ month })}`),
  createFixedAsset: (data: {
    name: string;
    assetNumber?: string;
    categoryAccountId: number;
    acquisitionDate: string;
    acquisitionCost: number;
    creditAccountId?: number;
    description?: string;
    assetType?: FixedAssetType;
    plateNumber?: string;
    isNonDepreciating: boolean;
    depreciationMethod?: "straight_line";
    usefulLifeYears?: number;
    depreciationExpenseAccountId?: number;
    accumulatedDepreciationAccountId?: number;
    openingAccumulatedDepreciation?: number;
    openingAccumulatedDepreciationDate?: string;
    sourceJournalLineId?: number;
  }) => post<ActiveFixedAsset>("/fixed-assets", data),
  disposeFixedAsset: (id: number, data: { disposalDate: string; disposalAmount: number; receivedAccountId: number }) =>
    post<DisposeAssetResult>(`/fixed-assets/${id}/dispose`, data),
  revalueFixedAsset: (id: number, data: { revaluationDate: string; newValue: number; adjustmentAccountId: number; notes?: string }) =>
    post<RevalueAssetResult>(`/fixed-assets/${id}/revalue`, data),
  fixedAssetRevaluations: (id: number) => get<FixedAssetRevaluation[]>(`/fixed-assets/${id}/revaluations`),

  orders: (type: OrderType, params: { from?: string; to?: string; search?: string } = {}) =>
    get<OrdersByStatus>(`/orders${qs({ type, from: params.from, to: params.to, search: params.search })}`),
  createOrder: (data: { type: OrderType; orderNumber?: string; partyName: string; orderDate: string; amount?: number; notes?: string }) =>
    post<Order>("/orders", data),
  updateOrderStatus: (id: number, status: OrderStatus) => put<Order>(`/orders/${id}/status`, { status }),

  products: (params: { search?: string; includeArchived?: boolean } = {}) =>
    get<ProductListResult>(`/products${qs({ search: params.search, includeArchived: params.includeArchived ? "true" : undefined })}`),
  productWarehouseStock: (warehouseId?: number) => get<{ productId: number; qty: number }[]>(`/products/warehouse-stock${qs({ warehouseId })}`),
  createProduct: (data: {
    type: "barang" | "jasa";
    name: string;
    code?: string;
    barcode?: string;
    categoryId?: number;
    unit?: string;
    description?: string;
    trackPurchase?: boolean;
    purchasePrice?: number;
    purchaseAccountId?: number;
    purchaseTaxId?: number;
    trackSale?: boolean;
    sellingPrice?: number;
    saleAccountId?: number;
    saleTaxId?: number;
    imageUrl?: string;
    productType?: "single" | "bundle";
    inventoryAccountId?: number;
    bundleExtraCostAccountId?: number;
    bundleComponents?: { productId: number; qty: number }[];
    trackInventory?: boolean;
    currentStock?: number;
    minStock?: number;
  }) => post<Product>("/products", data),
  updateProduct: (
    id: number,
    data: Partial<Pick<Product, "name" | "categoryId" | "unit" | "description" | "purchasePrice" | "sellingPrice" | "currentStock" | "minStock" | "isActive">>
  ) => put<Product>(`/products/${id}`, data),
  uploadProductImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return request<{ url: string }>("/products/upload-image", { method: "POST", body: formData });
  },

  productCategories: (includeArchived = false) =>
    get<ProductCategory[]>(`/product-categories${qs({ includeArchived: includeArchived ? "true" : undefined })}`),
  createProductCategory: (name: string) => post<ProductCategory>("/product-categories", { name }),

  warehouses: (params: { search?: string; includeArchived?: boolean } = {}) =>
    get<Warehouse[]>(`/warehouses${qs({ search: params.search, includeArchived: params.includeArchived ? "true" : undefined })}`),
  createWarehouse: (data: { name: string; code?: string; picUserIds?: number[]; address?: string; notes?: string }) =>
    post<Warehouse>("/warehouses", data),

  stockAdjustments: () => get<StockAdjustment[]>("/stock-adjustments"),
  createStockAdjustment: (data: {
    type: StockAdjustmentType;
    category: StockAdjustmentCategory;
    accountId?: number;
    warehouseId?: number;
    adjustmentDate: string;
    memo?: string;
    lines: { productId: number; value: number }[];
  }) => post<StockAdjustment>("/stock-adjustments", data),

  warehouseTransfers: () => get<WarehouseTransfer[]>("/warehouse-transfers"),
  createWarehouseTransfer: (data: {
    fromWarehouseId?: number;
    toWarehouseId?: number;
    transferDate: string;
    memo?: string;
    lines: { productId: number; qty: number }[];
    attachments?: { fileName: string; url: string }[];
  }) => post<WarehouseTransfer>("/warehouse-transfers", data),
  uploadWarehouseTransferAttachments: (files: File[]) => {
    const formData = new FormData();
    for (const file of files) formData.append("files", file);
    return request<{ fileName: string; url: string }[]>("/warehouse-transfers/upload-attachment", { method: "POST", body: formData });
  },

  contacts: (params: { type?: ContactType; search?: string; includeArchived?: boolean } = {}) =>
    get<Contact[]>(`/contacts${qs({ type: params.type, search: params.search, includeArchived: params.includeArchived ? "true" : undefined })}`),
  createContact: (data: {
    types: ContactType[];
    name: string;
    salutation?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    companyName?: string;
    address?: string;
    shippingAddress?: string;
    email?: string;
    mobilePhone?: string;
    phone?: string;
    fax?: string;
    citizenship?: Citizenship;
    npwp?: string;
    idType?: string;
    idNumber?: string;
    nitku?: string;
    paymentTerm?: string;
    receivableAccountId?: number;
    payableAccountId?: number;
    notes?: string;
    bankAccounts?: { bankName?: string; branch?: string; accountHolder?: string; accountNumber?: string }[];
  }) => post<Contact>("/contacts", data),

  expenses: () => get<Expense[]>("/expenses"),
  expenseStats: () => get<ExpenseStats>("/expenses/stats"),
  getExpense: (id: number) => get<ExpenseDetail>(`/expenses/${id}`),
  createExpense: (data: CreateExpenseInput) => post<ExpenseDetail>("/expenses", data),
  updateExpense: (id: number, data: CreateExpenseInput) => put<ExpenseDetail>(`/expenses/${id}`, data),
  deleteExpense: (id: number) => del<void>(`/expenses/${id}`),

  purchases: (params: { docType?: PurchaseDocType; status?: PurchaseStatus; contactId?: number } = {}) =>
    get<PurchaseDocument[]>(`/purchases${qs({ docType: params.docType, status: params.status, contactId: params.contactId })}`),
  purchaseStats: () => get<PurchaseStats>("/purchases/stats"),
  getPurchase: (id: number) => get<PurchaseDocumentDetail>(`/purchases/${id}`),
  createPurchase: (docType: PurchaseDocType, data: CreatePurchaseInput) => post<PurchaseDocumentDetail>("/purchases", { ...data, docType }),
  updatePurchase: (id: number, data: CreatePurchaseInput) => put<PurchaseDocumentDetail>(`/purchases/${id}`, data),
  deletePurchase: (id: number) => del<void>(`/purchases/${id}`),
  submitPurchase: (id: number) => post<PurchaseDocumentDetail>(`/purchases/${id}/submit`),
  approvePurchase: (id: number) => post<PurchaseDocumentDetail>(`/purchases/${id}/approve`),
  rejectPurchase: (id: number, reason?: string) => post<PurchaseDocumentDetail>(`/purchases/${id}/reject`, { reason }),
  convertPurchase: (id: number, targetType: PurchaseDocType) => post<PurchaseDocumentDetail>(`/purchases/${id}/convert`, { targetType }),
  addPurchasePayment: (id: number, data: { bankAccountId: number; amount: number; paymentDate: string; memo?: string }) =>
    post<PurchaseDocumentDetail>(`/purchases/${id}/payments`, data),

  sales: (params: { docType?: SaleDocType; status?: SaleStatus; contactId?: number } = {}) =>
    get<SaleDocument[]>(`/sales${qs({ docType: params.docType, status: params.status, contactId: params.contactId })}`),
  saleStats: () => get<SaleStats>("/sales/stats"),
  getSale: (id: number) => get<SaleDocumentDetail>(`/sales/${id}`),
  createSale: (docType: SaleDocType, data: CreateSaleInput) => post<SaleDocumentDetail>("/sales", { ...data, docType }),
  updateSale: (id: number, data: CreateSaleInput) => put<SaleDocumentDetail>(`/sales/${id}`, data),
  deleteSale: (id: number) => del<void>(`/sales/${id}`),
  submitSale: (id: number) => post<SaleDocumentDetail>(`/sales/${id}/submit`),
  approveSale: (id: number) => post<SaleDocumentDetail>(`/sales/${id}/approve`),
  rejectSale: (id: number, reason?: string) => post<SaleDocumentDetail>(`/sales/${id}/reject`, { reason }),
  convertSale: (id: number, targetType: SaleDocType) => post<SaleDocumentDetail>(`/sales/${id}/convert`, { targetType }),
  addSalePayment: (id: number, data: { bankAccountId: number; amount: number; paymentDate: string; memo?: string }) =>
    post<SaleDocumentDetail>(`/sales/${id}/payments`, data),

  journalValidation: () => get<JournalValidationResult>("/reports/journal-validation"),

  activityLogs: (params: { userId?: number; resourceType?: string; from?: string; to?: string; page?: number; limit?: number } = {}) =>
    get<ActivityLogPage>(`/activity-logs${qs(params)}`),
};
