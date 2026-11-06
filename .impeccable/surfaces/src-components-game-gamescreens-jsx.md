---
version: 1
slug: "src-components-game-gamescreens-jsx"
primary_target: "src/components/game/GameScreens.jsx"
related_targets: ["src/components/game/Round.jsx","src/components/game/Lobby.jsx","src/components/game/Results.jsx"]
---

# Game screens (lobby, round, reveal, results)

Scope: the in-game flow after the home screen. Mode: Operate. Mobile-first; portfolio reviewer playing solo is the primary visitor (PRODUCT.md).

Confirmed with the user: the clue must never be crowded out (including with the phone keyboard open); timing must always be clear; the home screen keeps its look and is only wired up; solo shortcut waits for M5. The user did not pick on the structure page and said to keep working, so the dealt lead (countdown dial) is built.

## Direction contract

THESIS: The round's clock and the clue's sharpening are one object, a five-arc dial, so a player reads time left and the next sharpening in one glance. Refuses the default of a top progress bar over a clue with a scoreboard competing beside it.

OWN-WORLD: The incumbent home screen: warm stone ground (#FBF9F5 light, #121110 dark) with the soft radial ambient, stone-900/stone-100 ink, Newsreader for headings and numerals, Plus Jakarta Sans for UI, rounded-xl inputs and solid ink primary buttons, hairline stone borders. No accent hue: "solved" is an inverted ink chip; the only colour is the clue itself.

STORY: The player sees the clue immediately, knows how long is left and when it sharpens, types a guess and gets an instant verdict. Other players' progress is peripheral: a row of chips that flip to ink when solved.

FIRST VIEWPORT: Header: "Round 3" in Newsreader at left with "of 10 · Poster" beneath; at right a 60px dial, seconds in Newsreader at its centre, five arcs (elapsed ink, current filling, future hairline). Centre: the clue, dominant (poster 2:3 up to the available height, still 16:9 full width, plot as a large serif quotation), "Sharpens in 4s" under it. Bottom, pinned above the keyboard: player chips, then the guess field and Guess button.

FORM: Countdown dial, position 6 of 7 on the ordered structure list (dealt lead). seed:4fcf2ebc14c6d718

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: when a level unlocks, its arc completes and the clue cross-fades to the sharper render (instant under reduced motion).
