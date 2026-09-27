"use client";

import { ReactNode } from "react";
import { useForceBusinessUnit } from "@/lib/business-unit";

// Route group (b2b) -- every b2b-* page lives under here so they all share this one
// switch instead of each page having to remember to force it. No visible toggle
// anywhere anymore; this is the only place `business_unit=b2b` gets selected.
export default function B2bLayout({ children }: { children: ReactNode }) {
  useForceBusinessUnit("b2b");
  return <>{children}</>;
}
