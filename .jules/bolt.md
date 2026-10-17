## 2026-10-17 - React 19 Bundle Code-Splitting via React.lazy and Named Export Resolvers

**Learning:** Static top-level imports of all route views and modal components in `App.tsx` created a monolithic JS bundle (~920 kB minified), increasing initial page load latency and Time to Interactive (TTI). Using `React.lazy()` with dynamic `import()` reduced the main bundle size by ~40% (down to ~554 kB) by splitting views and modals into 25 separate on-demand chunks. Because components used named exports, dynamic imports were wrapped with `.then(m => ({ default: m.ComponentName }))` to seamlessly integrate with `React.lazy`.

**Action:** For large React SPA codebases with multiple modal consoles and view routes, eagerly import only critical shell navigation components (navbars, footers) and lazy load route views and heavy modals with `React.lazy` and `Suspense` fallbacks.
