import { BACKEND_API } from '../config';

const BACKEND_TMDB_PROXY = `${BACKEND_API}/tmdb`;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
export const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
export const TMDB_LOGO_BASE = 'https://image.tmdb.org/t/p/w92';

export const TMDB_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];

export const REGIONS = [
  { code: 'US', name: 'United States 🇺🇸' },
  { code: 'GB', name: 'United Kingdom 🇬🇧' },
  { code: 'CA', name: 'Canada 🇨🇦' },
  { code: 'AU', name: 'Australia 🇦🇺' },
  { code: 'DE', name: 'Germany 🇩🇪' },
  { code: 'FR', name: 'France 🇫🇷' },
  { code: 'MX', name: 'Mexico 🇲🇽' },
  { code: 'ES', name: 'Spain 🇪🇸' }
];

export const PRESET_PACKS = [
  {
    id: 'nolan',
    title: 'Christopher Nolan Masterpieces',
    description: 'Mind-bending epics from Inception to Oppenheimer and Interstellar.',
    icon: '🧠',
    color: 'from-purple-600 to-indigo-600',
    movieIds: [157336, 27205, 155, 872585, 550, 49026]
  },
  {
    id: 'scifi',
    title: 'Sci-Fi & Cyberpunk Epics',
    description: 'Dune, The Matrix, Interstellar, Spider-Verse, and futuristic classics.',
    icon: '🚀',
    color: 'from-blue-600 to-cyan-600',
    movieIds: [438631, 693134, 157336, 27205, 603, 569094, 324857]
  },
  {
    id: 'marvel',
    title: 'Superhero & Multiverse Saga',
    description: 'Avengers, Spider-Verse, The Dark Knight, and The Batman.',
    icon: '⚡',
    color: 'from-rose-600 to-amber-600',
    movieIds: [299536, 569094, 324857, 155, 414906]
  },
  {
    id: 'animation',
    title: 'Animation & Studio Ghibli / Pixar',
    description: 'Spirited Away, Your Name, Soul, Puss in Boots, and Spider-Verse.',
    icon: '🎨',
    color: 'from-emerald-600 to-teal-600',
    movieIds: [129, 372058, 508442, 315162, 569094, 508947]
  },
  {
    id: 'mystery',
    title: 'Mind Games & Crime Mysteries',
    description: 'Knives Out, Parasite, Fight Club, The Batman, and Inception.',
    icon: '🕵️',
    color: 'from-violet-600 to-purple-800',
    movieIds: [546554, 496243, 550, 414906, 27205]
  }
];

