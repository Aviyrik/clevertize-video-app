# Video Brief Dashboard

Fill a brief → Claude writes one script per scene in your ANNEX A template → the scripts and a
character/environment brief are sent to your Magnific flow → the dashboard waits for the render and
shows the finished video to play and download.

## What you need first
1. **Node.js 18 or newer** installed (https://nodejs.org). Check with: `node -v`
2. An **Anthropic API key** — from https://console.anthropic.com
3. A **Magnific API key** — from your Magnific dashboard ("Get your API key")

## Setup (one time)
1. Open a terminal in this folder.
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to a new file named `.env`, then open `.env` and paste in your two keys.
   (The flow ID is already set to `UJAMwnyikX`, your "video gen 5" flow.)

## Run it
```
npm start
```
Then open **http://localhost:3000** in your browser.

Fill in the brief, pick the number of scenes, and click **Run pipeline**. The status panel on the
right shows progress: scripts → render started → checking every 10s → video ready. The finished
video appears with a Download button.

Tip: untick "Run Magnific automatically" to generate and review the scripts first, before spending
any render credits.

## How the pieces connect
- `server.js` talks to both APIs using the keys in `.env` (kept off the browser, which is the secure way).
- `POST /api/generate` → Claude writes the brief + scene scripts.
- `POST /api/run` → starts the Magnific flow, gets a run id back instantly.
- `GET /api/status/:runId` → the browser polls this until the video is ready (no timeout limit).
- `GET /api/download` → streams the finished file so download always works.

## If something needs adjusting
The exact field names Magnific returns for the run id and the finished video URL can vary — the code
already checks the common ones and scans the response for a video link. If a run starts but the video
never appears, open the Flows API docs (the "Open docs" button in Magnific) and check the field names
in the run + polling responses, then tweak `findVideoUrl` / the `runId` line in `server.js`.

## Going live for your team
To let others use it without your laptop running, deploy `server.js` to any Node host (Render,
Railway, Fly.io, a VPS, etc.) and set the same `.env` values there as environment variables.
