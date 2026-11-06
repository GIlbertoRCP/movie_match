import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { createContentSource } from '../content/source.js';
import { savePool, loadPool, POOL_VERSION } from '../content/pool.js';

const quiet = () => {};
const tempFile = async () => path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'source-')), 'pool.json');

const entry = (id) => ({
  id,
  title: `Film ${id}`,
  alternativeTitles: [],
  year: 2000,
  popularity: 1,
  voteCount: 9_000,
  overview: 'A skilled thief who steals corporate secrets from inside dreams is offered one final job.',
  posterPath: `/p${id}.jpg`,
  backdropPaths: [],
  cast: [],
  directors: [],
});

const details = (id) => ({
  id,
  title: `Film ${id}`,
  original_title: `Film ${id}`,
  release_date: '2000-01-01',
  vote_count: 9_000,
  overview: entry(id).overview,
  poster_path: `/p${id}.jpg`,
});

describe('createContentSource', () => {
  it('uses the fixtures when there is no cache and no TMDB client', async () => {
    const source = createContentSource({ poolFile: await tempFile(), client: null, log: quiet });
    await source.ready;
    expect(source.kind()).toBe('fixtures');
    expect((await source.pick(3)).length).toBe(3);
  });

  it('uses a fresh cached pool', async () => {
    const file = await tempFile();
    await savePool(file, { version: POOL_VERSION, builtAt: new Date().toISOString(), movies: [entry(1), entry(2)] });
    const source = createContentSource({ poolFile: file, client: null, log: quiet });
    await source.ready;
    expect(source.kind()).toBe('tmdb');
    expect((await source.pick(5)).map((q) => q.title).sort()).toEqual(['Film 1', 'Film 2']);
  });

  it('builds, caches and switches to the TMDB pool in the background', async () => {
    const file = await tempFile();
    const client = {
      async get(endpoint) {
        if (endpoint.startsWith('/movie/popular') || endpoint.startsWith('/movie/top_rated')) {
          return { results: [{ id: 7, vote_count: 9_000 }] };
        }
        return details(7);
      },
    };
    const source = createContentSource({ poolFile: file, client, buildOptions: { pages: 1 }, log: quiet });
    expect(source.kind()).toBe('fixtures'); // playable immediately
    await source.ready;
    expect(source.kind()).toBe('tmdb');
    expect((await loadPool(file)).movies.map((m) => m.id)).toEqual([7]);
  });

  it('stays on the fixtures if the build fails', async () => {
    const client = { get: async () => { throw new Error('offline'); } };
    const source = createContentSource({ poolFile: await tempFile(), client, buildOptions: { pages: 1 }, log: quiet });
    await source.ready;
    expect(source.kind()).toBe('fixtures');
  });
});
