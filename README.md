# Superstar ESL Quiz (Mario Blast launcher)

Classroom arcade launcher plus a siloed **Super Mario Party Quiz** game (Summer and Holiday editions). Placeholders for other titles stay in the catalog but are not playable.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:43123. The front page is the game launcher. Playable box arts: Summer Blast and Winter/Holiday Blast.

`npm run lint` runs `tsc --noEmit`. `npm run build` produces a production bundle.

## Layout

- `src/App.tsx` — thin shell: auth, launcher routing, toaster
- `src/launcher/` — catalog, SNES box-art cards, launcher UI
- `src/games/mario-party-quiz/` — the only playable game module (board, studio, Firebase decks)
- `src/shared/` — auth, Firebase, types, shared UI
- `public/assets/boxart/` — launcher covers
- `public/assets/characters/summer|winter/` — character art kept on disk for later
- `public/assets/teams/` — team SVG emblems used on the board and setup screen
- `public/assets/hero/` — seasonal character group art kept on disk for later

Google sign-in and Firestore question sync still use the committed Firebase applet config.
