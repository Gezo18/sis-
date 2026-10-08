## 2026-03-30 - O(1) Calendar Cell Event Lookup
**Learning:** In calendar components rendering multi-day month grids, filtering events inside the per-day render loop results in redundant O(Days * N) array iterations.
**Action:** Memoize category filtering and build a Map indexed by date (`eventsByDate`) using `useMemo` for O(1) lookups per day cell.
