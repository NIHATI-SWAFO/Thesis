import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import campusData from '../../assets/dlsud-campus.json';
import { API_ENDPOINTS } from '../../api/config';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DLSUD_CENTER = [120.9600, 14.3228];
const CAMPUS_BOUNDS = [[120.9540, 14.3175], [120.9660, 14.3310]];

// ── Heatmap layer — provides the glowing background behind clusters ─────────
const HEATMAP_LAYER = {
  id: 'violations-heatmap', type: 'heatmap', source: 'violations-source',
  paint: {
    // Weight scales with the number of points in the cluster
    'heatmap-weight': [
      'interpolate', ['linear'], ['coalesce', ['get', 'point_count'], 1],
      1, 0.2,
      5, 0.5,
      10, 0.8,
      20, 1.0
    ],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 14, 1.0, 17, 3.0, 19, 5.0],
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(0,0,0,0)',
      0.1, '#00c851', // Low / Green
      0.3, '#ffbb33', // Moderate / Yellow
      0.6, '#ff8800', // High / Orange
      0.8, '#ff4444', // Very High / Red
      1.0, '#CC0000', // Critical / Dark Red
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 15, 40, 17, 60, 19, 80],
    'heatmap-opacity': 0.85,
  },
};

// ── Cluster circle layer ────────────────────────────────────────────────────
const CLUSTER_CIRCLE_LAYER = {
  id: 'clusters', type: 'circle', source: 'violations-source',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step', ['get', 'point_count'],
      '#00c851', 4,   // 1–3  → green
      '#ffbb33', 7,   // 4–6  → yellow
      '#ff8800', 11,  // 7–10 → orange
      '#ff4444', 21,  // 11–20→ red
      '#CC0000'       // 21+  → dark red
    ],
    'circle-radius':       ['step', ['get', 'point_count'], 18, 4, 22, 11, 26, 21, 32],
    'circle-stroke-width': 3,
    'circle-stroke-color': '#ffffff',
    'circle-opacity':      0.95,
  },
};

// ── Cluster count label layer ───────────────────────────────────────────────
const CLUSTER_COUNT_LAYER = {
  id: 'cluster-count', type: 'symbol', source: 'violations-source',
  filter: ['has', 'point_count'],
  layout: {
    'text-field':       '{point_count_abbreviated}',
    'text-font':        ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size':        13,
    'text-allow-overlap': true,
  },
  paint: { 'text-color': '#ffffff' },
};

// ── Individual unclustered point layer ─────────────────────────────────────
const UNCLUSTERED_LAYER = {
  id: 'unclustered-point', type: 'circle', source: 'violations-source',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color':        '#00c851',
    'circle-radius':       10,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#ffffff',
    'circle-opacity':      0.95,
  },
};

const LEGEND_ITEMS = [
  { color: '#00c851', label: 'Low',       desc: 'Normal / Cool' },
  { color: '#ffbb33', label: 'Moderate',  desc: 'Monitored' },
  { color: '#ff8800', label: 'High',      desc: 'Active Hotspot' },
  { color: '#CC0000', label: 'Critical',  desc: 'Immediate Priority' },
];

