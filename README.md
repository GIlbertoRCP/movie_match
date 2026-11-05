# Movie Match

[![CI](https://github.com/GIlbertoRCP/movie_match/actions/workflows/ci.yml/badge.svg)](https://github.com/GIlbertoRCP/movie_match/actions/workflows/ci.yml)

A live multiplayer movie guessing game, currently being rebuilt. Create a room, share the code, and race your friends to name the movie from a pixelated poster, a single still, or a plot summary with the names blanked out.

> **Status:** mid-pivot. Milestones 1 (clean slate) and 2 (game engine) are done: the server runs complete multiplayer games over Socket.io, and the game screens arrive in milestone 4. The full plan, scope and milestones are in [docs/PIVOT_PLAN.md](docs/PIVOT_PLAN.md).

## How the game server works

- **The server is the only source of truth.** Each room is driven by a pure reducer (`server/game/room.js`): every change is `reduce(state, event)` with the time passed in, so the whole game is unit-tested without sockets or timers.
- **Timers live on the server.** Clients get `phaseEndsAt` and `serverNow` and draw the countdown locally, so a slow or tampered client can't buy extra time.
- **No answers on the wire.** Clients receive a projection of the room that never includes the answer before the reveal, or any future round.
- **Identity is server-assigned.** A socket's room and player come from create/join/resume, never from fields in a message.
- **Reconnects keep your seat.** A dropped player keeps their seat and score for 30 seconds and can resume with a session token; opening a second tab moves the seat there.

The event protocol is documented at the top of `server/game/socket.js`.

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4
- **Server:** Node.js, Express, Socket.io
- **Data:** [TMDB](https://www.themoviedb.org/) through a cached, rate-limited server proxy; the client never holds a TMDB key

## Run it locally

Requires Node.js 20+ and a TMDB API read access token.

```bash
npm install
(cd server && npm install)
```

Create `server/.env`:

```
TMDB_READ_TOKEN=your_tmdb_read_access_token
```

Then run the server and the frontend in two terminals:

```bash
cd server && node index.js     # http://localhost:5001
npm run dev                    # http://localhost:5173
```

Run the tests (unit tests plus real-socket integration tests):

```bash
npm test
```

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `TMDB_READ_TOKEN` (or `TMDB_API_KEY`) | server | TMDB credentials |
| `PORT` | server | Defaults to `5001` |
| `CLIENT_ORIGINS` | server | Comma-separated origins allowed to call the API and open sockets. Localhost:5173 is allowed outside production; same-origin requests are always allowed |
| `FRONTEND_URL` | server | Render's frontend host; added to the allowed origins |
| `VITE_BACKEND_URL` | frontend | API base URL when the API is on a different host |

## Deploy

- **Docker:** a single image runs nginx (frontend + reverse proxy) and the API: `docker build -t movie-match .` then `docker run -p 8080:80 -e TMDB_READ_TOKEN=... movie-match`.
- **Render:** `render.yaml` defines the API and static frontend services. Set `TMDB_READ_TOKEN` in the dashboard.

---

This product uses the TMDB API but is not endorsed or certified by TMDB.
