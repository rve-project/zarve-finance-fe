"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { setBusinessUnit as persistBusinessUnit } from "./api";

export type BusinessUnit = "zarve" | "b2b";

const STORAGE_KEY = "rve_finance_business_unit";

interface BusinessUnitContextValue {
  unit: BusinessUnit;
  setUnit: (u: BusinessUnit) => void;
}

const BusinessUnitContext = createContext<BusinessUnitContextValue | null>(null);

/** Which of the client's two separate businesses (Zarve rental / B2B) is currently
 * active. Mirrors LanguageProvider exactly. `setUnit` writes through to api.ts's
 * `setBusinessUnit()` so there is exactly one source of truth for the localStorage key
 * that `api.ts`'s `request()` reads on every call. */
export function BusinessUnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<BusinessUnit>("zarve");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "zarve" || stored === "b2b") setUnitState(stored);
    } catch {
      // ignore -- private browsing / storage disabled
    }
  }, []);

  function setUnit(u: BusinessUnit) {
    setUnitState(u);
    persistBusinessUnit(u);
  }

  const value = useMemo<BusinessUnitContextValue>(() => ({ unit, setUnit }), [unit]);

  return <BusinessUnitContext.Provider value={value}>{children}</BusinessUnitContext.Provider>;
}

export function useBusinessUnit() {
  const ctx = useContext(BusinessUnitContext);
  if (!ctx) throw new Error("useBusinessUnit must be used within BusinessUnitProvider");
  return ctx;
}
