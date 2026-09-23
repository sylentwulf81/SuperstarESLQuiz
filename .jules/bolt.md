## 2025-05-18 - Dynamic Lazy-Loading for Monolithic Arcade Games
**Learning:** Initial page load was bundling all 3 full interactive React game modules (Mario Party Quiz, Mario Blast Classic, Alien Invasion) into a single 1.73 MB bundle, forcing users on launcher load to download JS for games they might not play.
**Action:** Use `React.lazy()` and `Suspense` at the `App.tsx` router level to code-split game components and rulebook modals into lazy chunks. Reduced initial entry JS bundle size from 1,730.33 kB to 1,171.98 kB (a ~558 kB / 32% reduction in initial JavaScript payload), deferring game code execution until selected by the user.

## 2025-05-19 - Synchronous LocalStorage & SVG Path Lookup Optimizations
**Learning:** High-density UI elements like interactive launcher box art cards and 50-state SVG map paths were causing cascading renders and linear array lookup overhead (~150 `.find()` scans per map render and 12+ post-mount `localStorage` state passes).
**Action:** Use `useState(() => ...)` lazy initializers for synchronous `localStorage` reads and pre-computed `useMemo` hash maps for O(1) property lookups, combined with `React.memo` on high-frequency leaf components (`SnesBoxArt`, `UsaMap`).

## 2025-05-20 - Constant Time Hash Map Lookups in Board & Leaderboard Renders
**Learning:** High-density game boards (60 blocks) and team leaderboards were executing linear `teams.find()` and quadratic `sortedTeams.findIndex()` array scans inside map iteration callbacks on every game state tick / coin adjustment.
**Action:** Memoize `teamsMap` and `teamRanksMap` in `useMemo` hooks in `GameBoard.tsx` and `TeamLeaderboard.tsx` to convert O(N) array scans into O(1) constant-time hash map lookups.