export const MOCK_MOVIES = [
  {
    id: 550,
    title: "Fight Club",
    poster_path: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/hZkgoQY85KGWFToRrm8AosWwvXW.jpg",
    overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
    vote_average: 8.4,
    release_date: "1999-10-15",
    genre_ids: [18, 53, 35],
    genres: ["Drama", "Thriller", "Comedy"],
    runtime: 139,
    tagline: "Mischief. Mayhem. Soap."
  },
  {
    id: 157336,
    title: "Interstellar",
    poster_path: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsX2P.jpg",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
    vote_average: 8.4,
    release_date: "2014-11-05",
    genre_ids: [12, 18, 878],
    genres: ["Adventure", "Drama", "Sci-Fi"],
    runtime: 169,
    tagline: "Mankind was born on Earth. It was never meant to die here."
  },
  {
    id: 27205,
    title: "Inception",
    poster_path: "https://image.tmdb.org/t/p/w500/oYuLE1h2CVCdCG2B8mo9GlqsEd1.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAiaw.jpg",
    overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets.",
    vote_average: 8.4,
    release_date: "2010-07-15",
    genre_ids: [28, 878, 12],
    genres: ["Action", "Sci-Fi", "Adventure"],
    runtime: 148,
    tagline: "Your mind is the scene of the crime."
  },
  {
    id: 299536,
    title: "Avengers: Infinity War",
    poster_path: "https://image.tmdb.org/t/p/w500/7WsyChLLEzcqIFv2VwMvyDhWSt.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/mdf90Bbg3t9yR39e24L1k4aFp3j.jpg",
    overview: "As the Avengers and their allies have continued to protect the world, a new danger has emerged: Thanos.",
    vote_average: 8.3,
    release_date: "2018-04-25",
    genre_ids: [12, 28, 878],
    genres: ["Adventure", "Action", "Sci-Fi"],
    runtime: 149,
    tagline: "An entire universe. Once decision."
  },
  {
    id: 414906,
    title: "The Batman",
    poster_path: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
    overview: "In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family.",
    vote_average: 7.7,
    release_date: "2022-03-01",
    genre_ids: [80, 9648, 53],
    genres: ["Crime", "Mystery", "Thriller"],
    runtime: 176,
    tagline: "Unmask the truth."
  },
  {
    id: 438631,
    title: "Dune",
    poster_path: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94WAgMIckC.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/eeijXLZ92At0wqviOhsOizvlWoi.jpg",
    overview: "Paul Atreides must travel to the most dangerous planet in the universe to ensure the future of his family.",
    vote_average: 7.8,
    release_date: "2021-09-15",
    genre_ids: [878, 12],
    genres: ["Sci-Fi", "Adventure"],
    runtime: 155,
    tagline: "It begins."
  },
  {
    id: 693134,
    title: "Dune: Part Two",
    poster_path: "https://image.tmdb.org/t/p/w500/1pdfLPoVxftKu9c0TChrU1hflLh.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/xOM08Go8DFmknBToeaKGXhNM2v8.jpg",
    overview: "Paul Atreides unites with Chani and the Fremen while on a path of revenge against the conspirators.",
    vote_average: 8.5,
    release_date: "2024-02-27",
    genre_ids: [878, 12],
    genres: ["Sci-Fi", "Adventure"],
    runtime: 166,
    tagline: "Long live the fighters."
  },
  {
    id: 372058,
    title: "Your Name.",
    poster_path: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/dIWwZW7dJJtqC6C92fA0RCF9Lfr.jpg",
    overview: "High schoolers Mitsuha and Taki are complete strangers living separate lives until they switch places.",
    vote_average: 8.5,
    release_date: "2016-08-26",
    genre_ids: [16, 10749, 18, 14],
    genres: ["Animation", "Romance", "Drama", "Fantasy"],
    runtime: 106,
    tagline: "Treasure the experience."
  },
  {
    id: 546554,
    title: "Knives Out",
    poster_path: "https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x8WwYs2BClq.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/Ab8mtKAzvWwa22COGd0edYEeeUZ.jpg",
    overview: "When renowned crime novelist Harlan Thrombey is found dead, Detective Benoit Blanc investigates.",
    vote_average: 7.9,
    release_date: "2019-11-27",
    genre_ids: [35, 80, 9648],
    genres: ["Comedy", "Crime", "Mystery"],
    runtime: 130,
    tagline: "Everyone has a motive. No one has a clue."
  },
  {
    id: 872585,
    title: "Oppenheimer",
    poster_path: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGvC27vKDvI.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/fm6K8O2w9yB9Rya9b5wB25D1K35.jpg",
    overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    vote_average: 8.1,
    release_date: "2023-07-19",
    genre_ids: [18, 36],
    genres: ["Drama", "History"],
    runtime: 180,
    tagline: "The world forever changes."
  },
  {
    id: 508442,
    title: "Soul",
    poster_path: "https://image.tmdb.org/t/p/w500/hm58W8LOK2QqI8dWvptx92i4xKG.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/kf456ZQEW45XTvo6Wzjo5xQI5vB.jpg",
    overview: "Joe Gardner gets the chance of a lifetime to play at the best jazz club in town, but one small misstep takes him to The Great Before.",
    vote_average: 8.1,
    release_date: "2020-12-25",
    genre_ids: [16, 35, 14, 10751],
    genres: ["Animation", "Comedy", "Fantasy", "Family"],
    runtime: 100,
    tagline: "Is all this living really worth dying for?"
  },
  {
    id: 603,
    title: "The Matrix",
    poster_path: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/icBv25UfQ3mJj62L3o6Bw2hNf0j.jpg",
    overview: "A computer hacker joins a group of underground insurgents fighting the vast computers who rule the earth.",
    vote_average: 8.2,
    release_date: "1999-03-30",
    genre_ids: [28, 878],
    genres: ["Action", "Sci-Fi"],
    runtime: 136,
    tagline: "Welcome to the Real World."
  },
  {
    id: 155,
    title: "The Dark Knight",
    poster_path: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/dq2f8Nn5a5D4A9tP3N9K4x3kX5c.jpg",
    overview: "Batman raises the stakes in his war on crime while facing the chaotic criminal mastermind known as the Joker.",
    vote_average: 8.5,
    release_date: "2008-07-16",
    genre_ids: [18, 28, 80, 53],
    genres: ["Drama", "Action", "Crime", "Thriller"],
    runtime: 152,
    tagline: "Welcome to a world without rules."
  },
  {
    id: 569094,
    title: "Spider-Man: Across the Spider-Verse",
    poster_path: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj7sfs8.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/4H2Fj946xK8w2xY77dM9R0O8eW3.jpg",
    overview: "Miles Morales is catapulted across the Multiverse, where he encounters a team of Spider-People.",
    vote_average: 8.4,
    release_date: "2023-05-31",
    genre_ids: [16, 28, 12, 878],
    genres: ["Animation", "Action", "Adventure", "Sci-Fi"],
    runtime: 140,
    tagline: "With more power comes more responsibility."
  },
  {
    id: 129,
    title: "Spirited Away",
    poster_path: "https://image.tmdb.org/t/p/w500/39wmItE2ABv21YOD9OfH1L7qBvF.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/39wmItE2ABv21YOD9OfH1L7qBvF.jpg",
    overview: "A young girl becomes trapped in a strange new world of spirits and must call upon her courage.",
    vote_average: 8.5,
    release_date: "2001-07-20",
    genre_ids: [16, 14, 10751],
    genres: ["Animation", "Fantasy", "Family"],
    runtime: 125,
    tagline: "The tunnel led Chihiro to a mysterious world..."
  },
  {
    id: 496243,
    title: "Parasite",
    poster_path: "https://image.tmdb.org/t/p/w500/7IiT2ZwfuZk1iM1qUq3Yw3e9f4e.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/hiKmpZMGZOSkAUt9wB1VevXZjfq.jpg",
    overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy Parks for their livelihood.",
    vote_average: 8.5,
    release_date: "2019-05-30",
    genre_ids: [35, 53, 18],
    genres: ["Comedy", "Thriller", "Drama"],
    runtime: 132,
    tagline: "Act like you own the place."
  },
  {
    id: 315162,
    title: "Puss in Boots: The Last Wish",
    poster_path: "https://image.tmdb.org/t/p/w500/kuf6MHwImXEZjOI3Mz23kZ3dMJe.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/r9xVHZv2f2D3S39n4n4J7S7dMJe.jpg",
    overview: "Puss in Boots sets out on an epic journey to find the mythical Last Wish and restore his nine lives.",
    vote_average: 8.2,
    release_date: "2022-12-07",
    genre_ids: [16, 12, 35, 10751],
    genres: ["Animation", "Adventure", "Comedy", "Family"],
    runtime: 102,
    tagline: "Say hello to my little friend."
  },
  {
    id: 324857,
    title: "Spider-Man: Into the Spider-Verse",
    poster_path: "https://image.tmdb.org/t/p/w500/iiZZdoQH2a1h6N92WvE0n28Rk5n.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/7d62n2fD29fS9bN6S8D4e2f9jS8.jpg",
    overview: "Teen Miles Morales becomes the Spider-Man of his universe and must join five spider-powered individuals.",
    vote_average: 8.4,
    release_date: "2018-12-06",
    genre_ids: [16, 28, 12, 878],
    genres: ["Animation", "Action", "Adventure", "Sci-Fi"],
    runtime: 117,
    tagline: "More than one can wear the mask."
  },
  {
    id: 508947,
    title: "Turning Red",
    poster_path: "https://image.tmdb.org/t/p/w500/qsdjk9oRFZVLq05R22H9H8wD0.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/w1280/iQFcwG2wDzA6k1K0p5R5l7.jpg",
    overview: "Mei Lee is a confident 13-year-old who 'poofs' into a giant red panda whenever she gets too excited.",
    vote_average: 7.4,
    release_date: "2022-03-10",
    genre_ids: [16, 35, 10751, 14],
    genres: ["Animation", "Comedy", "Family", "Fantasy"],
    runtime: 100,
    tagline: "Growing up is a beast."
  }
];

