# Bolt's Performance Journal

## 2025-05-20 - Memoizing Filtered Student Lists in Teacher SIS Portals
**Learning:** In large React view trees with rich interactive controls (e.g. Moodle chat inputs, date pickers, search fields), inline `.filter()` operations on list state re-evaluate on every single keypress and re-render. Wrapping list filtering in `useMemo` eliminates redundant O(N * M) list traversals on unrelated state updates.
**Action:** Always memoize derived filtered lists in components that manage high-frequency local UI state (such as chat text inputs, toggle buttons, or modal visibility).
