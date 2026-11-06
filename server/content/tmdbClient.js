// Minimal TMDB v3 client for server-side content building.
// Credentials come only from the server's environment.

const API_BASE = 'https://api.themoviedb.org/3';
export const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export function createTmdbClient({
  readToken = process.env.TMDB_READ_TOKEN,
  apiKey = process.env.TMDB_API_KEY,
  fetchImpl = fetch,
  maxRetries = 3,
} = {}) {
  if (!readToken && !apiKey) return null;

  async function get(path, params = {}) {
    const search = new URLSearchParams({ language: 'en-US', ...params });
    const headers = {};
    if (readToken) headers.Authorization = `Bearer ${readToken}`;
    else search.set('api_key', apiKey);

    for (let attempt = 0; ; attempt++) {
      const res = await fetchImpl(`${API_BASE}${path}?${search}`, { headers });
      if (res.ok) return res.json();
      // Back off on rate limiting and transient server errors.
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        const retryAfter = Number(res.headers.get?.('retry-after')) || 2 ** attempt;
        await new Promise((r) => setTimeout(r, retryAfter * 1_000));
        continue;
      }
      throw new Error(`TMDB ${path} failed: HTTP ${res.status}`);
    }
  }

  return { get };
}

export async function fetchImage(path, size, fetchImpl = fetch) {
  const res = await fetchImpl(`${IMAGE_BASE}/${size}${path}`);
  if (!res.ok) throw new Error(`TMDB image ${size}${path} failed: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
