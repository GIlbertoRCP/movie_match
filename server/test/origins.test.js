import { describe, it, expect } from 'vitest';
import { allowedOriginsFromEnv, createOriginCheck } from '../origins.js';

const req = (headers) => ({ headers });

describe('allowedOriginsFromEnv', () => {
  it('parses CLIENT_ORIGINS and Render host names', () => {
    const origins = allowedOriginsFromEnv({
      NODE_ENV: 'production',
      CLIENT_ORIGINS: 'https://game.example/, http://other.example',
      FRONTEND_URL: 'movie-match-frontend',
    });
    expect([...origins].sort()).toEqual([
      'http://other.example',
      'https://game.example',
      'https://movie-match-frontend.onrender.com',
    ]);
  });

  it('allows the Vite dev server outside production only', () => {
    expect(allowedOriginsFromEnv({}).has('http://localhost:5173')).toBe(true);
    expect(allowedOriginsFromEnv({ NODE_ENV: 'production' }).size).toBe(0);
  });
});

describe('createOriginCheck', () => {
  const check = createOriginCheck(new Set(['https://game.example']));

  it('allows listed origins and requests without an origin', () => {
    expect(check(req({ origin: 'https://game.example' }))).toBe(true);
    expect(check(req({}))).toBe(true);
  });

  it('allows same-origin requests behind a proxy', () => {
    expect(check(req({ origin: 'https://play.example', host: 'play.example' }))).toBe(true);
  });

  it('refuses other origins and junk', () => {
    expect(check(req({ origin: 'https://evil.example', host: 'game.example' }))).toBe(false);
    expect(check(req({ origin: 'not a url', host: 'game.example' }))).toBe(false);
    expect(check(req({ origin: 'https://evil.example' }))).toBe(false);
  });
});
