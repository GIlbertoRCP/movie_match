---
name: Movie Match
description: A live multiplayer movie guessing game on a warm stone ground, set in ink and serif numerals.
colors:
  ground-light: "#FBF9F5"
  ground-light-glow: "#F5F1E8"
  ground-dark: "#121110"
  ground-dark-glow: "#1c1a17"
  ink: "#1c1917"
  ink-pressed: "#44403b"
  paper-ink: "#f5f5f4"
  paper-ink-bright: "#fafaf9"
  paper-ink-pressed: "#d6d3d1"
  stone-hairline: "#d6d3d1"
  stone-hairline-dark: "#44403b"
  stone-divider: "#e7e5e4"
  stone-divider-dark: "#292524"
  stone-wash: "#e7e5e4"
  stone-wash-dark: "#292524"
  stone-muted: "#57534d"
  stone-muted-dark: "#a6a09b"
  stone-mid: "#79716b"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  display-code:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "4.5rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.12em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(1.75rem, 7vw, 2.5rem)"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  clue-quote:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(1.5rem, 6.4vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.375
  title:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.25
  numeral:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "tnum"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  caption:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "0.02em"
rounded:
  blank: "3px"
  segment: "8px"
  control: "12px"
  frame: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  gutter: "20px"
  section: "40px"
  section-lg: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-ink-bright}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.ink-pressed}"
  button-primary-dark:
    backgroundColor: "{colors.paper-ink}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-primary-dark-hover:
    backgroundColor: "{colors.paper-ink-pressed}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.stone-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  input-text:
    backgroundColor: "#ffffffcc"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  chip-player:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 12px 4px 4px"
  chip-player-solved:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-ink-bright}"
    rounded: "{rounded.pill}"
  segmented-option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-ink-bright}"
    rounded: "{rounded.segment}"
    padding: "6px 16px"
  clue-frame:
    backgroundColor: "{colors.stone-wash}"
    rounded: "{rounded.frame}"
  countdown-dial:
    size: "60px"
---

# Design System: Movie Match

## Overview

**Creative North Star: "The Late Screening Programme"**

Movie Match looks like a printed programme handed out at a small repertory cinema: warm paper, black ink, a serif for anything worth reading aloud (titles, room codes, scores, the seconds left) and a quiet sans for everything you operate. The interface is deliberately colourless so that the only colour on screen is the clue itself: a pixelated poster, a still crop, or a synopsis with its names inked out. Everything else steps back to let a player read the clue and answer fast.

Density is low and the layout is a single column. Screens are short, centred, and one decision deep: a name and two ways in on the home screen, a giant room code in the lobby, a clue with a clock and a guess field in a round, a ranked list at the end. State is carried by ink inversion rather than hue: a solved player, a selected option, a confirmed guess and the reconnect banner all flip to solid ink with paper-coloured text.

Light and dark are equal citizens. Dark is the same programme read under the house lights down: a near-black warm ground with paper ink, never a blue-black or a neon scheme. The theme is applied before first paint and follows the OS until the player chooses.

**Key Characteristics:**
- Warm stone ground with a soft radial glow at the top of every screen.
- Two inks only: stone-900 on light, stone-100 on dark; no accent hue anywhere.
- Newsreader for headings and all numerals; Plus Jakarta Sans for controls and prose.
- "Done" and "selected" are an inverted ink fill, never a colour.
- Flat surfaces, hairline stone borders, one soft shadow reserved for the clue frame.
- Keyboard-aware layout: the clue keeps the space when the phone keyboard opens.

## Colors

A neutral warm-stone palette with two inks and no accent: the clue images are the only colour, and they are product content, not palette.

### Primary
- **Programme Ink** (`ink`): the light theme's one voice. Body text, headings, the primary button fill, the solved chip, the elapsed and current dial arcs, the redaction blanks in plot clues, the text-selection fill.
- **Paper Ink** (`paper-ink`): the dark theme's one voice, taking every role Programme Ink holds in light. **Bright Paper** (`paper-ink-bright`) is the text that sits on an ink fill.

### Neutral
- **Warm Paper Ground** (`ground-light`) with **Morning Glow** (`ground-light-glow`): the light page. Every screen paints a radial gradient from the glow at top centre to the ground at 80%. Also the browser `theme-color` and the focus-ring offset colour.
- **House-Lights-Down** (`ground-dark`) with **Ember Glow** (`ground-dark-glow`): the same gradient for dark.
- **Hairline Stone** (`stone-hairline` / `stone-hairline-dark`): input and secondary-button borders, the segmented picker outline, the "or join one" rule, unsolved chip borders.
- **Divider Stone** (`stone-divider` / `stone-divider-dark`): row dividers and the top and bottom rules of the lobby and results lists.
- **Stone Wash** (`stone-wash` / `stone-wash-dark`): avatar initials discs and the clue frame's empty fill before an image lands. Hover washes use the same stone at 60% opacity.
- **Muted Stone** (`stone-muted` / `stone-muted-dark`): secondary text, hints ("Sharpens in 4s"), meta lines, the TMDB attribution.
- **Mid Stone** (`stone-mid`): the dial's future-time hairline and focus rings, kept at 3:1 or better against both grounds.

