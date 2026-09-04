## 2025-05-10 - Slot Availability Calculation Optimizations

**Learning:** Booking availability logic in `src/lib/booking/availability.ts` runs frequent date comparisons across working shifts. Un-lean Mongoose queries coupled with `Date` re-instantiations inside nested loops create unnecessary document hydration overhead and hundreds of short-lived `Date` allocations per API request.

**Action:** Always use `.lean()` on read-only Mongoose query projections and pre-parse `Date` objects into numeric timestamps (`.getTime()`) outside of tight generation loops.
