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
  { color: '#00c851', label: 'Low',       range: '1–3' },
  { color: '#ffbb33', label: 'Moderate',  range: '4–6' },
  { color: '#ff8800', label: 'High',      range: '7–10' },
  { color: '#ff4444', label: 'Very High', range: '11–20' },
  { color: '#CC0000', label: 'Critical',  range: '21+' },
];

export default function MapTrial() {
  const mapContainer = useRef(null);
  const mapInstance  = useRef(null);
  const popupRef     = useRef(null);

  const [geojsonFeatureCount, setGeojsonFeatureCount] = useState(null);
  const [coords,   setCoords]   = useState({ lng: DLSUD_CENTER[0], lat: DLSUD_CENTER[1], zoom: 17 });
  const [mapReady, setMapReady] = useState(false);
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [stats,    setStats]    = useState({ total: 0, locations: 0, topLocation: null });
  const [filters,  setFilters]  = useState({ date_from: '', date_to: '', category: '' });

  // ── Add cluster layers once after source exists ─────────────────────────
  const addClusterLayers = useCallback((mapObj) => {
    if (!mapObj.getLayer('violations-heatmap')) mapObj.addLayer(HEATMAP_LAYER);
    if (!mapObj.getLayer('clusters'))           mapObj.addLayer(CLUSTER_CIRCLE_LAYER);
    if (!mapObj.getLayer('cluster-count'))      mapObj.addLayer(CLUSTER_COUNT_LAYER);
    if (!mapObj.getLayer('unclustered-point'))  mapObj.addLayer(UNCLUSTERED_LAYER);
  }, []);

  // ── Fetch + refresh data ────────────────────────────────────────────────
  const fetchAndRefresh = useCallback(async (mapObj, filterParams) => {
    if (!mapObj) return;
    setLoading(true);
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filterParams).filter(([, v]) => v !== ''))
    );
    try {
      const res  = await fetch(`${API_ENDPOINTS.VIOLATIONS_HEATMAP}?${params}`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();

      const geojson = data.geojson || { type: 'FeatureCollection', features: [] };
      setGeojsonFeatureCount(geojson.features.length);

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
        });
        addClusterLayers(mapObj);
      }

      const hotLocs = (data.location_summary || []).filter(l => l.count > 0);
      setStats({
        total:       data.total_violations || 0,
        locations:   hotLocs.length,
        topLocation: hotLocs[0] || null,
      });
    } catch (err) {
      console.error('Heatmap fetch failed:', err);
      setGeojsonFeatureCount(0);
    } finally {
      setLoading(false);
    }
  }, [addClusterLayers]);

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

      // ── Cluster click → zoom in ───────────────────────────────────────
      m.on('click', 'clusters', (e) => {
        const features = m.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        m.getSource('violations-source').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          m.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });

      // ── Individual point click → popup ────────────────────────────────
      m.on('click', 'unclustered-point', (e) => {
        const { location_name, rule_code, category, status, timestamp } = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates.slice();
        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: '260px', className: 'swafo-popup', offset: 16 })
          .setLngLat(coords)
          .setHTML(`
            <div style="padding:12px 16px;font-family:sans-serif;">
              <div style="font-size:9px;font-weight:900;color:#003624;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:4px;">Violation Record</div>
              <div style="font-size:14px;font-weight:800;color:#111;line-height:1.3;margin-bottom:8px;">${location_name}</div>
              <div style="display:flex;flex-direction:column;gap:4px;background:#f8fafc;border-radius:10px;padding:8px 10px;font-size:11px;">
                <div><span style="color:#94a3b8;font-weight:700;">Rule: </span><span style="font-weight:800;color:#1e293b;">${rule_code}</span></div>
                <div><span style="color:#94a3b8;font-weight:700;">Category: </span><span style="font-weight:800;color:#1e293b;">${category}</span></div>
                <div><span style="color:#94a3b8;font-weight:700;">Status: </span><span style="font-weight:800;color:#003624;">${status}</span></div>
                <div><span style="color:#94a3b8;font-weight:700;">Date: </span><span style="font-weight:800;color:#1e293b;">${timestamp}</span></div>
              </div>
            </div>
          `)
          .addTo(m);
      });

      m.on('mouseenter', 'clusters',          () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'clusters',          () => { m.getCanvas().style.cursor = ''; });
      m.on('mouseenter', 'unclustered-point', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'unclustered-point', () => { m.getCanvas().style.cursor = ''; });
      m.on('move', () => {
        const c = m.getCenter();
        setCoords({ lng: c.lng.toFixed(4), lat: c.lat.toFixed(4), zoom: m.getZoom().toFixed(2) });
      });
      m.on('error', (e) => setError(e.error?.message || 'Map failed to load'));

    } catch (err) { setError(err.message); }

    return () => {
      if (popupRef.current) popupRef.current.remove();
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [fetchAndRefresh]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    fetchAndRefresh(mapInstance.current, filters);
  }, [filters, mapReady, fetchAndRefresh]);

  const handleFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const clearFilters  = () => setFilters({ date_from: '', date_to: '', category: '' });
  const hasFilters    = filters.date_from || filters.date_to || filters.category;
  const isEmpty       = mapReady && !loading && geojsonFeatureCount === 0;

  const fieldBase = `h-[44px] bg-slate-50 border-2 border-slate-100 rounded-2xl px-4
    text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-400
    transition-all shadow-sm appearance-none w-full`;

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6 animate-fade-in font-pjs">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-[#003624] flex items-center justify-center text-emerald-400 shadow-lg">
              <span className="material-symbols-outlined text-[22px]">map</span>
            </div>
            <h1 className="text-[28px] font-black text-[#003624] tracking-tight leading-none">Campus Violation Heatmap</h1>
          </div>
          <p className="text-[13px] text-slate-400 font-medium ml-1 uppercase tracking-[0.12em]">
            Spatial violation analytics · DLSU-D Campus
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm flex flex-col items-center min-w-[90px]">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Violations</span>
            <span className="text-[26px] font-black text-[#003624] leading-none">{loading ? '…' : stats.total}</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm flex flex-col items-center min-w-[90px]">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Locations</span>
            <span className="text-[26px] font-black text-emerald-600 leading-none">{loading ? '…' : stats.locations}</span>
          </div>
          {stats.topLocation && (
            <div className="bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm flex flex-col max-w-[200px]">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Hottest Spot</span>
              <span className="text-[13px] font-black text-[#CC0000] leading-tight truncate">{stats.topLocation.name}</span>
              <span className="text-[10px] font-bold text-slate-400">{stats.topLocation.count} violations</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-100 rounded-3xl px-6 py-5 mb-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date From</label>
            <div className="relative">
              <input type="date" className={fieldBase} style={{ paddingLeft:'2.5rem' }}
                value={filters.date_from} onChange={e => handleFilter('date_from', e.target.value)} />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">event</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date To</label>
            <div className="relative">
              <input type="date" className={fieldBase} style={{ paddingLeft:'2.5rem' }}
                value={filters.date_to} onChange={e => handleFilter('date_to', e.target.value)} />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">event</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</label>
            <div className="relative">
              <select className={fieldBase} style={{ paddingRight:'2.5rem' }}
                value={filters.category} onChange={e => handleFilter('category', e.target.value)}>
                <option value="">All Categories</option>
                <option value="minor">⚠️ Minor Offenses</option>
                <option value="major">🔴 Major Offenses</option>
                <option value="traffic">🚗 Traffic Violations</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="flex items-end gap-3 ml-auto">
            {loading && (
              <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-600 h-[44px]">
                <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                Refreshing…
              </div>
            )}
            {hasFilters && (
              <button onClick={clearFilters}
                className="h-[44px] px-5 rounded-2xl bg-red-50 text-[12px] font-black text-red-500 uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px]">close</span>Clear
              </button>
            )}
          </div>
        </div>
        {hasFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active:</span>
            {filters.date_from && <span className="bg-emerald-50 text-emerald-700 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-100">From: {filters.date_from}</span>}
            {filters.date_to   && <span className="bg-emerald-50 text-emerald-700 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-100">To: {filters.date_to}</span>}
            {filters.category  && <span className="bg-emerald-50 text-emerald-700 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-100 capitalize">{filters.category}</span>}
          </div>
        )}
      </div>

      {/* Summary line */}
      {mapReady && !loading && stats.total > 0 && (
        <div className="mb-3 text-[12px] font-bold text-slate-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Showing <span className="font-black text-[#003624] mx-1">{stats.total}</span>
          violation{stats.total !== 1 ? 's' : ''} across
          <span className="font-black text-[#003624] mx-1">{stats.locations}</span>
          location{stats.locations !== 1 ? 's' : ''}
          {stats.topLocation && <>
            &nbsp;· Hottest: <span className="text-[#CC0000] font-black ml-1">{stats.topLocation.name} ({stats.topLocation.count})</span>
          </>}
        </div>
      )}

      {/* Map */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/5"
           style={{ height: 'calc(100vh - 330px)', minHeight: '560px' }}>

        <div ref={mapContainer} style={{ position:'absolute', inset:0, opacity: mapReady ? 1 : 0, transition:'opacity 0.6s ease' }} />

        {!mapReady && !error && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-emerald-50 flex flex-col items-center justify-center z-20">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
            <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">Loading Campus Map…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-50/90 backdrop-blur-md p-10 text-center">
            <span className="material-symbols-outlined text-[48px] text-red-400 mb-3">wifi_off</span>
            <h3 className="text-red-900 font-black text-[16px] mb-2">Map Connection Failed</h3>
            <p className="text-red-700/70 text-[13px] max-w-md mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-[#003624] text-white rounded-full font-black text-[12px] uppercase tracking-widest">Retry</button>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl px-10 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col items-center text-center max-w-xs">
              <span className="material-symbols-outlined text-[40px] text-slate-300 mb-3">location_off</span>
              <p className="text-[14px] font-black text-[#003624] mb-1">No Violations Found</p>
              <p className="text-[12px] font-medium text-slate-400">
                {hasFilters ? 'No violations match the selected filters.' : 'No violation records with location data exist yet.'}
              </p>
            </div>
          </div>
        )}

        {/* Legend */}
        {mapReady && (
          <div className="absolute bottom-5 left-5 z-10 flex flex-col gap-2.5">
            <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white shadow-lg flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-[#003624] uppercase tracking-widest">Heatmap Live</span>
            </div>
            <div className="bg-white/95 backdrop-blur-md px-5 py-4 rounded-2xl border border-white shadow-lg">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Cluster Intensity</p>
              <div className="flex flex-col gap-2">
                {LEGEND_ITEMS.map(({ color, label, range }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" style={{ background: color }} />
                    <div className="flex flex-col leading-none">
                      <span className="text-[11px] font-black text-slate-700">{label}</span>
                      <span className="text-[9px] font-bold text-slate-400">{range} violations</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Coord readout */}
        {mapReady && (
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-white shadow-md flex items-center gap-4">
            <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">LNG</span><span className="text-[12px] font-bold text-[#003624]">{coords.lng}</span></div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">LAT</span><span className="text-[12px] font-bold text-[#003624]">{coords.lat}</span></div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Z</span><span className="text-[12px] font-bold text-[#003624]">{coords.zoom}</span></div>
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
