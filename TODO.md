# TODO

## Blast: Chance Wheel (design first, then wire in)

Applies to Super Summer Blast, Super Winter Blast, and Super Halloween Blast (the `mario-party-quiz` engine).

The Chance Wheel replaces the old random mystery-card blocks. A correct answer already earns a pick from 6 mystery cards; the wheel is the separate, rarer "big moment" with major effects.

Current placeholder: the `mystery_card` blocks still sit on the board (5 in Winter, 7 in Summer) and give a free card pick. Hook point: `SELECT_BLOCK` in `src/games/mario-party-quiz/engine/reduce.ts` (marked `TODO(chance-wheel)`).

Decide before building:

- [ ] Trigger: keep fixed wheel blocks on the board, or a random chance after any block / correct answer? How often?
- [ ] Wedges: list of major effects (and which are too strong for a class of 12-year-olds).
- [ ] Wedge weights: equal slices, or weighted? Show weights visually?
- [ ] Who it affects: spinning team only, everyone, or a chosen rival?
- [ ] Catch-up rules: can 1st place land on catch-up wedges (like Blue Shell / Bowser cards today)?
- [ ] Does a wheel spin also give a card, or replace it? Does the turn pass after?
- [ ] Round/board enders: can a wedge end the activity early?
- [ ] Presentation: wheel art, spin sound, reveal animation; host "re-spin" / "skip" controls.
- [ ] Question Studio: rename "Mystery Card" block type to "Chance Wheel"; rulebook + Japanese guide copy.
