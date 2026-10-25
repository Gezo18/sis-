# Bolt Performance Journal

## 2026-10-25 - Calendar Grid O(1) Date Map Lookup Optimization
**Learning:** Calendar month views rendering 31 grid cells were running `array.filter(e => e.date === dayStr)` on every render pass, scaling as 31 × N linear array scans.
**Action:** Group items by date into a memoized `Record<string, Event[]>` hash map using `useMemo` so each grid cell achieves O(1) direct lookup.
