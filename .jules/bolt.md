## 2026-10-18 - Indexing list items by key in React components with grid views
**Learning:** Performing `array.filter()` inside an $N$-item grid render loop (such as days in a month calendar) creates $O(D \times N)$ iteration overhead per render. Pre-indexing items into a `Map` within `useMemo` optimizes lookups to $O(1)$ per cell ($O(D + N)$ total), preventing redundant array iterations on unrelated re-renders (such as state toggles).
**Action:** Use `useMemo` and a `Map` to group or index data before rendering repeating grid cells or nested loops.
