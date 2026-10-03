# Stremio Movie Autoplay Addon

This repository contains a small Stremio HTTP addon that:

- returns metadata for movies from TMDB (requires TMDB_API_KEY environment variable)
- returns autoplay streams for a movie from a local mapping file (streams.json)
- if no mapping is present, falls back to the TMDB YouTube trailer if available

How it works

- The addon exposes the `meta` and `stream` resources for type `movie` and id prefix `tmdb`.
- For metadata it calls TMDB `/movie/{id}` and builds a Stremio meta object.
- For streams it first checks streams.json (map of tmdbId -> [ { url, title, isFree } ]) and returns those streams which allow "autoplay" in Stremio. If none exist it fetches TMDB videos and returns the first YouTube trailer.

Setup

1. Create a TMDB API key at https://www.themoviedb.org/settings/api and set it in the environment:

   export TMDB_API_KEY=your_api_key

2. (Optional) Edit streams.json to add direct playable URLs for movies you control. Example:

{
  "550": [
    { "url": "https://cdn.example.com/movies/550/index.m3u8", "title": "1080p HLS", "isFree": true }
  ],
  "12345": [
    { "url": "https://example.com/movies/12345.mp4", "title": "1080p MP4" }
  ]
}

3. Install dependencies and start:

   npm install
   npm start

4. In Stremio, add the addon using the manifest URL:

   http://YOUR_HOST:7000/manifest.json

Notes and limitations

- This addon does not host movie files. To autoplay actual movies you must provide playable stream URLs in streams.json that point to HLS/MP4 or other supported formats.
- The fallback to TMDB YouTube videos returns trailers only (not full movies).
- Keep your TMDB API key secret; using environment variables is recommended.

If you want, I can:

- Add GitHub Actions to auto-deploy this to a server or to GitHub Pages (Pages can't run Node apps directly) or to a small Heroku/Render template.
- Add an endpoint that allows adding mappings to streams.json through a secure token.

