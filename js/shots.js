// Shot recording state machine and GPS management
const ShotModule = (() => {
  const state = {
    sessionId:    null,
    hole:         1,
    shotNum:      1,
    club:         null,
    phase:        'idle',   // 'idle' | 'started' | 'confirming'
    origin:       null,     // { lat, lng }
    landing:      null,
    pendingDist:  0,
    pendingBear:  0,
    watchId:      null,
    lastPosition: null,
    lastAccuracy: null,
  };

  // ── GPS ──────────────────────────────────────────────────────────

  function startGPS() {
    if (!navigator.geolocation) {
      setGpsStatus('GPS not available', false);
      return;
    }
    state.watchId = navigator.geolocation.watchPosition(
      pos => {
        state.lastPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        state.lastAccuracy = Math.round(pos.coords.accuracy);
        MapModule.updateUserPosition(pos.coords.latitude, pos.coords.longitude);
        const acc = state.lastAccuracy;
        const good = acc <= 8;
        const ok   = acc <= 20;
        const dot  = document.getElementById('gps-dot');
        if (dot) dot.style.background = good ? '#4ecca3' : ok ? '#f5a623' : '#e94560';
        setGpsStatus(`GPS ±${acc}m`, true);
      },
      () => setGpsStatus('GPS error', false),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    );
  }

  function stopGPS() {
    if (state.watchId !== null) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId = null;
    }
  }

  function setGpsStatus(msg) {
    const el = document.getElementById('gps-status');
    if (el) el.textContent = msg;
  }

  // ── Shot flow ─────────────────────────────────────────────────────

  function startShot() {
    if (!state.club) {
      alert('Please select a club first.');
      return;
    }
    if (!state.lastPosition) {
      alert('Waiting for GPS signal — try again in a moment.');
      return;
    }
    state.origin = { ...state.lastPosition };
    state.phase  = 'started';
    MapModule.placeOriginMarker(state.origin.lat, state.origin.lng);

    const actionBtn = document.getElementById('btn-shot-action');
    actionBtn.textContent = 'MARK LANDING';
    actionBtn.classList.add('marking');

    const msg = document.getElementById('shot-message');
    msg.textContent = 'Walk to your ball, then tap MARK LANDING';
    msg.classList.remove('hidden');
  }

  function markLanding() {
    if (!state.lastPosition) {
      alert('Waiting for GPS signal — try again in a moment.');
      return;
    }
    state.landing    = { ...state.lastPosition };
    state.phase      = 'confirming';
    state.pendingDist = haversineYards(
      state.origin.lat, state.origin.lng,
      state.landing.lat, state.landing.lng,
    );
    state.pendingBear = getBearing(
      state.origin.lat, state.origin.lng,
      state.landing.lat, state.landing.lng,
    );

    MapModule.placeLandingMarker(state.landing.lat, state.landing.lng);
    MapModule.drawShotLine(state.origin, state.landing);

    document.getElementById('shot-message').classList.add('hidden');
    document.getElementById('btn-shot-action').classList.add('hidden');

    const card = bearingToCardinal(state.pendingBear);
    document.getElementById('shot-summary').innerHTML =
      `<div style="color:var(--text-muted);font-size:0.82rem;font-weight:600">` +
        `Hole ${state.hole} &middot; Shot ${state.shotNum}` +
      `</div>` +
      `<div>${state.club}</div>` +
      `<div style="color:var(--success)">${state.pendingDist} yds &middot; ${card}</div>`;

    document.getElementById('shot-confirm-card').classList.remove('hidden');
  }

  async function confirmShot() {
    await DB.saveShot({
      sessionId:       state.sessionId,
      hole:            state.hole,
      shotNumberOnHole: state.shotNum,
      club:            state.club,
      timestamp:       new Date().toISOString(),
      originLat:       state.origin.lat,
      originLng:       state.origin.lng,
      landingLat:      state.landing.lat,
      landingLng:      state.landing.lng,
      distanceYards:   state.pendingDist,
      bearingDeg:      Math.round(state.pendingBear),
    });
    state.shotNum++;
    resetShotUI();
  }

  function redoShot() {
    MapModule.clearShotMarkers();
    state.phase  = 'idle';
    state.origin = null;
    state.landing = null;
    resetShotUI();
  }

  function resetShotUI() {
    state.phase = 'idle';
    document.getElementById('shot-confirm-card').classList.add('hidden');

    const actionBtn = document.getElementById('btn-shot-action');
    actionBtn.classList.remove('hidden', 'marking');
    actionBtn.textContent = 'START SHOT';

    document.getElementById('shot-message').classList.add('hidden');
    document.getElementById('current-shot-num').textContent = state.shotNum;
    MapModule.clearShotMarkers();
  }

  // ── Hole control ──────────────────────────────────────────────────

  function setHole(h) {
    state.hole    = Math.max(1, Math.min(18, h));
    state.shotNum = 1;
    document.getElementById('current-hole').textContent    = state.hole;
    document.getElementById('current-shot-num').textContent = state.shotNum;
    if (state.phase !== 'idle') redoShot();
  }

  // ── Club selection ────────────────────────────────────────────────

  function setClub(club) {
    state.club = club;
    setLastUsedClub(club);
    document.querySelectorAll('.club-btn').forEach(btn =>
      btn.classList.toggle('selected', btn.dataset.club === club),
    );
  }

  // ── Session lifecycle ─────────────────────────────────────────────

  async function startSession(courseName) {
    const id      = await DB.createSession(courseName);
    state.sessionId = id;
    state.hole      = 1;
    state.shotNum   = 1;
    state.phase     = 'idle';
    state.origin    = null;
    state.landing   = null;
    MapModule.resetFlyFlag();
    startGPS();
  }

  async function endSession() {
    if (state.sessionId) await DB.completeSession(state.sessionId);
    stopGPS();
    state.sessionId = null;
    MapModule.clearShotMarkers();
  }

  return { state, startSession, endSession, startShot, markLanding, confirmShot, redoShot, setHole, setClub };
})();
