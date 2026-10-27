## 2026-10-27 - In-Memory Caching for Synchronous Store Reads
**Learning:** In client-side state managers like `userStore`, repeatedly calling `localStorage.getItem()` and parsing JSON payloads on every helper/getter call during React component renders creates severe main-thread overhead.
**Action:** Cache parsed objects in module-scoped variables (`inMemoryUsers`) and guard with a loaded flag (`isUsersLoaded`). Invalidate or sync the cache only on store mutations (`saveUsers`, `resetToDefaults`).
