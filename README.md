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

## Going Live (Deploying from GitHub)

This application includes a Node.js Express backend and a built React frontend. Because it securely handles Anthropic and Magnific API keys, it deploys directly from GitHub to any Node or Docker hosting provider.

### Option 1: 1-Click Deploy on Render (Recommended)
1. Go to [Render.com](https://render.com) and click **New → Blueprint** (or **New → Web Service**).
2. Connect your GitHub repository: `https://github.com/Aviyrik/clevertize-video-app`.
3. Render automatically reads `render.yaml`.
4. Add your Environment Secrets:
   - `ANTHROPIC_API_KEY`: Your Claude API key
   - `MAGNIFIC_API_KEY`: Your Magnific API key
   - `MAGNIFIC_FLOW_ID`: `UJAMwnyikX`
5. Click **Deploy**. Your app is live with a public HTTPS URL and automatic CI/CD deploys on every `git push origin main`!

### Option 2: Deploy on Railway
1. Go to [Railway.app](https://railway.app) and click **New Project → Deploy from GitHub Repo**.
2. Select `clevertize-video-app`.
3. Under **Variables**, add:
   - `ANTHROPIC_API_KEY`
   - `MAGNIFIC_API_KEY`
   - `MAGNIFIC_FLOW_ID=UJAMwnyikX`
   - `PORT=3000`
4. Railway will automatically build the frontend (`npm run build`) and launch the production server (`npm start`).

### Option 3: Docker Deployment
A production-ready `Dockerfile` is included in the root directory. To run anywhere:
```bash
docker build -t clevertize-video-app .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY="your-key" -e MAGNIFIC_API_KEY="your-key" clevertize-video-app
```

