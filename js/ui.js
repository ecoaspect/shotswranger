// Main UI controller — wires up all screens and event listeners
(function () {

  // ── Helpers ────────────────────────────────────────────────────

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function buildClubSelector() {
    const container = document.getElementById('club-selector');
    container.innerHTML = '';
    CLUBS.forEach(group => {
      const lbl = document.createElement('span');
      lbl.className   = 'club-group-label';
      lbl.textContent = group.group;
      container.appendChild(lbl);

      group.clubs.forEach(club => {
        const btn       = document.createElement('button');
        btn.className   = 'club-btn' + (club === ShotModule.state.club ? ' selected' : '');
        btn.textContent = club;
        btn.dataset.club = club;
        btn.addEventListener('click', () => ShotModule.setClub(club));
        container.appendChild(btn);
      });
    });
  }

  async function loadHistory() {
    const sessions = await DB.getSessions();
    const list     = document.getElementById('history-list');

    if (sessions.length === 0) {
      list.innerHTML = '<p class="history-empty">No rounds recorded yet.</p>';
      return;
    }

    list.innerHTML = sessions.map(s => {
      const dateStr  = new Date(s.date).toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric',
      });
      const name     = s.courseName || 'Unnamed Course';
      const status   = s.isComplete ? 'Complete' : 'In progress';
      return `<div class="history-card" data-id="${s.id}">
        <div class="history-card-title">${name}</div>
        <div class="history-card-meta"><span>${dateStr}</span><span>${status}</span></div>
      </div>`;
    }).join('');

    list.querySelectorAll('.history-card').forEach(card => {
      card.addEventListener('click', async () => {
        await AnalysisModule.showSession(parseInt(card.dataset.id, 10));
        showScreen('screen-analysis');
      });
    });
  }

  // ── Boot ───────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    MapModule.init();

    // Welcome screen
    document.getElementById('btn-start-round').addEventListener('click', async () => {
      const courseName = document.getElementById('course-name').value.trim();
      await ShotModule.startSession(courseName);
      ShotModule.setClub(lastUsedClub);
      buildClubSelector();
      document.getElementById('current-hole').textContent    = '1';
      document.getElementById('current-shot-num').textContent = '1';
      showScreen('screen-round');
    });

    document.getElementById('btn-view-history').addEventListener('click', async () => {
      await loadHistory();
      showScreen('screen-history');
    });

    // Round screen — hole controls
    document.getElementById('btn-hole-prev').addEventListener('click', () =>
      ShotModule.setHole(ShotModule.state.hole - 1));

    document.getElementById('btn-hole-next').addEventListener('click', () =>
      ShotModule.setHole(ShotModule.state.hole + 1));

    // Round screen — shot action button (toggles between START and MARK LANDING)
    document.getElementById('btn-shot-action').addEventListener('click', () => {
      if (ShotModule.state.phase === 'idle')    ShotModule.startShot();
      else if (ShotModule.state.phase === 'started') ShotModule.markLanding();
    });

    // Confirm / redo
    document.getElementById('btn-confirm-shot').addEventListener('click', async () => {
      await ShotModule.confirmShot();
    });

    document.getElementById('btn-redo-shot').addEventListener('click', () => {
      ShotModule.redoShot();
    });

    // End round
    document.getElementById('btn-end-round').addEventListener('click', async () => {
      if (!confirm('End this round and return to history?')) return;
      await ShotModule.endSession();
      document.getElementById('course-name').value = '';
      await loadHistory();
      showScreen('screen-history');
    });

    // History screen
    document.getElementById('btn-history-back').addEventListener('click', () =>
      showScreen('screen-welcome'));

    // Analysis screen
    document.getElementById('btn-analysis-back').addEventListener('click', async () => {
      await loadHistory();
      showScreen('screen-history');
    });

    document.getElementById('btn-export').addEventListener('click', () =>
      AnalysisModule.exportCurrent());

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('./sw.js')
        .catch(err => console.warn('SW registration failed:', err));
    }
  });
})();
