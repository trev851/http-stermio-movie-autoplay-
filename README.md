# Stremio Movie Autoplay (TMDB meta + catalogs)

A Stremio-compatible addon that provides movie metadata, curated movie catalogs powered by [TMDB](https://www.themoviedb.org/), and streams you define yourself. It works in Stremio and in any app that supports Stremio addons, such as Lumo.

## Install

Manifest link:

```
https://http-stermio-movie-autoplay-f7yu.onrender.com/manifest.json
```

- **Stremio:** open the Addons section, choose to install from a link, and paste the manifest link above.
- **Lumo (or another Stremio-compatible app):** paste the same link on the Addons page.

> The addon runs on a free Render plan. After a quiet period the first request can take 30–60 seconds while the service wakes up. If it fails once, wait a minute and try again.

## Catalogs

All catalogs are for movies and use TMDB data.

| Catalog | What it shows |
| --- | --- |
| Franchise Collection | Movies from popular franchises (Marvel, Star Wars, Harry Potter and more) |
| Final Destination Collection | The Final Destination series |
| Director Collection | Popular movies from well-known directors |
| Actor Collection | Popular movies from well-known actors |
| Actress Collection | Popular movies from well-known actresses |
| Comedy, Drama, Action, Kids | Popular movies in each genre |

## Resources

- `catalog`: the lists above
- `meta`: title details (poster, background, description, genres, year)
- `stream`: playable sources (see below)

Titles use IDs that start with `tmdb:`. The addon only handles those IDs, so it provides streams for titles opened from its own catalogs.

## Streams

- If a title's TMDB ID is listed in `streams.json`, the addon returns the links you defined.
- Otherwise it returns a YouTube trailer when TMDB has one.

Example `streams.json` (the key is a TMDB movie ID):

```json
{
  "603": [
    { "title": "My source", "url": "https://example.com/video.mp4" }
  ]
}
```

Only add links to content you have the right to use.

## Run your own copy

1. Get a free **API Key (v3)** from your TMDB account (Settings → API). This is the short key, not the long Read Access Token.
2. Deploy to Render as a **Web Service**:
   - Build command: `npm install`
   - Start command: `node index.js`
   - Environment variable: `TMDB_API_KEY` set to your key
3. After it shows **Live**, your manifest link is the service address followed by `/manifest.json`. Render may add random letters to the service name, so copy the full address from the service page.

To run it locally:

```bash
npm install
TMDB_API_KEY=your_key node index.js
```

It listens on port 7000 by default, and the manifest is at `http://localhost:7000/manifest.json`.

> Never commit your TMDB key to the repo. Keep it in Render's Environment settings.

## Credits

- Movie data from [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.
- Built with the [Stremio addon SDK](https://github.com/Stremio/stremio-addon-sdk).
