# ShotWranger — Golf Shot Tracker: Project Plan

**Date:** 2026-05-04  
**Status:** Initial Planning

---

## 1. What This App Does

A mobile-first web app used on a golf course to record each shot:
- Mark your GPS position at address (shot origin)
- Mark the ball's landing position (shot endpoint)
- Select the club used
- All data stored locally and available for post-round analysis

---

## 2. Recommended Tech Stack

| Layer | Choice | Why |
|---|---|---|
| App type | **Progressive Web App (PWA)** | Installable to home screen, offline capable, no App Store |
| UI Framework | **Vanilla JS + HTML/CSS** | Minimal deps, fast, easy to maintain |
| Maps | **Leaflet.js + Mapbox Satellite tiles** | Free tier, excellent satellite imagery, well-documented |
| Local Storage | **Dexie.js (IndexedDB wrapper)** | Robust offline storage, queryable, survives browser close |
| Offline | **Service Worker + Cache API** | Caches map tiles and app shell for no-signal use |
| Charts (analysis) | **Chart.js** | Lightweight, good for distance/dispersion charts |
| Hosting | **GitHub Pages or Netlify** | Free HTTPS hosting (HTTPS is required for GPS access) |

---

## 3. Core Features — Phase 1

### 3.1 Shot Recording Screen (primary view)
- Satellite map background with current GPS position marker
- Large "START SHOT" button — records GPS coordinates + timestamp
- Club selector (see §3.2) — visible before starting shot
- After START: map shows origin pin; button changes to "MARK LANDING"
- "MARK LANDING" button records current GPS coordinates → calculates distance + bearing
- Brief summary card appears: club, distance, direction — confirm or discard

### 3.2 Club Selector
Simple grid of large tap-friendly buttons, grouped by type:

| Group | Clubs |
|---|---|
| Woods | Driver, 3W, 5W |
| Hybrids | 2H, 3H, 4H |
| Irons | 3i – 9i |
| Wedges | PW, GW, SW, LW |
| Short game | Chip, Punch, Flop |
| Putter | Putter |

- Remembers last-used club between shots
- One-tap selection, no scrolling required

### 3.3 Data Stored Per Shot
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "timestamp": "ISO 8601",
  "hole": 7,
  "shotNumberOnHole": 2,
  "club": "7i",
  "originLat": 40.123456,
  "originLng": -74.123456,
  "landingLat": 40.123789,
  "landingLng": -74.123100,
  "distanceYards": 148,
  "bearingDeg": 214,
  "notes": ""
}
```

### 3.4 Session & Hole Management
- "Start Round" creates a session (date, optional course name)
- Hole selector always visible on the shot screen: **← Hole 7 →** (tap arrows or tap the number to jump)
- Shot number on hole is auto-incremented (1st shot, 2nd shot, etc.) and resets when hole changes
- "End Hole" button marks the hole complete and advances to next hole
- "End Round" closes session with a summary (holes played, total shots, shots per hole)
- All shots belong to a session; sessions stored in IndexedDB alongside shots

### 3.5 History / Analysis Screen
- List of past rounds
- Per-round: shot count, total distance walked (optional), clubs used
- Per-club stats: average distance, distance spread (min/max), dispersion map
- Simple scatter plot: landing positions relative to origin for a given club
- Export to JSON or CSV button

---

## 4. Architecture Overview

```
/index.html          — App shell (single page)
/app.js              — Main controller
/map.js              — Leaflet map init, pin management
/shots.js            — Shot recording logic
/db.js               — Dexie.js schema + CRUD operations
/analysis.js         — Stats calculations, chart rendering
/sw.js               — Service Worker (offline caching)
/manifest.json       — PWA manifest (home screen install)
/styles.css          — Mobile-first CSS
/assets/             — Icons, splash screens
```

---

## 5. GPS & Map Considerations

### How shot distance is measured
The Haversine formula converts two lat/lng pairs to distance in yards. This is accurate to within ~1% at golf course distances.

### GPS accuracy reality check
- Modern phones: **3–8 meter accuracy** under open sky
- Under trees: **10–30 meters**, sometimes worse
- This means short shots (<50 yards) will have proportionally large error
- Long shots (150+ yards) will be fairly reliable
- **Suggestion:** Display a small "accuracy" indicator (from the Geolocation API's `coords.accuracy` field) so users can see when GPS is unreliable

### Map tiles and offline use
- Mapbox has a free tier (50,000 map loads/month — well above personal use)
- Map tiles must be cached by the Service Worker when the user has signal
- Implement a "Download this area" button that pre-fetches tiles for the current course at zoom levels 14–19
- Without this, the map goes blank mid-round if signal drops

### HTTPS is mandatory
- The browser's Geolocation API refuses to work on plain HTTP
- Must be hosted on HTTPS — GitHub Pages and Netlify both provide this free

---

## 6. Suggested Shot Recording UX Flow

```
[Round Start Screen]
  → Enter optional course name
  → Tap "Begin Round"

[Shot Screen — between shots]
  → Map shows current position (blue dot, updating)
  → Hole selector at top: ← Hole 1 →  (tap to change)
  → Club selector grid visible
  → Tap a club to select it (highlighted)
  → Tap "START SHOT"

[Shot Screen — after START SHOT]
  → Origin pin drops on map at current position
  → Message: "Walk to where your ball landed, then tap MARK LANDING"
  → User walks to ball
  → Tap "MARK LANDING"
  → Landing pin drops; line drawn between pins
  → Summary card slides up: "Hole 7 · Shot 2 · 7i — 148 yds — NE"
  → [Confirm] or [Redo]

