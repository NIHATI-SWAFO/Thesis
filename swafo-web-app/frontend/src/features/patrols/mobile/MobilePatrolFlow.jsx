import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_ENDPOINTS } from '../../../api/config';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toPng } from 'html-to-image';
import campusData from '../../../assets/dlsud-campus.json';
import { getBuildingImage } from '../../../utils/buildingImages';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const DLSUD_CENTER = [120.9600, 14.3228];
// Tight bounds matching the actual DLSU-D campus polygon footprint (mirrors MapTrial)
const CAMPUS_BOUNDS = [[120.9555, 14.3193], [120.9645, 14.3290]];

// ── All DLSU-D named locations (mirrors MapTrial / backend constants/locations.py) ──
const DLSUD_LOCATIONS = [
  { name: 'Gate 3',                              lat: 14.3281023, lng: 120.9569612, category: 'Gates & Entry Points' },
  { name: 'Magdalo Gate',                        lat: 14.3216701, lng: 120.9633916, category: 'Gates & Entry Points' },
  { name: 'CTH Building A',                      lat: 14.3234062, lng: 120.9592155, category: 'Academic Building' },
  { name: 'CTH Building B',                      lat: 14.3232843, lng: 120.9594965, category: 'Academic Building' },
  { name: 'Doctor Fe Del Mundo Hall',            lat: 14.3202359, lng: 120.9628733, category: 'Academic Building' },
  { name: 'Doña Marcela Agoncillo Hall',         lat: 14.3211602, lng: 120.9622084, category: 'Academic Building' },
  { name: 'Felipe Calderon Hall',                lat: 14.3226234, lng: 120.9596990, category: 'Academic Building' },
  { name: 'Francisco Barzaga Hall',              lat: 14.3222260, lng: 120.9598766, category: 'Academic Building' },
  { name: 'Gregoria De Jesus Hall',              lat: 14.3237095, lng: 120.9582591, category: 'Academic Building' },
  { name: 'ICTC Building',                       lat: 14.3223323, lng: 120.9629743, category: 'Academic Building' },
  { name: 'Julian Felipe Hall',                  lat: 14.3211370, lng: 120.9628567, category: 'Academic Building' },
  { name: 'Ladislao Diwa Hall',                  lat: 14.3223048, lng: 120.9596321, category: 'Academic Building' },
  { name: 'LDH Kubo',                            lat: 14.3224933, lng: 120.9596815, category: 'Academic Building' },
  { name: 'Maria Salome Llanera Hall',           lat: 14.3227719, lng: 120.9584732, category: 'Academic Building' },
  { name: 'Mariano Alvarez Hall',                lat: 14.3219241, lng: 120.9629693, category: 'Academic Building' },
  { name: 'Mariano Trias Hall',                  lat: 14.3237533, lng: 120.9587990, category: 'Academic Building' },
  { name: 'MTH Covered Court',                   lat: 14.3232939, lng: 120.9589006, category: 'Academic Building' },
  { name: 'Paulo Campos Hall',                   lat: 14.3209194, lng: 120.9628865, category: 'Academic Building' },
  { name: 'Saint La Salle Hall',                 lat: 14.3256939, lng: 120.9590734, category: 'Academic Building' },
  { name: 'Santiago Alvarez Hall',               lat: 14.3232948, lng: 120.9582303, category: 'Academic Building' },
  { name: 'Severino de las Alas Hall',           lat: 14.3226348, lng: 120.9610677, category: 'Academic Building' },
  { name: 'Vito Belarmino Hall',                 lat: 14.3222303, lng: 120.9591472, category: 'Academic Building' },
  { name: 'DLSU-D High School',                  lat: 14.3255855, lng: 120.9585768, category: 'High School Area' },
  { name: 'De La Salle University - Dasmariñas High School Complex', lat: 14.3257582, lng: 120.9590448, category: 'High School Area' },
  { name: 'High School Annex Building',          lat: 14.3255627, lng: 120.9591360, category: 'High School Area' },
  { name: 'High School Chapel',                  lat: 14.3260533, lng: 120.9592000, category: 'High School Area' },
  { name: 'Basic Education Covered Court',       lat: 14.3252593, lng: 120.9590583, category: 'Facility' },
  { name: 'Botanical Garden Park',               lat: 14.3216709, lng: 120.9615933, category: 'Facility' },
  { name: 'DLSU-D Grandstand',                   lat: 14.3249513, lng: 120.9575162, category: 'Facility' },
  { name: 'GMH Quadrangle',                      lat: 14.3228834, lng: 120.9591659, category: 'Facility' },
  { name: 'Guest House',                         lat: 14.3208670, lng: 120.9596082, category: 'Facility' },
  { name: 'Ladies Dormitory Complex',            lat: 14.3207950, lng: 120.9592808, category: 'Facility' },
  { name: 'Motor Pool',                          lat: 14.3202606, lng: 120.9636220, category: 'Facility' },
  { name: 'Residencia La Salle',                 lat: 14.3204049, lng: 120.9620443, category: 'Facility' },
  { name: 'Ugnayang La Salle',                   lat: 14.3267127, lng: 120.9574525, category: 'Facility' },
  { name: 'University Student Government',       lat: 14.3228244, lng: 120.9590088, category: 'Facility' },
  { name: 'Aklatang Emilio Aguinaldo',           lat: 14.3207434, lng: 120.9619580, category: 'Library & Cultural' },
  { name: 'Ayuntamiento',                        lat: 14.3207567, lng: 120.9630615, category: 'Library & Cultural' },
  { name: 'Ayuntamiento De Gonzalez',            lat: 14.3205439, lng: 120.9630429, category: 'Library & Cultural' },
  { name: 'Museo De La Salle',                   lat: 14.3209977, lng: 120.9610387, category: 'Library & Cultural' },
  { name: 'Rizal Library',                       lat: 14.3210924, lng: 120.9618808, category: 'Library & Cultural' },
  { name: 'Antonio and Victoria Cojuanco Memorial Chapel of Our Lady of the Holy Rosary', lat: 14.3205188, lng: 120.9615292, category: 'Chapel & Religious' },
  { name: 'La Porteria De San Benildo',          lat: 14.3224365, lng: 120.9633927, category: 'Chapel & Religious' },
  { name: 'University Clinic',                   lat: 14.3211716, lng: 120.9629366, category: 'Health & Services' },
  { name: 'Cafe Museo',                          lat: 14.3216672, lng: 120.9600649, category: 'Food & Canteen' },
  { name: 'Food Square Extension',               lat: 14.3215291, lng: 120.9603484, category: 'Food & Canteen' },
  { name: 'University Food Square',              lat: 14.3215061, lng: 120.9599738, category: 'Food & Canteen' },
  { name: 'DLSU-D Faculty/Staff Parking',        lat: 14.3244490, lng: 120.9586005, category: 'Parking' },
  { name: 'DLSU-D Student/Faculty/Staff Parking',lat: 14.3263091, lng: 120.9578142, category: 'Parking' },
  { name: 'DLSU-D Faculty/Staff/Student Parking Areas', lat: 14.3263091, lng: 120.9578142, category: 'Parking' },
  { name: 'DLSU-D ULS Parking',                  lat: 14.3265000, lng: 120.9576000, category: 'Parking' },
  { name: 'High School Parking',                 lat: 14.3259515, lng: 120.9585919, category: 'Parking' },
  // ── Missing Locations Manually Added for Reliable Snapping ────────────────────────
  { name: 'Oval / Track',                        lat: 14.3251000, lng: 120.9572000, category: 'Facility' },
  { name: 'Rotonda',                             lat: 14.3248000, lng: 120.9588000, category: 'Facility' },
  { name: 'Purificacion Borromeo Hall',          lat: 14.3223000, lng: 120.9627000, category: 'Academic Building' },
  { name: 'Information Technology Department Office', lat: 14.3225000, lng: 120.9628000, category: 'Academic Building' },
  { name: 'Building Main',                       lat: 14.3221000, lng: 120.9630000, category: 'Academic Building' },
  { name: 'Mila\'s Diner',                       lat: 14.3211000, lng: 120.9616000, category: 'Food & Canteen' },
  { name: 'National Book Store',                 lat: 14.3215500, lng: 120.9602000, category: 'Facility' },
  { name: 'Bahayang Pag-Asa Center for Streetchildren', lat: 14.3268000, lng: 120.9572000, category: 'Facility' },
];

const MOBILE_CATEGORY_COLORS = {
  'Gates & Entry Points': '#f59e0b',
  'Academic Building':    '#2563eb',
  'High School Area':     '#7c3aed',
  'Facility':             '#0891b2',
  'Library & Cultural':   '#db2777',
  'Chapel & Religious':   '#dc2626',
  'Health & Services':    '#16a34a',
  'Food & Canteen':       '#ea580c',
  'Parking':              '#6b7280',
};

const CAMPUS_LOCATIONS_GEOJSON_MOBILE = {
  type: 'FeatureCollection',
  features: DLSUD_LOCATIONS.map(loc => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [loc.lng, loc.lat] },
    properties: { name: loc.name, category: loc.category, color: MOBILE_CATEGORY_COLORS[loc.category] || '#6b7280' },
  })),
};

// ── Official Patrol Zone Preset Mappings & Boundary Helpers (Step 3) ─────────
const ZONE_PRESET_LOCATIONS = {
  'Zone 1: Magdalo Gate & Entry': [
    'Magdalo Gate', 'La Porteria De San Benildo', 'ICTC Building', 'Mariano Alvarez Hall'
  ],
  'Zone 2: South Admin & Academic': [
    'Ayuntamiento De Gonzalez', 'Ayuntamiento', 'Paulo Campos Hall', 'Julian Felipe Hall',
    'Doctor Fe Del Mundo Hall', 'University Clinic', 'Motor Pool'
  ],
  'Zone 3: Library, Chapel & Cultural': [
    'Aklatang Emilio Aguinaldo', 'Antonio and Victoria Cojuanco Memorial Chapel of Our Lady of the Holy Rosary',
    'Museo De La Salle', 'Rizal Library', 'Botanical Garden Park'
  ],
  'Zone 4: Food Court & Dormitory': [
    'University Food Square', 'Food Square Extension', 'Cafe Museo', 'Guest House',
    'Ladies Dormitory Complex', 'Residencia La Salle'
  ],
  'Zone 5: Central Academic (West)': [
    'CTH Building A', 'CTH Building B', 'CTH Building', 'Felipe Calderon Hall', 'Francisco Barzaga Hall',
    'Ladislao Diwa Hall', 'LDH Kubo', 'Vito Belarmino Hall'
  ],
  'Zone 6: MTH & GMH Quad Area': [
    'Mariano Trias Hall', 'MTH Covered Court', 'Santiago Alvarez Hall',
    'Gregoria De Jesus Hall', 'Maria Salome Llanera Hall', 'GMH Quadrangle'
  ],
  'Zone 7: High School Complex': [
    'DLSU-D High School', 'De La Salle University - Dasmariñas High School Complex',
    'High School Annex Building', 'High School Chapel', 'Basic Education Covered Court',
    'Saint La Salle Hall'
  ],
  'Zone 8: Gate 3 & Sports Area': [
    'Gate 3', 'Ugnayang La Salle', 'DLSU-D Grandstand', 'Oval / Track',
    'DLSU-D Faculty/Staff/Student Parking Areas'
  ]
};

const getLocationCoords = (locName) => {
  if (!locName) return { lng: DLSUD_CENTER[0], lat: DLSUD_CENTER[1], name: 'Campus Area' };
  const clean = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = clean(locName);
  const found = DLSUD_LOCATIONS.find(l => {
    const lClean = clean(l.name);
    return lClean === target || lClean.includes(target) || target.includes(lClean);
  });
  if (found && found.lng != null && found.lat != null) {
    return { lng: found.lng, lat: found.lat, name: found.name };
  }
  return { lng: DLSUD_CENTER[0], lat: DLSUD_CENTER[1], name: locName };
};

const isLocationInZone = (locationName, zoneName, zoneLocations = []) => {
  if (!zoneName) return true; // No restriction if officer has no assigned zone
  const allowed = [
    ...(zoneLocations || []),
    ...(ZONE_PRESET_LOCATIONS[zoneName] || [])
  ];
  if (allowed.length === 0) return true;

  const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetNorm = normalize(locationName);

  return allowed.some(allowedLoc => {
    const allowedNorm = normalize(allowedLoc);
    if (!allowedNorm || !targetNorm) return false;
    return targetNorm.includes(allowedNorm) || allowedNorm.includes(targetNorm);
  });
};

// ── Heatmap configuration for Risk Zones ─────────────────────────────────────
const RISK_HEATMAP_CONFIG = {
  'heatmap-weight': ['interpolate', ['linear'], ['coalesce', ['get', 'point_count'], 1], 1, 0.2, 5, 0.5, 10, 0.8, 20, 1.0],
  'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 14, 1.0, 17, 3.0, 19, 5.0],
  'heatmap-color': [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(0,0,0,0)',
    0.1, '#00c851', // Low
    0.3, '#ffbb33', // Moderate
    0.6, '#ff8800', // High
    0.8, '#ff4444', // Very High
    1.0, '#CC0000', // Critical
  ],
  'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 15, 40, 17, 60, 19, 80],
  'heatmap-opacity': 0.75,
};

// ── Shared haversine + checkpoint helpers (used in both SelectAreaScreen & LiveMapScreen) ──
const haversineKm = (lng1, lat1, lng2, lat2) => {
  if (lng1 == null || lat1 == null || lng2 == null || lat2 == null) return 999;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  const res = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return isNaN(res) ? 999 : res;
};

const riskLabelFromCount = (count) => {
  if (count >= 21) return 'Critical Risk';
  if (count >= 11) return 'Very High Risk';
  if (count >= 7)  return 'High Risk';
  if (count >= 4)  return 'Moderate Risk';
  return 'Low Risk';
};

// Compute up to 4 nearby checkpoints from raw location data array.
// Priority: proximity radius cascade → then rank by risk (violation count).
const computeCheckpointsFromData = (area, locationData) => {
  if (!area || !locationData?.length) return [];
  const withDist = locationData
    .filter(l => l.lng != null && l.lat != null)
    .map(l => ({ ...l, _dist: haversineKm(area.lng, area.lat, l.lng, l.lat) }))
    .filter(l => (l.name || l.location_name) !== area.name);

  // Expand radius until we find buildings: 40m → 100m → 250m → 500m → no cap
  let nearby = [];
  for (const radiusKm of [0.04, 0.10, 0.25, 0.50]) {
    nearby = withDist.filter(l => l._dist <= radiusKm);
    if (nearby.length >= 1) break;
  }
  // Final fallback: no radius — take 4 closest by raw distance
  if (nearby.length === 0) {
    nearby = [...withDist].sort((a, b) => a._dist - b._dist).slice(0, 4);
  }

  // Rank candidate pool by risk (highest violation count first)
  return nearby
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 4)
    .map((l, i) => ({
      id: `cp-${i + 1}`,
      name: l.name || l.location_name,
      zone: riskLabelFromCount(l.count || 0),
      riskCount: l.count || 0,
      lng: l.lng,
      lat: l.lat,
    }));
};


// --- PRODUCTION-GRADE MOBILE FLOW WITH REFINED SCALING & PERSISTENCE ---

