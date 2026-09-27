"use client";

import { useEffect, useRef } from "react";
import { getBusinessUnit, setBusinessUnit as persistBusinessUnit } from "./api";

export type BusinessUnit = "zarve" | "b2b";

/** Forces api.ts's X-Business-Unit header to `forced` for as long as the calling
 * component is mounted, then restores whatever it was before. There's no user-facing
 * switcher anywhere in this app; this is how B2B-only routes/screens (the (b2b) route
 * group's layout, and the Settings page's Taxes/Banks tabs) reach their own
 * accounts/journal/cash-bank data on the shared, business_unit-scoped endpoints.
 *
 * Writes straight to the localStorage-backed value `api.ts`'s `getBusinessUnit()`/
 * `setBusinessUnit()` read and write -- not through React state/context. Nothing in
 * this app reads the current unit for rendering (only `api.ts`'s plain `request()`
 * function needs it, once per call), so there's no reason to route this through a
 * Context Provider and risk either of two React pitfalls that a previous version of
 * this hook hit:
 *   1. A `useEffect`-based force runs too late -- React fires effects
 *      child-before-parent on mount, so a forcing layout's own effect would run
 *      *after* a b2b page's own `useEffect(() => api.something()..., [])` one level
 *      down, meaning that very first fetch would go out under whatever unit was
 *      active before the layout mounted (e.g. "zarve" on a fresh page load).
 *   2. Moving the force into the render body instead, but going through a Context
 *      Provider's setter, means a descendant calls an ancestor's `setState` during
 *      the descendant's own render -- React logs "Cannot update a component while
 *      rendering a different component" and the render becomes unreliable.
 * Reading/writing a plain module-level value directly during render sidesteps both:
 * it's synchronous (so children mounting in the same commit already see it) and
 * isn't React state at all (so there's no ancestor/descendant render-order issue).
 */
export function useForceBusinessUnit(forced: BusinessUnit) {
  const previousRef = useRef(getBusinessUnit());

  if (getBusinessUnit() !== forced) persistBusinessUnit(forced);

  useEffect(() => {
    // Re-assert (not just rely on the render-phase check above): React 18 dev
    // StrictMode mounts every component twice (render, commit effects, immediately
    // clean them up, then run them again) to surface effects that misbehave on a real
    // remount -- render itself is never replayed, only effects are, so when this
    // hook and a data-fetching `useEffect` live in the *same* component (e.g. a
    // Settings tab), the cleanup below can run and reset the unit before that other
    // effect's replayed setup fires; since hooks replay in the same call order as the
    // original mount, re-forcing here (before that other effect gets a chance to
    // read a stale value) fixes it for that same-component case.
    persistBusinessUnit(forced);
    return () => {
      // For the cross-component case (this hook living in a layout, with the actual
      // data fetch one level down in a child page) the fix above doesn't help --
      // effects fire child-before-parent on both the real mount and the replay, so
      // the child's fetch always re-runs before this cleanup's sibling setup would
      // get a chance to re-force. A genuine unmount (real navigation away from every
      // b2b-prefixed route) always has an updated `location.pathname` by the time
      // this cleanup runs, since the router commits the new URL before tearing down
      // the old route's components; a phantom StrictMode replay leaves the path
      // untouched, so this guard recognizes it as "still here" and skips the
      // restore instead of undoing the force for no real reason.
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/b2b-")) return;
      persistBusinessUnit(previousRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
