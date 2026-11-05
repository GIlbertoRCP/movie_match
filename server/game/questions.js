// Question sources. A question is:
//   { id, title, alternativeTitles, year, clue: { type, ... } }
//
// Milestone 3 adds a TMDB-backed source with poster/still/plot clues. Until
// then, this fixture source (one-line descriptions written for this project)
// keeps the engine playable end to end and gives tests stable data.

const FIXTURE_QUESTIONS = [
  ['inception', 'Inception', [], 2010, "A thief who steals secrets from inside people's dreams is offered one last job: planting an idea instead."],
  ['jurassic-park', 'Jurassic Park', [], 1993, "A billionaire's island park of cloned dinosaurs goes badly wrong during a weekend preview tour."],
  ['the-matrix', 'The Matrix', [], 1999, 'A hacker learns his world is a simulation and joins a rebellion against the machines running it.'],
  ['finding-nemo', 'Finding Nemo', [], 2003, 'An anxious clownfish crosses the ocean to find his son, helped by a very forgetful blue fish.'],
  ['toy-story', 'Toy Story', [], 1995, "A cowboy doll feels replaced when a flashy space-ranger figure becomes his kid's new favourite."],
  ['back-to-the-future', 'Back to the Future', [], 1985, 'A teenager is sent thirty years into the past in a time-travelling car and must get his parents together.'],
  ['the-lion-king', 'The Lion King', [], 1994, "A young prince flees his kingdom after his father's death, then returns to face his uncle."],
  ['jaws', 'Jaws', [], 1975, 'A beach-town police chief, a scientist and a fisherman go to sea to hunt a giant shark.'],
  ['spirited-away', 'Spirited Away', ['Sen to Chihiro no Kamikakushi'], 2001, 'A girl stuck in a world of spirits works at a bathhouse to save her parents, who have been turned into pigs.'],
  ['the-godfather', 'The Godfather', [], 1972, 'The ageing head of a crime family hands control to his reluctant youngest son.'],
  ['up', 'Up', [], 2009, 'A widower ties thousands of balloons to his house to fly to South America, with a young scout accidentally aboard.'],
  ['wall-e', 'WALL·E', ['Wall-E', 'Walle'], 2008, 'A small trash-compacting robot left alone on Earth falls for a sleek probe sent to look for plant life.'],
].map(([id, title, alternativeTitles, year, text]) => ({
  id,
  title,
  alternativeTitles,
  year,
  clue: { type: 'plot', text },
}));

function shuffled(items, random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createFixtureQuestionSource({ questions = FIXTURE_QUESTIONS, random = Math.random } = {}) {
  return {
    async pick(count) {
      return shuffled(questions, random).slice(0, Math.min(count, questions.length));
    },
  };
}

export { FIXTURE_QUESTIONS };
