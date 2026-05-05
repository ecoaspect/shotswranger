// Analysis screen: stats grid + charts + export
const AnalysisModule = (() => {
  let distChart  = null;
  let holesChart = null;
  let activeSessionId = null;

  Chart.defaults.color = '#8a8a9a';

  async function showSession(sessionId) {
    activeSessionId = sessionId;
    const { session, shots } = await DB.exportSession(sessionId);

    const title = session.courseName
      ? session.courseName
      : new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('analysis-title').textContent = title;

    renderStats(shots);
    renderDistChart(shots);
    renderHolesChart(shots);
  }

  function renderStats(shots) {
    const total   = shots.length;
    const holes   = new Set(shots.map(s => s.hole)).size;
    const dists   = shots.map(s => s.distanceYards).filter(d => d > 0);
    const longest = dists.length ? Math.max(...dists) : 0;
    const avgDist = dists.length ? Math.round(dists.reduce((a, b) => a + b, 0) / dists.length) : 0;
    const totalYds= dists.reduce((a, b) => a + b, 0);

    const clubCounts = {};
    shots.forEach(s => { clubCounts[s.club] = (clubCounts[s.club] || 0) + 1; });
    const topClub = Object.entries(clubCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    document.getElementById('stats-grid').innerHTML = [
      stat(total,    'Total Shots'),
      stat(holes,    'Holes'),
      stat(topClub,  'Top Club'),
      stat(longest,  'Longest (yds)'),
      stat(avgDist,  'Avg Dist'),
      stat(totalYds, 'Total Yds'),
    ].join('');
  }

  function stat(val, label) {
    return `<div class="stat-card">
      <div class="stat-value">${val}</div>
      <div class="stat-label">${label}</div>
    </div>`;
  }

  function renderDistChart(shots) {
    const groups = {};
    shots.filter(s => s.distanceYards > 0).forEach(s => {
      (groups[s.club] = groups[s.club] || []).push(s.distanceYards);
    });

    const labels = Object.keys(groups);
    const avgs   = labels.map(c => Math.round(groups[c].reduce((a, b) => a + b, 0) / groups[c].length));

    if (distChart) distChart.destroy();
    distChart = new Chart(document.getElementById('chart-distance'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data: avgs, backgroundColor: '#e94560', borderRadius: 4 }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8a8a9a' }, grid: { color: '#2a2a3e' } },
          y: { ticks: { color: '#8a8a9a' }, grid: { color: '#2a2a3e' } },
        },
      },
    });
  }

  function renderHolesChart(shots) {
    const labels = Array.from({ length: 18 }, (_, i) => `H${i + 1}`);
    const counts = Array.from({ length: 18 }, (_, i) => shots.filter(s => s.hole === i + 1).length);

    if (holesChart) holesChart.destroy();
    holesChart = new Chart(document.getElementById('chart-holes'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data: counts, backgroundColor: '#4ecca3', borderRadius: 4 }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8a8a9a' }, grid: { color: '#2a2a3e' } },
          y: { ticks: { color: '#8a8a9a', stepSize: 1 }, grid: { color: '#2a2a3e' } },
        },
      },
    });
  }

  async function exportCurrent() {
    if (!activeSessionId) return;
    const data = await DB.exportSession(activeSessionId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `shotswranger-${data.session.date.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { showSession, exportCurrent };
})();
