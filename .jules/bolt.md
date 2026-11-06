# Bolt's Performance Journal ⚡

## 2026-11-06 - Image Delivery & Off-Screen Decoding Optimization
**Learning:** High-resolution dynamic images (such as Unsplash media in university portals) loaded without native lazy loading or format negotiation cause main-thread decode jank and unneeded initial bandwidth consumption on the public portal routes (`/?view=news` and `/?view=home`). Setting `fetchPriority="high"` on the above-the-fold hero image while applying `loading="lazy"` and `decoding="async"` to downstream grid cards defers off-screen asset fetching and unblocks DOM rendering. Additionally, serving modern WebP format via dynamic image parameters (`&fm=webp`) shrinks payload size by ~40-60%.
**Action:** When adding images across portal and SIS views, always specify `loading="lazy"` and `decoding="async"` for non-critical assets, prioritize critical LCP elements with `fetchPriority="high"`, and enforce modern compression formats like WebP.
