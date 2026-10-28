# Image asset audit (classroom display)

Target: Mac → 1920×1080 smart display (device pixel ratio 1). Game screens now scale as a
1920×1080 stage (`html.stage-scale`), so "shown at 1080p" sizes below are the sizes in class.
An image looks soft when it is drawn larger than its natural size (upscale > 1.0).

## Measured in the running game at 1920×1080

| Asset | Natural | Shown | Upscale | Screen |
|---|---|---|---|---|
| `effects/reveal_mariosupermushroom.jpeg` | 960×716 | 631×724 (cover) | 1.01× | Card reveal |
| `teams/team_*.svg` | vector | 101×101 | n/a | Superstar screen |
| `teams/team_toad.png`, `team_rosalina.png` | 256×256 | 101×101 | 0.39× | Superstar screen |

## Bundled art by group

| Group | Natural size | Verdict for 1080p |
|---|---|---|
| Character avatars (`characters/{summer,winter,halloween}`) | 1024×1024 JPEG, 670–940 KB each | Sharp enough. Heavy: ~16 MB total; convert to WebP (~100 KB each). |
| Victory headers (`victoryheaders`) | 1024×764 | Fine at the Superstar screen's size. |
| Card reveal art in use (`effects/reveal_*.jpg`, portrait) | 571×1024 | About 1:1 in the reveal card at 1080p. Would soften on a 4K display. |
| Treasure blocks (`effects/treasureblock_*`) | 764×1024 | Fine. |
| Launcher box art / hero (`boxart`, `hero`) | 1200×896, 1376×768 | Fine (launcher is not shown in class). |
| Team icons | SVG, plus two 256×256 PNGs | Fine; convert the two PNGs to SVG for consistency. |
| Alien Invasion (`alien-invasion/image*.gif`) | 140–512 px GIFs | Low-res; check how large each is drawn before that game is used in class. |

### Unused files (safe to delete after a final check)

`effects/reveal_blooperink.jpeg`, `reveal_bowserrevolution.jpeg`, `reveal_bowsersfury.jpeg`,
`reveal_mariocoins.jpeg`, `reveal_mysterblock_pirhanaplant.jpeg`, `reveal_supercoins.jpg`
(no references in `src/`).

## What actually makes the class display fuzzy

1. **Teacher-uploaded question images**: every upload is cut to 640×480 JPEG at quality 0.72
   (`src/shared/utils/imageUtils.ts`) so decks fit in localStorage and a 1 MB Firestore document.
   The board editions' question window draws them large (`QuestionModal` image panel fills the
   column), so they are upscaled roughly 1.5–2× with JPEG artefacts. Fix in Phase 2: store images
   as files (Firebase Storage or Vercel Blob) at up to 1920 px, WebP.
2. **Display chain** (not code): Mac set to a scaled resolution instead of "Default for display",
   TV overscan ("Just Scan"/"Screen Fit" off), TV sharpness processing, or not in PC/Game mode.
   Any of these resamples the whole picture.
3. **Small, low-contrast text with glow/blur effects**: 9–11 px labels, `text-shadow` glows and
   translucent backgrounds read as soft from the back of a room. Fix in the design-system pass:
   a 1080p-safe minimum type size and fewer glow effects.
