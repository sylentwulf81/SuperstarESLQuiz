# Superstar ESL Quiz — Design Bible

All titles in this launcher are **classroom arcade games for Japanese ESL students**, usually projected on a big screen with a teacher hosting. Design for a noisy room, mixed reading levels, and glanceability from the back row.

## Core rule

**Simple, clear, visual.** If a graphic, number, animation, or sound can explain a mechanic, default to that. Big, bright, clear visuals always trump detailed explanations when feasible.

## Audience

- **Students:** Japanese ESL learners. Keep in-game English short, high-frequency, and optional when a picture will do.
- **Teachers:** Hosts running the room. Their instructions may be a little more detailed, but still scannable — never a paragraph when a label will do.

## In-game UI (student-facing)

- Prefer **icons, avatars, coins, colors, and motion** over sentences.
- Put the important number **big and alone** (coins, stars, timer, −5). Never nest it inside a long English sentence.
- One idea per screen region. One action per button.
- Short labels: `SWAP`, `STEAL`, `−5`, `ROUND OVER`. Avoid host-essay copy like “Choose an opponent below to swap bank totals.”
- Assume the class is looking at the board, not reading it. If they cannot understand the state in one second, it is too wordy.
- Sound and animation carry payoff. A coin burst beats a toast that explains the coin burst.

## Teacher / host UI

- Setup, rulebooks, and Question Studio may use more English.
- Still optimize for **scannability**: short steps, bold verbs, no nested clauses.
- Do not dump teacher copy onto the live student board.

## Visual language

- Large hit targets. High contrast. Saturated Mario-arcade color.
- Team identity is the avatar + color, not a caption.
- Scores and coins should be readable from across a classroom.
- Hover and highlight with glow/brightness, not tiny text changes.

## Checklist before shipping a screen

1. Can a student who is still learning English know what to do without reading a paragraph?
2. Is the key number (coins, stars, damage) bigger than the surrounding words?
3. Could this sentence be an icon, a badge, or a sound instead?
4. Is the teacher the only person who needs the leftover explanation — and if so, does it belong in the guide, not on the live board?
