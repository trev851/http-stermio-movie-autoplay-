# Stremio Movie Autoplay Addon

This repository contains a Stremio HTTP addon that:

- returns TMDB movie metadata from a TMDB movie ID
- returns autoplay streams from a local streams.json mapping
- falls back to YouTube TMDB trailers if no stream mapping exists
- includes curated movie catalogs for:
  - franchise collection
  - Final Destination collection
  - director collection
  - actor collection
  - actress collection
  - comedy, drama, action, and kids movies

How it works

- The addon exposes the `catalog`, `meta`, and `stream` resources for `movie` content.
- Catalogs are powered by TMDB discover/collection endpoints and curated TMDB IDs.
- Movie metadata is loaded by direct TMDB movie lookup using a numeric TMDB ID.
- Streams are resolved from `streams.json` first, then the TMDB video endpoint, then a YouTube trailer fallback.

Setup locally

1. Set the TMDB API key:

   export TMDB_API_KEY=your_api_key

2. Install dependencies:

   npm install

3. Start the addon:

   npm start

4. Add the addon in Stremio using the manifest URL:

   http://YOUR_HOST:7000/manifest.json

Render deployment

1. Create a Web Service on Render using this GitHub repo.
2. Use the default Node environment.
3. Set the build command:

   npm install

4. Set the start command:

   npm start

5. Add the environment variable:

   TMDB_API_KEY=your_tmdb_api_key

6. Render will expose a URL like:

   https://http-stermio-movie-autoplay.onrender.com/manifest.json

7. Add that exact URL to Stremio.

8. If you want to use a custom domain such as `https://pengu.uk/manifest.json`, add it in Render under Settings > Custom Domains.

Example `streams.json` mapping:

{
  "138843": [
    {
      "url": "https://cdn.example.com/movies/138843/master.m3u8",
      "title": "The Conjuring 1080p",
      "isFree": true
    }
  ],
  "953": [
    {
      "url": "https://cdn.example.com/movies/953/master.m3u8",
      "title": "Final Destination 1080p",
      "isFree": true
    }
  ]
}

Available catalogs

- franchise-collection
- final-destination-collection
- director-collection
- actor-collection
- actress-collection
- comedy
- drama
- action
- kids

Notes

- For real movie autoplay, you still need playable URLs in `streams.json`.
- The trailer fallback only returns preview trailers, not the full movie.
- The TMDB API key should stay private and should be stored in an environment variable.

Final Destination collection metadata

- TMDB collection ID: 8864
- Main films in the franchise include:
  - Final Destination (953)
  - Final Destination 2 (1006)
  - Final Destination 3 (11817)
  - The Final Destination (19912)
  - Final Destination 5 (55779)
  - Final Destination: Bloodlines (1226264)

If you want, I can next:

- expand the catalog with more actors/directors/franchises
- add a small admin API to update stream mappings without editing the file manually
- help deploy the addon on a public host
- add genre and collection filters by year or rating
