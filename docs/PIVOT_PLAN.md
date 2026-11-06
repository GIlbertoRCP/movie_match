# Pivot Plan: Movie Match → Live Movie Guessing Game

> Status: proposal · Written 2026-11-05 · Purpose: portfolio piece

## 1. The pitch

A real-time multiplayer guessing game. Someone creates a room, friends join with a 4-letter code, and everyone races to name the movie from a progressively revealed clue: a pixelated poster, a single still frame, or a plot summary with the names blanked out. Faster correct answers score more. A **solo mode** lets a visitor play alone, instantly.

**Working title:** TBD (pick something short and searchable before the README is written).

## 2. Who it's for, and what "done" means

The audience is **a recruiter or engineer reviewing a portfolio**, usually alone, usually on their phone, with about 60 seconds of attention.

v1 is done when:

- [ ] Visiting the live URL shows something playable in **under 3 seconds**, with no cold-start banner.
- [ ] A reviewer can finish a **solo round with no sign-up** and no second person.
- [ ] Two browsers can play a multiplayer round end-to-end, including one player refreshing mid-round and rejoining.
- [ ] Game logic has unit tests; one integration test plays a full multiplayer round over real sockets; CI runs both on every push.
- [ ] The README has a gameplay GIF, the live link, an architecture diagram, and a "design decisions" section.

## 3. Scope

### In v1
- Movies only, using a curated pool from TMDB
- 3 clue types: **pixelated poster**, **still frame**, **redacted plot**
- Rooms of 1–8 players, nickname only (no accounts)
- Solo mode (same engine, room of one)
- Light/dark theme, mobile-first layout

### Explicitly not in v1
- Accounts, login, saved history
- Other categories (albums, landmarks…), which can come in v2 because the engine is category-agnostic
- Global leaderboards
- Any "AI"/ML feature

The project drifted before because features were added faster than any one was finished. **Nothing outside this list gets built until every box in §2 is checked.**

## 4. What happens to the existing code

> **M1 update:** nearly every UI file depended on the 662-line `MovieContext`, so the "Adapt" and "Mine for parts" UI below was deleted too, rather than left in the tree with broken imports. Recover pieces from the pre-pivot code when needed: `git show 11a8fd1:src/components/CardStack.jsx` (commit `11a8fd1` is the last pre-pivot `main`). The client-side `src/services/tmdbApi.js` and `socketService.js` were also removed: under the §5 anti-cheat rule the client never talks to TMDB, and the socket client gets rewritten in M2.

| Area | Files | Decision |
|---|---|---|
| Socket.io rooms | `server/index.js` | **Rewrite** as a server-authoritative game engine (see §5) |
| TMDB proxy + cache | `server/routes/tmdbRoutes.js`, `src/services/tmdbApi.js` | **Keep**, then extend with images/credits endpoints and a movie-pool builder |
| Session create/join | `server/routes/sessionRoutes.js`, `HostSessionModal.jsx`, `OnlineSessionStatusBar.jsx` | **Adapt** into a room lobby (codes, player list, host controls) |
| Match celebration | `MatchModal.jsx`, `canvas-confetti` | **Adapt** into the round-reveal / winner screen |
| Card UI & gestures | `CardStack.jsx`, `MovieDetailDrawer.jsx` | **Mine for parts.** The animation/drawer work is reusable; the swipe deck is not the core loop anymore |
| Theme system | `ThemeContext.jsx`, Tailwind setup | **Keep**, but pick one visual direction and freeze it |
| Deploy | `Dockerfile`, `nginx.conf`, `supervisord.conf`, `render.yaml` | **Keep the Docker image**; change the host (see §8) |
| Auth (password + Authentik SSO) | `authRoutes.js`, `middleware/auth.js`, `AuthContext.jsx`, `AuthModal.jsx`, `users` table | **Delete** |
| Lists & likes | `listRoutes.js`, `CustomListModal.jsx`, `watchlists` / `user_likes` tables | **Delete** |
| "Two-tower neural network" | `server/ml/twoTowerEngine.js`, `mlRoutes.js`, `src/utils/recommendationEngine.js` | **Delete.** It's hand-set weights plus pseudo-random features, and a reviewer reading it would count it against you |
| Couch / async modes | `MovieContext.jsx`, `TransitionScreen.jsx` | **Delete** |
| Dead components | `CinemaDashboard.jsx` (imported, never rendered), `DesktopCinemaSpotlight.jsx`, `SessionStats.jsx`, `ApiKeyModal.jsx` | **Delete** |
| Swiping-era UI | `FilterModal.jsx`, `WatchProviders.jsx`, `HistoryDrawer.jsx`, `AboutModal.jsx`, `Navbar.jsx` | **Delete or rebuild small** as needed by the new screens |
| `MovieContext.jsx` (662 lines) | | **Replace** with a small game-state store driven by server events |
| SQLite | `server/config/db.js`, `database.sqlite` | **Drop for v1.** Rooms live in memory (see §5) |
| README | `README.md` | **Rewrite.** An accurate interim README landed with M1; the polished version is M6 |
| CI + TMDB rate limit (from `main`, Aug 6) | `.github/workflows/ci.yml`, `tmdbRoutes.js` | **Kept.** CI now runs lint, server syntax check, build and a server smoke test; tests return in M2 |

