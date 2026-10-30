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

## 2026-09-15 - Target Translation Lookups & Deduplicate Server-Side Page Fetches

**Learning:** Loading entire collection datasets (e.g. `BlogPost.find({ status: "published" })`) to build in-memory maps for single-record lookups creates O(N) database transfer and CPU overhead per page view. Combined with shared data fetching in `generateMetadata` and Page components without React `cache()`, queries execute multiple times per SSR request.

**Action:** Query indexed relationship fields (`translationGroupId`) directly and wrap shared server-side fetch helpers in React `cache()`.
