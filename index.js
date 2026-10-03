const { addonBuilder } = require("stremio-addon-sdk");
const fetch = require("node-fetch");

const manifest = {
  id: "org.trev851.movie.autoplay",
  version: "1.0.0",
  name: "Stremio Movie Autoplay (TMDB meta)",
  description: "Provides metadata from TMDB and autoplay streams from a user mapping or TMDB YouTube trailers.",
  resources: ["meta", "stream"],
  types: ["movie"],
  idPrefixes: ["tmdb"],
  catalogs: [],
};

const builder = new addonBuilder(manifest);

builder.defineMeta(async (args) => {
  // args.id is expected like "tmdb:12345" or "tmdb:movie:12345"
  try {
    const parts = args.id.split(":");
    const tmdbId = parts[parts.length - 1];
    const api_key = process.env.TMDB_API_KEY;
    if (!api_key) {
      console.warn("TMDB_API_KEY not set");
      return { metas: [] };
    }

    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${api_key}&language=en-US`);
    if (!res.ok) {
      console.warn(`TMDB metadata fetch failed for ${tmdbId}: ${res.status}`);
      return { metas: [] };
    }
    const data = await res.json();

    const meta = {
      id: `tmdb:${tmdbId}`,
      type: "movie",
      name: data.title || data.original_title,
      poster: data.poster_path ? `https://image.tmdb.org/t/p/original${data.poster_path}` : undefined,
      background: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : undefined,
      releaseInfo: data.release_date,
      imdb_id: data.imdb_id ? `imdb:${data.imdb_id}` : undefined,
      description: data.overview,
      genres: data.genres ? data.genres.map((g) => g.name) : [],
      meta: { tmdb_id: tmdbId },
    };

    return { metas: [meta] };
  } catch (err) {
    console.error(err);
    return { metas: [] };
  }
});

builder.defineStream(async (args) => {
  // Return stream(s) for the movie. First check streams.json mapping, then fall back to TMDB YouTube videos (trailers)
  try {
    const parts = args.id.split(":");
    const tmdbId = parts[parts.length - 1];

    // user-maintained mapping
    let mapping = {};
    try {
      // Use require so it's cached and easy to edit in repo
      mapping = require("./streams.json");
    } catch (e) {
      mapping = {};
    }

    if (mapping[tmdbId] && Array.isArray(mapping[tmdbId]) && mapping[tmdbId].length) {
      const streams = mapping[tmdbId].map((s) => ({
        title: s.title || "Autoplay Stream",
        url: s.url,
        isFree: s.isFree !== false,
      }));

      return { streams };
    }

    // Fallback: TMDB videos -> choose a YouTube trailer/teaser
    const api_key = process.env.TMDB_API_KEY;
    if (!api_key) return { streams: [] };

    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${api_key}&language=en-US`);
    if (!res.ok) return { streams: [] };
    const data = await res.json();

    const yt = data.results && data.results.find((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser" || v.type === "Clip"));
    if (yt) {
      return { streams: [{ title: `${yt.type} (YouTube)`, url: `https://www.youtube.com/watch?v=${yt.key}`, isFree: true }] };
    }

    return { streams: [] };
  } catch (err) {
    console.error(err);
    return { streams: [] };
  }
});

// Start a simple HTTP server for the addon
const server = require("http").createServer(builder.getInterface());
const port = process.env.PORT || 7000;
server.listen(port, () => console.log(`Addon running on http://localhost:${port}/manifest.json`));
