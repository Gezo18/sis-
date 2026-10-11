## 2026-10-11 - Memoization of Unfiltered Student & Course Lists Across Dashboard Views

**Learning:** Component state changes triggered by local timers (toast notifications), modal open/close actions, or Moodle chat typing cause frequent re-renders of parent dashboard components like `DatabaseStudentsDirectory`, `StaffSisPortal`, and `SisAcademicPlan`. Without `useMemo`, expensive student directory filters and per-student course array checks were executing repeatedly on every keypress or notification tick.
**Action:** Wrap student roster and course list filtering operations in `useMemo` with explicit dependency arrays to avoid unnecessary re-filtering and array allocations during unrelated UI state transitions.
