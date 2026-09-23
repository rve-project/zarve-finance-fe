import { Account, AccountType } from "./types";

/**
 * Best-guess default for an account dropdown that lists every account instead of
 * pre-filtering by type -- picks by the client's account-code-prefix convention first
 * (see migrations 014_business_unit.sql/017_account_categories_and_taxes.sql's seed
 * data, e.g. "11" = Cash & Bank, "15" = Fixed Assets), falling back to the first
 * account of the expected accounting type. Returns undefined if nothing matches (empty
 * chart of accounts) -- callers should leave the field unset in that case.
 */
export function pickDefaultAccount(accounts: Account[], opts: { nameIncludes?: string; codePrefix?: string; type?: AccountType }): Account | undefined {
  const sorted = [...accounts].sort((a, b) => a.code.localeCompare(b.code));
  if (opts.nameIncludes) {
    const needle = opts.nameIncludes.toLowerCase();
    const byName = sorted.find((a) => a.name.toLowerCase().includes(needle));
    if (byName) return byName;
  }
  if (opts.codePrefix) {
    const byPrefix = sorted.find((a) => a.code.startsWith(opts.codePrefix!));
    if (byPrefix) return byPrefix;
  }
  if (opts.type) return sorted.find((a) => a.type === opts.type);
  return undefined;
}
