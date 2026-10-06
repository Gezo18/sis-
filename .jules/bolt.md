## 2025-05-18 - Calendar Grid Render Bottleneck
**Learning:** Rendering calendar day grids with inline `.filter(e => e.date === dayStr)` inside the day mapping loop creates an O(Days * N) array scan bottleneck on every render.
**Action:** Pre-group calendar events into a date-indexed `Map<string, Event[]>` memoized with `useMemo`, allowing O(1) map lookups inside day cell render loops.
