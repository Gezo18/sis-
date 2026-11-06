# Bolt's Performance Journal ⚡

## 2026-11-06 - Image Delivery & Off-Screen Decoding Optimization
**Learning:** High-resolution dynamic images (such as Unsplash media in university portals) loaded without native lazy loading cause main-thread decode jank and unneeded initial bandwidth consumption on the public portal routes (`/?view=news` and `/?view=home`). Applying standard HTML `loading="lazy"` and `decoding="async"` attributes to downstream grid cards defers off-screen asset fetching and unblocks DOM rendering safely across React versions without risking TS2322 type conflicts.
**Action:** When adding images across portal and SIS views, always specify `loading="lazy"` and `decoding="async"` for non-critical assets.
