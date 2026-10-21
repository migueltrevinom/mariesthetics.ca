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

## 2026-09-03 - React cache() Request Deduplication & Field Projections on Hot Public Paths

**Learning:** In Next.js App Router, `generateMetadata` and Page rendering both run during the same server request and frequently invoke shared data-loader helpers. Wrapping read helpers in React `cache()` eliminates duplicate MongoDB queries per request. Pair this with explicit Mongoose `.select()` field projections on public routes to avoid retrieving unused document fields over the wire.

**Action:** Wrap data-loading functions called across both `generateMetadata` and Page components in `cache()`, and add `.select(...)` to all read-only Mongoose `.find()` calls on public landing routes.
