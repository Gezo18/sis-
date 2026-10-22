# Bolt's Performance Journal

## 2026-03-29 - O(days * events) Linear Scans in Month Calendar Grid
**Learning:** In React calendar components, calling `.filter(e => e.date === dayStr)` inside the day mapping loop (e.g. 31 days/month) causes linear array scans for every day cell on every render frame.
**Action:** Always pre-group events into an indexed Map (`Map<string, Event[]>`) using `useMemo` when rendering grid calendars to achieve O(1) cell event lookups.
