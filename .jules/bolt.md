## 2026-10-26 - Pre-indexing Date Collections in Calendar Views

**Learning:** Running linear array `.filter()` calls inside grid/month map loops (e.g., 31 days x N events) causes `O(D * N)` rendering overhead on every state update (modal toggles, RSVPs, view switches). Pre-indexing items into an `O(N)` lookup object via `useMemo` reduces per-cell rendering time to `O(1)`.

**Action:** Whenever rendering calendar grids or date-based lists in React components, construct an `{ [dateKey]: items[] }` dictionary inside `useMemo` instead of filtering inside the cell loop.
