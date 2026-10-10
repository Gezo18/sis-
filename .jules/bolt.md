# Bolt's Performance Journal

## 2025-05-18 - Memoize Derived Lists in Interactive Dashboard Views
**Learning:** In interactive dashboard components containing embedded sub-views (such as `StaffSisPortal` with live chat inputs, date pickers, and grade inputs), inline array filtering across student or course lists runs on every keystroke/state update. This causes avoidable array traversals and string operations on unrelated interactions.
**Action:** Always wrap derived list filters and status aggregations in `useMemo` with minimal dependency arrays when component state contains high-frequency interactive inputs (e.g. search boxes, messaging inputs, or sliders).
