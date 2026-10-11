import { Account, AccountBalanceRow } from "@/lib/types";

/** One Map<accountId, row> per period column -- every period's getAccountBalances call
 * returns a row for every account unconditionally, so each column has the same set of
 * account ids; this just makes "look up this account's row in period N" O(1) instead
 * of an Array.find() per cell. */
export function buildColumnMaps(columns: { rows: AccountBalanceRow[] }[]): Map<number, AccountBalanceRow>[] {
  return columns.map((col) => new Map(col.rows.map((r) => [r.account.id, r])));
}

/** The account list to render: every account that has a non-zero figure in AT LEAST
 * ONE of the period columns being compared (an account quiet this month but active
 * last month should still show its row, not disappear). */
export function activeAccountsAcrossColumns(columns: { rows: AccountBalanceRow[] }[]): Account[] {
  if (!columns.length) return [];
  const maps = buildColumnMaps(columns);
  const base = columns[0].rows.map((r) => r.account);
  return base.filter((acc) =>
    maps.some((m) => {
      const r = m.get(acc.id);
      return r && (r.initialBalance !== 0 || r.periodDebit !== 0 || r.periodCredit !== 0 || r.endBalance !== 0);
    })
  );
}
