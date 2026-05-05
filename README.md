# ShotWranger — Golf Shot Tracker

A mobile-first PWA for tracking GPS-based golf shots on the course.

---

## First-time setup

### 1. Add your Mapbox token

Open `config.js` and replace `pk.YOUR_MAPBOX_TOKEN_HERE` with your real token.

**Get a token:**
1. Go to [mapbox.com](https://mapbox.com) → sign in → Account → Tokens
2. Create a new token named `shotswranger`
3. Under **URL restrictions**, add both:
   - `https://ecoaspect.github.io/shotswranger`
   - `http://localhost:3000` (for local dev)
4. Scopes needed: `styles:read` and `styles:tiles` only
5. Paste the `pk.…` token into `config.js`

> The token will be visible in the public repo. That is fine — Mapbox URL restrictions prevent anyone else from using it.

---

### 2. Deploy to GitHub Pages

```bash
# One-time: create the repo on github.com named "shotswranger", then:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ecoaspect/shotswranger.git
git push -u origin main
```

Then in your GitHub repo:  
**Settings → Pages → Source: Deploy from branch → Branch: main → / (root) → Save**

Your app will be live at: **https://ecoaspect.github.io/shotswranger**

---

### 3. Install to phone home screen (optional)

Open the app in Chrome on your phone → tap the browser menu → **Add to Home Screen**.  
The app will work offline after the first visit.

---

## Local development

You need a local HTTPS-or-localhost server for GPS and the service worker to work.

```bash
# Option A — Node (npx, no install needed)
npx serve .

# Option B — Python
python -m http.server 3000
```

Then open `http://localhost:3000` in Chrome.

---

## How to use

1. Tap **Start Round**, enter an optional course name
2. Use **← Hole →** arrows to set the current hole
3. Select a club from the scrollable row
4. Tap **START SHOT** — a red pin drops at your position
5. Walk to where your ball landed, tap **MARK LANDING** — a green pin drops
6. Review the summary (club, yards, direction) → **Confirm** or **Redo**
7. Repeat for each shot; use **← Hole →** to advance holes
8. Tap **End Round** when finished
9. Tap **View History** to see past rounds and per-club analysis

---

## File structure

```
index.html          App shell
config.js           Mapbox token (edit this)
manifest.json       PWA manifest
sw.js               Service worker (offline caching)
css/styles.css      All styles
js/
  db.js             IndexedDB schema + CRUD (Dexie.js)
  clubs.js          Club list
  geo.js            Haversine distance + bearing
  map.js            Mapbox GL map + markers
  shots.js          Shot recording state machine + GPS
  analysis.js       Stats grid + Chart.js charts
  ui.js             Screen routing + event wiring
assets/
  icon-192.png      PWA icon (add your own)
  icon-512.png      PWA icon (add your own)
```

---

## Data storage

All data is stored in **IndexedDB** in the browser — nothing is sent to any server.  
Use **Export** on the analysis screen to download a JSON backup after each round.
