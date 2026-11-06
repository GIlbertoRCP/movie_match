# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a recruiter or engineer reviewing this as a portfolio piece. Usually alone, often on a phone, with about a minute of attention. They need to be playing almost immediately and to come away thinking it's polished and well engineered.

Secondary: friends playing together, each on their own phone, in a room of 2–8 players joined by a 4-letter code.

## Product Purpose

A live multiplayer movie guessing game. Players race to name a film from a clue that gets easier over about 30 seconds: a pixelated poster that sharpens, a still frame that zooms out, or a synopsis with the names blanked out. Faster correct answers score more.

It exists as a portfolio piece. Success means a reviewer can play a round in their first minute without signing up or finding a second person, and that the engineering underneath (server-authoritative real-time play, anti-cheat, reconnection) holds up if they read the code.

## Positioning

The server is the only source of truth. Timers, scoring and clue unlocks are enforced server-side, and answers never reach the browser before the reveal. That isn't a feature players see directly, but it's the thing the portfolio is meant to demonstrate.

## Operating Context

- Players join with a room code or share link; nicknames only, no accounts.
- A round: short intro, then about 30 seconds of guessing while the clue improves in steps, then a reveal, then the next round; final results at the end.
- Movie data and images come from TMDB.
- Hosted on a single server (Express + Socket.io) that also serves the frontend.

## Capabilities and Constraints

- Server protocol: `server/game/socket.js` (room:create / join / resume / leave, game:start, guess:submit; room:state broadcasts).
- Image clues come from `/api/clues/<token>/<level>` and each level unlocks at a server-given time; the unobscured image appears only after the reveal.
- No accounts, no saved history, no global leaderboard in v1.
- TMDB attribution is required wherever TMDB data is shown.
- Solo play works (a room of one); a dedicated solo mode is planned (milestone 5).
- Undecided: the final product name ("Movie Match" is a working title).

## Brand Commitments

- Voice: warm and cinephile, like a well-made film quiz at a cosy screening. Playful, not loud.
- Working title: Movie Match.

## Evidence on Hand

- Real gameplay content from TMDB (about 150 films), built locally by `npm run build-pool`.
- No testimonials, user counts or press exist; don't fabricate them.

## Product Principles

1. The first minute decides everything: playable without explanation, no dead ends.
2. The clue is the star; everything else supports reading it and answering fast.
3. Fair by construction: what a player sees is exactly what the server allows, nothing more.
4. Finished over big: a small game, polished, beats many half-built features.

## Accessibility & Inclusion

Basics: fully keyboard-playable, readable contrast in light and dark themes, respects reduced-motion preferences, labelled controls and live announcements for game events.
