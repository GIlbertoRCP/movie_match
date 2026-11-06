// Image clues, rendered on the server so the browser only ever receives the
// degraded picture — never a TMDB URL or the original image.
//
//   poster: pixelated, getting sharper with each level
//   still:  a textless backdrop, cropped around a focus point and widening
//
// Level `levels` is the unobscured image, served only after the reveal.

import sharp from 'sharp';
import { fetchImage } from './tmdbClient.js';

export const CLUE_LEVELS = 5;

// Poster: width in "pixels" of the mosaic at each level (then scaled back up).
const POSTER_MOSAIC_WIDTHS = [6, 10, 16, 26, 40];
const POSTER_OUTPUT_WIDTH = 342;

// Still: share of the frame (by width) shown at each level.
const STILL_CROP_FRACTIONS = [0.16, 0.26, 0.4, 0.6, 0.82];
const STILL_OUTPUT_WIDTH = 780;

const JPEG = { quality: 80, mozjpeg: true };

class LruCache {
  constructor(max) {
    this.max = max;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }
  set(key, value) {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value);
  }
  delete(key) {
    this.map.delete(key);
  }
}

export async function renderPoster(source, level) {
  const image = sharp(source);
  if (level >= POSTER_MOSAIC_WIDTHS.length) {
    return image.resize({ width: POSTER_OUTPUT_WIDTH }).jpeg(JPEG).toBuffer();
  }
  const { width, height } = await image.metadata();
  const mosaicWidth = POSTER_MOSAIC_WIDTHS[level];
  const mosaicHeight = Math.max(1, Math.round((height / width) * mosaicWidth));
  const tiny = await sharp(source).resize(mosaicWidth, mosaicHeight, { fit: 'fill' }).toBuffer();
  const outputHeight = Math.round((height / width) * POSTER_OUTPUT_WIDTH);
  return sharp(tiny)
    .resize(POSTER_OUTPUT_WIDTH, outputHeight, { fit: 'fill', kernel: sharp.kernel.nearest })
    .jpeg(JPEG)
    .toBuffer();
}

// `focus` is { x, y } in 0..1: the centre of the crop.
export async function renderStill(source, level, focus = { x: 0.5, y: 0.5 }) {
  const image = sharp(source);
  const { width, height } = await image.metadata();
  const fraction = level >= STILL_CROP_FRACTIONS.length ? 1 : STILL_CROP_FRACTIONS[level];
  const cropWidth = Math.max(1, Math.round(width * fraction));
  const cropHeight = Math.max(1, Math.round(height * fraction));
  const clamp = (value, max) => Math.min(Math.max(0, Math.round(value)), max);
  const left = clamp(focus.x * width - cropWidth / 2, width - cropWidth);
  const top = clamp(focus.y * height - cropHeight / 2, height - cropHeight);
  return image
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize({ width: STILL_OUTPUT_WIDTH })
    .jpeg(JPEG)
    .toBuffer();
}

// Fetches source images from TMDB and caches both sources and renders.
// Concurrent requests for the same image share one fetch/render.
export function createClueRenderer({ loadImage = fetchImage, sourceCacheSize = 40, renderCacheSize = 300 } = {}) {
  const sources = new LruCache(sourceCacheSize);
  const renders = new LruCache(renderCacheSize);

  function cached(cache, key, produce) {
    let promise = cache.get(key);
    if (!promise) {
      promise = produce();
      cache.set(key, promise);
      promise.catch(() => cache.delete(key)); // don't cache failures
    }
    return promise;
  }

  return {
    render(clue, level) {
      if (clue.type === 'poster') {
        const source = () => cached(sources, `w500${clue.imagePath}`, () => loadImage(clue.imagePath, 'w500'));
        return cached(renders, `poster:${clue.imagePath}:${level}`, async () => renderPoster(await source(), level));
      }
      if (clue.type === 'still') {
        const { x, y } = clue.focus;
        const source = () => cached(sources, `w1280${clue.imagePath}`, () => loadImage(clue.imagePath, 'w1280'));
        return cached(renders, `still:${clue.imagePath}:${x}:${y}:${level}`, async () =>
          renderStill(await source(), level, clue.focus)
        );
      }
      return Promise.reject(new Error(`No image for clue type ${clue.type}`));
    },
  };
}
