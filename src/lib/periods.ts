/**
 * Period math shared by every financial report's period picker + period-comparison
 * feature (mirrors Odoo's "Month / Quarter / Year / Custom Dates" picker and its
 * "Comparison: N Previous Periods" feature). Deliberately framework-free (no `t()`
 * calls here) -- label text is built by the caller via `periodLabel()` so it can stay
 * translated; this file only does date arithmetic.
 */

export type PeriodGranularity = "month" | "quarter" | "year" | "custom";

export interface Period {
  granularity: PeriodGranularity;
  /** ISO "YYYY-MM-DD", inclusive. */
  from: string;
  /** ISO "YYYY-MM-DD", inclusive. */
  to: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function iso(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function daysInMonth(y: number, m: number) {
  // Day 0 of next month == last day of this month (m is 1-indexed here).
  return new Date(y, m, 0).getDate();
}

export function monthPeriod(year: number, month: number): Period {
  return { granularity: "month", from: iso(year, month, 1), to: iso(year, month, daysInMonth(year, month)) };
}

export function quarterOf(month: number) {
  return Math.ceil(month / 3);
}

export function quarterPeriod(year: number, quarter: number): Period {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  return { granularity: "quarter", from: iso(year, startMonth, 1), to: iso(year, endMonth, daysInMonth(year, endMonth)) };
}

export function yearPeriod(year: number): Period {
  return { granularity: "year", from: iso(year, 1, 1), to: iso(year, 12, 31) };
}

export function customPeriod(from: string, to: string): Period {
  return { granularity: "custom", from, to };
}

/** Today's date, as the default "current period" before the user picks anything. */
export function thisMonthPeriod(): Period {
  const now = new Date();
  return monthPeriod(now.getFullYear(), now.getMonth() + 1);
}

/** One period earlier of the same granularity/length -- "Previous Period" in Odoo's
 * comparison feature. A custom range shifts back by its own day-span (inclusive),
 * since there's no calendar unit to step by. */
export function previousPeriod(p: Period): Period {
  const [y, m] = p.from.split("-").map(Number);
  switch (p.granularity) {
    case "month":
      return m === 1 ? monthPeriod(y - 1, 12) : monthPeriod(y, m - 1);
    case "quarter": {
      const q = quarterOf(m);
      return q === 1 ? quarterPeriod(y - 1, 4) : quarterPeriod(y, q - 1);
    }
    case "year":
      return yearPeriod(y - 1);
    case "custom": {
      const spanDays = Math.round((new Date(p.to).getTime() - new Date(p.from).getTime()) / 86_400_000) + 1;
      const newTo = new Date(p.from);
      newTo.setDate(newTo.getDate() - 1);
      const newFrom = new Date(newTo);
      newFrom.setDate(newFrom.getDate() - spanDays + 1);
      return customPeriod(newFrom.toISOString().slice(0, 10), newTo.toISOString().slice(0, 10));
    }
  }
}

/** Inverse of previousPeriod -- steps one period later. */
export function nextPeriod(p: Period): Period {
  const [y, m] = p.from.split("-").map(Number);
  switch (p.granularity) {
    case "month":
      return m === 12 ? monthPeriod(y + 1, 1) : monthPeriod(y, m + 1);
    case "quarter": {
      const q = quarterOf(m);
      return q === 4 ? quarterPeriod(y + 1, 1) : quarterPeriod(y, q + 1);
    }
    case "year":
      return yearPeriod(y + 1);
    case "custom": {
      const spanDays = Math.round((new Date(p.to).getTime() - new Date(p.from).getTime()) / 86_400_000) + 1;
      const newFrom = new Date(p.to);
      newFrom.setDate(newFrom.getDate() + 1);
      const newTo = new Date(newFrom);
      newTo.setDate(newTo.getDate() + spanDays - 1);
      return customPeriod(newFrom.toISOString().slice(0, 10), newTo.toISOString().slice(0, 10));
    }
  }
}

/** Same granularity/span, one year back -- "Same Period Last Year". */
export function samePeriodLastYear(p: Period): Period {
  const [y, m, d] = p.from.split("-").map(Number);
  switch (p.granularity) {
    case "month":
      return monthPeriod(y - 1, m);
    case "quarter":
      return quarterPeriod(y - 1, quarterOf(m));
    case "year":
      return yearPeriod(y - 1);
    case "custom": {
      const fromD = new Date(y - 1, m - 1, d);
      const [ty, tm, td] = p.to.split("-").map(Number);
      const toD = new Date(ty - 1, tm - 1, td);
      return customPeriod(fromD.toISOString().slice(0, 10), toD.toISOString().slice(0, 10));
    }
  }
}

/** Human label for a period, e.g. "Oktober 2026" / "Okt - Des 2026" / "2026" /
 * "01/10/2026 - 31/12/2026". `monthNames` is the 12-entry translated month-name array
 * (`t("date.month0")`..`t("date.month11")`) -- kept out of this file so it stays
 * framework-free. */
export function periodLabel(p: Period, monthNames: string[]): string {
  const [fy, fm, fd] = p.from.split("-").map(Number);
  const [ty, tm, td] = p.to.split("-").map(Number);
  switch (p.granularity) {
    case "month":
      return `${monthNames[fm - 1]} ${fy}`;
    case "quarter":
      return `${monthNames[fm - 1].slice(0, 3)} - ${monthNames[tm - 1].slice(0, 3)} ${fy}`;
    case "year":
      return String(fy);
    case "custom":
      return `${pad(fd)}/${pad(fm)}/${fy} - ${pad(td)}/${pad(tm)}/${ty}`;
  }
}

export type ComparisonMode = { type: "none" } | { type: "previous"; count: number } | { type: "lastYear" };

/** The full list of periods to fetch/display, current period first -- `[current, ...
 * comparisons]`, matching Odoo's "descending" period order. */
export function expandComparison(current: Period, comparison: ComparisonMode): Period[] {
  if (comparison.type === "none") return [current];
  if (comparison.type === "lastYear") return [current, samePeriodLastYear(current)];
  const periods = [current];
  let p = current;
  for (let i = 0; i < comparison.count; i++) {
    p = previousPeriod(p);
    periods.push(p);
  }
  return periods;
}
