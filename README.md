# Movie Match

[![CI](https://github.com/GIlbertoRCP/movie_match/actions/workflows/ci.yml/badge.svg)](https://github.com/GIlbertoRCP/movie_match/actions/workflows/ci.yml)

A live multiplayer movie guessing game, currently being rebuilt. Create a room, share the code, and race your friends to name the movie from a pixelated poster, a single still, or a plot summary with the names blanked out.

> **Status:** mid-pivot. Milestone 1 (clean slate) is done: the app boots to a Create / Join room screen, and the game engine arrives in milestone 2. The full plan, scope and milestones are in [docs/PIVOT_PLAN.md](docs/PIVOT_PLAN.md).

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
