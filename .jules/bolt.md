# Bolt's Performance Journal

## 2026-10-23 - Calendar Map Lookup Optimization
**Learning:** In monthly calendar views with multi-day grid rendering (e.g. 31 days in October), executing `array.filter(event => event.date === day)` inside the grid loop results in 31 full linear scans per render (O(31 * N)). Pre-indexing events into a `Map<string, CampusEvent[]>` with `useMemo` reduces lookup to O(1) per day, avoiding redundant iterations on re-renders and filter changes.
**Action:** When rendering calendar days or item buckets, pre-group items into a Hash Map/`Map` index with `useMemo` instead of executing `.filter()` per cell inside the render loop.