### Named Rules
**The Only Colour Is the Clue Rule.** No accent hue exists. Success, selection, urgency and connection state are expressed with ink inversion, weight, or a dashed border. If a new screen needs to say "good" or "chosen", it inverts the ink.

**The Two Inks Rule.** Each theme has exactly one ink (stone-900 light, stone-100 dark) plus the stone neutrals. Do not introduce black, pure white text, or a second dark.

## Typography

**Display Font:** Newsreader (with Georgia, serif), optical size axis 6..72, weights 400 and 500 loaded.
**Body Font:** Plus Jakarta Sans (with system-ui, -apple-system, sans-serif), weights 400, 500 and 600 loaded.

**Character:** A bookish, optically sized serif carries the cinephile voice and every number a player watches; a round, friendly geometric sans handles the operating layer without competing.

### Hierarchy
- **Display** (Newsreader 400, 48px): the one big line per screen: "Movie Match" on home, "You win" / "It's a tie" on results.
- **Display Code** (Newsreader 400, 72px, tracking 0.12em, tabular): the lobby's room code, the largest thing on that screen.
- **Headline** (Newsreader 400, clamp 28 to 40px): the revealed film title, with its year at 0.6em in muted stone; the 36px clue-type name on the round intro.
- **Clue Quote** (Newsreader 400, clamp 24 to 36px, leading 1.375, max 34ch, balanced): plot synopses. Steps down to clamp 21 to 30px past 280 characters, 18 to 26px past 440, and to clamp 18 to 22px while the keyboard is open.
- **Title** (Newsreader 400, 22px to 24px): the round header ("Round 3") and section headings ("Players").
- **Numeral** (Newsreader 400, 22 to 24px, tabular): the dial's seconds, scores, the "+points" on a solved guess. The dial's seconds step to 500 in the last five seconds.
- **Body** (Plus Jakarta Sans 400, 16px): button labels (500), input text, prose.
- **Label** (Plus Jakarta Sans 400 to 500, 14px): field labels, hints, chips, the "Rounds" picker, status lines.
- **Caption** (Plus Jakarta Sans 400, 12px, tracking 0.02em on meta lines): the round meta line ("of 10 · Poster") and TMDB attribution.

### Named Rules
**The Serif Numerals Rule.** Every number a player reads at a glance (seconds, scores, room code, round number) is set in Newsreader with tabular figures. Rank positions and counts in running text stay in the sans.

**The Weight Is the Alarm Rule.** Urgency is a weight step (400 to 500) on the dial's seconds, never a colour change.

## Layout

Single-column and centred, mobile-first. Menu screens (home, lobby, results) use a 384px column with 16px gutters (24px from 640px up) and a header carrying only Leave at left and the theme toggle at right. Sections inside that column are separated by 40 to 48px; controls inside a section by 8 to 16px.

The round screen is a three-band column pinned to the visible viewport: a header (title and meta at left, the 60px dial at right) capped at 768px; a flexible centre where the clue takes all remaining height (posters 2:3 up to the available height, stills 16:9 at full width, plot as a quotation); and a footer capped at 576px holding the player chips and the guess form, padded by the bottom safe-area inset. The footer keeps a fixed 76px slot across intro, guessing and reveal so the clue never jumps.

Keyboard-aware behaviour is part of the system: game screens size from `visualViewport`, and while a text field is focused and the visible height drops by 120px or more, the chips and the hint fold away, the header tightens, the solved count moves into the meta line, and plot text steps down. The clue keeps the space.

### Named Rules
**The Clue Keeps the Space Rule.** On any game screen, the clue gets the flexible region; chrome takes only what it needs and folds first when space runs out.

## Elevation & Depth

Flat by default. Depth comes from the tonal radial glow on the ground and from hairline borders, not from shadows. The single shadow in the system lifts the clue frame (and the revealed poster) off the page, so the eye knows which object is the game.

### Shadow Vocabulary
- **Clue Lift** (`box-shadow: 0 18px 40px -18px rgba(28,25,23,0.45)`): image clue frames and the reveal poster only. Soft, warm, offset downward and spread negative so it reads as a cast shadow under a print.

