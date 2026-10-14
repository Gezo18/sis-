## 2026-02-28 - In-Memory Store Caching and React Filter Memoization
**Learning:** Uncached store calls that deserialize `localStorage` on every query re-run `JSON.parse` and array reconciliation repeatedly across component renders. Combined with unmemoized `.filter()` operations on arrays with string manipulation, this creates heavy main-thread work on simple UI updates.
**Action:** Always maintain an in-memory cache variable for parsed store records when using `localStorage` backends, and wrap list search/filter operations in `useMemo` when rendering directory tables.
