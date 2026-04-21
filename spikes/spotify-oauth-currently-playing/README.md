# Spotify OAuth Currently Playing Spike

This is a disposable spike for Phase 0 in `PLAN.md`: validating Spotify OAuth, currently playing data, playback progress, and lyric highlighting before building the real Orpheus Web app.

For a beginner-friendly walkthrough of how `index.html`, `styles.css`, and `app.js` work together, read [`GUIDE.md`](./GUIDE.md).

It tests:

- Spotify OAuth with PKCE
- Reading the currently playing track
- Reading playback progress
- Basic playback commands
- Fake lyric highlighting from `progress_ms`

## Files

- `index.html`: page structure
- `styles.css`: page styling
- `app.js`: browser JavaScript loaded by the page
- `app.ts`: TypeScript version of the same spike logic for learning and comparison
- `app.original.js`: preserved copy of the earlier JavaScript version

## Run

From this folder:

```powershell
python -m http.server 5173
```

Open:

```text
http://127.0.0.1:5173/
```


## Why Python Starts This Spike

This spike is written with HTML, CSS, and JavaScript only. There is no Python application code here.

The command below uses Python's built-in static file server:

```powershell
python -m http.server 5173
```

It means: serve the files in this folder over HTTP at port `5173`.

We use it because Spotify OAuth needs a stable redirect URL such as:

```text
http://127.0.0.1:5173/
```

Opening `index.html` directly as a `file://` URL is not ideal for OAuth testing. Python is only a temporary local server for this spike. In the real Orpheus Web app, this role will likely be handled by Next.js or Vite with a command such as `npm run dev`.

## TypeScript Note

This folder now includes both JavaScript and TypeScript versions of the spike logic:

- `app.ts` is the TypeScript version, with explicit types added to the same browser flow.
- `app.js` is the file the browser runs.
- `app.original.js` keeps the original JavaScript source around for reference.

The browser still runs JavaScript, not TypeScript directly. To compile `app.ts`, you first need Node.js, because `npm` comes with Node.js and is commonly used to install TypeScript.

Check whether Node.js and npm are available:

```powershell
node -v
npm -v
```

If they are missing, install Node.js first. After that, install TypeScript:

```powershell
npm install -g typescript
```

Then you can compile TypeScript into JavaScript:

```powershell
tsc app.ts
```

That command usually writes `app.js`, which is the file loaded by `index.html`.

## Spotify Developer App Setup

In the Spotify Developer Dashboard, create an app and add this Redirect URI:

```text
http://127.0.0.1:5173/
```

Then copy the app Client ID into the page.

## Notes

Spotify playback control may require Spotify Premium and an active Spotify device.

This spike intentionally avoids Next.js, backend code, and databases. It is only for validating the core idea before building the real app.





