// Which browser origins may call the API or open a socket.

// Render's `host` property can be a bare hostname or a short service name.
function toOrigin(value) {
  const trimmed = value.trim().replace(/\/$/, '');
  if (!trimmed) return null;
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  const host = trimmed.includes('.') ? trimmed : `${trimmed}.onrender.com`;
  return `https://${host}`;
}

// CLIENT_ORIGINS: comma-separated full origins. FRONTEND_URL: Render host.
export function allowedOriginsFromEnv(env = process.env) {
  const origins = new Set(
    [...(env.CLIENT_ORIGINS || '').split(','), env.FRONTEND_URL || ''].map(toOrigin).filter(Boolean)
  );
  if (env.NODE_ENV !== 'production') {
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:5173');
  }
  return origins;
}

// Allowed: no Origin header (same-origin GETs, curl, health checks, non-browser
// clients), a listed origin, or a same-origin request (Origin host matches the
// Host it was sent to, as when nginx serves the frontend and proxies the API).
export function createOriginCheck(allowedOrigins) {
  return (req) => {
    const { origin, host } = req.headers;
    if (!origin || allowedOrigins.has(origin)) return true;
    try {
      return Boolean(host) && new URL(origin).host === host;
    } catch {
      return false;
    }
  };
}
