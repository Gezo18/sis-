## 2026-10-29 - Calendar Grid Rendering Optimization
**Learning:** Rendering calendar month views by executing `.filter(e => e.date === dayStr)` inside a 31-day `.map()` loop causes O(31 * N) nested scans on every component re-render.
**Action:** Always pre-group date-based items into a `Record<string, T[]>` dictionary with `useMemo` so grid cells can perform O(1) lookups.