## 5. Game engine design

The core idea is that **the server is the only source of truth**. Clients send intents ("I guessed X") and render whatever state the server broadcasts. Today the client tells the server which player it is and what it liked, and the server believes it. That has to go.

### Room state machine

```
lobby ──start──▶ round_intro ──3s──▶ guessing ──timer/all correct──▶ reveal ──5s──┐
  ▲                                                                                │
  └──────────── results ◀──last round── ◀───────────────── next round ◀────────────┘
```

- One `Room` object per room code, held in a `Map` on the server, with a pure `reducer(state, event) → state` at its core. Keeping it pure is what makes it unit-testable without sockets.
- Timers run **only on the server**. Clients receive `roundEndsAt` (a server timestamp) plus a clock offset measured at join, and draw the countdown locally, so a slow client can't get extra time.
- Rooms are deleted after a period of inactivity (replaces the current 12-hour SQLite cleanup).

### Players and reconnection
- Joining returns a random `playerToken`, stored in `sessionStorage`.
- On disconnect, the player is marked `away` (not removed) for a 30-second grace window. Reconnecting with the token restores their seat and score, and the server re-sends the full current state.
- If the host leaves, host passes to the next player.

### Answers and scoring
- Normalize guesses (case, punctuation, leading "the", accents) and accept small typos with a Levenshtein distance threshold scaled to title length. Accept TMDB alternative titles.
- Score = base points × time remaining, with a small bonus for first correct guess. Ties are broken by server receive time.
- Rate-limit guess events per socket to stop spamming the input.

### Anti-cheat (a good README talking point)
The client must never receive the answer before the reveal:
- Pixelated posters/stills are **generated on the server** (e.g., with `sharp`) and sent as image bytes, not as TMDB URLs. A TMDB URL or movie ID in the network tab gives the answer away.
- Round payloads contain only the clue; title, ID and year arrive in the `reveal` event.

### Scaling note (README, not v1 work)
In-memory rooms mean one server instance. Document how you'd scale: sticky sessions + the Socket.io Redis adapter + room state in Redis.

## 6. Content: clues and the movie pool

- **Pool builder:** a script that pulls TMDB popular + top-rated movies above a vote-count threshold, fetches posters, backdrops and credits, and writes a cached JSON pool. Difficulty tiers come from popularity rank (Easy = top 200, Hard = deeper cuts).
- **Pixelated poster:** pre-render 4–5 pixelation levels server-side; the round steps through them as time passes.
- **Still frame:** a TMDB backdrop, cropped to a random region that widens over time.
- **Redacted plot:** the TMDB overview with title words, cast names and character names (from credits) replaced by `█████`.
- TMDB attribution in the footer, as their terms require.

## 7. Solo mode

Same engine, room of one, so there's no second code path.
- **Quick play:** 10 rounds, mixed clue types, score at the end.
- **Daily challenge (stretch):** the same 5 movies for everyone that day (seeded by date), with a spoiler-free shareable result grid. Cheap to build on top of the engine, and very good for demos.

## 8. Hosting

The current Render free setup has two problems for a portfolio:
1. **It sleeps when idle**, so the first visitor (the reviewer) waits through a cold start.
2. **The disk is wiped on redeploy**, so SQLite data doesn't persist (this matters less once the DB is gone).

Options: an always-on paid tier on Render, Fly.io or Railway, or a scheduled ping to keep the free instance awake. Decide on cost; the requirement is just "no cold start". Serve the frontend and the socket server from the same origin through the existing nginx config, which also avoids CORS.

## 9. Security clean-up (do during milestone 1)

