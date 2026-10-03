const fetch = (() => {
  try {
    // node-fetch v2
    return require('node-fetch');
  } catch (e) {
    // node 18+ has global fetch
    if (typeof fetch !== 'undefined') return fetch;
    console.error('Failed to require node-fetch and global fetch not available:', e.message);
    throw e;
  }
})();

const { addonBuilder } = require('stremio-addon-sdk');

const manifest = {
  id: 'org.trev851.movie.autoplay',
  version: '1.1.0',
  name: 'Stremio Movie Autoplay (TMDB meta + catalogs)',
  description: 'Movie metadata, autoplay streams, and curated TMDB movie catalogs for franchise, genre, actor, actress, and director collections.',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie'],
  idPrefixes: ['tmdb'],
  catalogs: [
    { type: 'movie', id: 'franchise-collection', name: 'Franchise Collection' },
    { type: 'movie', id: 'final-destination-collection', name: 'Final Destination Collection' },
    { type: 'movie', id: 'director-collection', name: 'Director Collection' },
    { type: 'movie', id: 'actor-collection', name: 'Actor Collection' },
    { type: 'movie', id: 'actress-collection', name: 'Actress Collection' },
    { type: 'movie', id: 'comedy', name: 'Comedy Movies' },
    { type: 'movie', id: 'drama', name: 'Drama Movies' },
    { type: 'movie', id: 'action', name: 'Action Movies' },
    { type: 'movie', id: 'kids', name: 'Kids Movies' },
  ],
};

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const catalogDefinitions = {
  'franchise-collection': {
    type: 'collection',
    name: 'Franchise Collection',
    items: [
      { name: 'Marvel Cinematic Universe', id: 86311 },
      { name: 'Star Wars', id: 10 },
      { name: 'The Conjuring', id: 402 },
      { name: 'Final Destination', id: 8864 },
      { name: 'Harry Potter', id: 1241 },
      { name: 'Jurassic Park', id: 328 },
      { name: 'Transformers', id: 8650 },
      { name: 'Toy Story', id: 10194 },
      { name: 'Despicable Me', id: 86066 },
      { name: 'Fast & Furious', id: 9485 },
      { name: 'Batman', id: 120794 },
      { name: 'The Lord of the Rings', id: 123 },
      { name: 'Planet of the Apes', id: 417 },
    ],
  },
  'final-destination-collection': {
    type: 'collection',
    name: 'Final Destination Collection',
    items: [{ name: 'Final Destination', id: 8864 }],
  },
  'director-collection': {
    type: 'person',
    kind: 'crew',
    name: 'Director Collection',
    items: [
      { name: 'Christopher Nolan', id: 525 },
      { name: 'Steven Spielberg', id: 488 },
      { name: 'James Cameron', id: 2710 },
      { name: 'Martin Scorsese', id: 1032 },
      { name: 'Peter Jackson', id: 108 },
      { name: 'Denis Villeneuve', id: 137427 },
      { name: 'Ridley Scott', id: 78 },
      { name: 'Quentin Tarantino', id: 138 },
      { name: 'Tim Burton', id: 510 },
    ],
  },
  'actor-collection': {
    type: 'person',
    kind: 'cast',
    name: 'Actor Collection',
    items: [
      { name: 'Tom Hanks', id: 31 },
      { name: 'Leonardo DiCaprio', id: 6193 },
      { name: 'Dwayne Johnson', id: 18918 },
      { name: 'Brad Pitt', id: 287 },
      { name: 'Matt Damon', id: 1269 },
      { name: 'Tom Cruise', id: 500 },
      { name: 'Ryan Reynolds', id: 10859 },
      { name: 'Will Smith', id: 2888 },
      { name: 'Keanu Reeves', id: 6384 },
      { name: 'Vin Diesel', id: 12835 },
    ],
  },
  'actress-collection': {
    type: 'person',
    kind: 'cast',
    name: 'Actress Collection',
    items: [
      { name: 'Meryl Streep', id: 5064 },
      { name: 'Cate Blanchett', id: 112 },
      { name: 'Julia Roberts', id: 1204 },
      { name: 'Sandra Bullock', id: 1827 },
      { name: 'Angelina Jolie', id: 11701 },
      { name: 'Emma Stone', id: 54693 },
      { name: 'Scarlett Johansson', id: 1245 },
      { name: 'Margot Robbie', id: 234352 },
      { name: 'Viola Davis', id: 2245 },
      { name: 'Natalie Portman', id: 524 },
    ],
  },
  comedy: { type: 'genre', genre: 35, name: 'Comedy Movies' },
  drama: { type: 'genre', genre: 18, name: 'Drama Movies' },
  action: { type: 'genre', genre: 28, name: 'Action Movies' },
  kids: { type: 'genre', genre: 10751, name: 'Kids Movies' },
};

const builder = new addonBuilder(manifest);

function parseTmdbId(rawId) {
  if (!rawId) return null;
  const id = String(rawId).trim();
  const parts = id.split(':');
  return parts[parts.length - 1] || null;
}

