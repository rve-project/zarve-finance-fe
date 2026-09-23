import { AccountType } from "./types";

/**
 * Finer-grained "Kategori Akun" labels (matching Mekari Jurnal's chart-of-accounts
 * naming), derived from the account's `type` + code prefix -- the same '11xx' etc.
 * prefix convention already used by reportsController.cashFlow and cashBank.controller.
 * These are presentation-only: the schema only stores `type`; nothing else in the app
 * needs the finer category, so it isn't persisted anywhere.
 */
export interface AccountCategoryOption {
  value: string;
  label: string;
  type: AccountType;
  /** Suggested code prefix, prefilled (not enforced) when picking this category. */
  codeHint: string;
}

export const ACCOUNT_CATEGORY_OPTIONS: AccountCategoryOption[] = [
  { value: "cash_bank", label: "Cash & Bank", type: "asset", codeHint: "11" },
  { value: "ar", label: "Accounts Receivable (A/R)", type: "asset", codeHint: "12" },
  { value: "inventory", label: "Inventory", type: "asset", codeHint: "13" },
  { value: "other_current_asset", label: "Other Current Assets", type: "asset", codeHint: "14" },
  { value: "fixed_asset", label: "Fixed Assets", type: "asset", codeHint: "15" },
  { value: "ap", label: "Accounts Payable (A/P)", type: "liability", codeHint: "21" },
  { value: "other_current_liability", label: "Other Current Liability", type: "liability", codeHint: "23" },
  { value: "long_term_liability", label: "Long Term Liability", type: "liability", codeHint: "25" },
  { value: "equity", label: "Equity", type: "equity", codeHint: "31" },
  { value: "income", label: "Income", type: "income", codeHint: "41" },
  { value: "other_income", label: "Other Income", type: "income", codeHint: "49" },
  { value: "cogs", label: "Cost of Goods Sold", type: "expense", codeHint: "51" },
  { value: "expense", label: "Expense", type: "expense", codeHint: "52" },
  { value: "other_expense", label: "Other Expense", type: "expense", codeHint: "59" },
];

export function categorizeAccount(account: { type: AccountType; code: string }): string {
  const code = account.code;
  switch (account.type) {
    case "asset":
      if (code.startsWith("11")) return "Cash & Bank";
      if (code.startsWith("12")) return "Accounts Receivable (A/R)";
      if (code.startsWith("13")) return "Inventory";
      if (code.startsWith("14")) return "Other Current Assets";
      if (code.startsWith("15")) return "Fixed Assets";
      return "Other Assets";
    case "liability":
      if (code.startsWith("21")) return "Accounts Payable (A/P)";
      if (code.startsWith("23") || code.startsWith("24")) return "Other Current Liability";
      return "Long Term Liability";
    case "equity":
      return "Equity";
    case "income":
      if (code.startsWith("49")) return "Other Income";
      return "Income";
    case "expense":
      if (code.startsWith("51")) return "Cost of Goods Sold";
      if (code.startsWith("59")) return "Other Expense";
      return "Expense";
    default:
      return "Other";
  }
}
