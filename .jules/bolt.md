## 2025-05-18 - Dynamic Lazy-Loading for Monolithic Arcade Games
**Learning:** Initial page load was bundling all 3 full interactive React game modules (Mario Party Quiz, Mario Blast Classic, Alien Invasion) into a single 1.73 MB bundle, forcing users on launcher load to download JS for games they might not play.
**Action:** Use `React.lazy()` and `Suspense` at the `App.tsx` router level to code-split game components and rulebook modals into lazy chunks. Reduced initial entry JS bundle size from 1,730.33 kB to 1,171.98 kB (a ~558 kB / 32% reduction in initial JavaScript payload), deferring game code execution until selected by the user.

## 2025-05-19 - Synchronous LocalStorage & SVG Path Lookup Optimizations
**Learning:** High-density UI elements like interactive launcher box art cards and 50-state SVG map paths were causing cascading renders and linear array lookup overhead (~150 `.find()` scans per map render and 12+ post-mount `localStorage` state passes).
**Action:** Use `useState(() => ...)` lazy initializers for synchronous `localStorage` reads and pre-computed `useMemo` hash maps for O(1) property lookups, combined with `React.memo` on high-frequency leaf components (`SnesBoxArt`, `UsaMap`).

## 2025-05-20 - Constant Time Hash Map Lookups in Board & Leaderboard Renders
**Learning:** High-density game boards (60 blocks) and team leaderboards were executing linear `teams.find()` and quadratic `sortedTeams.findIndex()` array scans inside map iteration callbacks on every game state tick / coin adjustment.
**Action:** Memoize `teamsMap` and `teamRanksMap` in `useMemo` hooks in `GameBoard.tsx` and `TeamLeaderboard.tsx` to convert O(N) array scans into O(1) constant-time hash map lookups.

## 2025-05-21 - Caching & Memoization for MarkedPrompt Regex Parsing
**Learning:** `MarkedPrompt` text components rendered across prompt cards, modals, and editors were re-running regex matching (`exec` loop in `parseMarkedPrompt`) on every render pass, causing redundant string parsing and CPU overhead for identical prompt texts.
**Action:** Wrap `MarkedPrompt` in `React.memo`, memoize parts parsing via `useMemo`, and introduce a bounded Map cache (`parseCache`, max 250 entries) in `parseMarkedPrompt` to convert repetitive regex parsing into O(1) string cache lookups.

## 2025-05-22 - High-Density SVG Leaf Component Memoization & Safe Unique Defs
**Learning:** `MarioCoin` leaf components rendered in high frequency across game boards, leaderboards, and modals were re-allocating lookup objects and triggering VDOM re-renders on every parent state tick. Replacing `useId()` with static IDs in reusable SVG components breaks SVG gradient rendering due to DOM ID collisions.
**Action:** Wrap `MarioCoin` in `React.memo`, hoist static size lookup maps (`DIM_MAP`) outside render scope, remove dead object allocations (`sizeMap`), and retain `React.useId()` for safe unique SVG gradient `<defs>` IDs.
