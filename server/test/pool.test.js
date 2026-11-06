import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { toPoolEntry, buildPool, savePool, loadPool, POOL_VERSION } from '../content/pool.js';

function details(overrides = {}) {
  return {
    id: 27205,
    title: 'Inception',
    original_title: 'Inception',
    release_date: '2010-07-15',
    adult: false,
    vote_count: 40_000,
    popularity: 46,
    overview: 'A thief who steals secrets.',
    poster_path: '/poster.jpg',
    alternative_titles: {
      titles: [
        { iso_3166_1: 'US', title: 'Inception: The IMAX Experience' },
        { iso_3166_1: 'MX', title: 'El Origen' },
        { iso_3166_1: 'GB', title: 'Inception' },
      ],
    },
    images: {
      backdrops: [
        { file_path: '/text.jpg', iso_639_1: 'en', width: 3840, vote_count: 99 },
        { file_path: '/small.jpg', iso_639_1: null, width: 780, vote_count: 50 },
        { file_path: '/b.jpg', iso_639_1: null, width: 1920, vote_count: 5 },
        { file_path: '/a.jpg', iso_639_1: null, width: 3840, vote_count: 20 },
      ],
    },
    credits: {
      cast: [{ name: 'Leonardo DiCaprio', character: 'Dom Cobb' }],
      crew: [
        { name: 'Christopher Nolan', job: 'Director' },
        { name: 'Hans Zimmer', job: 'Original Music Composer' },
      ],
    },
    ...overrides,
  };
}

describe('toPoolEntry', () => {
  it('keeps what clues need', () => {
    expect(toPoolEntry(details())).toEqual({
      id: 27205,
      title: 'Inception',
      alternativeTitles: ['Inception: The IMAX Experience'],
      year: 2010,
      popularity: 46,
      voteCount: 40_000,
      overview: 'A thief who steals secrets.',
      posterPath: '/poster.jpg',
      backdropPaths: ['/a.jpg', '/b.jpg'], // textless, large enough, most voted first
      cast: [{ name: 'Leonardo DiCaprio', character: 'Dom Cobb' }],
      directors: ['Christopher Nolan'],
    });
  });

  it('accepts the original title for foreign-language films', () => {
    expect(toPoolEntry(details({ title: 'Spirited Away', original_title: '千と千尋の神隠し' })).alternativeTitles).toContain(
      '千と千尋の神隠し'
    );
  });

  it('skips adult films and films without a poster', () => {
    expect(toPoolEntry(details({ adult: true }))).toBeNull();
    expect(toPoolEntry(details({ poster_path: null }))).toBeNull();
  });
});

describe('buildPool', () => {
  function fakeClient({ failId } = {}) {
    const calls = [];
    return {
      calls,
      async get(endpoint, params) {
        calls.push([endpoint, params]);
        if (endpoint === '/movie/popular') return { results: [{ id: 1, vote_count: 9_000 }, { id: 2, vote_count: 10 }] };
        if (endpoint === '/movie/top_rated') return { results: [{ id: 1, vote_count: 9_000 }, { id: 3, vote_count: 5_000 }] };
        const id = Number(endpoint.split('/').pop());
        if (id === failId) throw new Error('boom');
        return details({ id, title: `Film ${id}`, vote_count: id * 1_000 });
      },
    };
  }

  it('merges both lists, filters by votes and de-duplicates', async () => {
    const client = fakeClient();
    const pool = await buildPool(client, { pages: 1 });
    expect(pool.version).toBe(POOL_VERSION);
    expect(pool.movies.map((m) => m.id)).toEqual([3, 1]); // id 2 has too few votes; sorted by votes
    expect(client.calls.filter(([e]) => e.startsWith('/movie/1')).length).toBe(1);
  });

  it('skips films whose details fail', async () => {
    const pool = await buildPool(fakeClient({ failId: 3 }), { pages: 1 });
    expect(pool.movies.map((m) => m.id)).toEqual([1]);
  });
});

describe('savePool / loadPool', () => {
  it('round-trips and rejects stale or old-format pools', async () => {
    const file = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'pool-')), 'nested', 'pool.json');
    const pool = { version: POOL_VERSION, builtAt: new Date(1_000_000).toISOString(), movies: [toPoolEntry(details())] };
    await savePool(file, pool);

    expect(await loadPool(file, { now: 1_000_000 })).toEqual(pool);
    expect(await loadPool(file, { now: 1_000_000 + 8 * 24 * 3600 * 1000 })).toBeNull();

    await savePool(file, { ...pool, version: POOL_VERSION - 1 });
    expect(await loadPool(file, { now: 1_000_000 })).toBeNull();
    expect(await loadPool(`${file}.missing`)).toBeNull();
  });
});