async function tmdbFetch(path, params = {}) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not set');
  }

  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDB request failed for ${path}: ${res.status} ${text}`);
  }

  return res.json();
}

function movieToMeta(movie) {
  const title = movie.title || movie.original_title || movie.name || movie.original_name || 'Untitled';
  const year = movie.release_date || movie.first_air_date || '';

  return {
    id: `tmdb:${movie.id}`,
    type: 'movie',
    name: title,
    poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    background: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : undefined,
    releaseInfo: year ? year.slice(0, 4) : undefined,
    description: movie.overview || undefined,
    genres: movie.genres ? movie.genres.map((g) => g.name) : movie.genre_ids || [],
    meta: { tmdb_id: String(movie.id) },
  };
}

async function discoverMovies(config) {
  if (!config) return [];

  if (config.type === 'genre') {
    const data = await tmdbFetch('discover/movie', {
      language: 'en-US',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      with_genres: config.genre,
      page: 1,
    });
    return data.results || [];
  }

  if (config.type === 'person') {
    const paramName = config.kind === 'crew' ? 'with_crew' : 'with_cast';
    const allMovies = await Promise.all(
      config.items.map(async (person) => {
        const data = await tmdbFetch('discover/movie', {
          language: 'en-US',
          sort_by: 'popularity.desc',
          include_adult: false,
          [paramName]: person.id,
          page: 1,
        });
        return data.results || [];
      })
    );

    const merged = [];
    const seen = new Set();
    for (const movieList of allMovies) {
      for (const movie of movieList) {
        if (!movie || !movie.id || seen.has(movie.id)) continue;
        seen.add(movie.id);
        merged.push(movie);
      }
    }
    return merged;
  }

  if (config.type === 'collection') {
    const allParts = await Promise.all(
      config.items.map(async (item) => {
        try {
          const data = await tmdbFetch(`collection/${item.id}`, { language: 'en-US' });
          return data.parts || [];
        } catch (err) {
          console.warn(`Failed to fetch collection ${item.name} (${item.id}):`, err.message);
          return [];
        }
      })
    );

    const merged = [];
    const seen = new Set();
    for (const list of allParts) {
      for (const movie of list) {
        if (!movie || !movie.id || seen.has(movie.id)) continue;
        seen.add(movie.id);
        merged.push(movie);
      }
    }
    return merged;
  }

  return [];
}

builder.defineCatalogHandler(async ({ type, id }) => {
  if (type !== 'movie') return { metas: [] };

  const config = catalogDefinitions[id];
  if (!config) return { metas: [] };

  try {
    const movies = await discoverMovies(config);
    return { metas: movies.slice(0, 30).map(movieToMeta) };
  } catch (err) {
    console.error(`Catalog handler failed for ${id}:`, err);
    return { metas: [] };
  }
});

builder.defineMetaHandler(async (args) => {
  try {
    const tmdbId = parseTmdbId(args.id);
    if (!tmdbId) return { metas: [] };

    const data = await tmdbFetch(`movie/${tmdbId}`, {
      language: 'en-US',
      append_to_response: 'images,credits,videos',
    });

    const meta = {
      id: `tmdb:${tmdbId}`,
      type: 'movie',
      name: data.original_title || data.title || 'Untitled',
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : undefined,
      background: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : undefined,
      releaseInfo: data.release_date ? data.release_date.slice(0, 4) : undefined,
      imdb_id: data.imdb_id ? `imdb:${data.imdb_id}` : undefined,
      description: data.overview || undefined,
      genres: data.genres ? data.genres.map((g) => g.name) : [],
      meta: { tmdb_id: String(tmdbId) },
    };

    return { metas: [meta] };
  } catch (err) {
    console.error('Meta fetch failed:', err);
    return { metas: [] };
  }
});

builder.defineStreamHandler(async (args) => {
  try {
    const tmdbId = parseTmdbId(args.id);
    if (!tmdbId) return { streams: [] };

    let mapping = {};
    try {
      mapping = require('./streams.json');
    } catch (e) {
      mapping = {};
    }

    if (mapping[tmdbId] && Array.isArray(mapping[tmdbId]) && mapping[tmdbId].length) {
      return {
        streams: mapping[tmdbId].map((s) => ({
          title: s.title || 'Autoplay Stream',
          url: s.url,
          isFree: s.isFree !== false,
        })),
      };
    }

    const data = await tmdbFetch(`movie/${tmdbId}/videos`, { language: 'en-US' });
    const videos = data.results || [];
    const yt = videos.find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip'));

    if (!yt) return { streams: [] };

    return {
      streams: [{
        title: `${yt.type || 'Trailer'} (YouTube)`,
        url: `https://www.youtube.com/watch?v=${yt.key}`,
        isFree: true,
      }],
    };
  } catch (err) {
    console.error('Stream fetch failed:', err);
    return { streams: [] };
  }
});

const server = require('http').createServer(builder.getInterface());
const port = process.env.PORT || 7000;
server.listen(port, () => console.log(`Addon running on http://localhost:${port}/manifest.json`));

module.exports = { manifest, catalogDefinitions, movieToMeta };