const FullMapScreen = ({ onBack, trailCoords = [] }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isTopDownView, setIsTopDownView] = useState(false);

  // Sync POV toggle
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: isTopDownView ? 0 : 55,
        bearing: isTopDownView ? 0 : mapRef.current.getBearing(),
        duration: 800
      });
    }
  }, [isTopDownView]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current || !mapContainerRef.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const m = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/timothydevcastro/cmod8zewr004601pe41yy4304',
        center: DLSUD_CENTER,
        zoom: 18,
        pitch: 55,
        bearing: 0,
        minZoom: 14,
        maxZoom: 20,
        antialias: true,
        attributionControl: false,
      });
      mapRef.current = m;

      m.on('load', () => {
        // Violations Source
        m.addSource('violations-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        // Safely fetch real violations heatmap
        fetch(API_ENDPOINTS.VIOLATIONS_HEATMAP)
          .then(res => res.ok ? res.json() : null)
          .then(vData => {
            if (vData?.geojson && m.getSource('violations-source')) {
              m.getSource('violations-source').setData(vData.geojson);
            }
          })
          .catch(() => {});

        // Risk Heatmap Layer (Hidden by default)
        m.addLayer({
          id: 'risk-heatmap', type: 'heatmap', source: 'violations-source',
          paint: RISK_HEATMAP_CONFIG,
          layout: { 'visibility': 'none' }
        });

        // Live Trail Source
        m.addSource('patrol-trail', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: trailCoords } },
        });

        // Glow Layer
        m.addLayer({
          id: 'trail-glow', type: 'line', source: 'patrol-trail',
          paint: { 'line-color': '#39E58C', 'line-width': 12, 'line-opacity': 0.15, 'line-blur': 8 },
        });

        // Main Trail Line
        m.addLayer({
          id: 'trail-line', type: 'line', source: 'patrol-trail',
          paint: { 'line-color': '#39E58C', 'line-width': 4.5, 'line-opacity': 0.95 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
      });
    }, 100);
    return () => {
      clearTimeout(timer);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Sync heatmap visibility
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      mapRef.current.setLayoutProperty('risk-heatmap', 'visibility', showHeatmap ? 'visible' : 'none');
    }
  }, [showHeatmap]);

  return (
    <div className="fixed inset-0 z-[8000] font-manrope">
      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Back button */}
      <div className="absolute top-6 left-5 z-[8001]">
        <button onClick={onBack} className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center text-[#1A5C3A] active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-[26px]">arrow_back</span>
        </button>
      </div>

      {/* FAB cluster */}
      <div className="absolute bottom-10 right-5 z-[8001] flex flex-col gap-3">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center transition-all ${showHeatmap ? 'bg-[#1A5C3A] text-white' : 'bg-white text-gray-400'}`}
        >
          <span className="material-symbols-outlined text-[26px]">layers</span>
        </button>
        <button
          onClick={() => mapRef.current?.easeTo({ center: DLSUD_CENTER, zoom: 18, pitch: isTopDownView ? 0 : 55, duration: 800 })}
          className="w-12 h-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-[#1A5C3A] active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-[26px]">my_location</span>
        </button>
        <button
          onClick={() => setIsTopDownView(!isTopDownView)}
          className="w-12 h-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-[#1A5C3A] active:scale-90 transition-transform"
          title={isTopDownView ? "Switch to 3D View" : "Switch to Top-Down View"}
        >
          <span className="material-symbols-outlined text-[26px]">
            {isTopDownView ? 'view_in_ar' : 'map'}
          </span>
        </button>
      </div>
    </div>
  );
};


const DynamicSummaryScreen = ({ onSave, onBack, sessionData, isSaving, trailCoords, distanceKm, capturedPhotos = [] }) => {
  const navigate = useNavigate();
  const exportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const shiftType = sessionData?.shift_type || 'Morning';
  const isNight = shiftType === 'Evening';
  const mapStyle = isNight ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
  
  // Adaptive theming for glass cards
  const glassBg = isNight ? 'bg-[#2A2A2A]/80 border-white/5' : 'bg-white/80 border-black/5';
  const textColor = isNight ? 'text-white' : 'text-gray-900';
  const subtextColor = isNight ? 'text-white/60' : 'text-gray-500';
  const iconBg = isNight ? 'bg-white/5' : 'bg-black/5';

  const formatDisplayTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = () => {
    if (!sessionData?.actual_start || !sessionData?.actual_end) return sessionData?.duration_display || '0m';
    const start = new Date(sessionData.actual_start);
    const end = new Date(sessionData.actual_end);
    const diffMins = Math.floor((end - start) / 60000);
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleSaveImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);

    try {
      // Small pause for layout stabilization
      await new Promise(r => setTimeout(r, 100));

      const filter = (node) => {
        if (node && node.hasAttribute && node.hasAttribute('data-html2canvas-ignore')) {
          return false;
        }
        return true;
      };

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: isNight ? '#0D1F16' : '#F4F6F5',
        filter,
        skipFonts: true,
      });

      const filename = `Patrol_${sessionData?.shift_type || 'Summary'}_${Date.now()}.png`;

      // Try native share API first on mobile
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Patrol Summary',
            text: 'SWAFO Patrol Session Summary'
          });
          setIsExporting(false);
          return;
        }
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          setIsExporting(false);
          return;
        }
      }

      // Direct download fallback
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Export failed:", err);
      // Retry with 1x resolution if high-res failed
      try {
        const fallbackDataUrl = await toPng(exportRef.current, {
          cacheBust: true,
          pixelRatio: 1,
          backgroundColor: isNight ? '#0D1F16' : '#F4F6F5',
          filter: (node) => !node?.hasAttribute?.('data-html2canvas-ignore'),
          skipFonts: true,
        });
        const link = document.createElement('a');
        link.href = fallbackDataUrl;
        link.download = `Patrol_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackErr) {
        console.error("Fallback export failed:", fallbackErr);
        alert("Failed to export image. Please try taking a screenshot.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const locationName = sessionData?.location || 'Campus Patrol';
  const checkpoints = Array.isArray(sessionData?.checkpoints_data) ? sessionData.checkpoints_data : [];
  const violationsCount = sessionData?.violations_count || sessionData?.violationCount || 0;
  const officerName = sessionData?.officer_name || sessionData?.officer_details?.full_name || 'SWAFO Officer';
  const bldgHeroImg = getBuildingImage(locationName) || (checkpoints[0] && getBuildingImage(checkpoints[0].name || checkpoints[0].building));
  const officerPhotos = (capturedPhotos || []).filter(p => {
    const url = p?.url || p;
    if (!url || typeof url !== 'string') return Boolean(url);
    return !url.includes('/images/buildings/') && !url.includes('/media/buildings/');
  });
  const lastPhoto = officerPhotos.length > 0 
    ? (officerPhotos[0].url || officerPhotos[0]) 
    : bldgHeroImg;

  return (
    <div ref={exportRef} className={`fixed inset-0 z-[9000] flex flex-col font-manrope animate-fade-in ${isNight ? 'bg-[#0D1F16]' : 'bg-[#F4F6F5]'} overflow-hidden`}>
      {/* Background Image / Ambient Blur */}
      {lastPhoto && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img src={lastPhoto} alt="Patrol Background" className="w-full h-72 object-cover opacity-20 blur-xl scale-110" />
          <div className={`absolute inset-0 bg-gradient-to-b ${isNight ? 'from-[#0D1F16]/60 via-[#0D1F16]/95 to-[#0D1F16]' : 'from-[#F4F6F5]/40 via-[#F4F6F5]/90 to-[#F4F6F5]'}`} />
        </div>
      )}

      {/* Top Floating Controls */}
      <div className="relative z-30 px-5 pt-10 pb-3 flex justify-between items-center shrink-0">
        <button 
          onClick={onBack} 
          data-html2canvas-ignore 
          className="w-10 h-10 bg-white/90 backdrop-blur-md border border-gray-200/80 rounded-full shadow-md flex items-center justify-center text-gray-800 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        
        <button 
          onClick={handleSaveImage} 
          disabled={isExporting} 
          data-html2canvas-ignore 
          className="px-4 h-10 bg-white/90 backdrop-blur-md border border-gray-200/80 rounded-full shadow-md flex items-center gap-2 text-gray-800 active:scale-90 transition-transform cursor-pointer"
        >
          {isExporting ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">download</span>}
          <span className="font-bold text-[13px]">{isExporting ? 'Saving...' : 'Save Image'}</span>
        </button>
      </div>

      {/* Scrollable Summary Body */}
      <div className="relative z-20 flex-1 overflow-y-auto px-5 pb-8 space-y-4 no-scrollbar">

        {/* ── 1. HERO BUILDING / LOCATION BANNER ── */}
        <div className="relative rounded-[28px] overflow-hidden shadow-md border-2 border-white bg-gradient-to-br from-[#003624] to-[#1A5C3A] text-white">
          {bldgHeroImg && (
            <div className="relative h-44 w-full overflow-hidden">
              <img src={bldgHeroImg} alt={locationName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
              <div className="absolute top-3.5 right-3.5 bg-black/50 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#39E58C] rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-wider text-[#39E58C]">Verified GPS</span>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <div className="flex items-center gap-1.5 text-white/80 text-[10px] font-bold uppercase tracking-widest mb-1">
                  <span className="material-symbols-outlined text-[14px] text-[#39E58C]">location_on</span>
                  <span>{sessionData?.assignedZone || 'Designated Campus Zone'}</span>
                </div>
                <h2 className="font-black text-[22px] text-white leading-tight tracking-tight drop-shadow-sm">
                  {locationName}
                </h2>
              </div>
            </div>
          )}

          {/* Officer footer chip */}
          <div className="px-4 py-2.5 bg-black/25 backdrop-blur-sm flex items-center justify-between border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#39E58C]/20 border border-[#39E58C]/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#39E58C] text-[13px]">badge</span>
              </div>
              <span className="text-[11px] font-bold text-white/90">{officerName}</span>
            </div>
            <span className="text-[10px] font-bold text-white/60">
              {new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* ── 2. SESSION TITLE & STATUS ── */}
        <div className="px-1 pt-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black text-[#1A5C3A] tracking-[0.2em] uppercase">Session Detail</span>
            <span className="bg-[#39E58C] text-[#003624] text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
              Completed
            </span>
          </div>
          <h1 className="font-black text-[28px] text-[#000000] leading-none tracking-tight">
            {shiftType} Patrol
          </h1>
          <p className="text-[12px] font-bold text-gray-400 mt-1">
            {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* ── 3. METRIC TILES (2x2 Grid) ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'DURATION', value: calculateDuration(), icon: 'schedule', color: 'text-emerald-700' },
            { label: 'DISTANCE', value: distanceKm > 0 ? `${distanceKm} km` : '0.15 km', icon: 'explore', color: 'text-blue-600' },
            { label: 'TIME STARTED', value: formatDisplayTime(sessionData?.actual_start), icon: 'login', color: 'text-amber-600' },
            { label: 'TIME FINISHED', value: formatDisplayTime(sessionData?.actual_end), icon: 'logout', color: 'text-purple-600' }
          ].map(stat => (
            <div key={stat.label} className="flex flex-col gap-2 p-4 rounded-[22px] bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                  <span className={`material-symbols-outlined text-[16px] ${stat.color}`}>{stat.icon}</span>
                </div>
                <span className="font-black text-[9px] text-gray-400 uppercase tracking-widest">{stat.label}</span>
              </div>
              <span className="font-black text-[19px] text-[#000000] leading-none tracking-tight">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* ── 4. CHECKPOINTS CLEARED SUMMARY ── */}
        {checkpoints.length > 0 && (
          <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1A5C3A] text-[18px]">verified</span>
                <span className="font-black text-[13px] text-[#000000] tracking-tight">Checkpoints Cleared</span>
              </div>
              <span className="bg-[#E8F5E9] text-[#1A5C3A] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                {checkpoints.filter(c => c.done !== false).length}/{checkpoints.length} Cleared
              </span>
            </div>
            <div className="space-y-2">
              {checkpoints.map((cp, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-[#1A5C3A] text-white flex items-center justify-center shrink-0 text-[11px] font-black">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[13px] text-[#000] truncate leading-tight">{cp.name || cp.label || `Checkpoint ${idx + 1}`}</p>
                    <p className="text-[10px] font-semibold text-emerald-600">Inspected & Verified</p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 shrink-0">
                    {cp.time || formatDisplayTime(sessionData?.actual_end)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. INCIDENT & VIOLATIONS STATUS ── */}
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${violationsCount > 0 ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-emerald-50 text-[#1A5C3A] border border-emerald-200'}`}>
              <span className="material-symbols-outlined text-[22px]">{violationsCount > 0 ? 'warning' : 'shield'}</span>
            </div>
            <div>
              <p className="font-black text-[16px] text-[#000] leading-tight">
                {violationsCount > 0 ? `${violationsCount} Violations Recorded` : 'Zero Incidents Logged'}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                {violationsCount > 0 ? 'Review incident cases' : 'Normal Patrol Condition'}
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${violationsCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-[#003624]'}`}>
            {violationsCount > 0 ? 'Alert' : 'All Clear'}
          </span>
        </div>

        {/* ── 6. OFFICER OBSERVATIONS / NOTES ── */}
        {sessionData?.notes && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-[24px] p-4 flex gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">edit_note</span>
            <div className="flex-1">
              <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-0.5">Officer Observation</p>
              <p className="text-[12px] font-medium text-amber-950 leading-relaxed italic">
                “{sessionData.notes}”
              </p>
            </div>
          </div>
        )}

        {/* ── 7. EVIDENCE GALLERY PREVIEW ── */}
        {officerPhotos.length > 0 && (
          <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-black text-[13px] text-[#000]">Captured Evidence</span>
              <span className="text-[10px] font-bold text-gray-400">{officerPhotos.length} photos</span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {officerPhotos.map((photo, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-100 shadow-sm bg-gray-50">
                  <img src={photo.url || photo} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 8. SAVE TO HISTORY ACTION BUTTON ── */}
        <div className="pt-2 pb-4">
          <button 
            onClick={onSave} 
            disabled={isSaving} 
            data-html2canvas-ignore 
            className={`w-full h-[58px] ${isSaving ? 'bg-gray-400' : 'bg-[#00875A] hover:bg-[#00704A]'} rounded-[20px] shadow-[0_8px_30px_rgba(0,135,90,0.35)] flex justify-center items-center gap-2.5 text-white active:scale-[0.98] transition-all cursor-pointer`}
          >
            {isSaving ? <span className="animate-spin material-symbols-outlined text-[20px]">sync</span> : <span className="material-symbols-outlined text-[22px]">save</span>}
            <span className="font-black text-[16px] tracking-tight">{isSaving ? 'Saving Patrol Record...' : 'Save to History'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

// Helper: find nearest location from real API data
const getNearestFromData = (lng, lat, locationSummary) => {
  if (!locationSummary || locationSummary.length === 0) return 'Campus Area';
  let nearest = locationSummary[0];
  let minDist = Infinity;
  locationSummary.forEach(loc => {
    if (!loc.lat || !loc.lng) return;
    const d = Math.sqrt(Math.pow(loc.lng - lng, 2) + Math.pow(loc.lat - lat, 2));
    if (d < minDist) { minDist = d; nearest = loc; }
  });
  return nearest.name || nearest.location_name || 'Campus Area';
};

const SelectAreaScreen = ({ onConfirm, onBack, formData, setFormData }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const locationDataRef = useRef([]);
  const detailsRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [hotspotCount, setHotspotCount] = useState(0);
  const [selectedArea, setSelectedArea] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [suggestedRoute, setSuggestedRoute] = useState([]);
  const [patrolledToday, setPatrolledToday] = useState([]);
  const [patrolMode, setPatrolMode] = useState('route'); // 'single' | 'route'
  const [previewCheckpoints, setPreviewCheckpoints] = useState([]);

  // ── Step 3: Officer Monthly Zone Assignment State ──────────────────────────
  const [assignedZone, setAssignedZone] = useState(null);
  const assignedZoneRef = useRef(null);
  const [restrictedAlert, setRestrictedAlert] = useState(null);
  const [loadingZone, setLoadingZone] = useState(true);

  // Sync ref with state so Mapbox click listener always sees the current zone
  useEffect(() => {
    assignedZoneRef.current = assignedZone;
  }, [assignedZone]);

  // Fetch logged-in officer's active monthly zone
  useEffect(() => {
    const fetchOfficerZone = async () => {
      try {
        setLoadingZone(true);
        const loggedUser = (() => {
          try {
            return JSON.parse(localStorage.getItem('swafo_mock_user') || '{}');
          } catch {
            return {};
          }
        })();

        const officerId = loggedUser.id;
        const officerEmail = loggedUser.email;
        const officerName = loggedUser.name;

        let foundZone = null;

        // 1. Try my_assignment endpoint
        try {
          let url = `${API_ENDPOINTS.PATROLS_ASSIGNMENTS_MY}?`;
          if (officerId) url += `officer_id=${officerId}&`;
          if (officerEmail) url += `officer_email=${encodeURIComponent(officerEmail)}&`;
          if (officerName) url += `officer_name=${encodeURIComponent(officerName)}&`;

          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data && data.zone) {
              foundZone = {
                zone: data.zone,
                locations: data.locations && data.locations.length > 0 
                  ? data.locations 
                  : (ZONE_PRESET_LOCATIONS[data.zone] || [])
              };
            }
          }
        } catch (e) {
          console.warn('my_assignment fetch failed, using fallback:', e);
        }

        // 2. Fallback: check all current assignments
        if (!foundZone) {
          try {
            const allRes = await fetch(API_ENDPOINTS.PATROLS_ASSIGNMENTS_CURRENT);
            if (allRes.ok) {
              const allData = await allRes.json();
              const list = Array.isArray(allData) ? allData : (allData.results || []);
              const match = list.find(a => 
                (officerId && a.officer === officerId) ||
                (officerEmail && a.officer_email?.toLowerCase() === officerEmail.toLowerCase()) ||
                (officerName && a.officer_name?.toLowerCase().includes(officerName.toLowerCase().split(' ')[0]))
              );
              if (match) {
                foundZone = {
                  zone: match.zone,
                  locations: ZONE_PRESET_LOCATIONS[match.zone] || []
                };
              }
            }
          } catch (e) {
            console.warn('PATROLS_ASSIGNMENTS_CURRENT fallback failed:', e);
          }
        }

        if (foundZone) {
          setAssignedZone(foundZone);
          assignedZoneRef.current = foundZone;

          // Auto-center map on assigned zone if map is already initialized
          const firstLocName = (foundZone.locations || [])[0];
          const coords = getLocationCoords(firstLocName);
          if (coords && mapRef.current) {
            mapRef.current.flyTo({ center: [coords.lng, coords.lat], zoom: 17, duration: 800 });
          }
        }
      } catch (err) {
        console.error('Failed to load officer assignment:', err);
      } finally {
        setLoadingZone(false);
      }
    };

    fetchOfficerZone();
  }, []);

  // Assign risk label + color based on violation count
  const getRiskLevel = (count) => {
    if (count >= 21) return { label: 'Critical', color: '#CC0000', dot: 'bg-[#CC0000]' };
    if (count >= 11) return { label: 'Very High', color: '#ff4444', dot: 'bg-[#ff4444]' };
    if (count >= 7)  return { label: 'High', color: '#ff8800', dot: 'bg-[#ff8800]' };
    if (count >= 4)  return { label: 'Moderate', color: '#ffbb33', dot: 'bg-[#ffbb33]' };
    return { label: 'Low', color: '#00c851', dot: 'bg-[#00c851]' };
  };

  // Auto-detect shift from 24h time string "HH:MM"
  const getShiftFromTime = (timeStr) => {
    if (!timeStr) return 'Morning';
    const [h] = timeStr.split(':').map(Number);
    if (h >= 4 && h < 12)  return 'Morning';    // 04:00 – 11:59
    if (h >= 12 && h < 16) return 'Afternoon';  // 12:00 – 15:59
    return 'Evening';                            // 16:00 – 23:59 and 00:00 – 03:59
  };

  const handleTimeChange = (timeStr) => {
    setFormData(prev => ({ ...prev, start_time: timeStr, shift_type: getShiftFromTime(timeStr) }));
  };

  // ── Uses shared module-level helpers: haversineKm, riskLabelFromCount, computeCheckpointsFromData ─
  const riskColor = (count) => {
    if (count >= 21) return '#CC0000';
    if (count >= 11) return '#ff4444';
    if (count >= 7)  return '#ff8800';
    if (count >= 4)  return '#ffbb33';
    return '#00c851';
  };

  // Wraps checkpoint generation; when officer has an assigned zone, creates the complete route of all designated buildings in their zone
  const computeNearbyCheckpoints = (area) => {
    if (!area) return [];
    const currentZone = assignedZoneRef.current;

    // If officer has an assigned zone, include all designated buildings in this zone!
    if (currentZone && currentZone.zone) {
      const zoneLocs = currentZone.locations && currentZone.locations.length > 0 
        ? currentZone.locations 
        : (ZONE_PRESET_LOCATIONS[currentZone.zone] || []);
      
      const clean = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const areaClean = clean(area.name);

      // Selected area is the first stop (START)
      const selectedCoords = getLocationCoords(area.name) || { lng: area.lng, lat: area.lat };
      const selectedRisk = (locationDataRef.current || []).find(l => clean(l.name || l.location_name) === areaClean)?.count || 0;

      const selectedEntry = {
        id: 'cp-selected',
        name: area.name,
        zone: currentZone.zone,
        riskCount: selectedRisk,
        lng: selectedCoords.lng,
        lat: selectedCoords.lat,
      };

      // All other buildings in this assigned zone
      const otherBuildings = zoneLocs
        .filter(locName => clean(locName) !== areaClean)
        .map((locName, idx) => {
          const coords = getLocationCoords(locName);
          const risk = (locationDataRef.current || []).find(l => clean(l.name || l.location_name) === clean(locName))?.count || 0;
          const dist = coords && selectedCoords ? haversineKm(selectedCoords.lng, selectedCoords.lat, coords.lng, coords.lat) : idx;
          return {
            id: `cp-zone-${idx + 1}`,
            name: coords?.name || locName,
            zone: currentZone.zone,
            riskCount: risk,
            lng: coords?.lng || area.lng,
            lat: coords?.lat || area.lat,
            _dist: dist
          };
        })
        // Sort remaining buildings by proximity to create a natural walking route through the zone
        .sort((a, b) => a._dist - b._dist);

      return [selectedEntry, ...otherBuildings];
    }

    // Default fallback when unassigned
    const nearby = computeCheckpointsFromData(area, locationDataRef.current || []);
    return [
      { id: 'cp-selected', name: area.name, zone: 'Selected Area', riskCount: 0, lng: area.lng, lat: area.lat },
      ...nearby,
    ].slice(0, 5);
  };

  // Recompute previewCheckpoints whenever selectedArea or assignedZone changes
  useEffect(() => {
    if (selectedArea) {
      setPreviewCheckpoints(computeNearbyCheckpoints(selectedArea));
    }
  }, [selectedArea, assignedZone]);

  // Core Area Selection Logic with Zone Restriction Enforcement (Step 3)
  const processAreaSelection = (areaName, pinLng, pinLat) => {
    const currentZone = assignedZoneRef.current;
    if (currentZone && currentZone.zone) {
      const allowed = isLocationInZone(areaName, currentZone.zone, currentZone.locations);
      if (!allowed) {
        // Outside of assigned zone! Block selection and show modal!
        setRestrictedAlert({
          attemptedLocation: areaName,
          zoneName: currentZone.zone,
          allowedLocations: currentZone.locations && currentZone.locations.length > 0 
            ? currentZone.locations 
            : (ZONE_PRESET_LOCATIONS[currentZone.zone] || [])
        });
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
        setSelectedArea(null);
        setSheetVisible(false);
        return;
      }
    }

    // Inside zone or unrestricted
    setRestrictedAlert(null);
    if (markerRef.current) markerRef.current.remove();

    const el = document.createElement('div');
    el.style.cssText = `
      width:44px; height:44px; border-radius:50%;
      background:#1A5C3A; border:4px solid white;
      box-shadow:0 8px 24px rgba(26,92,58,0.4);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer;
    `;
    el.innerHTML = `<span class="material-symbols-outlined" style="color:white;font-size:20px;">location_on</span>`;

    if (mapRef.current) {
      markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([pinLng, pinLat])
        .addTo(mapRef.current);
      mapRef.current.easeTo({ center: [pinLng, pinLat], zoom: Math.max(mapRef.current.getZoom(), 17), duration: 400 });
    }
    const newArea = { name: areaName, lng: pinLng, lat: pinLat };
    setSelectedArea(newArea);
    setPreviewCheckpoints(computeNearbyCheckpoints(newArea));
    setSheetVisible(true);
  };

  const handleSelectAllowedLocation = (locName) => {
    setRestrictedAlert(null);
    const coords = getLocationCoords(locName);
    if (coords) {
      processAreaSelection(coords.name || locName, coords.lng, coords.lat);
    } else {
      processAreaSelection(locName, DLSUD_CENTER[0], DLSUD_CENTER[1]);
    }
  };

  const handleAreaSelect = (name, lng, lat) => {
    processAreaSelection(name, lng, lat);
  };

  const handleConfirmArea = () => {
    if (!selectedArea) return;
    const freshPreview = computeNearbyCheckpoints(selectedArea);
    const checkpoints = patrolMode === 'single'
      ? [{ id: 'cp-selected', name: selectedArea.name, zone: assignedZone?.zone || 'Single Building Patrol', riskCount: 0, lng: selectedArea.lng, lat: selectedArea.lat }]
      : freshPreview;
    setFormData(prev => ({
      ...prev,
      location: selectedArea.name,
      location_lng: selectedArea.lng,
      location_lat: selectedArea.lat,
      checkpoints,
      patrolMode,
      assignedZone: assignedZone?.zone,
      locationData: locationDataRef.current || [],
    }));
    setSheetVisible(false);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleDismissSheet = () => {
    setSheetVisible(false);
    // Remove marker
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
    setSelectedArea(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current || !mapContainerRef.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const m = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/timothydevcastro/cmod8zewr004601pe41yy4304',
        center: DLSUD_CENTER,
        zoom: 16.5,
        pitch: 30,
        bearing: -17,
        maxBounds: CAMPUS_BOUNDS,
        minZoom: 14,
        maxZoom: 19,
        antialias: true,
        attributionControl: false,
      });
      mapRef.current = m;

      m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

      m.on('load', async () => {
        m.resize();
        try {
          // Fetch heatmap AND today's patrolled locations in parallel
          const [heatmapRes, patrolledRes] = await Promise.all([
            fetch(API_ENDPOINTS.VIOLATIONS_HEATMAP),
            fetch(API_ENDPOINTS.PATROLS_PATROLLED_TODAY).catch(() => null),
          ]);
          const data = heatmapRes.ok ? await heatmapRes.json() : { geojson: { type: 'FeatureCollection', features: [] } };
          const patrolledData = patrolledRes?.ok ? await patrolledRes.json() : { patrolled_locations: [] };
          const alreadyPatrolled = (patrolledData.patrolled_locations || []).map(l => l.toLowerCase().trim());
          setPatrolledToday(alreadyPatrolled);

          const geojson = data.geojson || { type: 'FeatureCollection', features: [] };
          setHotspotCount(data.total_violations || 0);

          // Store real location data for accurate proximity matching
          const locSummary = data.location_summary || [];
          // Also extract unique locations from geojson features as fallback
          const fromFeatures = [];
          geojson.features.forEach(f => {
            const name = f.properties?.location_name;
            const [fLng, fLat] = f.geometry?.coordinates || [];
            if (name && fLng && fLat && !fromFeatures.find(l => l.name === name)) {
              fromFeatures.push({ name, lng: fLng, lat: fLat });
            }
          });
          const loaded = locSummary.length > 0 ? locSummary : fromFeatures;
          locationDataRef.current = loaded;
          if (selectedArea) {
            setPreviewCheckpoints(computeNearbyCheckpoints(selectedArea));
          }

          // Build suggested route: sort by count, exclude already-patrolled locations today
          const sorted = [...(locSummary.length > 0 ? locSummary : fromFeatures)]
            .filter(l => (l.count || 0) > 0)
            .filter(l => !alreadyPatrolled.includes((l.name || l.location_name || '').toLowerCase().trim()))
            .sort((a, b) => (b.count || 0) - (a.count || 0))
            .slice(0, 5);
          setSuggestedRoute(sorted);

          m.addSource('violations-mobile', {
            type: 'geojson', data: geojson,
            cluster: true, clusterRadius: 25, clusterMaxZoom: 16,
          });

          // ── World mask — hide everything outside the DLSU-D campus polygon ───────────────────
          try {
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
            m.addSource('world-mask-mobile', { type: 'geojson', data: worldMask });
            m.addLayer({ id: 'world-mask-mobile', type: 'fill', source: 'world-mask-mobile',
              paint: { 'fill-color': '#ecfdf5', 'fill-opacity': 1 } });
          } catch (maskErr) {
            console.warn('World mask failed:', maskErr);
          }

          m.addLayer({ id: 'mobile-heatmap', type: 'heatmap', source: 'violations-mobile',
            paint: {
              'heatmap-weight': ['interpolate', ['linear'], ['coalesce', ['get', 'point_count'], 1], 1, 0.3, 10, 1.0],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 14, 1.0, 17, 3.5],
              'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.2, '#00c851', 0.5, '#ffbb33', 0.75, '#ff8800', 1.0, '#ff4444'],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 14, 30, 17, 55],
              'heatmap-opacity': 0.80,
            },
          });
          m.addLayer({ id: 'mobile-clusters', type: 'circle', source: 'violations-mobile', filter: ['has', 'point_count'],
            paint: { 'circle-color': ['step', ['get', 'point_count'], '#00c851', 4, '#ffbb33', 8, '#ff4444'], 'circle-radius': ['step', ['get', 'point_count'], 16, 4, 20, 8, 26], 'circle-stroke-width': 3, 'circle-stroke-color': '#fff', 'circle-opacity': 0.95 },
          });
          m.addLayer({ id: 'mobile-cluster-count', type: 'symbol', source: 'violations-mobile', filter: ['has', 'point_count'],
            layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 11, 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'] },
            paint: { 'text-color': '#fff' },
          });
          m.addLayer({ id: 'mobile-unclustered', type: 'circle', source: 'violations-mobile', filter: ['!', ['has', 'point_count']],
            paint: { 'circle-color': '#ff4444', 'circle-radius': 8, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
          });

          // ── Campus location pins (all 52 named locations — clickable invisibly) ───────────────────────────
          // NOTE: The dots are set to 1% opacity (0.01) so the map looks clean.
          // Mapbox GL ignores opacity 0 for click detection, so 0.01 makes them invisible but still clickable!
          m.addSource('campus-locations-mobile', { type: 'geojson', data: CAMPUS_LOCATIONS_GEOJSON_MOBILE });
          m.addLayer({
            id: 'campus-loc-circle-mobile',
            type: 'circle',
            source: 'campus-locations-mobile',
            paint: {
              'circle-color':        '#000000',
              'circle-radius':       ['interpolate', ['linear'], ['zoom'], 15, 12, 17, 16, 19, 22], // Made even larger for better touch targets
              'circle-opacity':      0.01,
              'circle-stroke-width': 0,
            },
          });

          setMapReady(true);
        } catch (e) {
          console.error('Mobile heatmap failed:', e);
          setMapReady(true);
        }
      });

      // ── Map click → use real API data with Zone Restriction (Step 3) ────────────
      m.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        
        // 1. Comfortable fat-finger padding (40x40 pixels)
        const bbox = [
          [e.point.x - 20, e.point.y - 20],
          [e.point.x + 20, e.point.y + 20]
        ];

        // 0. Campus location pin tap — highest priority, use pin name + exact coords
        const campusPinFeatures = m.queryRenderedFeatures(bbox, { layers: ['campus-loc-circle-mobile'] });
        if (campusPinFeatures.length > 0) {
          const { name } = campusPinFeatures[0].properties;
          const [pinLng, pinLat] = campusPinFeatures[0].geometry.coordinates.slice();
          processAreaSelection(name, pinLng, pinLat);
          return;
        }

        // 1. Check if user tapped directly on an unclustered violation point
        const pointFeatures = m.queryRenderedFeatures(bbox, { layers: ['mobile-unclustered'] });
        const clusterFeatures = m.queryRenderedFeatures(bbox, { layers: ['mobile-clusters'] });
        
        // 2. Query ALL features to catch Mapbox native POIs or Building Polygons
        const allFeatures = m.queryRenderedFeatures(bbox);
        
        const namedFeatures = allFeatures.filter(f => {
          if (!f.properties) return false;
          if (f.layer.id === 'mobile-cluster-count' || f.layer.id === 'campus-loc-label-mobile') return false;
          return !!(f.properties.name || f.properties.name_en || f.properties.title);
        });

        const poiFeature = namedFeatures.length > 0 ? namedFeatures[0] : null;

        let areaName;
        let pinLng = lng;
        let pinLat = lat;

        // Combine hotspots with all 52 core campus locations so we can snap accurately even to areas without violations
        const allKnownLocations = [
          ...(locationDataRef.current || []),
          ...DLSUD_LOCATIONS.map(loc => ({ name: loc.name, lng: loc.lng, lat: loc.lat }))
        ];

        if (pointFeatures.length > 0) {
          // Tapped directly on a violation dot — use its exact location_name
          areaName = pointFeatures[0].properties?.location_name || 'Campus Area';
          [pinLng, pinLat] = pointFeatures[0].geometry.coordinates;
        } else if (clusterFeatures.length > 0) {
          // Tapped on a cluster — find nearest real location to the cluster center
          const [cLng, cLat] = clusterFeatures[0].geometry.coordinates;
          areaName = getNearestFromData(cLng, cLat, locationDataRef.current);
          pinLng = cLng; pinLat = cLat;
        } else if (poiFeature) {
          // Tapped on a Mapbox POI label or Building Polygon with a name!
          areaName = poiFeature.properties.name || poiFeature.properties.name_en || poiFeature.properties.title;
          if (poiFeature.geometry && poiFeature.geometry.type === 'Point') {
            [pinLng, pinLat] = poiFeature.geometry.coordinates;
          } else {
            pinLng = lng;
            pinLat = lat;
          }
        } else {
          // Tapped on empty space with absolutely no names nearby — snap to the nearest known location
          areaName = getNearestFromData(lng, lat, allKnownLocations);
        }

        processAreaSelection(areaName, pinLng, pinLat);
      });

    }, 150);

    return () => {
      clearTimeout(timer);
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Sync assigned zone highlight on map once map is ready and zone is loaded
  useEffect(() => {
    if (!mapRef.current || !mapReady || !assignedZone) return;
    const m = mapRef.current;
    const azLocs = assignedZone.locations || ZONE_PRESET_LOCATIONS[assignedZone.zone] || [];
    const azFeatures = azLocs.map(name => {
      const c = getLocationCoords(name);
      return c ? { type: 'Feature', geometry: { type: 'Point', coordinates: [c.lng, c.lat] }, properties: { name: c.name || name } } : null;
    }).filter(Boolean);

    if (azFeatures.length === 0) return;
    const sourceData = { type: 'FeatureCollection', features: azFeatures };

    try {
      if (m.getSource('assigned-zone-source')) {
        m.getSource('assigned-zone-source').setData(sourceData);
      } else {
        m.addSource('assigned-zone-source', { type: 'geojson', data: sourceData });
        m.addLayer({
          id: 'assigned-zone-glow',
          type: 'circle',
          source: 'assigned-zone-source',
          paint: {
            'circle-color': '#39E58C',
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 16, 17, 26],
            'circle-opacity': 0.35,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#1A5C3A',
          }
        });
        m.addLayer({
          id: 'assigned-zone-center',
          type: 'circle',
          source: 'assigned-zone-source',
          paint: {
            'circle-color': '#1A5C3A',
            'circle-radius': 6,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          }
        });
      }

      // Automatically focus on the assigned zone
      const firstCoord = azFeatures[0]?.geometry?.coordinates;
      if (firstCoord && !selectedArea) {
        m.flyTo({ center: firstCoord, zoom: 17, duration: 600 });
      }
    } catch (layerErr) {
      console.warn('Could not add assigned zone layer:', layerErr);
    }
  }, [assignedZone, mapReady]);

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F5] font-manrope animate-fade-in overflow-y-auto no-scrollbar pb-[100px]">
      <div className="px-5 pt-6 mb-5 flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-[#1A5C3A] active:scale-90 transition-transform"><span className="material-symbols-outlined text-[24px]">arrow_back</span></button>
        <div><p className="font-black text-[9px] text-[#888888] tracking-[0.2em] uppercase mb-0.5">LOCATION PROTOCOL</p><h2 className="font-manrope font-black text-[24px] text-[#000000] leading-none tracking-tight">Select Patrol Area</h2></div>
      </div>

      <div className="px-5 mb-5">
        {/* Officer's Assigned Monthly Zone Card (Step 3) */}
        {assignedZone && (
          <div className="bg-gradient-to-r from-[#003624] to-[#1A5C3A] rounded-[24px] p-4 text-white shadow-lg mb-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[20px]">verified_user</span>
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Monthly Patrol Assignment</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                Active Zone
              </span>
            </div>
            <div>
              <h2 className="font-pjs font-black text-[17px] leading-tight mb-1">{assignedZone.zone}</h2>
              <p className="text-[11px] text-emerald-100/70 font-medium">
                Map clicks are locked to your designated zone buildings.
              </p>
            </div>
            {/* Quick Chips for Assigned Buildings */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(assignedZone.locations || ZONE_PRESET_LOCATIONS[assignedZone.zone] || []).map((bldg) => (
                <button
                  key={bldg}
                  type="button"
                  onClick={() => handleSelectAllowedLocation(bldg)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    selectedArea?.name === bldg 
                      ? 'bg-emerald-400 text-[#003624] shadow-md font-black' 
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">location_on</span>
                  <span>{bldg}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-4">
          {selectedArea ? (
            <span className="text-[#1A5C3A] font-black">📍 {selectedArea.name} selected</span>
          ) : assignedZone ? (
            <span>Tap your assigned zone locations on the map or select a quick chip above.</span>
          ) : (
            'Tap anywhere on campus to select your patrol area.'
          )}
        </p>

        {/* ── RESTRICTED ALERT MODAL (Step 3) ── */}
        {restrictedAlert && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5 font-manrope">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setRestrictedAlert(null)} />
            <div className="bg-white w-full max-w-sm rounded-[32px] p-6 relative z-10 animate-scale-up shadow-2xl border border-rose-100 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                  <span className="material-symbols-outlined text-[26px]">block</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Out of Assigned Zone</span>
                  <h3 className="font-pjs font-black text-[18px] text-[#000000] leading-tight">Location Restricted</h3>
                </div>
              </div>

              <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-3.5 text-[12px] text-gray-700 leading-relaxed">
                <p className="mb-1">
                  You tapped <strong className="text-rose-700 font-bold">"{restrictedAlert.attemptedLocation}"</strong>.
                </p>
                <p className="text-gray-500">
                  You are assigned to <strong className="text-[#003624] font-bold">{restrictedAlert.zoneName}</strong> for this month. Patrols must be logged within your designated zone.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
                  Select a building in your zone:
                </p>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {restrictedAlert.allowedLocations.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => handleSelectAllowedLocation(loc)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#003624] font-bold text-[12px] border border-emerald-100 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="material-symbols-outlined text-[16px] text-emerald-700 shrink-0">location_on</span>
                        <span className="truncate">{loc}</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider shrink-0 bg-emerald-200/60 px-2 py-0.5 rounded-lg">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRestrictedAlert(null)}
                className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[13px] transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Live Mapbox Heatmap */}
        <div className="w-full rounded-[32px] shadow-md relative overflow-hidden mb-4 border-4 border-white" style={{height: '340px'}}>
          <div ref={mapContainerRef} style={{position:'absolute', inset:0, width:'100%', height:'100%'}} />
          {!mapReady && (
            <div className="absolute inset-0 bg-[#F0F4F8] flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[40px] text-[#1A5C3A] animate-spin">refresh</span>
              <span className="text-[10px] font-black text-[#1A5C3A] uppercase tracking-widest">Loading Campus Map...</span>
            </div>
          )}
          {mapReady && (
            <div className="absolute top-3 left-3 flex gap-2">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">{hotspotCount} Hotspots</span>
              </div>
            </div>
          )}
          {mapReady && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <span className="text-[9px] font-black text-[#1A5C3A] uppercase tracking-widest">Tap to Select</span>
            </div>
          )}
        </div>

        {/* Heatmap legend */}
        <div className="flex items-center justify-between bg-white rounded-[20px] px-5 py-3 shadow-sm border border-white mb-4">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Risk Level</span>
          <div className="flex items-center gap-3">
            {[['#00c851','Low'],['#ffbb33','Mid'],['#ff8800','High'],['#ff4444','Critical']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:c}} />
                <span className="text-[9px] font-bold text-gray-500">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmed Patrol Area Card */}
        {selectedArea ? (
          <div className="bg-[#E8F5E9] border border-[#39E58C]/40 rounded-[20px] p-3.5 mb-6 flex items-center gap-3.5 shadow-sm">
            {getBuildingImage(selectedArea.name) ? (
              <div className="w-13 h-13 rounded-[16px] overflow-hidden shrink-0 border-2 border-white shadow-md bg-white">
                <img src={getBuildingImage(selectedArea.name)} alt={selectedArea.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-[#1A5C3A] rounded-[16px] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-[20px]">location_on</span>
              </div>
            )}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSheetVisible(true)}>
              <p className="text-[9px] font-black text-[#1A5C3A] uppercase tracking-widest mb-0.5">Confirmed Patrol Area</p>
              <p className="font-black text-[15px] text-[#000000] tracking-tight leading-none truncate">{selectedArea.name}</p>
            </div>
            <button 
              type="button"
              onClick={() => setSheetVisible(true)} 
              className="px-3 py-1.5 bg-white text-[#1A5C3A] rounded-xl text-[11px] font-bold border border-emerald-200 shadow-sm active:scale-95 transition-transform flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">route</span>
              <span>Route</span>
            </button>
            <button onClick={handleDismissSheet} title="Clear selection" className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 active:scale-90 transition-transform shrink-0">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[20px] px-5 py-4 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-gray-300 text-[22px]">touch_app</span>
            <p className="text-[12px] font-bold text-gray-400">No area selected yet — tap the map above</p>
          </div>
        )}

        {/* AI Suggested Route — ONLY SHOWS AFTER CLICKING A BUILDING */}
        {/* Hidden in single-building mode or when no area is selected yet */}
        {formData.patrolMode !== 'single' && selectedArea && (
        <div className="bg-[#1A5C3A] rounded-[28px] p-6 shadow-lg mb-8 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-[#39E58C]/20 rounded-lg flex items-center justify-center"><span className="material-symbols-outlined text-[#39E58C] text-[20px]">magic_button</span></div>
            <div>
              <h3 className="font-black text-white text-[16px] tracking-tight">AI Suggested Route</h3>
              <p className="text-[9px] font-black text-[#39E58C] uppercase tracking-widest">
                NEARBY BUILDINGS · SORTED BY RISK
              </p>
            </div>
          </div>

          {/* Show previewCheckpoints (nearby buildings by risk) */}
          {previewCheckpoints.length > 0 ? (
            <div className="space-y-4">
              {previewCheckpoints.map((cp, idx) => {
                const risk = getRiskLevel(cp.riskCount || 0);
                const isFirst = idx === 0;
                return (
                  <div key={cp.id} className="flex items-center gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 border-white/20
                        ${isFirst ? 'bg-[#39E58C] text-[#1A5C3A] border-[#39E58C]' : 'bg-white/10 text-white'}`}>
                        {idx + 1}
                      </div>
                      {idx < previewCheckpoints.length - 1 && <div className="w-0.5 h-4 bg-white/15 mt-1" />}
                    </div>

                    <div className="flex-1 pt-0.5 min-w-0">
                      <p className={`font-black text-[14px] tracking-tight leading-none mb-1.5 truncate ${isFirst ? 'text-[#39E58C]' : 'text-white'}`}>
                        {cp.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: risk.color}} />
                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest truncate">{cp.zone || risk.label}</span>
                        {cp.riskCount > 0 && <span className="text-[9px] font-bold text-white/40 shrink-0">• {cp.riskCount} violations</span>}
                      </div>
                    </div>
                    {isFirst && (
                      <div className="bg-[#39E58C]/20 px-2.5 py-1 rounded-full shrink-0">
                        <span className="text-[8px] font-black text-[#39E58C] uppercase tracking-widest">Start</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 opacity-60">
              <span className="material-symbols-outlined text-white text-[20px] animate-spin">refresh</span>
              <p className="text-[13px] font-bold text-white">Analyzing violation hotspots...</p>
            </div>
          )}
        </div>
        )}

        <div ref={detailsRef} className="space-y-8 px-1 scroll-mt-6">
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] bg-white border-[1.5px] border-[#1A5C3A] rounded-[14px] shadow-sm flex items-center justify-center text-[#1A5C3A]">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
            </div>
            <h3 className="font-bold text-[20px] text-[#0D1A0F] tracking-tight">Patrol Details</h3>
          </div>
          <div className="space-y-6">

            {/* Row 1: Date + Time — moved to top */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">PATROL DATE</label>
                <div className="relative w-full">
                  <input 
                    type="date" 
                    value={formData.patrol_date || ''} 
                    onChange={e => setFormData({ ...formData, patrol_date: e.target.value })} 
                    className="w-full h-[52px] bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] pl-4 pr-10 font-bold text-[#0D1A0F] text-[14px] border border-gray-100 outline-none appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer bg-transparent" 
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-800 text-[18px] pointer-events-none">calendar_today</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">START TIME</label>
                <div className="relative w-full">
                  <input 
                    type="time" 
                    value={formData.start_time || ''} 
                    onChange={e => handleTimeChange(e.target.value)} 
                    className="w-full h-[52px] bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] pl-4 pr-10 font-bold text-[#0D1A0F] text-[14px] border border-gray-100 outline-none appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer bg-transparent" 
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-800 text-[20px] pointer-events-none">schedule</span>
                </div>
              </div>
            </div>

            {/* Row 2: Auto-detected Shift Type badge */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">SHIFT TYPE</label>
              <div className="h-14 bg-white rounded-[20px] shadow-sm px-5 flex items-center justify-between border border-gray-50">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#1A5C3A] text-[20px]">
                    {formData.shift_type === 'Morning' ? 'wb_sunny' : formData.shift_type === 'Afternoon' ? 'partly_cloudy_day' : 'bedtime'}
                  </span>
                  <span className="font-black text-gray-800 text-[15px]">{formData.shift_type} Shift</span>
                </div>
                <span className="text-[9px] font-black text-[#1A5C3A] bg-[#E8F5E9] px-3 py-1.5 rounded-full uppercase tracking-widest">Auto</span>
              </div>
            </div>

            {/* Row 3: Notes */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">PATROL NOTES</label>
              <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="e.g., Check lighting..." className="h-24 bg-white rounded-[20px] shadow-sm p-5 text-[14px] font-medium text-gray-800 outline-none resize-none border border-gray-50" />
            </div>

          </div>
        </div>
      </div>
      <div className="px-5 pb-10 pt-4">
        <button
          onClick={onConfirm}
          disabled={!selectedArea}
          className={`w-full h-[64px] rounded-full shadow-lg flex justify-center items-center gap-3 font-black text-[18px] tracking-tight border-b-4 transition-all
            ${selectedArea ? 'bg-[#1A5C3A] border-[#14492c] text-white hover:bg-[#154a2e] active:scale-[0.98]' : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed shadow-none'}`}
        >
          <span className="material-symbols-outlined text-[24px]">{selectedArea ? 'play_arrow' : 'location_off'}</span>
          <span>{selectedArea ? 'Start Live Patrol' : 'Select Patrol Area First'}</span>
        </button>
      </div>

      {/* ── Slide-up Area Confirmation Sheet ─────────────────────────────────── */}
      {sheetVisible && selectedArea && (() => {
        const riskStyle = (rc) => {
          if (rc >= 21) return { label: 'Critical Risk',   bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626' };
          if (rc >= 11) return { label: 'Very High Risk',  bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626' };
          if (rc >= 7)  return { label: 'High Risk',       bg: '#FEF3C7', text: '#D97706', dot: '#D97706' };
          if (rc >= 4)  return { label: 'Moderate Risk',   bg: '#FEF9C3', text: '#CA8A04', dot: '#CA8A04' };
          return         { label: 'Low Risk',              bg: '#DCFCE7', text: '#16A34A', dot: '#16A34A' };
        };
        return (
          <div className="fixed inset-0 z-[9999] flex flex-col justify-end" style={{fontFamily:'Manrope, sans-serif'}}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={handleDismissSheet} />
            {/* Sheet — single light background, rounded top */}
            <div className="relative bg-[#F3F4F6] rounded-t-[32px] shadow-2xl px-5 pt-5 pb-8 animate-slide-up">
              {/* Drag handle */}
              <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />

              {/* ── Selected Area header ────────────────────────────── */}
              <div className="mb-6 px-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-[#1A5C3A] text-[16px]">location_on</span>
                  <p className="text-[9px] font-black text-[#1A5C3A] uppercase tracking-[0.18em]">Selected Area</p>
                </div>
                <h2 className="font-black text-[24px] text-[#0D1A0F] leading-tight tracking-tight mb-0.5">{selectedArea.name}</h2>
                <p className="text-[10px] font-medium text-gray-400">DLSU-D Campus • {selectedArea.lat.toFixed(4)}°N {selectedArea.lng.toFixed(4)}°E</p>
              </div>

              {/* ── Patrol Mode ─────────────────────────────────────── */}
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.16em] mb-2 px-1">Patrol Mode</p>
              <div className="grid grid-cols-2 gap-2 mb-6 px-1">
                <button
                  onClick={() => setPatrolMode('single')}
                  className={`h-[44px] rounded-[14px] font-bold text-[12px] flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    patrolMode === 'single'
                      ? 'bg-[#1A5C3A] text-white shadow-md'
                      : 'bg-transparent text-gray-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  Single Building
                </button>
                <button
                  onClick={() => setPatrolMode('route')}
                  className={`h-[44px] rounded-[14px] font-bold text-[12px] flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    patrolMode === 'route'
                      ? 'bg-[#1A5C3A] text-white shadow-md'
                      : 'bg-transparent text-gray-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">route</span>
                  Suggested Route
                </button>
              </div>

              {/* ── Checkpoint Route (timeline inside a box) ─────────────────────── */}
              {patrolMode === 'route' && previewCheckpoints.length > 0 && (
                <div className="mb-6 border border-gray-200 rounded-[20px] p-4 bg-[#F3F4F6] shadow-sm max-h-[260px] overflow-y-auto custom-scrollbar">
                  {/* Section header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#1A5C3A] text-[15px]">route</span>
                      <p className="text-[10px] font-black text-[#1A5C3A] uppercase tracking-widest">Checkpoint Route</p>
                    </div>
                    <span className="text-[8px] font-black text-[#1A5C3A] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                      {previewCheckpoints.length} Stops
                    </span>
                  </div>

                  {/* Timeline rows */}
                  <div className="relative">
                    {previewCheckpoints.map((cp, idx) => {
                      const rc = cp.riskCount || 0;
                      const risk = rc > 0 ? riskStyle(rc) : null;
                      const isFirst = idx === 0;
                      const isLast = idx === previewCheckpoints.length - 1;
                      return (
                        <div key={`${cp.id || 'cp'}-${idx}`} className="flex items-start gap-3 relative">
                          {/* Connector line between circles */}
                          {!isLast && (
                            <div className="absolute left-[13px] top-[26px] bottom-[-4px] w-[2px] bg-gray-200 z-0" />
                          )}
                          {/* Number circle */}
                          <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 ${
                            isFirst
                              ? 'bg-[#1A5C3A] text-white'
                              : isLast
                                ? 'bg-[#4ADE80] text-[#1A5C3A]' // Light green for the last stop
                                : 'bg-transparent border border-gray-400 text-gray-600'
                          }`}>
                            {idx + 1}
                          </div>
                          {/* Text content */}
                          <div className={`flex-1 flex items-start justify-between gap-1 ${!isLast ? 'pb-5' : 'pb-0'}`}>
                            <div className="min-w-0">
                              <p className="font-bold text-[13px] text-[#111] leading-snug">{cp.name}</p>
                              {risk && (
                                <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md" style={{ backgroundColor: risk.bg }}>
                                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: risk.dot }} />
                                  <span className="text-[8px] font-bold" style={{ color: risk.text }}>
                                    {risk.label} - {rc} violations
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* START / END tags */}
                            {isFirst && (
                              <span className="text-[8px] font-black text-white bg-[#1A5C3A] px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-1">Start</span>
                            )}
                            {isLast && !isFirst && (
                              <span className="text-[8px] font-bold text-[#1A5C3A] uppercase tracking-wider shrink-0 mt-1">End</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Single mode note */}
              {patrolMode === 'single' && (
                <div className="bg-transparent rounded-[14px] px-4 py-3 mb-5 flex items-center gap-3 border border-gray-200">
                  <span className="material-symbols-outlined text-[#1A5C3A] text-[18px]">info</span>
                  <p className="text-[11px] font-medium text-gray-500 leading-relaxed">Only <span className="font-black text-[#111]">{selectedArea.name}</span> will be your checkpoint for this patrol.</p>
                </div>
              )}

              {/* ── Action buttons ─────────────────────────────────── */}
              <div className="flex gap-3 items-center">
                <button
                  onClick={handleDismissSheet}
                  className="flex-none px-6 h-[48px] font-bold text-[14px] text-gray-500 active:scale-95 transition-transform"
                >
                  Change
                </button>
                <button
                  onClick={handleConfirmArea}
                  className="flex-1 h-[48px] bg-[#1A5C3A] rounded-[16px] font-bold text-[14px] text-white flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

const LiveMapScreen = ({ onEnd, onExpand, onBack, seconds, isPatrolActive, setIsPatrolActive, capturedPhotos, onCamera, distanceKm, setDistanceKm, setTrailCoords, trailCoords = [], formData, setFormData, violationCount, setViolationCount }) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);
  const trailCoordsRef = useRef(trailCoords);
  const lastPosRef = useRef(null);
  const demoIntervalRef = useRef(null);
  const demoIndexRef = useRef(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isTopDownView, setIsTopDownView] = useState(false);

  // ── Checkpoint state ──────────────────────────────────────────────────────
  const checkpointMarkersRef = useRef([]);

  // Build the checkpoint list from formData:
  // 1. If formData.checkpoints has data, preserve exact done flags!
  // 2. Otherwise compute dynamically from formData.locationData
  // 3. Always prepend the selected area itself as checkpoint #1
  const buildCheckpoints = () => {
    const saved = formData?.checkpoints || [];
    const savedSelected = saved.find(s => s.id === 'cp-selected' || s.name === formData?.location);

    const selectedEntry = {
      id: 'cp-selected',
      name: formData?.location || 'Selected Area',
      zone: formData?.assignedZone || 'Selected Patrol Area',
      riskCount: 0,
      lng: formData?.location_lng,
      lat: formData?.location_lat,
      done: Boolean(savedSelected?.done),
    };

    if (formData?.patrolMode === 'single') {
      return [selectedEntry];
    }

    let nearby = [];
    // Use saved checkpoints if they contain real nearby buildings (not just the selected area)
    const savedNearby = saved.filter(cp => cp.id !== 'cp-selected' && cp.name !== formData?.location);
    if (savedNearby.length > 0) {
      nearby = savedNearby.map(cp => ({ ...cp, done: Boolean(cp.done) }));
    } else if (formData?.locationData?.length && formData?.location_lng != null) {
      // Recompute from locationData stored in formData
      nearby = computeCheckpointsFromData(
        { name: formData.location, lng: formData.location_lng, lat: formData.location_lat },
        formData.locationData
      ).map(cp => ({ ...cp, done: false }));
    }

    return [selectedEntry, ...nearby];
  };

  const [checkpoints, setCheckpoints] = useState(() => buildCheckpoints());
  const checkedCount = checkpoints.filter(c => c.done).length;
  const totalCount = checkpoints.length;
  const allChecked = checkedCount === totalCount && totalCount > 0;
  const activeCheckpoint = checkpoints.find(c => !c.done) || checkpoints[checkpoints.length - 1];

  const markCheckpointDone = (id) => {
    const updated = checkpoints.map(cp => cp.id === id ? { ...cp, done: !cp.done } : cp);
    setCheckpoints(updated);
    if (setFormData) {
      setFormData(f => ({ ...f, checkpoints: updated }));
    }
    try {
      const stored = JSON.parse(sessionStorage.getItem('swafo_live_patrol_state') || '{}');
      stored.formData = { ...(stored.formData || {}), checkpoints: updated };
      sessionStorage.setItem('swafo_live_patrol_state', JSON.stringify(stored));
    } catch (e) {}
  };

  // Sync POV toggle
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: isTopDownView ? 0 : 60,
        bearing: isTopDownView ? 0 : mapRef.current.getBearing(),
        duration: 800
      });
    }
  }, [isTopDownView]);

  // Use the confirmed patrol area as map center, fallback to campus center
  const areaCenter = (formData?.location_lng && formData?.location_lat)
    ? [formData.location_lng, formData.location_lat]
    : DLSUD_CENTER;
  const areaName = formData?.location || 'Campus Area';

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}`;
  };

  // Pace calculation (min/km)
  const paceStr = (() => {
    if (!distanceKm || distanceKm <= 0 || seconds <= 0) return '--:--';
    const totalMin = seconds / 60;
    const paceMin = totalMin / distanceKm;
    const min = Math.floor(paceMin);
    const sec = Math.floor((paceMin - min) * 60);
    return `${min}:${sec.toString().padStart(2,'0')}`;
  })();

  // Haversine distance in km between two [lng,lat] pairs
  const haversine = ([lng1, lat1], [lng2, lat2]) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // Update trail GeoJSON source on the map
  const updateTrail = (m) => {
    const coords = trailCoordsRef.current;
    if (!m || !m.getSource('patrol-trail')) return;
    m.getSource('patrol-trail').setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
    });
  };

  // ── Init Mapbox ────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current || !mapContainerRef.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const m = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/timothydevcastro/cmod8zewr004601pe41yy4304',
        center: areaCenter,
        zoom: 18,
        pitch: 55,
        bearing: 0,
        // maxBounds removed — allows camera to follow real GPS location during testing
        maxZoom: 20,
        antialias: true,
        attributionControl: false,
      });
      mapRef.current = m;

      m.on('load', () => {
        m.resize();

        // Drop numbered pins for each checkpoint — use same buildCheckpoints() as the list UI
        const cps = buildCheckpoints();
        cps.forEach((cp, idx) => {
          if (!cp.lng || !cp.lat) return;
          const el = document.createElement('div');
          el.style.cssText = `
            width: 36px; height: 36px; border-radius: 50%;
            background: ${idx === 0 ? '#1A5C3A' : '#fff'};
            border: 3px solid ${idx === 0 ? '#fff' : '#1A5C3A'};
            box-shadow: 0 4px 16px rgba(26,92,58,0.35);
            display: flex; align-items: center; justify-content: center;
            cursor: default;
          `;
          el.innerHTML = `<span style="font-family:sans-serif;font-size:11px;font-weight:900;color:${idx === 0 ? '#fff' : '#1A5C3A'}">${idx + 1}</span>`;
          const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([cp.lng, cp.lat])
            .addTo(m);
          checkpointMarkersRef.current.push(marker);
        });


        // Drop a pin on the confirmed patrol area
        if (formData?.location_lng && formData?.location_lat) {
          const areaEl = document.createElement('div');
          areaEl.style.cssText = `width:48px; height:48px; border-radius:50%; background:#1A5C3A; border:4px solid white; box-shadow:0 8px 24px rgba(26,92,58,0.35); display:flex; align-items:center; justify-content:center;`;
          areaEl.innerHTML = `<span class="material-symbols-outlined" style="color:white;font-size:22px;">location_on</span>`;
          new mapboxgl.Marker({ element: areaEl, anchor: 'center' }).setLngLat(areaCenter).addTo(m);
        }

        // Violations Source for Heatmap
        m.addSource('violations-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        // Safely fetch real violations heatmap
        fetch(API_ENDPOINTS.VIOLATIONS_HEATMAP)
          .then(res => res.ok ? res.json() : null)
          .then(vData => {
            if (vData?.geojson && m.getSource('violations-source')) {
              m.getSource('violations-source').setData(vData.geojson);
            }
          })
          .catch(() => {});

        m.addLayer({
          id: 'risk-heatmap', type: 'heatmap', source: 'violations-source',
          paint: RISK_HEATMAP_CONFIG,
          layout: { 'visibility': 'none' }
        });

        // Trail line source + layer
        m.addSource('patrol-trail', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: trailCoordsRef.current } },
        });

        m.addLayer({
          id: 'trail-glow', type: 'line', source: 'patrol-trail',
          paint: { 'line-color': '#39E58C', 'line-width': 10, 'line-opacity': 0.15, 'line-blur': 6 },
        });

        m.addLayer({
          id: 'trail-line', type: 'line', source: 'patrol-trail',
          paint: { 'line-color': '#39E58C', 'line-width': 4, 'line-opacity': 0.95 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
      });
    }, 150);
    return () => {
      clearTimeout(timer);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Sync heatmap visibility
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      mapRef.current.setLayoutProperty('risk-heatmap', 'visibility', showHeatmap ? 'visible' : 'none');
    }
  }, [showHeatmap]);

  // ── GPS tracking — start when patrol goes active ───────────────────────────
  const [gpsError, setGpsError] = useState(null);

  useEffect(() => {
    if (!isPatrolActive) return;
    if (!navigator.geolocation) {
      setGpsError('GPS not supported on this device.');
      return;
    }
    setGpsError(null);

    const placeMarker = (coord) => {
      const m = mapRef.current;
      if (!m) return;

      const doPlace = () => {
        // Camera follow
        m.flyTo({
          center: coord,
          bearing: isTopDownView ? 0 : m.getBearing(),
          pitch: isTopDownView ? 0 : 60,
          zoom: 18,
          duration: 1000,
          essential: true,
        });

        // Accumulate distance (ignore GPS jitter < 2m, ignore teleports > 200m)
        if (lastPosRef.current) {
          const d = haversine(lastPosRef.current, coord);
          if (d > 0.002 && d < 0.2) {
            setDistanceKm(prev => Math.round((prev + d) * 100) / 100);
          }
          // If teleported > 200m (usually happens when GPS finally locks on), reset the trail to avoid drawing a giant line
          if (d >= 0.2) {
            trailCoordsRef.current = [];
          }
        }
        lastPosRef.current = coord;

        // Append to trail
        trailCoordsRef.current.push(coord);
        if (setTrailCoords) setTrailCoords([...trailCoordsRef.current]);
        updateTrail(m);

        // Create / move marker
        if (!markerRef.current) {
          if (!document.getElementById('patrol-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'patrol-pulse-style';
            style.textContent = '@keyframes patrol-pulse-ring{0%{transform:scale(0.5);opacity:0.9;}100%{transform:scale(3);opacity:0;}}';
            document.head.appendChild(style);
          }
          const el = document.createElement('div');
          el.style.cssText = 'position:relative;width:38px;height:38px;';
          el.innerHTML = `
            <div style="position:absolute;inset:0;border-radius:50%;
              background:rgba(26,92,58,0.25);
              animation:patrol-pulse-ring 1.6s ease-out infinite;"></div>
            <div style="position:absolute;inset:6px;border-radius:50%;
              background:#1A5C3A;border:3px solid white;
              box-shadow:0 4px 18px rgba(26,92,58,0.55);"></div>
          `;
          markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat(coord).addTo(m);
        } else {
          markerRef.current.setLngLat(coord);
        }
      };

      // If map style not ready yet, wait for it
      if (!m.isStyleLoaded()) {
        m.once('idle', doPlace);
      } else {
        doPlace();
      }
    };

    // Force an immediate fetch to jump to location instantly
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsError(null);
        placeMarker([pos.coords.longitude, pos.coords.latitude]);
      },
      (err) => console.warn('Initial GPS fetch error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude: lng, latitude: lat } = pos.coords;
        setGpsError(null);
        placeMarker([lng, lat]);
      },
      (err) => {
        setGpsError(`GPS: ${err.message}`);
        console.warn('GPS error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isPatrolActive]);

  // ── DEMO WALK: simulate GPS movement for desktop testing ─────────────────
  const DEMO_ROUTE = [
    [120.9590, 14.3222], [120.9593, 14.3225], [120.9597, 14.3228],
    [120.9601, 14.3231], [120.9605, 14.3228], [120.9608, 14.3224],
    [120.9605, 14.3220], [120.9601, 14.3218], [120.9597, 14.3220],
    [120.9593, 14.3222], [120.9590, 14.3225], [120.9590, 14.3222],
  ];

  const startDemoWalk = () => {
    if (!isPatrolActive) setIsPatrolActive();
    setIsDemoMode(true);
    demoIndexRef.current = 0;
    const m = mapRef.current;

    const step = () => {
      const idx = demoIndexRef.current;
      if (idx >= DEMO_ROUTE.length) {
        clearInterval(demoIntervalRef.current);
        setIsDemoMode(false);
        return;
      }
      const coord = DEMO_ROUTE[idx];
      const prev = DEMO_ROUTE[idx > 0 ? idx - 1 : 0];

      // Update distance
      if (idx > 0) {
        const R = 6371;
        const dLat = (coord[1] - prev[1]) * Math.PI / 180;
        const dLng = (coord[0] - prev[0]) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(prev[1]*Math.PI/180)*Math.cos(coord[1]*Math.PI/180)*Math.sin(dLng/2)**2;
        const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        setDistanceKm(p => Math.round((p + d) * 1000) / 1000);
      }

      // Update trail
      trailCoordsRef.current.push(coord);
      if (setTrailCoords) setTrailCoords([...trailCoordsRef.current]);
      if (m?.getSource('patrol-trail')) {
        m.getSource('patrol-trail').setData({
          type: 'Feature', geometry: { type: 'LineString', coordinates: trailCoordsRef.current },
        });
      }

      // Move / create marker
      if (!markerRef.current && m) {
        if (!document.getElementById('patrol-pulse-style')) {
          const s = document.createElement('style');
          s.id = 'patrol-pulse-style';
          s.textContent = '@keyframes patrol-pulse-ring{0%{transform:scale(0.5);opacity:0.9;}100%{transform:scale(3);opacity:0;}}';
          document.head.appendChild(s);
        }
        const el = document.createElement('div');
        el.style.cssText = 'position:relative;width:38px;height:38px;';
        el.innerHTML = `<div style="position:absolute;inset:0;border-radius:50%;background:rgba(26,92,58,0.25);animation:patrol-pulse-ring 1.6s ease-out infinite;"></div><div style="position:absolute;inset:6px;border-radius:50%;background:#1A5C3A;border:3px solid white;box-shadow:0 4px 18px rgba(26,92,58,0.55);"></div>`;
        markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(coord).addTo(m);
      } else if (markerRef.current) {
        markerRef.current.setLngLat(coord);
      }

      // Camera follow
      m?.easeTo({ center: coord, zoom: 18.5, pitch: 55, duration: 1200 });
      demoIndexRef.current += 1;
    };

    step(); // run first step immediately
    demoIntervalRef.current = setInterval(step, 1500);
  };

  const stopDemo = () => {
    clearInterval(demoIntervalRef.current);
    setIsDemoMode(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F5] font-manrope animate-fade-in overflow-y-auto no-scrollbar pb-[110px]">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-[#1A5C3A] border border-gray-100 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <h1 className="font-manrope font-black text-[22px] text-[#000000] tracking-tight">Live Map</h1>
        {isPatrolActive ? (
          <div className="flex items-center gap-2">
            <div className="bg-[#E8F5E9] px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#1A5C3A] rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-[#1A5C3A] uppercase tracking-widest">LIVE</span>
            </div>
            {/* Demo Walk button — for desktop testing only */}
            {!isDemoMode ? (
              <button
                onClick={startDemoWalk}
                title="Simulate walk (desktop testing)"
                className="bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-full flex items-center gap-1 active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-amber-500 text-[14px]">directions_walk</span>
                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Demo</span>
              </button>
            ) : (
              <button
                onClick={stopDemo}
                className="bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-full flex items-center gap-1 active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-red-400 text-[14px]">stop</span>
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Stop</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-10 h-10" />
        )}
      </div>

      {/* ── STATS BAR ──────────────────────────────────────────────────── */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-[24px] shadow-sm border border-white py-4 px-2 grid grid-cols-3 divide-x divide-gray-100">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">TIME ACTIVE</span>
            <span className="font-black text-[18px] text-[#000000] tabular-nums tracking-tight">{formatTime(seconds)}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">DISTANCE</span>
            <div className="flex items-baseline gap-0.5">
              <span className="font-black text-[18px] text-[#000000]">{(distanceKm || 0).toFixed(1)}</span>
              <span className="text-[10px] font-bold text-gray-400">km</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">CHECKPOINTS</span>
            <div className="flex items-baseline gap-0.5">
              <span className={`font-black text-[18px] ${checkedCount > 0 ? 'text-[#1A5C3A]' : 'text-[#000000]'}`}>{checkedCount}</span>
              <span className="text-[10px] font-bold text-gray-400">/{totalCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPACT MAP PREVIEW ────────────────────────────────────────── */}
      <div className="px-5 mb-4 relative">
        {gpsError && (
          <div className="absolute top-[-50px] left-5 right-5 z-20 bg-red-50/95 backdrop-blur-md rounded-2xl px-4 py-2 border border-red-200 flex items-center gap-2 shadow-md animate-fade-in">
            <span className="material-symbols-outlined text-red-500 text-[18px]">location_off</span>
            <p className="text-[11px] font-bold text-red-600 leading-tight">{gpsError}</p>
          </div>
        )}
        <div className="relative rounded-[28px] overflow-hidden border-4 border-white shadow-md" style={{ height: 360 }}>
          <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

          {/* Expand + Recenter + Heatmap — top left & right */}
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <button
              onClick={onExpand}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center text-[#1A5C3A] active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[22px]">zoom_out_map</span>
            </button>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`w-10 h-10 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center active:scale-90 transition-all ${showHeatmap ? 'bg-[#1A5C3A] text-white' : 'bg-white/90 text-gray-400'}`}
            >
              <span className="material-symbols-outlined text-[22px]">layers</span>
            </button>
          </div>
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            <button
              onClick={() => {
                if (lastPosRef.current && mapRef.current) {
                  mapRef.current.easeTo({ center: lastPosRef.current, zoom: 18, pitch: isTopDownView ? 0 : 60, duration: 600 });
                }
              }}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center text-[#1A5C3A] active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[22px]">my_location</span>
            </button>
            <button
              onClick={() => setIsTopDownView(!isTopDownView)}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center text-[#1A5C3A] active:scale-90 transition-transform"
              title={isTopDownView ? "Switch to 3D View" : "Switch to Top-Down View"}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isTopDownView ? 'view_in_ar' : 'map'}
              </span>
            </button>
          </div>

          {/* ── BOTTOM ACTION BAR overlaid on map ── */}
          <div className="absolute bottom-6 inset-x-0 z-10 flex justify-center pointer-events-none">
              {!isPatrolActive ? (
                <button
                  onClick={setIsPatrolActive}
                  className="pointer-events-auto w-full max-w-[180px] h-[46px] bg-[#39E58C] rounded-full flex justify-center items-center gap-2 active:scale-95 transition-transform shadow-lg"
                >
                  <span className="material-symbols-outlined text-[#0D3522] text-[18px]">directions_run</span>
                  <span className="font-black text-[14px] text-[#0D3522] tracking-tight">Start Patrol</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    console.log("End Patrol button clicked");
                    if (allChecked) {
                      console.log("All checkpoints completed");
                      onEnd(checkpoints);
                    } else {
                      console.log("Checkpoints not completed, showing alert");
                      alert(`Please complete all checkpoints first (${checkedCount}/${totalCount})`);
                    }
                  }}
                  title={!allChecked ? `Complete all checkpoints first (${checkedCount}/${totalCount})` : 'End Patrol'}
                  style={{ pointerEvents: 'auto' }}
                  className={`w-full max-w-[200px] h-[46px] rounded-full flex justify-center items-center gap-2 transition-all border-b-4 shadow-lg ${
                    allChecked
                      ? 'bg-[#E53935] border-[#c62828] active:scale-95 cursor-pointer'
                      : 'bg-gray-300 border-gray-400 opacity-60 cursor-pointer'
                  }`}
                >
                  <span className="material-symbols-outlined text-white text-[18px]">{allChecked ? 'stop_circle' : 'lock'}</span>
                  <span className="font-black text-[14px] text-white tracking-tight">
                    {allChecked ? 'End Patrol' : `${checkedCount}/${totalCount} Checked`}
                  </span>
                </button>
              )}
          </div>
        </div>
      </div>

      {/* ── ONGOING PATROL STATUS PILL ─────────────────────────────────── */}
      {isPatrolActive && (
        <div className="px-5 mb-4">
          <div className="w-full h-[52px] bg-[#39E58C] rounded-full flex justify-center items-center gap-2.5 shadow-md">
            <span className="material-symbols-outlined text-[#0D3522] text-[20px]">radio_button_checked</span>
            <span className="font-black text-[15px] text-[#0D3522] tracking-tight uppercase">Ongoing Patrol</span>
          </div>
        </div>
      )}

      {/* ── CURRENT CHECKPOINT ─────────────────────────────────────────── */}
      {isPatrolActive && (
        <div className="px-5 mb-5 flex flex-col gap-4">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">CURRENT CHECKPOINT</p>
            {allChecked ? (
              <div className="bg-[#E8F5E9] rounded-[24px] p-5 shadow-sm border border-[#C8E6C9] flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1A5C3A] rounded-[18px] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white text-[26px]">task_alt</span>
                </div>
                <div>
                  <h3 className="font-black text-[18px] text-[#1A5C3A] tracking-tight leading-none mb-1">All Checkpoints Cleared</h3>
                  <p className="text-[11px] font-bold text-[#1A5C3A]/60">{totalCount}/{totalCount} completed — ready to end patrol</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-white flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E8F5E9] rounded-[18px] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1A5C3A] text-[26px] fill-1">location_on</span>
                </div>
                <div>
                  <h3 className="font-black text-[18px] text-[#000000] tracking-tight leading-none mb-1">{activeCheckpoint?.name || areaName}</h3>
                  <p className="text-[11px] font-bold text-gray-400">Zone: {activeCheckpoint?.zone || 'Main Area'}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── CHECKPOINT LIST ─────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Checkpoint List</p>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                allChecked ? 'text-[#1A5C3A] bg-[#E8F5E9]' : 'text-gray-400 bg-gray-100'
              }`}>{checkedCount}/{totalCount}</span>
            </div>
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden">
              {checkpoints.map((cp, idx) => {
                const rc = cp.riskCount || 0;
                const riskDot = rc >= 21 ? '#CC0000' : rc >= 11 ? '#ff4444' : rc >= 7 ? '#ff8800' : rc >= 4 ? '#ffbb33' : null;
                const bldgImg = getBuildingImage(cp.name);
                return (
                  <div key={cp.id} className={`flex items-center gap-3 px-4 py-3 transition-all ${
                    idx < checkpoints.length - 1 ? 'border-b border-gray-50' : ''
                  } ${cp.done ? 'bg-gray-50/60' : 'bg-white'}`}>
                    {/* Number / check circle */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      cp.done
                        ? 'bg-[#1A5C3A] text-white'
                        : idx === 0 ? 'bg-[#1A5C3A]/10 border-2 border-[#1A5C3A]/30 text-[#1A5C3A]'
                        : 'bg-gray-100 border-2 border-gray-200 text-gray-500'
                    }`}>
                      {cp.done
                        ? <span className="material-symbols-outlined text-[15px]">check</span>
                        : <span className="text-[10px] font-black">{idx + 1}</span>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-[13px] tracking-tight leading-none mb-0.5 truncate ${
                        cp.done ? 'line-through text-gray-300' : 'text-[#111]'
                      }`}>{cp.name}</p>
                      <div className="flex items-center gap-1.5">
                        {riskDot && !cp.done && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: riskDot }} />}
                        <p className="text-[10px] font-medium text-gray-400 truncate">{cp.zone}</p>
                      </div>
                    </div>
                    {/* Action */}
                    <button
                      type="button"
                      onClick={() => markCheckpointDone(cp.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-90 transition-all cursor-pointer ${
                        cp.done
                          ? 'bg-emerald-50 border border-emerald-300 text-[#1A5C3A] font-black'
                          : 'bg-gray-100 border border-gray-200 text-gray-500 hover:bg-[#E8F5E9] hover:border-[#C8E6C9] hover:text-[#1A5C3A]'
                      }`}
                      title={cp.done ? "Completed - click to unmark" : "Mark as completed"}
                    >
                      <span className={`material-symbols-outlined text-[15px] ${cp.done ? 'text-[#1A5C3A]' : 'text-gray-400'}`}>
                        {cp.done ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider">
                        {cp.done ? 'Done' : 'Mark Done'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VIOLATIONS COUNTER UI */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">INCIDENT TRACKING</p>
              <button
                onClick={() => {
                  navigate('/officer/violations/new');
                }}
                className="flex items-center gap-1.5 bg-orange-50 shadow-sm border border-orange-100 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-orange-600 text-[16px]">gavel</span>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Record</span>
              </button>
            </div>
            <div className="bg-white rounded-[24px] p-4 shadow-sm border border-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-[18px] flex items-center justify-center shrink-0 border border-orange-100">
                  <span className="material-symbols-outlined text-orange-500 text-[26px]">gavel</span>
                </div>
                <div>
                  <h3 className="font-black text-[22px] text-[#000000] tracking-tight leading-none mb-0.5">{violationCount}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Violations Logged</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                  <button onClick={() => setViolationCount(Math.max(0, violationCount - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white hover:shadow-sm hover:text-gray-600 transition-all">
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <button onClick={() => setViolationCount(violationCount + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white hover:shadow-sm hover:text-gray-600 transition-all">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CAPTURED EVIDENCE ──────────────────────────────────────────── */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-manrope font-black text-[20px] text-[#000000] tracking-tight">Captured Evidence</h2>
          <button onClick={onCamera} className="flex items-center gap-1.5 bg-white shadow-sm border border-gray-100 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-[#1A5C3A] text-[16px]">photo_camera</span>
            <span className="text-[10px] font-black text-[#1A5C3A] uppercase tracking-widest">Capture</span>
          </button>
        </div>

        {capturedPhotos.length > 0 ? (
          <>
            <p className="text-[10px] font-bold text-gray-400 mb-3 px-1">{capturedPhotos.length} Photos Captured</p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {capturedPhotos.map((photo, idx) => (
                <div key={idx} className="relative w-[140px] h-[140px] rounded-[22px] overflow-hidden shrink-0 shadow-md border-[3px] border-white">
                  <img src={photo.url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <p className="text-[7px] font-black uppercase tracking-widest text-white/70 mb-0.5">{photo.location}</p>
                    <p className="font-black text-[11px] text-white leading-none">{photo.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center bg-white rounded-[24px] border-2 border-dashed border-gray-100 gap-2">
            <span className="material-symbols-outlined text-[32px] text-gray-200">photo_library</span>
            <p className="text-[11px] font-bold text-gray-300 italic">No evidence captured yet</p>
          </div>
        )}
      </div>

    </div>
  );
};





const PatrolHistoryArchive = ({ onBack, sessionData: propData }) => {
  // Read from sessionStorage (set by PatrolMonitoring on card click) or fallback to prop
  const sessionData = (() => {
    try {
      const stored = sessionStorage.getItem('swafo_viewing_patrol');
      return stored ? JSON.parse(stored) : propData;
    } catch { return propData; }
  })();

  const shiftLabel = sessionData?.shift_type ? `${sessionData.shift_type} Patrol` : 'Patrol Session';
  const dateStr = sessionData?.actual_start
    ? new Date(sessionData.actual_start).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  const startTime = sessionData?.actual_start
    ? new Date(sessionData.actual_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const endTime = sessionData?.actual_end
    ? new Date(sessionData.actual_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const durationMins = (sessionData?.actual_start && sessionData?.actual_end)
    ? Math.max(0, Math.floor((new Date(sessionData.actual_end) - new Date(sessionData.actual_start)) / 60000))
    : 0;
  const durationStr = durationMins >= 60
    ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
    : `${durationMins}m`;
  const rawPhotos = sessionData?.capturedPhotos || [];
  const photos = rawPhotos.filter(p => {
    const url = p?.url || p;
    if (!url || typeof url !== 'string') return Boolean(url);
    return !url.includes('/images/buildings/') && !url.includes('/media/buildings/');
  });
  const areaName = sessionData?.location || 'Campus Patrol';
  const isNight = sessionData?.shift_type === 'Evening';
  const navigate = useNavigate();
  const patrolId = sessionData?.id || 'local';

  return (
    <div className="flex-1 flex flex-col bg-[#F0F2F5] font-manrope animate-fade-in overflow-y-auto no-scrollbar pb-[120px]">

      {/* Hero Header */}
      <div className={`relative overflow-hidden rounded-b-[48px] mb-6 ${isNight ? 'bg-[#0D1F16]' : 'bg-[#1A5C3A]'}`}
        style={{ minHeight: 220 }}>
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Glow blob */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#39E58C] rounded-full opacity-10 blur-3xl" />

        {/* Back button */}
        <div className="absolute top-6 left-5 z-10">
          <button onClick={onBack} className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-90 transition-transform border border-white/20">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
        </div>

        {/* Completed badge */}
        <div className="absolute top-6 right-5 z-10">
          <div className="bg-[#39E58C]/20 border border-[#39E58C]/40 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#39E58C] rounded-full" />
            <span className="text-[9px] font-black text-[#39E58C] uppercase tracking-widest">Completed</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-20 pb-8">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{dateStr}</p>
          <h1 className="font-manrope font-black text-[30px] text-white leading-tight tracking-tight mb-1">{shiftLabel}</h1>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#39E58C] text-[14px]">location_on</span>
              <p className="text-[13px] font-bold text-white/70">{areaName}</p>
            </div>
            <button
              onClick={() => navigate(`/officer/patrol-history/${patrolId}/session`)}
              className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 px-3 py-2 rounded-full active:scale-95 transition-all hover:bg-white/25"
            >
              <span className="text-[9px] font-black text-white uppercase tracking-widest">View Session Details</span>
              <span className="material-symbols-outlined text-white text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Duration', value: durationStr, icon: 'timer' },
            { label: 'Started', value: startTime, icon: 'login' },
            { label: 'Ended', value: endTime, icon: 'logout' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-[22px] p-4 shadow-sm border border-white flex flex-col items-center gap-1.5">
              <div className="w-8 h-8 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[#1A5C3A] text-[16px]">{s.icon}</span>
              </div>
              <p className="font-black text-[14px] tracking-tight leading-none">{s.value}</p>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Tracking */}
      <div className="px-5 mb-6">
        <div className="flex justify-between items-end mb-2 px-1">
          <span className="text-[10px] font-black text-gray-400 tracking-[0.15em] uppercase">Incident Tracking</span>
        </div>
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-[16px] flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-500 text-[24px]">gavel</span>
            </div>
            <div>
              <p className="font-black text-[22px] text-[#000000] leading-none mb-0.5 tracking-tight">
                {sessionData.violations_count || sessionData.violationCount || 0}
              </p>
              <p className="font-black text-[9px] text-gray-400 uppercase tracking-widest">Violations Logged</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/officer/cases')}
            className="bg-orange-50 hover:bg-orange-100 text-orange-600 font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
          >
            Review Cases
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Officer Notes */}
      {sessionData.notes && (
        <div className="px-5 mb-6">
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#1A5C3A] text-[18px]">edit_note</span>
              <h3 className="font-black text-[14px] text-[#000000] tracking-tight">Officer Notes</h3>
            </div>
            <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
              {sessionData.notes}
            </p>
          </div>
        </div>
      )}

      {/* Evidence Records */}
      <div className="px-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-[#1A5C3A] rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[16px]">photo_library</span>
          </div>
          <h2 className="font-manrope font-black text-[20px] tracking-tight">Evidence Records</h2>
          <div className="ml-auto bg-[#E8F5E9] px-3 py-1 rounded-full">
            <span className="text-[9px] font-black text-[#1A5C3A] uppercase tracking-widest">{photos.length} Photos</span>
          </div>
        </div>

        <div className="space-y-4">
          {photos.length > 0 ? photos.map((item, idx) => {
            const rawDate = item.timestamp || startTime || '';
            const fileDate = rawDate.replace(/[:\s]/g, '').slice(0, 12) || `${Date.now()}`;
            const fileName = `IMG_${new Date().toLocaleDateString('en-GB').replace(/\//g,'')}_${fileDate.replace(/\D/g,'').padStart(4,'0')}.jpg`;
            return (
              <div key={idx} className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-50 flex items-start gap-4 active:scale-[0.98] transition-transform">
                {/* Thumbnail */}
                <div
                  onClick={() => window.dispatchEvent(new CustomEvent('open-image', {detail: item.url}))}
                  className="w-[76px] h-[76px] rounded-[18px] overflow-hidden shrink-0 shadow-md border-2 border-white cursor-pointer"
                >
                  {item.url
                    ? <img src={item.url} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-[#F0F2F5] flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-300 text-[28px]">image</span>
                      </div>
                  }
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="font-black text-[15px] text-[#000000] tracking-tight leading-none mb-1.5">
                    {item.location || areaName}
                  </h4>
                  <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold mb-2">
                    <span className="material-symbols-outlined text-[11px]">schedule</span>
                    <span>{rawDate || '--:--'}</span>
                    <span className="text-gray-200 mx-0.5">•</span>
                    <span>3rd floor</span>
                  </div>
                  <p className="text-[9px] font-semibold text-gray-300 mb-2.5 truncate">{fileName}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-[#E8F5E9] text-[#1A5C3A] text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">HD Metadata</span>
                    <span className="bg-blue-50 text-blue-500 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">GPS Logged</span>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="py-16 flex flex-col items-center justify-center bg-white rounded-[28px] border-2 border-dashed border-gray-100 gap-3">
              <span className="material-symbols-outlined text-[40px] text-gray-200">photo_library</span>
              <p className="text-[12px] font-bold text-gray-300 italic">No evidence captured during this patrol</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// SESSION DETAILS — Strava-style patrol result card
// ────────────────────────────────────────────────────────────
const PatrolSessionDetails = ({ onBack, sessionData }) => {
  const navigate = useNavigate();
  const areaName   = sessionData?.location   || 'Campus Patrol';
  const shiftLabel = sessionData?.shift_type ? `${sessionData.shift_type} Patrol` : 'Patrol Session';
  const isNight    = sessionData?.shift_type === 'Evening';
  const rawPhotos  = sessionData?.capturedPhotos || [];
  const photos     = rawPhotos.filter(p => {
    const url = p?.url || p;
    if (!url || typeof url !== 'string') return Boolean(url);
    return !url.includes('/images/buildings/') && !url.includes('/media/buildings/');
  });
  const exportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleSaveImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);

    try {
      await new Promise(r => setTimeout(r, 100));

      const filter = (node) => {
        if (node && node.hasAttribute && node.hasAttribute('data-html2canvas-ignore')) {
          return false;
        }
        return true;
      };

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0D1A14',
        filter,
        skipFonts: true,
        height: exportRef.current.scrollHeight,
        style: {
          height: `${exportRef.current.scrollHeight}px`,
          maxHeight: 'none',
          overflow: 'visible',
        }
      });

      const filename = `Patrol_Archive_${Date.now()}.png`;

      // Native Share API on mobile
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Patrol Summary',
            text: 'SWAFO Patrol Session Details'
          });
          setIsExporting(false);
          return;
        }
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          setIsExporting(false);
          return;
        }
      }

      // Download Fallback
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Export failed:", err);
      try {
        const fallbackDataUrl = await toPng(exportRef.current, {
          cacheBust: true,
          pixelRatio: 1,
          backgroundColor: '#0D1A14',
          filter: (node) => !node?.hasAttribute?.('data-html2canvas-ignore'),
          skipFonts: true,
        });
        const link = document.createElement('a');
        link.href = fallbackDataUrl;
        link.download = `Patrol_Archive_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackErr) {
        console.error("Fallback export failed:", fallbackErr);
        alert("Failed to export image. Please try taking a screenshot.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Fallback chain for start/end times (support old data keys too)
  const startTime = sessionData?.actual_start
    ? new Date(sessionData.actual_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : sessionData?.start_time || '--:--';
  const endTime = sessionData?.actual_end
    ? new Date(sessionData.actual_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const dateStr = sessionData?.actual_start
    ? new Date(sessionData.actual_start).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
    : sessionData?.patrol_date || new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const durationMins = (sessionData?.actual_start && sessionData?.actual_end)
    ? Math.max(0, Math.floor((new Date(sessionData.actual_end) - new Date(sessionData.actual_start)) / 60000))
    : sessionData?.duration_display ? parseInt(sessionData.duration_display) : 0;
  const durationStr = durationMins >= 60
    ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
    : durationMins > 0 ? `${durationMins}m` : '0m';

  const distanceKm = sessionData?.distance_km ? Number(sessionData.distance_km).toFixed(2) : '0.00';
  const efficiencyScore = Math.min(100, Math.round(60 + (photos.length * 8) + (durationMins > 20 ? 15 : 0)));
  const violationsCount = sessionData?.violations_count ?? sessionData?.violationCount ?? 0;

  // ── Patrol Route: use real checkpoints_data from DB if available ──
  // Fall back to photo-derived waypoints only when no checkpoints were saved.
  const storedCheckpoints = Array.isArray(sessionData?.checkpoints_data) ? sessionData.checkpoints_data : [];
  const checkpoints = storedCheckpoints.length > 0
    ? storedCheckpoints.map((cp, i) => ({
        label: cp.name || cp.building || cp.location || areaName,
        time:  cp.time || cp.timestamp || '--:--',
        note:  cp.note || null,
        idx:   i,
      }))
    : photos.length > 0
      ? photos.map((p, i) => ({ label: p.location || areaName, time: p.timestamp || startTime, idx: i }))
      : [
          { label: 'Patrol Started', time: startTime, idx: 0 },
          { label: areaName,          time: '--:--',   idx: 1 },
          { label: 'Patrol Ended',   time: endTime,   idx: 2 },
        ];

  return (
    <div ref={exportRef} className="flex-1 flex flex-col font-manrope animate-fade-in overflow-y-auto no-scrollbar pb-[120px]"
      style={{ background: 'linear-gradient(180deg, #0D1A14 0%, #0F2318 40%, #F0F2F5 40%)' }}>

      {/* ── Dark Hero ───────────────────────────────────────────── */}
      <div className="relative px-6 pt-14 pb-6">
        {/* Back */}
        <div className="absolute top-6 left-5 right-5 flex justify-between items-center z-50">
          <button onClick={onBack} data-html2canvas-ignore className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-90 transition-transform border border-white/15">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          
          <button 
            onClick={handleSaveImage} 
            disabled={isExporting} 
            data-html2canvas-ignore 
            className="px-4 h-10 bg-[#39E58C] text-[#003624] rounded-full flex items-center gap-2 font-black text-[13px] shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {isExporting ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">download</span>}
            {isExporting ? 'Saving...' : 'Save Image'}
          </button>
        </div>

        {/* Celebration icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-[#39E58C]/15 border-2 border-[#39E58C]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#39E58C] text-[40px]">verified</span>
          </div>
        </div>

        <p className="text-center text-[10px] font-black text-[#39E58C] uppercase tracking-[0.25em] mb-1">Patrol Archive</p>
        <h1 className="text-center font-manrope font-black text-[26px] text-white tracking-tight leading-tight mb-1">{shiftLabel}</h1>
        <p className="text-center text-[12px] font-bold text-white/40 mb-6">{dateStr} &bull; {areaName}</p>

        {/* Big 3 stat ring row */}
        <div className="grid grid-cols-3 gap-3 mb-2">
          {[
            { label: 'Duration', value: durationStr, sub: 'total time', icon: 'timer' },
            { label: 'Evidence', value: `${photos.length}`, sub: 'photos', icon: 'photo_camera' },
            { label: 'Efficiency', value: `${efficiencyScore}%`, sub: 'score', icon: 'trending_up' },
          ].map(s => (
            <div key={s.label} className="bg-white/8 border border-white/10 rounded-[20px] p-4 flex flex-col items-center gap-1 backdrop-blur-sm">
              <span className="material-symbols-outlined text-[#39E58C] text-[18px] mb-0.5">{s.icon}</span>
              <p className="font-black text-[22px] text-white leading-none tracking-tight">{s.value}</p>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── White content area ─────────────────────────────────────── */}
      <div className="px-5 space-y-5">

        {/* Session Overview Card */}
        <div className="bg-white rounded-[28px] shadow-sm border border-gray-50 overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-gray-50">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Session Overview</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Time Started', value: startTime, icon: 'login' },
                { label: 'Time Ended', value: endTime, icon: 'logout' },
                { label: 'Officer', value: sessionData?.officer_name || sessionData?.officer_details?.full_name || 'SWAFO Officer', icon: 'badge' },
                { label: 'Shift', value: sessionData?.shift_type || '--', icon: 'schedule' },
                { label: 'Distance', value: `${distanceKm} km`, icon: 'straighten' },
                { label: 'Area', value: areaName, icon: 'location_on' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#E8F5E9] rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#1A5C3A] text-[15px]">{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                    <p className="font-black text-[13px] tracking-tight text-[#000]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Officer Notes — always shown */}
          <div className="px-6 py-4">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Officer Notes</p>
            <p className="text-[13px] font-medium text-gray-500 leading-relaxed italic">
              {sessionData?.notes ? `“${sessionData.notes}”` : 'No observations recorded for this session.'}
            </p>
          </div>
        </div>

        {/* ── Violations Counter — matches screenshot style ──────── */}
        <div className="bg-white rounded-[28px] shadow-sm border border-gray-50 px-5 py-4 flex items-center gap-4">
          {/* Icon circle */}
          <div className="w-12 h-12 rounded-full bg-[#1A5C3A]/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#1A5C3A] text-[22px]">gavel</span>
          </div>
          {/* Number + labels */}
          <div className="flex-1">
            <div className="flex items-baseline gap-1.5">
              <p className={`font-black text-[28px] leading-none tracking-tight ${violationsCount > 0 ? 'text-[#000]' : 'text-[#000]'}`}>
                {violationsCount}
              </p>
              <p className="font-black text-[10px] text-gray-400 uppercase tracking-widest">Logged</p>
            </div>
            <p className="font-black text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">Incident Violations</p>
          </div>
          {/* Review Cases button — always visible */}
          <button
            onClick={() => navigate('/officer/cases')}
            className="bg-[#1A5C3A] text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            Review Cases
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Patrol Route — real checkpoints from patrol */}
        <div className="bg-white rounded-[28px] shadow-sm border border-gray-50 px-6 py-5">
          {/* Header row */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 bg-[#1A5C3A] rounded-[14px] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-[16px]">route</span>
            </div>
            <h3 className="font-manrope font-black text-[17px] tracking-tight flex-1">Patrol Route</h3>
            {/* Checkpoint count badge */}
            <span className="bg-[#E8F5E9] text-[#1A5C3A] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              {checkpoints.length} Checkpoint{checkpoints.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Timeline list */}
          <div className="relative pl-1">
            {/* Vertical connector line */}
            <div className="absolute left-[18px] top-5 bottom-5 w-[2px] bg-[#E8F5E9] z-0" />

            <div className="space-y-0">
              {checkpoints.map((cp, i) => {
                const isFirst = i === 0;
                const isLast  = i === checkpoints.length - 1;
                const subtitle = isFirst ? 'Session Begin'
                  : isLast ? 'Session End'
                  : cp.note || 'Checkpoint';
                const iconName = isFirst ? 'start' : isLast ? 'flag' : 'location_on';
                const bldgImg = cp.image || getBuildingImage(cp.label || cp.name);
                return (
                  <div key={i} className="flex items-center gap-3 relative pb-5 last:pb-0">
                    {/* Icon square */}
                    <div className={`w-9 h-9 rounded-[14px] flex items-center justify-center shrink-0 z-10 shadow-sm
                      ${isFirst ? 'bg-[#1A5C3A]' : isLast ? 'bg-[#39E58C]' : 'bg-[#E8F5E9]'}`}>
                      <span className={`material-symbols-outlined text-[16px]
                        ${isFirst ? 'text-white' : isLast ? 'text-[#003624]' : 'text-[#1A5C3A]'}`}>
                        {iconName}
                      </span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 flex justify-between items-center min-w-0">
                      <div className="min-w-0">
                        <p className="font-black text-[14px] text-[#000] tracking-tight leading-none mb-0.5 truncate">
                          {cp.label || cp.name}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                          {subtitle}
                        </p>
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 tabular-nums shrink-0 ml-3">
                        {cp.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>



        {/* Evidence Strip */}
        {photos.length > 0 && (
          <div className="bg-white rounded-[28px] shadow-sm border border-gray-50 px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#1A5C3A] rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[15px]">photo_library</span>
                </div>
                <h3 className="font-manrope font-black text-[17px] tracking-tight">Evidence</h3>
              </div>
              <span className="bg-[#E8F5E9] text-[#1A5C3A] text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">{photos.length} Photos</span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {photos.map((p, i) => (
                <div 
                  key={i} 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-image', {detail: p.url}))}
                  className="relative w-[90px] h-[90px] rounded-[18px] overflow-hidden shrink-0 shadow-sm border-2 border-white cursor-pointer"
                >
                  {p.url
                    ? <img src={p.url} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><span className="material-symbols-outlined text-gray-300 text-[24px]">image</span></div>
                  }
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                    <p className="text-white text-[7px] font-black leading-none truncate">{p.location || areaName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



      </div>
    </div>
  );
};




// Helper to draw watermark on any canvas context
const applyWatermark = (ctx, width, height, locName, coords) => {
  ctx.fillStyle = 'white';
  ctx.textAlign = 'right';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  const padRight = width - 20;
  let y = 40;

  ctx.font = 'bold 26px Arial';
  ctx.fillText('SWAFO Security Unit', padRight, y);
  y += 30;
  ctx.font = 'bold 22px Arial';
  ctx.fillText('Evidence Capture', padRight, y);
  y += 45;

  ctx.font = '18px Arial';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  ctx.fillText(`${dateStr} ${timeStr}`, padRight, y);
  y += 25;

  ctx.fillText(locName || 'Campus Grounds', padRight, y);
  y += 30;

  let gpsStr = "⌖ GPS Unavailable";
  if (coords && coords.length > 0) {
    const lastCoord = coords[coords.length - 1];
    const lng = parseFloat(lastCoord[0]).toFixed(5);
    const lat = parseFloat(lastCoord[1]).toFixed(5);
    gpsStr = `⌖ ${lat}°N ${lng}°E`;
  }
  ctx.fillText(gpsStr, padRight, y);
};


const InAppCamera = ({ onCapture, onClose, locationName, trailCoords }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Request rear camera
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Rear camera unavailable, trying any device camera...");
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (errFallback) {
          console.warn("Camera access denied or unavailable:", errFallback?.name || errFallback?.message);
          setError(
            errFallback?.name === 'NotAllowedError' || errFallback?.name === 'PermissionDeniedError'
              ? 'Camera permission was denied in your browser settings. You can allow camera access or upload an image directly below.'
              : 'Could not access device camera. Please check your camera permissions or upload an image.'
          );
        }
      }
    };
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const fallbackInputRef = useRef(null);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return; // Video not ready
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    applyWatermark(ctx, canvas.width, canvas.height, locationName, trailCoords);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(dataUrl);
  };

  const handleFallbackFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        applyWatermark(ctx, canvas.width, canvas.height, locationName, trailCoords);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col font-manrope animate-fade-in">
      <input 
        type="file" 
        ref={fallbackInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleFallbackFile} 
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden p-6">
        {error ? (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 max-w-sm w-full text-center flex flex-col items-center gap-4 text-white shadow-2xl animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-[32px]">videocam_off</span>
            </div>
            <div>
              <h3 className="font-black text-[20px] text-white tracking-tight mb-1">Camera Access Needed</h3>
              <p className="text-[12px] font-medium text-white/70 leading-relaxed">
                {error}
              </p>
            </div>
            <div className="flex flex-col gap-2.5 w-full mt-2">
              <button 
                type="button"
                onClick={() => fallbackInputRef.current?.click()} 
                className="w-full h-12 bg-[#39E58C] text-[#003624] font-black text-[13px] rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Upload Photo from Device</span>
              </button>
              <button 
                type="button"
                onClick={onClose} 
                className="w-full h-11 bg-white/10 text-white/80 font-bold text-[13px] rounded-2xl hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}
        
        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent flex items-start px-6 pt-8 z-10">
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-[26px]">close</span>
          </button>
        </div>

        {/* Bottom controls — only shown when camera stream is active */}
        {!error && (
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center pb-8 z-10">
            <button 
              onClick={handleCapture}
              className="w-20 h-20 rounded-full border-[4px] border-white/80 p-1 active:scale-90 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-pointer"
            >
              <div className="w-full h-full bg-white rounded-full"></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MobilePatrolFlow({ initialScreen = 'selectArea' }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Load state from session storage for persistence across navigations
  const savedState = JSON.parse(sessionStorage.getItem('swafo_live_patrol_state') || 'null');

  const [seconds, setSeconds] = useState(savedState?.seconds || 0);
  const [isPatrolActive, setIsPatrolActive] = useState(savedState?.isPatrolActive || false);
  const [distanceKm, setDistanceKm] = useState(savedState?.distanceKm || 0);
  const [trailCoords, setTrailCoords] = useState(savedState?.trailCoords || []); // [[lng,lat], ...]
  const [activeSession, setActiveSession] = useState(savedState?.activeSession || JSON.parse(localStorage.getItem('swafo_active_session') || '{}'));
  const [capturedPhotos, setCapturedPhotos] = useState(savedState?.capturedPhotos || activeSession.capturedPhotos || []);
  const [violationCount, setViolationCount] = useState(savedState?.violationCount || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showInAppCamera, setShowInAppCamera] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // Full screen image viewer
  const galleryInputRef = useRef(null);
  const now = new Date();
  const [formData, setFormData] = useState(savedState?.formData || { shift_type: (now.getHours() >= 4 && now.getHours() < 12) ? 'Morning' : (now.getHours() >= 12 && now.getHours() < 16) ? 'Afternoon' : 'Evening', patrol_date: now.toISOString().split('T')[0], start_time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`, notes: '' });

  useEffect(() => {
    const handleOpenImage = (e) => setSelectedImage(e.detail);
    window.addEventListener('open-image', handleOpenImage);
    return () => window.removeEventListener('open-image', handleOpenImage);
  }, []);

  // Sync state to session storage to survive navigation to Record Violation
  useEffect(() => {
    if (isPatrolActive) {
      const stateObj = {
        seconds, isPatrolActive, distanceKm, trailCoords, activeSession, capturedPhotos, violationCount, formData
      };
      sessionStorage.setItem('swafo_live_patrol_state', JSON.stringify(stateObj));
      try {
        const storedSession = JSON.parse(localStorage.getItem('swafo_active_session') || '{}');
        localStorage.setItem('swafo_active_session', JSON.stringify({
          ...storedSession,
          checkpoints: formData.checkpoints || [],
          location: formData.location,
          assignedZone: formData.assignedZone
        }));
      } catch (e) {}
    }
  }, [seconds, isPatrolActive, distanceKm, trailCoords, activeSession, capturedPhotos, violationCount, formData]);

  useEffect(() => { let timer; if (isPatrolActive) { timer = setInterval(() => setSeconds(s => s + 1), 1000); } return () => clearInterval(timer); }, [isPatrolActive]);

  // Forcefully reset EVERYTHING if the user navigates back to 'Select Area'
  useEffect(() => {
    if (location.pathname.endsWith('select')) {
      if (isPatrolActive) {
        navigate('/officer/patrols/live', { replace: true });
        return;
      }
      setIsPatrolActive(false);
      setSeconds(0);
      setDistanceKm(0);
      setTrailCoords([]);
      setCapturedPhotos([]);
      setViolationCount(0);
      setActiveSession({});
      sessionStorage.removeItem('swafo_live_patrol_state');
    }
  }, [location.pathname, isPatrolActive, navigate]);

  const handleStartPatrol = async () => {
    // Force reset all tracking state when a new patrol officially starts!
    setSeconds(0);
    setDistanceKm(0);
    setTrailCoords([]);
    setCapturedPhotos([]);
    setViolationCount(0);
    
    const loggedUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('swafo_mock_user') || '{}');
      } catch (e) {
        return {};
      }
    })();
    const officerId = loggedUser.id || 63;
    const officerName = loggedUser.name || 'SWAFO Officer';

    const startTimeIso = new Date().toISOString();
    try {
      const resp = await fetch(API_ENDPOINTS.PATROLS_CREATE, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          officer: officerId, 
          location: formData.location || 'Campus Patrol', 
          status: "IN_PROGRESS", 
          shift_type: formData.shift_type, 
          notes: formData.notes, 
          actual_start: startTimeIso 
        })
      });
      if (resp.ok) {
        const d = await resp.json();
        setActiveSession({ 
          ...d, 
          officer: officerId,
          officer_name: officerName,
          officer_details: { id: officerId, full_name: officerName, email: loggedUser.email },
          actual_start: startTimeIso, 
          capturedPhotos: [] 
        });
      } else {
        // API error — still start locally (demo mode)
        setActiveSession({ 
          id: 'demo-' + Date.now(), 
          officer: officerId,
          officer_name: officerName,
          officer_details: { id: officerId, full_name: officerName, email: loggedUser.email },
          actual_start: startTimeIso, 
          capturedPhotos: [] 
        });
      }
    } catch (e) {
      // Network error — still start locally (demo mode)
      setActiveSession({ 
        id: 'demo-' + Date.now(), 
        officer: officerId,
        officer_name: officerName,
        officer_details: { id: officerId, full_name: officerName, email: loggedUser.email },
        actual_start: startTimeIso, 
        capturedPhotos: [] 
      });
    }
    setIsPatrolActive(true); // Always activate regardless of API result
  };

  const handleEndPatrol = async (liveCheckpoints = []) => {
    try {
      const endTimeIso = new Date().toISOString();

      // Snapshot completed checkpoints
      const completedCheckpoints = liveCheckpoints
        .filter(cp => cp.done)
        .map(cp => {
          const bldgImg = getBuildingImage(cp.name || cp.location_name);
          return {
            name:     cp.name || cp.location_name || cp.label || 'Checkpoint',
            time:     new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status:   'completed',
            note:     cp.note || '',
            building: cp.name || cp.location_name || '',
            image:    bldgImg || null,
          };
        });

      // Keep only actual officer-captured photos, do NOT inject static building catalog images
      const allPhotos = (capturedPhotos || []).filter(p => {
        const url = p?.url || p;
        if (!url || typeof url !== 'string') return Boolean(url);
        return !url.includes('/images/buildings/') && !url.includes('/media/buildings/');
      });

      // Build the final completed patrol record
      const finalData = {
        ...activeSession,
        actual_end:        endTimeIso,
        end_time:          endTimeIso,
        status:            'COMPLETED',
        capturedPhotos:    allPhotos,
        trail_coordinates: trailCoords,
        distance_km:       distanceKm,
        location:          formData.location || activeSession?.location || 'Campus Patrol',
        shift_type:        formData.shift_type || activeSession?.shift_type,
        checkpoints_data:  completedCheckpoints,
        violations_count:  violationCount,
        photos_count:      allPhotos.length,
        duration_display:  Math.max(0, Math.floor((new Date(endTimeIso) - new Date(activeSession?.actual_start)) / 60000)) + 'm',
      };

      // Set the active session so the summary screen has the data
      setActiveSession(finalData);
      setIsPatrolActive(false);

      console.log("Navigating to summary details screen");
      navigate('/officer/patrols/summary');
    } catch (e) {
      console.error("Error in handleEndPatrol:", e);
    }
  };


  const handleSaveToHistory = async () => {
    setIsSaving(true);
    const finalData = { ...activeSession };

    try {
      // ── Save to localStorage immediately (instant feedback) ──────────────
      const existingHistory = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
      localStorage.setItem('swafo_local_history', JSON.stringify([finalData, ...existingHistory]));

      // ── Store in sessionStorage for the detail screen to read ────────────
      sessionStorage.setItem('swafo_viewing_patrol', JSON.stringify(finalData));

      if (activeSession.id && !activeSession.id.toString().startsWith('demo-')) {
        // ── Save completed patrol to DB ──────────────────────────────────
        await fetch(`${API_ENDPOINTS.PATROLS_END(activeSession.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        await fetch(`${API_ENDPOINTS.PATROLS_CREATE}${activeSession.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes:             finalData.notes,
            trail_coordinates: finalData.trail_coordinates,
            distance_km:       finalData.distance_km,
            photos_count:      finalData.photos_count,
            checkpoints_data:  finalData.checkpoints_data || [],
            violations_count:  finalData.violations_count,
          })
        });
      }

      localStorage.removeItem('swafo_active_session');
      sessionStorage.removeItem('swafo_live_patrol_state');
      
      const patrolId = activeSession?.id || 'local';
      navigate(`/officer/patrol-history/${patrolId}`);
    } catch (e) {
      console.error("Save error", e);
      localStorage.removeItem('swafo_active_session');
      sessionStorage.removeItem('swafo_live_patrol_state');
      const patrolId = activeSession?.id || 'local';
      navigate(`/officer/patrol-history/${patrolId}`);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F5] h-full relative overflow-x-hidden">
      <input type="file" ref={galleryInputRef} accept="image/*" className="hidden" onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Apply identical forensic watermark
            applyWatermark(ctx, canvas.width, canvas.height, formData.location, trailCoords);
            
            const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const newPhoto = { url: watermarkedDataUrl, location: formData.location || "Campus Grounds", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setCapturedPhotos(prev => [newPhoto, ...prev]);
          };
          img.src = URL.createObjectURL(file);
        }
      }} />

      {/* IN-APP CAMERA OVERLAY */}
      {showInAppCamera && (
        <InAppCamera 
          onClose={() => setShowInAppCamera(false)} 
          locationName={formData.location || activeSession?.location || 'Campus Grounds'}
          trailCoords={trailCoords}
          onCapture={(dataUrl) => {
            const newPhoto = { url: dataUrl, location: formData.location || "Campus Grounds", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setCapturedPhotos(prev => [newPhoto, ...prev]);
            setShowInAppCamera(false);
          }} 
        />
      )}

      {(location.pathname.endsWith('select') || initialScreen === 'selectArea') && <SelectAreaScreen onConfirm={() => navigate('/officer/patrols/live')} onBack={() => navigate('/officer/patrols')} formData={formData} setFormData={setFormData} />}
      {location.pathname.endsWith('live') && <LiveMapScreen onEnd={handleEndPatrol} onExpand={() => navigate('/officer/patrols/expanded-map')} onBack={() => navigate('/officer/patrols/select')} seconds={seconds} isPatrolActive={isPatrolActive} setIsPatrolActive={handleStartPatrol} capturedPhotos={capturedPhotos} onCamera={() => setShowPhotoMenu(true)} distanceKm={distanceKm} setDistanceKm={setDistanceKm} setTrailCoords={setTrailCoords} trailCoords={trailCoords} formData={formData} setFormData={setFormData} violationCount={violationCount} setViolationCount={setViolationCount} />}
      {location.pathname.endsWith('summary') && <DynamicSummaryScreen onSave={handleSaveToHistory} onBack={() => navigate('/officer/patrols/live')} sessionData={activeSession} isSaving={isSaving} trailCoords={trailCoords} distanceKm={distanceKm} capturedPhotos={capturedPhotos} />}
      {location.pathname.endsWith('expanded-map') && <FullMapScreen onBack={() => navigate('/officer/patrols/live')} trailCoords={trailCoords} />}
      {location.pathname.includes('patrol-history/') && (() => {
        // Read the patrol clicked in PatrolMonitoring (stored in sessionStorage)
        // Fallback: search localStorage history by path ID
        const pathId = location.pathname.split('patrol-history/')[1];
        let archived = null;
        try {
          const stored = sessionStorage.getItem('swafo_viewing_patrol');
          archived = stored ? JSON.parse(stored) : null;
        } catch {}
        if (!archived) {
          const allHistory = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
          archived = allHistory.find(p => String(p.id) === pathId) || allHistory[0] || {};
        }
        return <PatrolSessionDetails onBack={() => navigate('/officer/patrols')} sessionData={archived} />;
      })()}
      {(location.pathname.includes('history') || initialScreen === 'archive') && !location.pathname.includes('patrol-history/') && <PatrolSessionDetails onBack={() => navigate('/officer/patrols')} sessionData={activeSession} />}

      {/* PHOTO ACTION SHEET */}
      {showPhotoMenu && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center font-manrope">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowPhotoMenu(false)} />
          <div className="bg-white w-full rounded-t-[32px] p-6 relative z-10 animate-slide-up pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="font-manrope font-black text-[22px] mb-1">Add Evidence</h3>
            <p className="text-[13px] font-bold text-gray-400 mb-6">Choose an image source to attach to this patrol.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setShowPhotoMenu(false); setShowInAppCamera(true); }}
                className="w-full h-[64px] bg-[#1A5C3A] rounded-[24px] flex items-center justify-center gap-3 text-white shadow-xl shadow-[#1A5C3A]/20 active:scale-[0.98] transition-transform"
              >
                <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                <span className="font-black text-[16px]">Use Live Camera</span>
              </button>
              <button 
                onClick={() => { setShowPhotoMenu(false); galleryInputRef.current?.click(); }}
                className="w-full h-[64px] bg-gray-100 rounded-[24px] flex items-center justify-center gap-3 text-gray-700 active:scale-[0.98] transition-transform"
              >
                <span className="material-symbols-outlined text-[24px]">image</span>
                <span className="font-black text-[16px]">Upload from Gallery</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN IMAGE VIEWER */}
      {selectedImage && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center font-manrope animate-fade-in" onClick={() => setSelectedImage(null)}>
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent flex justify-end px-6 pt-8 z-10 pointer-events-none">
            <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform pointer-events-auto border border-white/30">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
          <div className="w-full h-full flex items-center justify-center p-4">
            <img src={selectedImage} onClick={(e) => e.stopPropagation()} className="max-w-full max-h-[85vh] object-contain rounded-[12px] shadow-2xl" />
          </div>
          <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
            <p className="text-white/50 text-[12px] font-bold">Tap anywhere to close</p>
          </div>
        </div>
      )}

    </div >
  );
}