- `server/index.js` reflects **any** origin with `credentials: true`. Restrict to the app's own origin.
- Socket events currently trust a client-supplied `player` field. Bind identity to the socket/token on the server.
- Make sure `.env`, `server/.env` and `database.sqlite` stay out of git (they're currently ignored; keep it that way), and rotate any keys that were ever shared.
- *(Found in M1)* A TMDB API key was hardcoded in `server/routes/tmdbRoutes.js` and is in git history. It's removed from the code, but **regenerate it in your TMDB account settings**. The client also sent `VITE_TMDB_API_KEY` (embedded in the public bundle) via an `x-tmdb-key` header; the server now uses only `TMDB_READ_TOKEN` / `TMDB_API_KEY` from its own env.
- *(Found in M1)* The Dockerfile installed the frontend's dependencies instead of the server's, so the container couldn't start the API, and with no `.dockerignore` it copied `.env` files and `node_modules` into the image. Both fixed.

## 10. Engineering quality

- **TypeScript**, at least for the server and the shared event types, so client and server agree on message shapes. A shared `events.ts` is a nice thing to point at in an interview.
- **Vitest:** reducer tests for every state transition, answer-matching tests (typos, alternate titles, "The"), scoring tests.
- **Integration test:** spin up the server, connect 2–3 `socket.io-client` instances, play a full round, assert scores. Add one reconnection test.
- **CI:** GitHub Actions running lint (oxlint is already set up), typecheck, and tests on every push.
- **Small commits with real messages.** Reviewers do read history.

## 11. Milestones

Each milestone ends in a working, deployable state.

**M1: Clean slate** (≈ 1–2 days)
- [x] Work on a `pivot` branch
- [x] Delete everything marked "Delete" in §4 (plus the UI noted in the §4 update)
- [x] Fix the CORS and socket-identity issues from §9 (CORS is limited to an origin allowlist plus same-origin, WebSocket upgrades are origin-checked, and the client-trusting swipe protocol is removed)
- [x] App still builds and boots to an empty "Create / Join room" screen

**M2: Game engine** (≈ 3–5 days)
- [x] Pure room reducer + unit tests (`server/game/room.js`)
- [x] Socket layer: create/join room, start game, guess, server timers (`server/game/manager.js`, `socket.js`; the event protocol is documented at the top of `socket.js`)
- [x] Reconnection with grace window + test
- [x] Integration test of a full round
- [ ] CI green (server tests are wired into CI; passes locally, awaiting the first GitHub run)

> M2 notes: written in plain JavaScript (see open decision 1). Rounds come from a small hand-written fixture source (`server/game/questions.js`) until M3 adds TMDB clues. Beyond the plan, the engine also handles a second tab taking over a seat, per-socket guess rate limiting, and sequel numbers in answers ("Toy Story" ≠ "Toy Story 2").

**M3: Clues and content** (≈ 3–4 days)
- [x] Movie pool builder script + cached pool (`npm run build-pool`; 155 films at ≥3,000 votes, ~9 s)
- [x] Server-side pixelation for posters and stills (`server/content/images.js`, using sharp)
- [x] Redacted plot clues (`server/content/redact.js`)
- [x] Answer matching with fuzzy tolerance + tests (done in M2)

> M3 notes: each round gets one clue type from a shuffled poster/still/plot rotation. Image clues have 5 levels that unlock on a schedule *enforced by the server*: the browser gets an opaque per-round URL, and early requests get a 403. The unobscured image is served only after the reveal. The pool is cached in `server/data/` (git- and Docker-ignored, since it's TMDB data built with your credentials); without a cache the server builds it in the background at startup and uses the fixtures until it's ready. **Not done:** difficulty tiers (§6). The pool is a single tier for now.

**M4: Game UI** (≈ 4–6 days)
- [x] Lobby (code, player list, host start button, share link)
- [x] Round screen (clue, countdown, guess input, live "X got it!" feed)
- [x] Reveal and final results
- [x] Mobile-first; one frozen visual direction

> M4 notes: the visual direction is the existing home screen's (warm stone, Newsreader, Plus Jakarta Sans), recorded in PRODUCT.md and the game screens' surface brief (`.impeccable/surfaces/`). The round screen is built around a five-arc countdown dial (one arc per clue level). Players' solves show as chips that flip to ink, plus screen-reader announcements, instead of a separate text feed. Confetti was dropped: the warm, cinephile tone wanted one authored moment (the clue sharpening), not celebrations. Every screen state can be previewed with fixed sample data at `?preview=<scene>` in dev.

**M5: Solo mode** (≈ 1–2 days)
- [ ] Quick play from the landing page, no room code needed
- [ ] (Stretch) Daily challenge + share grid

**M6: Ship it** (≈ 2 days)
- [ ] Always-on hosting, single origin
- [ ] README: GIF, live link, architecture diagram, design decisions (server authority, anti-cheat, reconnection, scaling)
- [ ] Pin the repo; add it to your portfolio site/resume

Rough total: **3–4 weeks of part-time work.**

## 12. Open decisions

1. **TypeScript or not?** Recommended, but it adds friction to M1. Could be limited to the server and shared types. *(M2 stayed in JavaScript; the engine is pure functions, so converting later is mechanical.)*
2. **Hosting budget:** paid always-on instance vs. free tier + keep-alive ping.
3. **Name:** needed before the README and domain.
4. **Keep the current visual style or start fresh?** Whichever you pick, freeze it after M4.
