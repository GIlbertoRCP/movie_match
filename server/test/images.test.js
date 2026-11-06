import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import { renderPoster, renderStill, createClueRenderer, CLUE_LEVELS } from '../content/images.js';

// A synthetic "poster": a smooth gradient, so any pixelation shows up as flat blocks.
async function gradient(width, height) {
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      raw[i] = Math.round((x / width) * 255);
      raw[i + 1] = Math.round((y / height) * 255);
      raw[i + 2] = 128;
    }
  }
  return sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
}

// Red-channel spread across a horizontal window of the middle row: ~0 inside a
// flat mosaic block, large where the gradient is still continuous.
async function spread(jpeg, fromX, toX) {
  const { data, info } = await sharp(jpeg).raw().toBuffer({ resolveWithObject: true });
  const row = Math.floor(info.height / 2);
  const reds = [];
  for (let x = fromX; x < toX; x++) reds.push(data[(row * info.width + x) * info.channels]);
  return Math.max(...reds) - Math.min(...reds);
}

let poster;
let backdrop;
beforeAll(async () => {
  poster = await gradient(500, 750);
  backdrop = await gradient(1280, 720);
});

describe('renderPoster', () => {
  it('outputs a 342px-wide JPEG at every level, keeping the aspect ratio', async () => {
    for (let level = 0; level <= CLUE_LEVELS; level++) {
      const meta = await sharp(await renderPoster(poster, level)).metadata();
      expect(meta).toMatchObject({ format: 'jpeg', width: 342, height: 513 });
    }
  });

  it('is a coarse mosaic at level 0 and unobscured at the reveal level', async () => {
    // Level 0 is 6 mosaic columns, ~57px each: the interior of the first block is flat.
    expect(await spread(await renderPoster(poster, 0), 10, 45)).toBeLessThanOrEqual(8);
    // The same window of the full image still shows the gradient.
    expect(await spread(await renderPoster(poster, CLUE_LEVELS), 10, 45)).toBeGreaterThan(18);
  });

  it('gets sharper with each level', async () => {
    // Count plateaus (runs of near-equal pixels) across the middle row: smaller
    // mosaic blocks mean more of them. Tolerant of JPEG ringing at block edges.
    async function plateaus(jpeg) {
      const { data, info } = await sharp(jpeg).raw().toBuffer({ resolveWithObject: true });
      const offset = Math.floor(info.height / 2) * info.width * info.channels;
      let runs = 1;
      let start = data[offset];
      for (let x = 1; x < info.width; x++) {
        const value = data[offset + x * info.channels];
        if (Math.abs(value - start) > 4) {
          runs++;
          start = value;
        }
      }
      return runs;
    }
    const detail = [];
    for (let level = 0; level <= CLUE_LEVELS; level++) detail.push(await plateaus(await renderPoster(poster, level)));
    for (let i = 1; i < detail.length; i++) expect(detail[i]).toBeGreaterThanOrEqual(detail[i - 1]);
    expect(detail[CLUE_LEVELS]).toBeGreaterThan(detail[0] * 2);
  });
});

describe('renderStill', () => {
  it('crops around the focus and widens with each level', async () => {
    const means = [];
    for (let level = 0; level <= CLUE_LEVELS; level++) {
      const out = await renderStill(backdrop, level, { x: 0.25, y: 0.5 });
      const meta = await sharp(out).metadata();
      expect(meta).toMatchObject({ format: 'jpeg', width: 780 });
      expect(Math.abs(meta.height - 439)).toBeLessThanOrEqual(2); // 16:9, give or take crop rounding
      means.push((await sharp(out).stats()).channels[0].mean); // red = x position in the gradient
    }
    // A tight crop around x=25% is mostly low-red; wider crops approach the full-frame mean.
    expect(means[0]).toBeLessThan(80);
    expect(means[CLUE_LEVELS]).toBeGreaterThan(110);
  });

  it('keeps the crop inside the frame for focus points near an edge', async () => {
    const meta = await sharp(await renderStill(backdrop, 0, { x: 0, y: 1 })).metadata();
    expect(meta.width).toBe(780);
  });
});

describe('createClueRenderer', () => {
  it('fetches each source once and caches renders', async () => {
    const loads = [];
    const renderer = createClueRenderer({
      loadImage: async (imagePath, size) => {
        loads.push(`${size}${imagePath}`);
        return poster;
      },
    });
    const clue = { type: 'poster', imagePath: '/p.jpg', levels: CLUE_LEVELS };
    const [a, b] = await Promise.all([renderer.render(clue, 0), renderer.render(clue, 0)]);
    await renderer.render(clue, 1);
    expect(a).toBe(b);
    expect(loads).toEqual(['w500/p.jpg']);
  });

  it('retries after a failed fetch instead of caching the failure', async () => {
    let attempts = 0;
    const renderer = createClueRenderer({
      loadImage: async () => {
        attempts++;
        if (attempts === 1) throw new Error('network');
        return backdrop;
      },
    });
    const clue = { type: 'still', imagePath: '/b.jpg', focus: { x: 0.5, y: 0.5 }, levels: CLUE_LEVELS };
    await expect(renderer.render(clue, 0)).rejects.toThrow('network');
    await expect(renderer.render(clue, 0)).resolves.toBeInstanceOf(Buffer);
  });

  it('rejects clue types without images', async () => {
    await expect(createClueRenderer().render({ type: 'plot', text: 'x' }, 0)).rejects.toThrow();
  });
});
