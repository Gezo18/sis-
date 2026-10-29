# Bolt's Performance Journal

## 2026-10-29 - Memoizing Student Directory Array Filtering
**Learning:** Computing multi-field array filtering and string normalizations directly in the render body of large list components (such as `DatabaseStudentsDirectory`) executes on every render cycle—including during unrelated state updates like toast timers or modal toggles.
**Action:** Use `React.useMemo` for heavy multi-field search and array filtering operations with comprehensive dependency arrays to avoid redundant calculations.
