import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractMovieEmbedding,
  buildUserEmbedding,
  updateOnlineUserVector,
  rankMovieWithDeepMLP,
  processTwoTowerRecommendations
} from '../server/ml/twoTowerEngine.js';

const mockMovieA = {
  id: 550,
  title: 'Fight Club',
  genre_ids: [28, 18], // Action, Drama
  vote_average: 8.4,
  vote_count: 24000,
  popularity: 65.5,
  release_date: '1999-10-15'
};

const mockMovieB = {
  id: 27205,
  title: 'Inception',
  genre_ids: [28, 878, 12], // Action, Sci-Fi, Adventure
  vote_average: 8.3,
  vote_count: 34000,
  popularity: 95.2,
  release_date: '2010-07-16'
};

const mockMovieC = {
  id: 12,
  title: 'Finding Nemo',
  genre_ids: [16, 10751], // Animation, Family
  vote_average: 7.8,
  vote_count: 18000,
  popularity: 45.0,
  release_date: '2003-05-30'
};

test('extractMovieEmbedding returns a 64-dimensional normalized vector', () => {
  const embed = extractMovieEmbedding(mockMovieA);
  assert.equal(Array.isArray(embed), true);
  assert.equal(embed.length, 64);
  
  // Check genre indices (28 -> Action index 0, 18 -> Drama index 6)
  assert.equal(embed[0], 1.0);
  assert.equal(embed[6], 1.0);

  // Check normalized rating (8.4 / 10 = 0.84)
  assert.ok(Math.abs(embed[18] - 0.84) < 0.0001);

  // Check decade index for 1999 (90s era index 24)
  assert.equal(embed[24], 1.0);
});

test('buildUserEmbedding constructs weighted normalized user preference vector', () => {
  const userVec = buildUserEmbedding([mockMovieA], [mockMovieC]);
  assert.equal(Array.isArray(userVec), true);
  assert.equal(userVec.length, 64);

  // Calculate L2 magnitude to verify unit normalization
  const mag = Math.sqrt(userVec.reduce((sum, val) => sum + val * val, 0));
  assert.ok(Math.abs(mag - 1.0) < 0.0001, `Magnitude should be ~1.0, got ${mag}`);
});

test('updateOnlineUserVector updates user vector dynamically on swipe event', () => {
  const initialVec = new Array(64).fill(0.5);
  const movieEmbed = extractMovieEmbedding(mockMovieB);

  // Apply online learning update for a liked swipe
  const updatedVec = updateOnlineUserVector(initialVec, movieEmbed, true, 0.2);
  assert.equal(updatedVec.length, 64);

  // Verify vector updated and remained unit normalized
  const mag = Math.sqrt(updatedVec.reduce((sum, val) => sum + val * val, 0));
  assert.ok(Math.abs(mag - 1.0) < 0.0001);
  assert.notDeepEqual(updatedVec, initialVec);
});

test('rankMovieWithDeepMLP returns probability and bounded match score', () => {
  const userVec = buildUserEmbedding([mockMovieA], []);
  const movieEmbed = extractMovieEmbedding(mockMovieA);

  const result = rankMovieWithDeepMLP(userVec, movieEmbed);
  assert.ok(result.probability >= 0 && result.probability <= 1.0);
  assert.ok(result.matchPercentage >= 60 && result.matchPercentage <= 99);
});

test('processTwoTowerRecommendations ranks candidates by predicted match score', () => {
  const candidates = [mockMovieA, mockMovieB, mockMovieC];
  const ranked = processTwoTowerRecommendations(candidates, [mockMovieA], []);

  assert.equal(ranked.length, 3);
  assert.ok(ranked[0].matchScore >= ranked[1].matchScore);
  assert.ok(ranked[1].matchScore >= ranked[2].matchScore);
});
