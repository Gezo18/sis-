# Bolt's Journal - Critical Learnings

## 2026-10-19 - In-memory caching for synchronous localStorage operations
**Learning:** `userStore.getUsers()` was invoked repeatedly across multiple React components during initial load and state updates. Each call synchronously accessed `localStorage.getItem` and executed `JSON.parse` on large mock dataset arrays (~8 user objects with deep course & attendance arrays). Caching the parsed array in an in-memory `cachedUsers` variable eliminates redundant synchronous I/O and JSON parsing overhead on every render.
**Action:** When working with client-side mock/storage stores in React, cache parsed `localStorage` data in an in-memory variable and invalidate/update the cache in `saveUsers()` and reset helpers.
