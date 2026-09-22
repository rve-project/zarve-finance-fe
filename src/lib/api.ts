import {
  Account,
  AccountType,
  AgedReceivablesResult,
  AppSettings,
  BalanceSheetResult,
  CashFlowResult,
  DriverRevenueRecap,
  GeneralLedgerResult,
  GeofenceViolationsResult,
  Invoice,
  InvoiceDetail,
  InvoiceStatusSummaryRow,
  JournalEntryDetail,
  JournalEntryPage,
  JournalLineInput,
  Partner,
  PartnerPage,
  Payment,
  ProfitAndLossResult,
  ReconciliationHistoryPage,
  ReconciliationRunResult,
  RevenueRecap,
  TrialBalanceResult,
  UnreconciledPaymentPage,
  User,
  Vehicle,
  VehicleCategoryOption,
  VehicleProfitabilityResult,
  VendorBillDetail,
  VendorBillPage,
  VendorPaymentPage,
  ZarveInvoiceDetail,
  ZarveInvoicePage,
  ZarveInvoiceType,
  ZarveMirrorSyncStatus,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api";
const TOKEN_KEY = "rve_finance_token";

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
      ...initHeaders,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Gagal memanggil ${path} (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined });
const put = <T>(path: string, data: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(data) });

async function downloadFile(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  logout: () => post<void>("/auth/logout"),
  me: () => get<User>("/auth/me"),

  accounts: (type?: AccountType) => get<Account[]>(`/accounts${qs({ type })}`),
  createAccount: (data: { code: string; name: string; type: AccountType; parentId?: number }) =>
    post<Account>("/accounts", data),
  updateAccount: (id: number, data: Partial<Account>) => put<Account>(`/accounts/${id}`, data),

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
  balanceSheet: (asOf: string) => get<BalanceSheetResult>(`/reports/balance-sheet${qs({ asOf })}`),
  cashFlow: (from: string, to: string) => get<CashFlowResult>(`/reports/cash-flow${qs({ from, to })}`),

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

  agedReceivables: (asOf?: string) => get<AgedReceivablesResult>(`/reports/aged-receivables${qs({ asOf })}`),
  vehicleProfitability: (from: string, to: string) =>
    get<VehicleProfitabilityResult>(`/reports/vehicle-profitability${qs({ from, to })}`),
  geofenceViolations: (from: string, to: string, page = 1, limit = 20) =>
    get<GeofenceViolationsResult>(`/reports/geofence-violations${qs({ from, to, page, limit })}`),
};
