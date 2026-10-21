# Bolt's Journal - Critical Learnings

## 2026-10-21 - Memoizing filtered lists in complex portal dashboards
**Learning:** React re-renders in portal components (like `StaffSisPortal`) triggered by frequent state changes (e.g. chat message updates, search input toggles) re-execute full array filtering and string comparisons on every keypress unless memoized with `useMemo`.
**Action:** Always wrap list filtering, string matching, and sorting logic in `useMemo` when rendering tabular portal data with high-frequency sibling state updates.