export default function MapTrial() {
  const mapContainer = useRef(null);
  const mapInstance  = useRef(null);
  const popupRef     = useRef(null);
  const locationSummaryRef = useRef([]);
  const showLocationPopupRef = useRef(null);

  const [geojsonFeatureCount, setGeojsonFeatureCount] = useState(null);
  const [coords,   setCoords]   = useState({ lng: DLSUD_CENTER[0], lat: DLSUD_CENTER[1], zoom: 17 });
  const [mapReady, setMapReady] = useState(false);
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [stats,    setStats]    = useState({ total: 0, locations: 0, topLocation: null });
  const [filters,  setFilters]  = useState({ date_from: '', date_to: '', category: '' });
  const [useDecay, setUseDecay]  = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  // ── Add cluster layers once after source exists ─────────────────────────
  const addClusterLayers = useCallback((mapObj) => {
    if (!mapObj.getLayer('violations-heatmap')) mapObj.addLayer(HEATMAP_LAYER);
    if (!mapObj.getLayer('clusters'))           mapObj.addLayer(CLUSTER_CIRCLE_LAYER);
    if (!mapObj.getLayer('cluster-count'))      mapObj.addLayer(CLUSTER_COUNT_LAYER);
    if (!mapObj.getLayer('unclustered-point'))  mapObj.addLayer(UNCLUSTERED_LAYER);
  }, []);

  // ── Fetch + refresh data ────────────────────────────────────────────────
  const fetchAndRefresh = useCallback(async (mapObj, filterParams, decayEnabled = useDecay) => {
    if (!mapObj) return;
    setLoading(true);
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filterParams).filter(([, v]) => v !== ''))
    );
    if (decayEnabled) {
      params.set('decay', 'true');
    }
    try {
      const res  = await fetch(`${API_ENDPOINTS.VIOLATIONS_HEATMAP}?${params}`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();

      const geojson = data.geojson || { type: 'FeatureCollection', features: [] };
      setGeojsonFeatureCount(geojson.features.length);
      locationSummaryRef.current = data.location_summary || [];

      if (mapObj.getSource('violations-source')) {
        mapObj.getSource('violations-source').setData(geojson);
      } else {
        // Source with clustering enabled — GPS-ready
        mapObj.addSource('violations-source', {
          type:          'geojson',
          data:          geojson,
          cluster:       true,
          clusterRadius: 20,
          clusterMaxZoom: 16,    // split clusters early so you see individual dots at zoom 17
          clusterProperties: {
            'total_weight': ['+', ['get', 'weight']]
          }
        });
        addClusterLayers(mapObj);
      }

      // Dynamic cluster circle color styling based on whether decay is enabled
      if (mapObj.getLayer('clusters')) {
        if (decayEnabled) {
          mapObj.setPaintProperty('clusters', 'circle-color', [
            'step', ['coalesce', ['get', 'total_weight'], ['get', 'point_count']],
            '#00c851', 26,   // <= 25 -> Low (Green)
            '#ffbb33', 51,   // 26-50 -> Moderate (Yellow)
            '#ff8800', 76,   // 51-75 -> High (Orange)
            '#CC0000'        // > 75 -> Critical (Dark Red)
          ]);
        } else {
          mapObj.setPaintProperty('clusters', 'circle-color', [
            'step', ['get', 'point_count'],
            '#00c851', 4,   // 1–3  → green
            '#ffbb33', 7,   // 4–6  → yellow
            '#ff8800', 11,  // 7–10 → orange
            '#ff4444', 21,  // 11–20→ red
            '#CC0000'       // 21+  → dark red
          ]);
        }
      }

      if (mapObj.getLayer('violations-heatmap')) {
        if (decayEnabled) {
          mapObj.setPaintProperty('violations-heatmap', 'heatmap-weight', [
            'interpolate', ['linear'], ['coalesce', ['get', 'total_weight'], ['get', 'weight'], 1],
            1, 0.1,
            25, 0.4,
            50, 0.7,
            75, 1.0
          ]);
        } else {
          mapObj.setPaintProperty('violations-heatmap', 'heatmap-weight', [
            'interpolate', ['linear'], ['coalesce', ['get', 'point_count'], 1],
            1, 0.2,
            5, 0.5,
            10, 0.8,
            20, 1.0
          ]);
        }
      }

      const hotLocs = (data.location_summary || []).filter(l => (l.risk_score || l.count) > 0);
      setStats({
        total:       data.total_violations || 0,
        locations:   hotLocs.length,
        topLocation: hotLocs[0] || null,
        decayApplied: Boolean(data.decay_applied),
      });
    } catch (err) {
      console.error('Heatmap fetch failed:', err);
      setGeojsonFeatureCount(0);
    } finally {
      setLoading(false);
    }
  }, [addClusterLayers, useDecay]);

  // ── Unified Location Popup Function (shows all cases for the building) ─
  const showLocationPopup = useCallback((locName, coords, m) => {
    if (!m) return;
    const cleanName = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetClean = cleanName(locName);
    const locData = (locationSummaryRef.current || []).find(l => {
      const c = cleanName(l.name);
      return c === targetClean || c.includes(targetClean) || targetClean.includes(c);
    });

    const totalCount = locData?.count || 1;
    const recentCount = locData?.recent_count || 0;
    const riskTier = locData?.risk_tier || 'Low';
    const violations = locData?.violations || [];

    const tierColors = {
      Critical:    { bg: '#FEE2E2', text: '#991B1B', border: '#F87171', dot: '#DC2626', label: 'Critical Hotspot' },
      'Very High': { bg: '#FEE2E2', text: '#991B1B', border: '#F87171', dot: '#DC2626', label: 'Very High Risk' },
      High:        { bg: '#FFEDD5', text: '#9A3412', border: '#FB923C', dot: '#EA580C', label: 'High Hotspot' },
      Moderate:    { bg: '#FEF9C3', text: '#854D0E', border: '#FACC15', dot: '#CA8A04', label: 'Moderate Risk' },
      Low:         { bg: '#DCFCE7', text: '#166534', border: '#86EFAC', dot: '#16A34A', label: 'Low / Stable' },
    };
    const tier = tierColors[riskTier] || tierColors.Low;

    const violationsHtml = violations.length > 0 ? violations.map(v => `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:6px 8px;background:#f8fafc;border-radius:8px;border:1px solid #f1f5f9;margin-bottom:4px;">
        <div style="min-width:0;flex:1;">
          <div style="font-size:11px;font-weight:800;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.rule_code || v.category}</div>
          <div style="font-size:9px;font-weight:600;color:#64748b;">${v.category} · ${v.timestamp}</div>
        </div>
        <span style="font-size:9px;font-weight:800;padding:2px 6px;border-radius:6px;background:${v.status === 'OPEN' ? '#fef3c7' : '#e2e8f0'};color:${v.status === 'OPEN' ? '#92400e' : '#475569'};text-transform:uppercase;">${v.status}</span>
      </div>
    `).join('') : '<div style="font-size:11px;color:#94a3b8;padding:8px;text-align:center;">No recent case details</div>';

    const moreText = (totalCount > violations.length)
      ? `<div style="font-size:9px;font-weight:700;color:#94a3b8;text-align:center;margin-top:4px;">+ ${totalCount - violations.length} older cases recorded</div>`
      : '';

    const contentHtml = `
      <div style="padding:14px 16px;font-family:system-ui,-apple-system,sans-serif;width:290px;max-width:90vw;">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:9px;font-weight:900;color:#003624;text-transform:uppercase;letter-spacing:0.12em;">Campus Hotspot</span>
          <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:${tier.bg};border:1px solid ${tier.border};font-size:9px;font-weight:900;color:${tier.text};">
            <span style="width:6px;height:6px;border-radius:50%;background:${tier.dot};display:inline-block;"></span>
            ${tier.label}
          </span>
        </div>
        <div style="font-size:15px;font-weight:900;color:#0f172a;line-height:1.2;margin-bottom:10px;">${locData?.name || locName || 'Campus Location'}</div>

        <!-- Metrics Grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
          <div style="background:#f1f5f9;border-radius:10px;padding:8px 10px;">
            <div style="font-size:8px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">All-Time</div>
            <div style="font-size:15px;font-weight:900;color:#0f172a;line-height:1;">${totalCount} <span style="font-size:10px;font-weight:700;color:#64748b;">cases</span></div>
          </div>
          <div style="background:${recentCount > 0 ? '#fef3c7' : '#f1f5f9'};border-radius:10px;padding:8px 10px;">
            <div style="font-size:8px;font-weight:800;color:${recentCount > 0 ? '#92400e' : '#64748b'};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Last 30 Days</div>
            <div style="font-size:15px;font-weight:900;color:${recentCount > 0 ? '#b45309' : '#0f172a'};line-height:1;">${recentCount} <span style="font-size:10px;font-weight:700;color:${recentCount > 0 ? '#92400e' : '#64748b'};">${recentCount > 0 ? 'active' : 'quiet'}</span></div>
          </div>
        </div>

        <!-- Case breakdown header -->
        <div style="font-size:9px;font-weight:900;color:#475569;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;display:flex;justify-content:space-between;">
          <span>Incident History</span>
          <span style="color:#94a3b8;font-weight:700;">${violations.length} shown</span>
        </div>

        <!-- Scrollable Cases list -->
        <div style="max-height:140px;overflow-y:auto;padding-right:2px;margin-bottom:4px;">
          ${violationsHtml}
        </div>
        ${moreText}
      </div>
    `;

    if (popupRef.current) popupRef.current.remove();
    popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: '330px', className: 'swafo-popup', offset: 16 })
      .setLngLat(coords)
      .setHTML(contentHtml)
      .addTo(m);
  }, []);

  showLocationPopupRef.current = showLocationPopup;

  // ── Initialize map ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mapInstance.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const container = mapContainer.current;
    if (!container) return;

    try {
      const m = new mapboxgl.Map({
        container,
        style:              'mapbox://styles/timothydevcastro/cmod8zewr004601pe41yy4304',
        center:             DLSUD_CENTER,
        zoom:               17,
        pitch:              45,      // 3D perspective
        bearing:            -17,     // slight rotation for better depth
        maxBounds:          CAMPUS_BOUNDS,
        minZoom:            15,
        maxZoom:            19,
        antialias:          true,
        attributionControl: false,
      });
      mapInstance.current = m;
      m.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
      m.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      m.on('load', () => {
        try {
          // World mask — hide everything outside campus
          const worldMask = {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [[-180,90],[-180,-90],[180,-90],[180,90],[-180,90]],
                ...campusData.features[0].geometry.coordinates,
              ],
            },
          };
          m.addSource('world-mask-src', { type: 'geojson', data: worldMask });
          m.addLayer({ id: 'world-mask', type: 'fill', source: 'world-mask-src',
            paint: { 'fill-color': '#ecfdf5', 'fill-opacity': 1 } });
          m.addSource('dlsud-campus', { type: 'geojson', data: campusData });

          setMapReady(true);
          fetchAndRefresh(m, { date_from: '', date_to: '', category: '' });
        } catch (e) {
          setError(`Map logic failed: ${e.message}`);
        }
      });

      // ── Cluster click → show building popup ───────────────────────────
      const handleClusterClick = (e) => {
        const features = m.queryRenderedFeatures(e.point, { layers: ['clusters', 'cluster-count'] });
        if (!features.length) return;
        const clusterId = features[0].properties.cluster_id;
        const coords = features[0].geometry.coordinates.slice();
        
        m.getSource('violations-source').getClusterLeaves(clusterId, 50, 0, (err, leaves) => {
          const locName = leaves?.[0]?.properties?.location_name || 'Campus Building';
          if (showLocationPopupRef.current) {
            showLocationPopupRef.current(locName, coords, m);
          }
        });
      };

      m.on('click', 'clusters', handleClusterClick);
      m.on('click', 'cluster-count', handleClusterClick);

      // ── Individual point click → show building popup ──────────────────
      m.on('click', 'unclustered-point', (e) => {
        if (!e.features.length) return;
        const { location_name } = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates.slice();
        if (showLocationPopupRef.current) {
          showLocationPopupRef.current(location_name, coords, m);
        }
      });

      m.on('mouseenter', 'clusters',          () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'clusters',          () => { m.getCanvas().style.cursor = ''; });
      m.on('mouseenter', 'cluster-count',     () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'cluster-count',     () => { m.getCanvas().style.cursor = ''; });
      m.on('mouseenter', 'unclustered-point', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'unclustered-point', () => { m.getCanvas().style.cursor = ''; });
      m.on('move', () => {
        const c = m.getCenter();
        setCoords({ lng: c.lng.toFixed(4), lat: c.lat.toFixed(4), zoom: m.getZoom().toFixed(2) });
      });
      m.on('error', (e) => {
        const msg = e?.error?.message || '';
        if (msg.includes('Could not load models') || msg.includes('maple1') || msg.includes('lod2')) return;
        setError(msg || 'Map failed to load');
      });

    } catch (err) { setError(err.message); }

    return () => {
      if (popupRef.current) popupRef.current.remove();
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [fetchAndRefresh]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    fetchAndRefresh(mapInstance.current, filters, useDecay);
  }, [filters, useDecay, mapReady, fetchAndRefresh]);

  // ── Auto-poll every 30s so new violations appear without page refresh ────
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const interval = setInterval(() => {
      fetchAndRefresh(mapInstance.current, filters, useDecay);
    }, 30000);
    return () => clearInterval(interval);
  }, [filters, useDecay, mapReady, fetchAndRefresh]);


  const handleFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const clearFilters  = () => setFilters({ date_from: '', date_to: '', category: '' });
  const hasFilters    = filters.date_from || filters.date_to || filters.category;
  const isEmpty       = mapReady && !loading && geojsonFeatureCount === 0;

  const fieldBase = `h-[44px] bg-slate-50 border-2 border-slate-100 rounded-2xl px-4
    text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-400
    transition-all shadow-sm appearance-none w-full`;

  return (
    <div className="max-w-[1400px] mx-auto px-3.5 sm:px-6 py-4 sm:py-6 animate-fade-in font-pjs pb-20">

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#003624] flex items-center justify-center text-emerald-400 shadow-md shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">map</span>
            </div>
            <h1 className="text-xl sm:text-[26px] md:text-[28px] font-black text-[#003624] tracking-tight leading-tight">
              Campus Violation Heatmap
            </h1>
          </div>
          <p className="text-[11px] sm:text-[13px] text-slate-400 font-medium ml-0.5 sm:ml-1 uppercase tracking-[0.1em]">
            Spatial violation analytics · DLSU-D Campus
          </p>
        </div>

        {/* Stats grid: 2 cols on mobile, flex on desktop */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <div className="bg-white border border-slate-100 rounded-2xl px-3.5 sm:px-5 py-2.5 sm:py-3 shadow-sm flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Violations</span>
            <span className="text-xl sm:text-[26px] font-black text-[#003624] leading-none">{loading ? '…' : stats.total}</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl px-3.5 sm:px-5 py-2.5 sm:py-3 shadow-sm flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Locations</span>
            <span className="text-xl sm:text-[26px] font-black text-emerald-600 leading-none">{loading ? '…' : stats.locations}</span>
          </div>
          {stats.topLocation && (
            <div className="col-span-2 sm:col-span-1 bg-white border border-slate-100 rounded-2xl px-3.5 sm:px-5 py-2 sm:py-3 shadow-sm flex flex-col max-w-full sm:max-w-[200px]">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Hottest Spot</span>
              <span className="text-xs sm:text-[13px] font-black text-[#CC0000] leading-tight truncate">{stats.topLocation.name}</span>
              <span className="text-[10px] font-bold text-slate-400">{stats.topLocation.count} violations</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3.5 sm:px-6 sm:py-5 mb-4 shadow-sm">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 sm:gap-4 items-end">
          <div className="col-span-1 flex flex-col gap-1 sm:min-w-[150px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date From</label>
            <div className="relative">
              <input type="date" className={fieldBase} style={{ paddingLeft:'2.2rem' }}
                value={filters.date_from || ""} onChange={e => handleFilter('date_from', e.target.value)} />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">event</span>
            </div>
          </div>
          <div className="col-span-1 flex flex-col gap-1 sm:min-w-[150px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date To</label>
            <div className="relative">
              <input type="date" className={fieldBase} style={{ paddingLeft:'2.2rem' }}
                value={filters.date_to || ""} onChange={e => handleFilter('date_to', e.target.value)} />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">event</span>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1 sm:min-w-[180px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</label>
            <div className="relative">
              <select className={fieldBase} style={{ paddingRight:'2.2rem' }}
                value={filters.category || ""} onChange={e => handleFilter('category', e.target.value)}>
                <option value="">All Categories</option>
                <option value="minor">⚠️ Minor Offenses</option>
                <option value="major">🔴 Major Offenses</option>
                <option value="traffic">🚗 Traffic Violations</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Hotspot Recency Toggle: All-Time vs Recent */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1 sm:min-w-[190px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Hotspot Recency
            </label>
            <div className="h-[44px] bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setUseDecay(false)}
                className={`flex-1 h-full rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  !useDecay
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">history</span>
                <span>All-Time</span>
              </button>
              <button
                type="button"
                onClick={() => setUseDecay(true)}
                className={`flex-1 h-full rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  useDecay
                    ? 'bg-[#1A5C3A] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">bolt</span>
                <span>Recent</span>
              </button>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-start gap-2 sm:ml-auto">
            {loading && (
              <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-bold text-emerald-600 h-[40px] sm:h-[44px]">
                <div className="w-3.5 h-3.5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                Refreshing…
              </div>
            )}
            {hasFilters && (
              <button onClick={clearFilters}
                className="h-[40px] sm:h-[44px] px-4 rounded-xl sm:rounded-2xl bg-red-50 text-[11px] sm:text-[12px] font-black text-red-500 uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 flex items-center gap-1.5 ml-auto cursor-pointer">
                <span className="material-symbols-outlined text-[14px]">close</span>Clear
              </button>
            )}
          </div>
        </div>

        {/* Explainer guidance banner for Officers */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[17px] text-emerald-700 shrink-0">info</span>
            <p className="text-[11px] font-bold text-slate-600 leading-tight">
              {useDecay ? (
                <>
                  <strong className="text-emerald-800 font-black">⚡ Recent Mode:</strong> Circle numbers show total records (e.g. 22). Colors show recent activity (green = quiet in last 30d, red = active this week).
                </>
              ) : (
                <>
                  <strong className="text-slate-800 font-black">📅 All-Time Mode:</strong> Circle numbers and colors both reflect cumulative historical volume.
                </>
              )}
            </p>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0 hidden sm:inline">
            Tap any circle to view case breakdown
          </span>
        </div>

        {hasFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active:</span>
            {filters.date_from && <span className="bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-emerald-100">From: {filters.date_from}</span>}
            {filters.date_to   && <span className="bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-emerald-100">To: {filters.date_to}</span>}
            {filters.category  && <span className="bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-emerald-100 capitalize">{filters.category}</span>}
          </div>
        )}
      </div>

      {/* Summary line */}
      {mapReady && !loading && stats.total > 0 && (
        <div className="mb-3 text-[11px] sm:text-[12px] font-bold text-slate-500 flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span>
            Showing <strong className="text-[#003624] font-black">{stats.total}</strong> violation{stats.total !== 1 ? 's' : ''} across <strong className="text-[#003624] font-black">{stats.locations}</strong> location{stats.locations !== 1 ? 's' : ''}
          </span>
          {stats.topLocation && (
            <span className="text-slate-400 hidden sm:inline">
              · Hottest: <strong className="text-[#CC0000] font-black">
                {stats.topLocation.name} ({stats.topLocation.count} violations)
              </strong>
            </span>
          )}
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/5"
           style={{ height: 'calc(100vh - 340px)', minHeight: '440px' }}>

        <div ref={mapContainer} style={{ position:'absolute', inset:0, opacity: mapReady ? 1 : 0, transition:'opacity 0.6s ease' }} />

        {!mapReady && !error && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-emerald-50 flex flex-col items-center justify-center z-20">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
            <p className="text-[11px] sm:text-[12px] font-black uppercase tracking-widest text-slate-400">Loading Campus Map…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-50/90 backdrop-blur-md p-6 sm:p-10 text-center">
            <span className="material-symbols-outlined text-[40px] sm:text-[48px] text-red-400 mb-2 sm:mb-3">wifi_off</span>
            <h3 className="text-red-900 font-black text-sm sm:text-[16px] mb-1 sm:mb-2">Map Connection Failed</h3>
            <p className="text-red-700/70 text-xs sm:text-[13px] max-w-md mb-4 sm:mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#003624] text-white rounded-full font-black text-[11px] sm:text-[12px] uppercase tracking-widest">Retry</button>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:px-10 sm:py-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col items-center text-center max-w-xs">
              <span className="material-symbols-outlined text-[32px] sm:text-[40px] text-slate-300 mb-2 sm:mb-3">location_off</span>
              <p className="text-xs sm:text-[14px] font-black text-[#003624] mb-1">No Violations Found</p>
              <p className="text-[11px] sm:text-[12px] font-medium text-slate-400">
                {hasFilters ? 'No violations match the selected filters.' : 'No violation records with location data exist yet.'}
              </p>
            </div>
          </div>
        )}

        {/* Legend & Status */}
        {mapReady && (
          <div className="absolute bottom-4 left-3.5 sm:left-5 z-10 flex flex-col gap-2 max-w-[calc(100%-2rem)]">
            <button 
              onClick={() => setShowLegend(!showLegend)}
              className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl sm:rounded-2xl border border-white shadow-lg flex items-center gap-2 text-left cursor-pointer active:scale-95 transition-transform w-fit"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-[#003624] uppercase tracking-wider">
                Heatmap Live
              </span>
              <span className="material-symbols-outlined text-[15px] text-slate-400">
                {showLegend ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showLegend && (
              <div className="bg-white/95 backdrop-blur-md px-4 py-3 sm:px-5 sm:py-4 rounded-2xl border border-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3">
                  Hotspot Risk Levels
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                  {LEGEND_ITEMS.map(({ color, label, desc }) => (
                    <div key={label} className="flex items-center gap-2 sm:gap-3">
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex-shrink-0 shadow-sm" style={{ background: color }} />
                      <div className="flex flex-col leading-none">
                        <span className="text-[10px] sm:text-[11px] font-black text-slate-700">{label}</span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">{desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Coord readout */}
        {mapReady && (
          <div className="hidden sm:flex absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-white shadow-md items-center gap-3">
            <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">LNG</span><span className="text-[11px] font-bold text-[#003624]">{coords.lng}</span></div>
            <div className="w-px h-5 bg-slate-100" />
            <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">LAT</span><span className="text-[11px] font-bold text-[#003624]">{coords.lat}</span></div>
            <div className="w-px h-5 bg-slate-100" />
            <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Z</span><span className="text-[11px] font-bold text-[#003624]">{coords.zoom}</span></div>
          </div>
        )}
      </div>

      <style>{`
        .swafo-popup .mapboxgl-popup-content { border-radius:20px;padding:0;box-shadow:0 20px 60px rgba(0,0,0,0.18);border:1px solid #f1f5f9;overflow:hidden; }
        .swafo-popup .mapboxgl-popup-close-button { font-size:16px;color:#64748b;padding:6px 10px; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity:0;cursor:pointer;position:absolute;right:0;width:100%;height:100%; }
        input[type="date"] { color-scheme:light; }
      `}</style>
    </div>
  );
}
