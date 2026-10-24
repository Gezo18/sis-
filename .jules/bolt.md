# Bolt's Journal - Critical Learnings

## 2026-10-24 - Avoiding Inline Array Filtering and Re-allocation in React Render Loop
**Learning:** In React components rendering large tables or lists (e.g. `SisAcademicPlan`), performing multiple `.filter()` calls inside JSX select/filter dropdowns causes $O(N \cdot M)$ allocations on every render pass. Combining filter iterations and status counting into a single `useMemo` pass reduces array allocations and eliminates unnecessary UI recalculations.
**Action:** Always compute filtered arrays and derived counts together using `useMemo` when rendering lists/tables with filter controls.