export const MOCK_WATCH_PROVIDERS = {
  550: {
    flatrate: [
      { provider_id: 8, provider_name: 'Netflix', logo_path: '/9A1JSVm2xs0y48x2y3B8m7w.jpg' },
      { provider_id: 119, provider_name: 'Amazon Prime Video', logo_path: '/em85x340.jpg' }
    ],
    rent: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/9gh6.jpg' }],
    buy: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/9gh6.jpg' }]
  }
};

const DEFAULT_MOCK_PROVIDERS = {
  flatrate: [
    { provider_id: 8, provider_name: 'Netflix', logo_path: '/9A1JSVm2xs0y48x2y3B8m7w.jpg' },
    { provider_id: 119, provider_name: 'Amazon Prime Video', logo_path: '/em85x340.jpg' }
  ],
  rent: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/9gh6.jpg' }],
  buy: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/9gh6.jpg' }]
};

/**
 * Live search movies by title via Express backend proxy or TMDB API directly
 */
export async function searchMovies(query = '', apiKey = null) {
  if (!query.trim()) return [];

  const activeKey = apiKey || import.meta.env.VITE_TMDB_API_KEY;

  try {
    const headers = {};
    if (activeKey) headers['x-tmdb-key'] = activeKey;

    const res = await fetch(`${BACKEND_TMDB_PROXY}/search?query=${encodeURIComponent(query)}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results.slice(0, 10).map(movie => formatMovieData(movie));
      }
    }
  } catch (err) {
    console.warn('Backend proxy unavailable, trying direct TMDB API / Mock search...');
  }

  if (activeKey) {
    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${activeKey}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`
      );
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).slice(0, 10).map(movie => formatMovieData(movie));
      }
    } catch {
      // Fall through to mock search
    }
  }

  const q = query.toLowerCase();
  return MOCK_MOVIES.filter(m => m.title.toLowerCase().includes(q));
}

