import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDecadeKey,
  getMovieGenreIds,
  createInitialTasteMatrix,
  updateTasteMatrix,
  calculateMatchScore,
  rankAndBalanceDeck
} from '../src/utils/recommendationEngine.js';

const mockMovie = {
  id: 100,
  title: 'Test Movie',
  genre_ids: [28, 12],
  vote_average: 8.0,
  release_date: '2022-05-10'
};

test('getDecadeKey formats release year into decade string', () => {
  assert.equal(getDecadeKey('1994-09-23'), '1990s');
  assert.equal(getDecadeKey('2023-11-15'), '2020s');
  assert.equal(getDecadeKey(null), '2020s');
});

test('getMovieGenreIds extracts genre IDs from movie object', () => {
  assert.deepEqual(getMovieGenreIds(mockMovie), [28, 12]);
  assert.deepEqual(getMovieGenreIds({ genres: [{ id: 18 }, { id: 35 }] }), [18, 35]);
});

test('updateTasteMatrix adjusts genre and decade weights on swipe', () => {
  const initial = createInitialTasteMatrix();
  const liked = updateTasteMatrix(initial, mockMovie, true);

  assert.equal(liked.likedCount, 1);
  assert.equal(liked.genreWeights[28], 2.5);
  assert.equal(liked.genreWeights[12], 2.5);
  assert.equal(liked.decadeWeights['2020s'], 1.5);
  assert.ok(liked.swipedIds.has(100));

  const passed = updateTasteMatrix(liked, { id: 101, genre_ids: [28], release_date: '2022-01-01' }, false);
  assert.equal(passed.passedCount, 1);
  assert.equal(passed.genreWeights[28], 1.75); // 2.5 - 0.75
});

test('calculateMatchScore computes score bounded between 58 and 99', () => {
  const matrix = createInitialTasteMatrix();
  matrix.likedCount = 3;
  matrix.genreWeights[28] = 5.0;

  const score = calculateMatchScore(mockMovie, matrix);
  assert.ok(typeof score === 'number');
  assert.ok(score >= 58 && score <= 99);
});

test('rankAndBalanceDeck ranks candidates and filters out already swiped movies', () => {
  const matrix = createInitialTasteMatrix();
  matrix.swipedIds.add(100);

  const candidates = [mockMovie, { id: 200, title: 'Unswiped Movie', vote_average: 8.5 }];
  const deck = rankAndBalanceDeck(candidates, matrix);

  assert.equal(deck.length, 1);
  assert.equal(deck[0].id, 200);
});
