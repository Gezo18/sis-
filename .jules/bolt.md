# Bolt's Performance Journal

## 2026-10-29 - In-Memory Cache for User Data Store
**Learning:** Synchronous `localStorage.getItem` and `JSON.parse` operations in frequently called data getters (such as `userStore.getUsers()`) during React component render cycles introduce significant I/O and parsing overhead.
**Action:** Always maintain an in-memory reference cache for client-side stores and invalidate/update the cache only when mutations occur.