/**
 * Fetch movies deck from TMDB or Fallback
 */
export async function fetchDiscoverMovies(filters = {}, apiKey = null) {
  const activeKey = apiKey || import.meta.env.VITE_TMDB_API_KEY;

  try {
    const headers = {};
    if (activeKey) headers['x-tmdb-key'] = activeKey;

    const params = new URLSearchParams();
    if (filters.genreId && filters.genreId !== 'all') params.append('genre', filters.genreId);
    if (filters.minScore) params.append('minScore', filters.minScore);
    if (filters.startYear) params.append('startYear', filters.startYear);
    if (filters.endYear) params.append('endYear', filters.endYear);

    const res = await fetch(`${BACKEND_TMDB_PROXY}/discover?${params.toString()}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results.map(movie => formatMovieData(movie));
      }
    }
  } catch (err) {
    // Fallback
  }

  if (!activeKey) {
    return filterMockMovies(filters);
  }

  try {
    const params = new URLSearchParams({
      api_key: activeKey,
      language: 'en-US',
      sort_by: filters.sortBy || 'popularity.desc',
      include_adult: 'false',
      include_video: 'false',
      page: '1',
      'vote_count.gte': '100'
    });

    if (filters.genreId && filters.genreId !== 'all') {
      params.append('with_genres', filters.genreId);
    }
    if (filters.minScore) {
      params.append('vote_average.gte', filters.minScore);
    }
    if (filters.startYear) {
      params.append('primary_release_date.gte', `${filters.startYear}-01-01`);
    }
    if (filters.endYear) {
      params.append('primary_release_date.lte', `${filters.endYear}-12-31`);
    }

    const response = await fetch(`${TMDB_BASE_URL}/discover/movie?${params.toString()}`);
    if (!response.ok) {
      console.warn(`TMDB API response status ${response.status}. Switching to curated movies deck...`);
      return filterMockMovies(filters);
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return filterMockMovies(filters);
    }

    return data.results.map(movie => formatMovieData(movie));
  } catch (err) {
    console.warn('Unable to connect to TMDB API directly, using curated movie deck fallback.', err);
    return filterMockMovies(filters);
  }
}

/**
 * Fetch movies by specific array of IDs
 */
export async function fetchMoviesByIds(movieIds = [], apiKey = null) {
  if (!movieIds || !movieIds.length) return [];

  const uniqueIds = [...new Set(movieIds)];

  const fetchPromises = uniqueIds.map(async id => {
    // Check mock first
    const mock = MOCK_MOVIES.find(m => m.id === Number(id));
    if (mock) return mock;

    // Try backend proxy
    try {
      const res = await fetch(`${BACKEND_TMDB_PROXY}/movie/${id}`);
      if (res.ok) {
        const data = await res.json();
        return formatMovieData(data);
      }
    } catch (err) {}

    // Fallback direct TMDB API if key available
    const activeKey = apiKey || import.meta.env.VITE_TMDB_API_KEY;
    if (activeKey) {
      try {
        const res = await fetch(`${TMDB_BASE_URL}/movie/${id}?api_key=${activeKey}&language=en-US`);
        if (res.ok) {
          const data = await res.json();
          return formatMovieData(data);
        }
      } catch (err) {}
    }
    return null;
  });

  const results = await Promise.all(fetchPromises);
  return results.filter(Boolean);
}

/**
 * Fetch streaming providers for a movie by region
 */
export async function fetchWatchProviders(movieId, region = 'US', apiKey = null) {
  const activeKey = apiKey || import.meta.env.VITE_TMDB_API_KEY;

  try {
    const headers = {};
    if (activeKey) headers['x-tmdb-key'] = activeKey;

    const res = await fetch(`${BACKEND_TMDB_PROXY}/providers/${movieId}`, { headers });
    if (res.ok) {
      const data = await res.json();
      const regionData = data.results?.[region] || data.results?.['US'];

      if (regionData) {
        return {
          link: regionData.link,
          flatrate: (regionData.flatrate || []).map(p => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_path: p.logo_path ? `${TMDB_LOGO_BASE}${p.logo_path}` : null
          })),
          rent: (regionData.rent || []).map(p => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_path: p.logo_path ? `${TMDB_LOGO_BASE}${p.logo_path}` : null
          })),
          buy: (regionData.buy || []).map(p => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_path: p.logo_path ? `${TMDB_LOGO_BASE}${p.logo_path}` : null
          }))
        };
      }
    }
  } catch (err) {
    // Fall back to direct or mock
  }

  if (!activeKey) {
    return MOCK_WATCH_PROVIDERS[movieId] || DEFAULT_MOCK_PROVIDERS;
  }

  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${activeKey}`);
    if (!res.ok) throw new Error('Provider request failed');

    const data = await res.json();
    const regionData = data.results?.[region] || data.results?.['US'];

    if (!regionData) {
      return MOCK_WATCH_PROVIDERS[movieId] || DEFAULT_MOCK_PROVIDERS;
    }

    return {
      link: regionData.link,
      flatrate: (regionData.flatrate || []).map(p => ({
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        logo_path: p.logo_path ? `${TMDB_LOGO_BASE}${p.logo_path}` : null
      })),
      rent: (regionData.rent || []).map(p => ({
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        logo_path: p.logo_path ? `${TMDB_LOGO_BASE}${p.logo_path}` : null
      })),
      buy: (regionData.buy || []).map(p => ({
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        logo_path: p.logo_path ? `${TMDB_LOGO_BASE}${p.logo_path}` : null
      }))
    };
  } catch (err) {
    console.error('Failed to fetch watch providers:', err);
    return MOCK_WATCH_PROVIDERS[movieId] || DEFAULT_MOCK_PROVIDERS;
  }
}

