# Bolt's Journal - Critical Learnings

## 2025-05-10 - Slot Availability Calculation Optimizations

**Learning:** Booking availability logic in `src/lib/booking/availability.ts` runs frequent date comparisons across working shifts. Un-lean Mongoose queries coupled with `Date` re-instantiations inside nested loops create unnecessary document hydration overhead and hundreds of short-lived `Date` allocations per API request.

**Action:** Always use `.lean()` on read-only Mongoose query projections and pre-parse `Date` objects into numeric timestamps (`.getTime()`) outside of tight generation loops.

## 2025-05-18 - Memoize Date Instantiations in Interactive Booking Flow

**Learning:** In interactive multi-step forms like `BookingWizard`, top-level array generators and time-filtering operations (such as generating upcoming dates and partitioning slots by morning/afternoon) re-instantiate `Date` objects and perform string parsing on every single keystroke/state change if not memoized.

**Action:** Always wrap date range generators and slot filters in `useMemo` in interactive client-side React components to prevent main-thread lag during form input.

## 2026-09-02 - Lean Schedule Reads on Hot Availability Paths

**Learning:** `getEffectiveDaySchedule` is called on every availability lookup and only reads weekly hours / date overrides. Hydrating the singleton `CalendarSchedule` document on that path is wasted work.

**Action:** Use `getSchedule({ lean: true })` for read-only schedule lookups. Keep the hydrated document on write paths that call `markModified` / `save`.

## 2026-09-03 - Reuse Lean Models across Availability Scans

**Learning:** `getAvailableSlots` in `availability.ts` was fetching full `Service` documents on every call. In route handlers like `/api/public/next-available` which scan 7 days, this resulted in up to 7 duplicate DB queries for the exact same `Service` document.

**Action:** Allow core utility functions to accept pre-fetched lean service objects directly (or project only `.select("durationMin active").lean()`), avoiding duplicate database roundtrips in scanning loops and API handlers.