[After confirming shot]
  → Shot count for hole updates
  → Option to tap "End Hole" → advances to next hole, resets shot counter
  → Or just tap next club and START SHOT again

[End Round]
  → Summary: holes played, total shots, shots per hole scorecard
  → Return to history
```

---

## 7. Potential Problems & Watchout Items

### GPS Drift
- The phone's GPS position can "wander" while you stand still — up to 10+ meters
- The origin pin should be captured on button tap, not averaged over time
- Consider a 2-second countdown before capturing to let GPS stabilize

### One-Handed Use
- Golfers often have a club in one hand
- All interactive elements must be reachable with one thumb
- Minimum tap target size: 48×48px
- Avoid tiny confirmation dialogs

### Sunlight Readability
- Golf courses are bright; phone screens wash out
- Use high-contrast UI: white text on very dark backgrounds, or dark text on white
- Test the UI outdoors in direct sunlight before calling it done
- Consider a "high brightness" mode that maximizes contrast

### Battery Drain
- Continuous GPS is a significant battery drain (~10–15% per hour)
- Only activate `watchPosition` when a round is active
- Use `maximumAge: 5000` (accept cached position up to 5 seconds old) between shots
- Display battery warning if device is below 20%

### No Signal Mid-Round
- Golf courses — especially rural ones — frequently have dead zones
- All write operations must succeed offline (IndexedDB handles this)
- Map tiles must be pre-cached (see §5)
- App must function 100% offline once the round has started

### Data Loss
- IndexedDB data can be cleared if user clears browser data
- Export to JSON after each round as a backup habit
- Long-term: add optional cloud sync (Phase 2)

### Accidental Taps
- "START SHOT" and "MARK LANDING" must have confirmation or be hard to accidentally hit
- Consider requiring a 500ms press-and-hold to trigger, or a swipe-to-confirm

### Multiple Users / Devices
- Phase 1 is single-device only
- Data lives in the browser's IndexedDB — not shared across devices
- If the user switches phones, they lose data (until Phase 2 cloud sync)

### Mapbox API Key Exposure
- The Mapbox public token will be visible in client-side JS
- This is normal and acceptable for Mapbox — restrict the token to your domain in the Mapbox dashboard
- Do NOT use a secret token in client-side code

### Privacy
- GPS coordinates of where someone golfs is low-sensitivity data
- If cloud sync is added later, clearly communicate what is stored
- No PII is required for Phase 1

---

## 8. Enhancements for Future Phases

| Phase | Feature |
|---|---|
| 2 | Cloud sync (Supabase or Firebase) for cross-device access |
| 2 | Manual position correction — drag pin to exact landing spot |
| 2 | Optional hole number tracking |
| 3 | Course database integration (hole layouts, par info) |
| 3 | Dispersion charts per club (scatter plot of all landing positions) |
| 3 | Strokes Gained calculations (requires baseline data) |
| 3 | Multi-player / group tracking |
| 4 | Weather data capture per shot (wind speed, temp) via weather API |
| 4 | Video clip attachment per shot |
| 4 | AI-driven recommendations ("you consistently miss right with your 6i") |

---

## 9. Development Sequence (Recommended)

1. **Project scaffold** — HTML/CSS shell, PWA manifest, Service Worker stub
2. **Map view** — Leaflet + Mapbox tiles, GPS blue dot working
3. **Club selector** — UI component, state management
4. **Shot recording** — START/MARK flow, Haversine distance calc
5. **IndexedDB persistence** — Dexie schema, save/load shots and sessions
6. **History screen** — List rounds, view shots on map
7. **Offline support** — Service Worker caching map tiles, test with airplane mode
8. **Analysis screen** — Per-club averages, Chart.js dispersion plot
9. **Polish** — Sunlight contrast, touch targets, battery/GPS accuracy indicators
10. **Deploy** — Netlify or GitHub Pages with HTTPS

---

## 10. Estimates

| Phase | Effort (solo dev) |
|---|---|
| Core recording app (steps 1–7) | 3–5 days |
| Analysis screen (step 8) | 1–2 days |
| Polish + deploy (steps 9–10) | 1 day |
| **Total Phase 1** | **~1 week** |

## 11. Decisions Confirmed

| Question | Decision |
|---|---|
| Map provider | **Mapbox** (free tier, public token restricted to your domain) |
| Hole tracking in Phase 1 | **Yes** — hole selector + shot-per-hole counter |
| User model | **Single user** — no auth, no login, all data local |
| Hosting | **GitHub Pages** (public repo, free on GitHub Free tier) |

> **GitHub Pages note:** The repo must be public to use GitHub Pages on the free plan. For a personal proof-of-concept with no sensitive data, this is fine. If you later want a private repo, Netlify's free tier supports private-repo deploys via GitHub OAuth.

---

## 12. Mapbox Setup (do this first)

1. Create a free account at mapbox.com
2. Go to Account → Tokens → Create a token
3. Restrict the token to your GitHub Pages URL (e.g. `https://yourusername.github.io`)
4. Add `Styles:Tiles` and `Styles:Read` scopes — nothing else needed for Phase 1
5. The token goes in a `config.js` file (not hardcoded in source if repo is public — see §7 Watchout below)

> **Watchout — public repo + API token:** Since the repo is public, the Mapbox token will be visible in source. This is acceptable for Mapbox *if* you restrict the token to your domain (Mapbox allows URL-based token restrictions). Anyone who finds the token can only use it from your domain, not make arbitrary API calls. Do NOT use a secret-scoped token.

---
