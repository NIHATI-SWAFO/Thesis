import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import campusData from '../../assets/dlsud-campus.json';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const DLSUD_CENTER = [120.9600, 14.3228];
const CAMPUS_BOUNDS = [[120.9540, 14.3175], [120.9660, 14.3310]];

// ── Haversine distance helper (km) ────────────────────────────────────────────
const haversine = ([lng1, lat1], [lng2, lat2]) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
};

export default function LiveNavigation() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const trailCoordsRef = useRef([]);
  const lastPosRef = useRef(null);
  const timerRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Stats
  const [seconds, setSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [steps, setSteps] = useState(0);

  // ── Init Mapbox ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const m = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/timothydevcastro/cmod8zewr004601pe41yy4304',
      center: DLSUD_CENTER,
      zoom: 17.5,
      pitch: 50,
      bearing: -17,
      antialias: true,
      attributionControl: false,
    });
    mapRef.current = m;

    m.on('load', () => {
      // ── Campus boundary overlay ────────────────────────────────────────────
      try {
        m.addSource('campus-outline-src', { type: 'geojson', data: campusData });
        m.addLayer({
          id: 'campus-outline', type: 'line', source: 'campus-outline-src',
          paint: { 'line-color': '#1A5C3A', 'line-width': 2.5, 'line-opacity': 0.7, 'line-dasharray': [4, 3] },
        });
      } catch (e) { console.warn('Campus boundary:', e.message); }

      // ── Patrol trail source + layers ────────────────────────────────────────
      m.addSource('patrol-trail', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
      });
      m.addLayer({
        id: 'trail-glow', type: 'line', source: 'patrol-trail',
        paint: { 'line-color': '#39E58C', 'line-width': 12, 'line-opacity': 0.15, 'line-blur': 8 },
      });
      m.addLayer({
        id: 'trail-line', type: 'line', source: 'patrol-trail',
        paint: { 'line-color': '#39E58C', 'line-width': 5, 'line-opacity': 0.95 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });

      setMapReady(true);
    });

    return () => {
      stopTracking();
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTracking]);

  // ── GPS Tracking ────────────────────────────────────────────────────────────
  const startTracking = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported on this device.');
      return;
    }
    setGpsError(null);
    setIsTracking(true);
    trailCoordsRef.current = [];
    lastPosRef.current = null;
    setDistanceKm(0);
    setSteps(0);
    setSeconds(0);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude: lng, latitude: lat, heading } = pos.coords;
        const coord = [lng, lat];
        const m = mapRef.current;
        if (!m || !m.isStyleLoaded()) return;

        // ── Accumulate distance (ignore GPS jitter < 2m) ──
        if (lastPosRef.current) {
          const d = haversine(lastPosRef.current, coord);
          if (d > 0.002) {
            setDistanceKm(prev => {
              const next = Math.round((prev + d) * 1000) / 1000;
              // Estimate steps: avg 762m per 1000 steps
              setSteps(Math.round((next * 1000) / 0.762));
              return next;
            });
          }
        }
        lastPosRef.current = coord;

        // ── Append to trail ──
        trailCoordsRef.current.push(coord);
        if (m.getSource('patrol-trail')) {
          m.getSource('patrol-trail').setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: trailCoordsRef.current },
          });
        }

        // ── Create / move user marker ──
        if (!userMarkerRef.current) {
          const el = document.createElement('div');
          el.innerHTML = `
            <div style="position:relative;width:36px;height:36px;">
              <div style="position:absolute;inset:0;border-radius:50%;background:rgba(26,92,58,0.2);animation:pulse-ring 1.5s ease-out infinite;"></div>
              <div style="position:absolute;inset:5px;border-radius:50%;background:#1A5C3A;border:3px solid white;box-shadow:0 4px 16px rgba(26,92,58,0.5);"></div>
            </div>
          `;
          userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat(coord).addTo(m);
        } else {
          userMarkerRef.current.setLngLat(coord);
        }

        // ── Navigation-mode camera: follow + rotate ──
        m.flyTo({
          center: coord,
          bearing: heading ?? m.getBearing(),
          pitch: 55,
          zoom: 18.5,
          duration: 1000,
          essential: true,
        });
      },
      (err) => {
        setGpsError(`GPS Error: ${err.message}`);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const resetMap = () => {
    stopTracking();
    trailCoordsRef.current = [];
    lastPosRef.current = null;
    setDistanceKm(0);
    setSteps(0);
    setSeconds(0);
    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
    if (mapRef.current?.getSource('patrol-trail')) {
      mapRef.current.getSource('patrol-trail').setData({
        type: 'Feature', geometry: { type: 'LineString', coordinates: [] },
      });
    }
    mapRef.current?.easeTo({ center: DLSUD_CENTER, pitch: 50, bearing: -17, zoom: 17.5, duration: 800 });
  };

  return (
    <div className="w-full font-manrope relative" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Pulsing ring animation ─────────────────────────────────── */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.8); opacity: 0; }
        }
      `}</style>

      {/* ── Full-screen Map ───────────────────────────────────────── */}
      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* ── Loading ───────────────────────────────────────────────── */}
      {!mapReady && (
        <div className="absolute inset-0 z-30 bg-[#ecfdf5] flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 border-4 border-[#1A5C3A]/20 border-t-[#1A5C3A] rounded-full animate-spin" />
          <p className="text-[12px] font-black uppercase tracking-widest text-[#1A5C3A]/60">Loading Campus Map…</p>
        </div>
      )}

      {/* ── TOP: Stats Bar ────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-lg border border-white px-5 py-3 grid grid-cols-3 divide-x divide-gray-100">
          <div className="flex flex-col items-center pr-4">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Time Active</span>
            <span className="text-[18px] font-black text-[#003624] tabular-nums tracking-tight">{formatTime(seconds)}</span>
          </div>
          <div className="flex flex-col items-center px-4">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Distance</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[18px] font-black text-[#003624]">{distanceKm.toFixed(2)}</span>
              <span className="text-[10px] font-bold text-gray-400">km</span>
            </div>
          </div>
          <div className="flex flex-col items-center pl-4">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Steps</span>
            <span className={`text-[18px] font-black tabular-nums ${isTracking ? 'text-[#1A5C3A]' : 'text-[#003624]'}`}>{steps.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── GPS Error ─────────────────────────────────────────────── */}
      {gpsError && (
        <div className="absolute top-24 left-4 right-4 z-20 bg-red-50/95 backdrop-blur-md rounded-2xl px-5 py-3 border border-red-100 flex items-center gap-3 shadow-md">
          <span className="material-symbols-outlined text-red-400 text-[20px]">location_off</span>
          <p className="text-[12px] font-bold text-red-500">{gpsError}</p>
        </div>
      )}

      {/* ── BOTTOM: Controls ──────────────────────────────────────── */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex flex-col gap-3">

        {/* Path recorded pill — shows when trail has points */}
        {trailCoordsRef.current.length > 1 && (
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl px-5 py-3 shadow-md border border-white flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-[#39E58C] rounded-full animate-pulse" />
            <p className="text-[12px] font-black text-[#003624]">
              Patrol path recording — {trailCoordsRef.current.length} GPS points captured
            </p>
          </div>
        )}

        {/* Main action button */}
        <div className="flex gap-3">
          {!isTracking ? (
            <button
              onClick={startTracking}
              disabled={!mapReady}
              className="flex-1 h-[58px] bg-[#1A5C3A] rounded-[20px] flex justify-center items-center gap-3 shadow-xl active:scale-95 transition-all border-b-4 border-[#14492c] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-white text-[24px]">my_location</span>
              <span className="font-black text-[16px] text-white tracking-tight">Use My Location</span>
            </button>
          ) : (
            <>
              <button
                onClick={stopTracking}
                className="flex-1 h-[58px] bg-[#E53935] rounded-[20px] flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all border-b-4 border-[#c62828]"
              >
                <span className="material-symbols-outlined text-white text-[22px]">stop_circle</span>
                <span className="font-black text-[15px] text-white tracking-tight">Stop Tracking</span>
              </button>
              <button
                onClick={resetMap}
                className="w-[58px] h-[58px] bg-white/95 backdrop-blur-md rounded-[20px] flex justify-center items-center shadow-lg border border-gray-100 active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-gray-500 text-[24px]">refresh</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