// Helpers
function formatMovieData(movie) {
  const genreNames = (movie.genre_ids || [])
    .map(id => TMDB_GENRES.find(g => g.id === id)?.name)
    .filter(Boolean);

  return {
    id: movie.id,
    title: movie.title || movie.original_title,
    poster_path: movie.poster_path ? (movie.poster_path.startsWith('http') ? movie.poster_path : `${TMDB_IMAGE_BASE}${movie.poster_path}`) : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
    backdrop_path: movie.backdrop_path ? (movie.backdrop_path.startsWith('http') ? movie.backdrop_path : `${TMDB_BACKDROP_BASE}${movie.backdrop_path}`) : movie.poster_path ? `${TMDB_BACKDROP_BASE}${movie.poster_path}` : null,
    overview: movie.overview || "No overview available for this movie.",
    vote_average: typeof movie.vote_average === 'number' ? Math.round(movie.vote_average * 10) / 10 : 7.5,
    release_date: movie.release_date || 'N/A',
    genre_ids: movie.genre_ids || [],
    genres: genreNames.length ? genreNames : (movie.genres?.map(g => g.name) || ["Movie"]),
    runtime: movie.runtime || 120,
    tagline: movie.tagline || null
  };
}

function filterMockMovies(filters = {}) {
  let list = [...MOCK_MOVIES];

  if (filters.genreId && filters.genreId !== 'all') {
    const gid = Number(filters.genreId);
    list = list.filter(m => m.genre_ids.includes(gid));
  }
  if (filters.minScore) {
    list = list.filter(m => m.vote_average >= Number(filters.minScore));
  }
  if (filters.startYear) {
    list = list.filter(m => {
      const year = parseInt(m.release_date.split('-')[0], 10);
      return year >= Number(filters.startYear);
    });
  }
  if (filters.endYear) {
    list = list.filter(m => {
      const year = parseInt(m.release_date.split('-')[0], 10);
      return year <= Number(filters.endYear);
    });
  }

  return list.slice(0, 20);
}
