// Turns the TMDB movie pool into game questions with a mix of clue types.

import { shuffled } from '../game/questions.js';
import { plotClueFor } from './redact.js';
import { CLUE_LEVELS } from './images.js';

export const CLUE_TYPES = ['poster', 'still', 'plot'];

// Builds a clue of `type` for `movie`, or null if the film can't support it.
export function clueFor(type, movie, random = Math.random) {
  switch (type) {
    case 'poster':
      return movie.posterPath ? { type, imagePath: movie.posterPath, levels: CLUE_LEVELS } : null;
    case 'still': {
      if (!movie.backdropPaths?.length) return null;
      // Focus somewhere in the middle 50% so the first crop isn't just a border.
      const around = () => Math.round((0.25 + random() * 0.5) * 100) / 100;
      return {
        type,
        imagePath: movie.backdropPaths[Math.floor(random() * movie.backdropPaths.length)],
        focus: { x: around(), y: around() },
        levels: CLUE_LEVELS,
      };
    }
    case 'plot':
      return plotClueFor(movie);
    default:
      return null;
  }
}

export function createTmdbQuestionSource({ pool, random = Math.random, clueTypes = CLUE_TYPES } = {}) {
  if (!pool?.movies?.length) throw new Error('createTmdbQuestionSource needs a non-empty pool');

  return {
    size: pool.movies.length,
    async pick(count) {
      // A shuffled rotation of clue types keeps every game mixed; a film that
      // can't support its turn's type falls back to the next one.
      const rotation = shuffled(clueTypes, random);
      const questions = [];
      for (const movie of shuffled(pool.movies, random)) {
        if (questions.length >= count) break;
        const preferred = rotation[questions.length % rotation.length];
        const order = [preferred, ...rotation.filter((t) => t !== preferred)];
        for (const type of order) {
          const clue = clueFor(type, movie, random);
          if (!clue) continue;
          questions.push({
            id: `tmdb-${movie.id}`,
            title: movie.title,
            alternativeTitles: movie.alternativeTitles,
            year: movie.year,
            posterPath: movie.posterPath,
            clue,
          });
          break;
        }
      }
      return questions;
    },
  };
}
