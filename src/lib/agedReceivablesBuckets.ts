import { AgedReceivableBucket } from "./types";

// Fixed status palette (never themed/reused) -- "current" isn't a severity yet, so it
// gets a neutral gray instead of stretching the 4-step good/warning/serious/critical
// scale to 5. Shared between the Aged Receivables list and its per-partner detail page.
export const BUCKET_COLOR: Record<AgedReceivableBucket, string> = {
  current: "#9a9a9a",
  d1to30: "#0ca30c",
  d31to60: "#fab219",
  d61to90: "#ec835a",
  d90plus: "#d03b3b",
};

export const BUCKET_LABEL_KEY: Record<AgedReceivableBucket, string> = {
  current: "agedReceivables.bucket.current",
  d1to30: "agedReceivables.bucket.d1to30",
  d31to60: "agedReceivables.bucket.d31to60",
  d61to90: "agedReceivables.bucket.d61to90",
  d90plus: "agedReceivables.bucket.d90plus",
};

export const BUCKET_BADGE_CLASS: Record<AgedReceivableBucket, string> = {
  current: "bg-zinc-100 text-zinc-600",
  d1to30: "bg-emerald-50 text-emerald-700",
  d31to60: "bg-amber-50 text-amber-700",
  d61to90: "bg-orange-50 text-orange-700",
  d90plus: "bg-red-50 text-red-700",
};
