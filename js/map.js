// Mapbox GL map, user position marker, and shot markers
const MapModule = (() => {
  let map          = null;
  let userMarker   = null;
  let originMarker = null;
  let landingMarker= null;
  let hasFlownToUser = false;

  const LINE_SOURCE = 'shot-line';

  function makeMarkerEl(color, glow) {
    const el = document.createElement('div');
    el.style.cssText = [
      'width:20px', 'height:20px', 'border-radius:50%',
      `background:${color}`, 'border:3px solid #fff',
      `box-shadow:0 0 10px ${glow}`,
    ].join(';');
    return el;
  }

  function init() {
    if (typeof MAPBOX_TOKEN === 'undefined' || MAPBOX_TOKEN.includes('YOUR_TOKEN')) {
      document.getElementById('map').innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;' +
        'height:100%;background:#1a1a2e;color:#e94560;text-align:center;' +
        'padding:2rem;font-size:1rem;line-height:1.6">' +
        'Add your Mapbox token to <strong>config.js</strong> to enable the map.' +
        '</div>';
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map = new mapboxgl.Map({
      container: 'map',
      style:     'mapbox://styles/mapbox/satellite-streets-v12',
      zoom:      17,
      center:    [-98.5795, 39.8283], // center of US; GPS will override
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: false }), 'top-right');

    map.on('load', () => {
      map.addSource(LINE_SOURCE, {
        type: 'geojson',
        data: emptyLine(),
      });
      map.addLayer({
        id:     LINE_SOURCE,
        type:   'line',
        source: LINE_SOURCE,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#4ecca3',
          'line-width': 3,
          'line-dasharray': [2, 2],
        },
      });
    });

    // User location dot
    const el = document.createElement('div');
    el.style.cssText =
      'width:16px;height:16px;border-radius:50%;background:#2979ff;' +
      'border:3px solid #fff;box-shadow:0 0 10px rgba(41,121,255,0.7)';
    userMarker = new mapboxgl.Marker({ element: el })
      .setLngLat([-98.5795, 39.8283])
      .addTo(map);
  }

  function updateUserPosition(lat, lng) {
    if (!map || !userMarker) return;
    userMarker.setLngLat([lng, lat]);
    if (!hasFlownToUser) {
      hasFlownToUser = true;
      map.flyTo({ center: [lng, lat], zoom: 17, duration: 1200 });
    }
  }

  function placeOriginMarker(lat, lng) {
    if (!map) return;
    clearShotMarkers();
    originMarker = new mapboxgl.Marker({ element: makeMarkerEl('#e94560', 'rgba(233,69,96,0.7)') })
      .setLngLat([lng, lat])
      .addTo(map);
    map.flyTo({ center: [lng, lat], zoom: 18, duration: 500 });
  }

  function placeLandingMarker(lat, lng) {
    if (!map) return;
    landingMarker = new mapboxgl.Marker({ element: makeMarkerEl('#4ecca3', 'rgba(78,204,163,0.7)') })
      .setLngLat([lng, lat])
      .addTo(map);
  }

  function drawShotLine(origin, landing) {
    if (!map) return;
    const src = map.getSource(LINE_SOURCE);
    if (!src) return;
    src.setData({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [origin.lng, origin.lat],
          [landing.lng, landing.lat],
        ],
      },
    });
    const bounds = new mapboxgl.LngLatBounds()
      .extend([origin.lng,  origin.lat])
      .extend([landing.lng, landing.lat]);
    map.fitBounds(bounds, { padding: 80, maxZoom: 18, duration: 700 });
  }

  function clearShotMarkers() {
    if (originMarker)  { originMarker.remove();  originMarker  = null; }
    if (landingMarker) { landingMarker.remove(); landingMarker = null; }
    const src = map && map.getSource ? map.getSource(LINE_SOURCE) : null;
    if (src) src.setData(emptyLine());
  }

  function emptyLine() {
    return { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } };
  }

  function resize() { if (map) map.resize(); }

  function resetFlyFlag() { hasFlownToUser = false; }

  return { init, resize, updateUserPosition, placeOriginMarker, placeLandingMarker, drawShotLine, clearShotMarkers, resetFlyFlag };
})();