### Named Rules
**The One Lifted Object Rule.** Only the clue is elevated. Buttons, inputs, chips, lists and banners stay flat.

## Shapes

Gently rounded and consistent: 12px corners on every input, button and picker outline; 16px on the clue frame; full pills for chips, the quiet Leave button, the theme toggle and avatar discs; 8px on segmented-picker options nested inside a 12px outline; 3px on the inked redaction bars. Borders are 1px hairlines; the only other stroke weights are the dial's 2px future arc and 5px filled arc. An away player is drawn with a dashed border rather than a fainter colour alone.

## Components

### Buttons
Solid, quiet, and the same height as the field next to them.
- **Shape:** gently curved (12px), 12px by 20px padding, 16px medium label, optional 18px line icon with an 8px gap.
- **Primary:** solid ink fill with paper text; one per screen (Create a room, Guess, Start the game, Play again).
- **Hover / Focus:** fill lightens a step (stone-700 light, stone-300 dark) on a colour transition; focus shows a 2px mid-stone ring offset by 2px in the ground colour. Disabled drops to 40% opacity.
- **Secondary:** transparent with a hairline border and ink text; hover adds a 60% stone wash. Used for Join, Share invite, Copy code.
- **Quiet:** pill, 14px muted text, no border, hover wash. Used for Leave in screen headers; the theme toggle is its icon-only sibling.

### Chips (player row)
- **Style:** pill with a hairline border, a 24px initials disc, the player's name ("You" for yourself) at 14px. Horizontal scroll row, scrollbar hidden.
- **State:** solved flips the whole chip to ink fill with a check in the disc (300ms colour transition, instant under reduced motion); away is a dashed border with muted text.

### Segmented Picker (round count)
A 12px hairline outline with 4px inset; options are 8px-rounded labels at 14px tabular. Selected is an ink fill; others take the hover wash. Focus rings the option.

### Lists (players, final scores)
Full-width rows divided by hairlines with a rule above and below, 12 to 14px vertical padding. Lobby rows lead with a 32px initials disc; score rows lead with a muted rank and end with the score in serif numerals. Your own row is marked by weight 600 or "(you)", never a highlight colour.

### Inputs / Fields
- **Style:** 12px corners, hairline border, ground showing through an 80% white (light) or 80% stone-900 (dark) fill, 12px by 16px padding, 16px text so iOS does not zoom.
- **Focus:** no outline; a 2px mid-stone focus-visible ring. Caret is the ink colour.
- **Error / Disabled:** errors appear as muted text in a reserved line below the field (no red, no border change); disabled is 60% opacity.

### Banner
The reconnect notice is a full-width ink strip at the top of the game column with paper text and a line icon. It sits in the flow so it never covers the header.

### Countdown Dial (signature)
The round's clock and the clue's sharpening as one object. A 60px ring split into one arc per clue level with 6px gaps: elapsed and current time fill in ink at 5px, future time is a 2px mid-stone hairline. The seconds sit in the centre in Newsreader 22px tabular and step to weight 500 for the last five seconds. Outside guessing it becomes a single arc counting the intro or the reveal. Exposed as a `timer` with a spoken label.

### Clue Frame (signature)
A 16px-rounded, stone-wash frame with the Clue Lift shadow. Each newly unlocked level is stacked over the last and fades in over 700ms ease-out, so the image visibly sharpens instead of flickering; under reduced motion it swaps instantly. Plot clues render without a frame as a large serif quotation with names replaced by 2.6em inked bars that never wrap away from their punctuation. The frame's contents (pixelated posters and still crops rendered by the server from TMDB images) are product content, not design assets.

## Do's and Don'ts

### Do:
- **Do** paint every screen on the warm ground with its radial glow (`ground-light` to `ground-light-glow`, `ground-dark` to `ground-dark-glow`).
- **Do** express solved, selected and confirmed states as an inverted ink fill with paper text.
- **Do** set every glanceable number in Newsreader with tabular figures.
- **Do** reuse the shared control styles (12px corners, 12px by 20px buttons, 2px mid-stone focus ring offset on the ground) for any new control.
- **Do** give the clue the flexible region and fold chrome first when the keyboard opens.
- **Do** make every transition instant under `prefers-reduced-motion`.
- **Do** carry the TMDB attribution in the footer of any screen that shows TMDB data, at caption size in muted stone.

### Don't:
- **Don't** introduce an accent hue, including green for correct or red for wrong; the user confirmed a world with no accent, and the only colour is the clue.
- **Don't** signal urgency with colour; step the weight instead.
- **Don't** shadow anything other than the clue frame and the reveal poster.
- **Don't** treat clue images or the dev preview's synthetic canvas mosaics as design assets or decoration.
