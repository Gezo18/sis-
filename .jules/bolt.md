## 2025-05-18 - [Directory Search & Filtering Hoisting in React]
**Learning:** In React list views with nested array searching/filtering (e.g., matching across student profiles, course status arrays, and advisor emails), running string operations (`.toLowerCase()`, `.split()`, `.trim()`) inside the filter callback loop causes unnecessary allocations per item on every render pass.
**Action:** Always hoist invariant query lowercasing and parameter parsing outside `.filter()` callbacks and memoize filter results with `useMemo` when rendering multi-attribute student or course tables.
