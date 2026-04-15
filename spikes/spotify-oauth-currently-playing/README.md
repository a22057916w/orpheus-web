# Spotify OAuth Currently Playing Spike

This is a disposable spike for Phase 0 in `PLAN.md`: validating Spotify OAuth, currently playing data, playback progress, and lyric highlighting before building the real Orpheus Web app.

For a beginner-friendly walkthrough of how `index.html`, `styles.css`, and `app.js` work together, read [`GUIDE.md`](./GUIDE.md).

It tests:

- Spotify OAuth with PKCE
- Reading the currently playing track
- Reading playback progress
- Basic playback commands
- Fake lyric highlighting from `progress_ms`

## Run

From this folder:

```powershell
python -m http.server 5173
```

Open:

```text
http://127.0.0.1:5173/
```

## Spotify Developer App Setup

In the Spotify Developer Dashboard, create an app and add this Redirect URI:

```text
http://127.0.0.1:5173/
```

Then copy the app Client ID into the page.

## Notes

Spotify playback control may require Spotify Premium and an active Spotify device.

This spike intentionally avoids Next.js, backend code, and databases. It is only for validating the core idea before building the real app.




