import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_ENDPOINTS } from '../../api/config';
import { getBuildingImage } from '../../utils/buildingImages';

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(iso, opts) { return iso ? new Date(iso).toLocaleString('en-US', opts) : '--'; }
function fmtTime(iso) { return fmt(iso, { hour: '2-digit', minute: '2-digit' }); }
function fmtDate(iso) { return fmt(iso, { weekday: 'long', month: 'long', day: 'numeric' }); }
function durationMins(start, end) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
}
function score(p) {
  const cp   = Array.isArray(p.checkpoints_data) ? p.checkpoints_data.length : 0;
  const done = Array.isArray(p.checkpoints_data) ? p.checkpoints_data.filter(c => c.status === 'completed').length : 0;
  return cp > 0 ? Math.round((done / cp) * 100) : (p.status === 'COMPLETED' ? 100 : 0);
}

const STATUS_COLORS = {
  COMPLETED:   { bg: 'bg-[#7cfabb]',  text: 'text-[#003624]' },
  IN_PROGRESS: { bg: 'bg-yellow-300', text: 'text-yellow-900' },
  CANCELLED:   { bg: 'bg-red-200',    text: 'text-red-800'   },
};

export default function PatrolHistory({ role }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [patrols, setPatrols]         = useState([]);
  const [selected, setSelected]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 1024);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // On desktop, auto-select first if none selected
      if (!mobile && !selected && patrols.length > 0) {
        setSelected(patrols[0]);
      }
    };
    window.addEventListener('resize', onResize);
    loadPatrols();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // When location changes or on mount on mobile, ALWAYS default to list (selected = null)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSelected(null);
    }
  }, [location.pathname]);

  async function loadPatrols() {
    try {
      const resp        = await fetch(API_ENDPOINTS.PATROLS_LIST);
      const serverData  = resp.ok ? await resp.json() : [];
      const results     = Array.isArray(serverData) ? serverData : (serverData.results || []);

      // filter by officer for non-admins
      const filtered = role === 'admin'
        ? results
        : results.filter(p => p.officer_details?.email === user?.email);

      // merge localStorage patrols (deduplicate by id)
      const localData = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
      const merged    = [...filtered];
      localData.forEach(lp => {
        if (!merged.find(m => String(m.id) === String(lp.id))) merged.push(lp);
      });

      const sorted = merged.sort((a, b) => new Date(b.start_time || b.actual_start) - new Date(a.start_time || a.actual_start));
      setPatrols(sorted);
      
      // IMPORTANT: Only auto-select on desktop! On mobile, keep null so director lands on the list!
      if (window.innerWidth >= 1024 && sorted.length > 0) {
        setSelected(sorted[0]);
      } else {
        setSelected(null);
      }
    } catch (e) {
      const localData = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
      setPatrols(localData);
      if (window.innerWidth >= 1024 && localData.length > 0) {
        setSelected(localData[0]);
      } else {
        setSelected(null);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── loading / empty states ────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#1A5C3A] border-t-transparent rounded-full animate-spin" />
        <p className="font-manrope font-bold text-[#1A5C3A]">Loading Patrol Records…</p>
      </div>
    </div>
  );

  if (patrols.length === 0) return (
    <div className="flex items-center justify-center h-[60vh] px-4 text-center">
      <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md">
        <span className="material-symbols-outlined text-[48px] text-gray-300 mb-3">history</span>
        <h3 className="font-pjs font-bold text-[18px] text-[#003624] mb-1">No Patrol Records Found</h3>
        <p className="font-manrope text-[13px] text-gray-400">There are no completed or active patrol logs recorded yet.</p>
      </div>
    </div>
  );

  // ── MOBILE: full-screen detail for selected OR full-screen list ───────────
  if (isMobile) {
    return selected
      ? <PatrolDetail patrol={selected} onBack={() => setSelected(null)} patrols={patrols} onSelect={setSelected} role={role} />
      : <PatrolList patrols={patrols} onSelect={setSelected} role={role} />;
  }

  // ── DESKTOP: split-pane ───────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto px-8 pt-10 pb-24 font-manrope animate-fade-in">

      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-1">
            {role === 'admin' ? 'Institutional Surveillance Archive' : 'Patrol Archive'}
          </p>
          <h1 className="font-manrope font-black text-[40px] text-[#000] leading-none tracking-tight">
            {role === 'admin' ? 'Patrol Oversight' : 'Patrol History'}
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-white">
          <div className="w-2 h-2 bg-[#39E58C] rounded-full animate-pulse" />
          <span className="font-black text-[12px] text-[#1A5C3A] uppercase tracking-widest">{patrols.length} Records</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: list */}
        <div className="col-span-5 space-y-4 overflow-y-auto max-h-[80vh] pr-2 no-scrollbar">
          {patrols.map(p => (
            <PatrolCard
              key={p.id}
              patrol={p}
              active={selected?.id === p.id}
              onClick={() => setSelected(p)}
            />
          ))}
        </div>

        {/* Right: detail */}
        <div className="col-span-7">
          <DetailPanel patrol={selected || patrols[0]} />
        </div>
      </div>
    </div>
  );
}

// ── Patrol list card (desktop left pane / mobile list) ─────────────────────
function PatrolCard({ patrol: p, active, onClick }) {
  const st    = STATUS_COLORS[p.status] || STATUS_COLORS.IN_PROGRESS;
  const mins  = durationMins(p.start_time || p.actual_start, p.end_time || p.actual_end);
  const viol  = p.violations_count ?? 0;
  const rawCaptured = Array.isArray(p.capturedPhotos) ? p.capturedPhotos : [];
  const officerPhotos = rawCaptured.filter(ph => {
    const url = ph?.url || ph;
    if (!url || typeof url !== 'string') return Boolean(url);
    return !url.includes('/images/buildings/') && !url.includes('/media/buildings/');
  });
  const photos = officerPhotos.length;
  const officerThumb = officerPhotos.length > 0 ? (officerPhotos[0].url || officerPhotos[0]) : null;
  const cardThumb = officerThumb || getBuildingImage(p.location) || 
    (p.checkpoints_data?.[0] && getBuildingImage(p.checkpoints_data[0].name || p.checkpoints_data[0].building));
  const officerName = p.officer_details?.full_name || 'Officer on Duty';

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-2xl sm:rounded-[24px] p-4 cursor-pointer transition-all duration-200 overflow-hidden group
        ${active
          ? 'shadow-lg ring-2 ring-[#1A5C3A]/20 border-emerald-300'
          : 'shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-slate-100'}`}
    >
      {/* accent bar */}
      <div className={`absolute top-0 left-0 w-[3px] h-full bg-[#1A5C3A] transition-transform duration-300 ${active ? 'scale-y-100' : 'scale-y-0'}`} />

      <div className="flex gap-3.5 items-center">
        {cardThumb ? (
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl sm:rounded-[16px] overflow-hidden shrink-0 border border-gray-100 bg-gray-50 shadow-sm">
            <img src={cardThumb} alt={p.location} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl sm:rounded-[16px] bg-[#E8F5E9] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#1A5C3A] text-[22px] sm:text-[24px]">photo_camera</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-pjs font-bold text-[15px] sm:text-[16px] text-[#003624] leading-tight truncate">
              {p.location || 'Campus Patrol'}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest ${st.bg} ${st.text} shrink-0 ml-1.5`}>
              {p.status?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-[11px] font-bold text-gray-400 truncate">
            {fmtDate(p.start_time || p.actual_start)} · <span className="text-slate-600">{officerName}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#1A5C3A]">timer</span>
            {mins}m
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#1A5C3A]">photo_camera</span>
            {photos}
          </span>
          <span className={`flex items-center gap-1 ${viol > 0 ? 'text-red-500 font-bold' : ''}`}>
            <span className={`material-symbols-outlined text-[14px] ${viol > 0 ? 'text-red-500' : 'text-gray-300'}`}>warning</span>
            {viol} {viol === 1 ? 'viol' : 'viols'}
          </span>
        </div>
        <span className="text-[11px] font-bold text-[#1A5C3A] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
          Details <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        </span>
      </div>
    </div>
  );
}

// ── Full detail panel (desktop right pane & mobile detail screen) ──────────
function DetailPanel({ patrol: p }) {
  const [viewingPhoto, setViewingPhoto] = useState(null);
  if (!p) return null;

  const startIso  = p.start_time  || p.actual_start;
  const endIso    = p.end_time    || p.actual_end;
  const mins      = durationMins(startIso, endIso);
  const sc        = score(p);
  const officer   = p.officer_details?.full_name || 'Officer on Duty';
  const shift     = p.shift_type || '--';
  const viol      = p.violations_count ?? 0;
  const notes     = p.notes || null;
  const checkpoints = Array.isArray(p.checkpoints_data) ? p.checkpoints_data : [];
  const rawCaptured = Array.isArray(p.capturedPhotos) ? p.capturedPhotos : [];

  // Only actual officer-captured photos, excluding static building catalog images
  const allEvidence = rawCaptured.filter(ph => {
    const url = ph?.url || ph;
    if (!url || typeof url !== 'string') return Boolean(url);
    return !url.includes('/images/buildings/') && !url.includes('/media/buildings/');
  });

  const photos = allEvidence.length;

  return (
    <div className="rounded-2xl sm:rounded-[32px] overflow-hidden shadow-xl sm:shadow-2xl relative border border-slate-100">

      {/* Lightbox Modal */}
      {viewingPhoto && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            <img src={viewingPhoto} alt="Building Clearance Evidence" className="w-full h-full object-contain max-h-[80vh] rounded-2xl" />
            <button 
              onClick={() => setViewingPhoto(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all border border-white/30"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Dark header (PATROL COMPLETE style) ── */}
      <div className="bg-[#0D2F1E] px-4 sm:px-8 pt-6 sm:pt-8 pb-7 sm:pb-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1A5C3A] border-2 border-[#39E58C]/30 flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
            <span className="material-symbols-outlined text-[#39E58C] text-[24px] sm:text-[28px]">verified</span>
          </div>
          <p className="text-[9px] sm:text-[10px] font-black text-[#39E58C] tracking-[0.25em] sm:tracking-[0.3em] uppercase mb-1.5 sm:mb-2">
            {p.status === 'COMPLETED' ? 'Patrol Complete' : p.status?.replace('_', ' ')}
          </p>
          <h2 className="font-pjs font-extrabold text-[22px] sm:text-[28px] text-white leading-tight mb-1">
            {p.location || 'Campus Patrol'}
          </h2>
          <p className="text-[12px] sm:text-[13px] font-bold text-white/50">
            {fmtDate(startIso)} · {p.location}
          </p>
        </div>

        {/* Metric tiles */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: 'timer',        label: 'Total Time',  val: `${mins}m`   },
            { icon: 'photo_camera', label: 'Photos',      val: photos       },
            { icon: 'trending_up',  label: 'Score',       val: `${sc}%`     },
          ].map(m => (
            <div key={m.label} className="bg-[#1A3825] rounded-xl sm:rounded-[18px] py-3.5 sm:py-5 flex flex-col items-center gap-0.5 sm:gap-1">
              <span className="material-symbols-outlined text-[#39E58C] text-[18px] sm:text-[22px]">{m.icon}</span>
              <p className="font-black text-[18px] sm:text-[22px] text-white leading-none">{m.val}</p>
              <p className="text-[8px] sm:text-[9px] font-black text-white/40 uppercase tracking-widest text-center">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Light body ── */}
      <div className="bg-white px-4 sm:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">

        {/* Session Overview */}
        <Section label="Session Overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 sm:gap-y-4 gap-x-6">
            <InfoRow icon="login"      label="Time Started" val={fmtTime(startIso)} />
            <InfoRow icon="logout"     label="Time Ended"   val={fmtTime(endIso)} />
            <InfoRow icon="badge"      label="Officer"      val={officer} />
            <InfoRow icon="schedule"   label="Shift"        val={shift} />
            <InfoRow icon="straighten" label="Distance"     val={`${(p.distance_km || 0).toFixed(2)} km`} />
            <InfoRow icon="location_on" label="Area"        val={p.location || '--'} />
          </div>
        </Section>

        {/* Violation Counter */}
        <Section label="Violations Recorded" badge={viol > 0 ? `${viol} RECORDED` : 'NONE'} badgeColor={viol > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}>
          <div className={`flex items-center gap-4 p-4 rounded-xl sm:rounded-[16px] ${viol > 0 ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${viol > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <span className={`material-symbols-outlined text-[20px] sm:text-[22px] ${viol > 0 ? 'text-red-500' : 'text-gray-300'}`}>warning</span>
            </div>
            <div>
              <p className={`font-black text-[26px] sm:text-[32px] leading-none ${viol > 0 ? 'text-red-600' : 'text-gray-300'}`}>{viol}</p>
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {viol === 0 ? 'No violations during this patrol' : `violation${viol > 1 ? 's' : ''} recorded`}
              </p>
            </div>
          </div>
        </Section>

        {/* Officer Notes */}
        {notes && (
          <Section label="Officer Notes">
            <div className="bg-amber-50 border border-amber-100 rounded-xl sm:rounded-[16px] p-4 flex gap-3">
              <span className="material-symbols-outlined text-amber-500 text-[18px] sm:text-[20px] shrink-0 mt-0.5">sticky_note_2</span>
              <p className="text-[12px] sm:text-[13px] font-medium text-gray-700 leading-relaxed">{notes}</p>
            </div>
          </Section>
        )}

        {/* Patrol Route with Building Visual Thumbnails */}
        {checkpoints.length > 0 && (
          <Section label="Patrol Route Checkpoints" badge={`${checkpoints.length} CHECKPOINTS`}>
            <div className="space-y-2">
              {checkpoints.map((cp, i) => {
                const bldgImg = getBuildingImage(cp.name || cp.building);
                return (
                  <div key={i} className="flex gap-2.5 sm:gap-3 relative items-center bg-gray-50/70 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 z-10
                      ${i === 0 ? 'bg-[#1A5C3A]' : i === checkpoints.length - 1 ? 'bg-[#39E58C]' : 'bg-white border-2 border-gray-200'}`}>
                      {i === 0
                        ? <span className="material-symbols-outlined text-white text-[12px] sm:text-[14px]">radio_button_checked</span>
                        : i === checkpoints.length - 1
                          ? <span className="material-symbols-outlined text-[#003624] text-[12px] sm:text-[14px]">flag</span>
                          : <span className="text-[10px] sm:text-[11px] font-black text-gray-400">{i + 1}</span>
                      }
                    </div>

                    {bldgImg && (
                      <div 
                        onClick={() => setViewingPhoto(bldgImg)}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden shrink-0 border border-gray-200 bg-white shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform group relative"
                        title="Click to view building photo"
                      >
                        <img src={bldgImg} alt={cp.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[14px] sm:text-[16px]">zoom_in</span>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[13px] sm:text-[14px] text-[#000] truncate">{cp.name || cp.building || `Checkpoint ${i + 1}`}</p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          ✓ Cleared
                        </span>
                        {cp.note && <span className="text-[10px] sm:text-[11px] text-gray-400 truncate">{cp.note}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 shrink-0 ml-1.5 sm:ml-2">{cp.time || ''}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Evidence Photos */}
        {allEvidence.length > 0 && (
          <Section label="Patrol Evidence" badge={`${allEvidence.length} PHOTOS`}>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {allEvidence.slice(0, 6).map((ph, i) => {
                const src = ph.url || ph;
                return (
                  <div 
                    key={i} 
                    onClick={() => setViewingPhoto(src)}
                    className="aspect-square rounded-xl sm:rounded-[16px] overflow-hidden bg-gray-100 cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-transform group relative"
                  >
                    <img src={src} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[20px] sm:text-[22px]">zoom_in</span>
                    </div>
                    {ph.location && (
                      <div className="absolute bottom-1 inset-x-1 bg-black/60 backdrop-blur-sm rounded-lg py-0.5 px-1 text-center">
                        <p className="text-[8px] sm:text-[9px] font-bold text-white truncate">{ph.location}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {allEvidence.length > 6 && (
                <div 
                  onClick={() => setViewingPhoto(allEvidence[6].url || allEvidence[6])}
                  className="aspect-square rounded-xl sm:rounded-[16px] bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <p className="font-black text-gray-500 text-[11px] sm:text-[13px]">+{allEvidence.length - 6} more</p>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// ── Mobile-only patrol list ───────────────────────────────────────────────
function PatrolList({ patrols, onSelect, role }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return patrols.filter(p => {
      const loc = (p.location || '').toLowerCase();
      const officer = (p.officer_details?.full_name || '').toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = !q || loc.includes(q) || officer.includes(q);
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [patrols, search, statusFilter]);

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-[#f8fafc] px-4 pt-5 font-manrope">
      {/* Mobile Page Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200">
            {role === 'admin' ? 'Director Archive' : 'Officer Archive'}
          </span>
          <span className="text-[11px] font-bold text-gray-400">
            {filtered.length} of {patrols.length} Records
          </span>
        </div>
        <h1 className="font-pjs font-extrabold text-[24px] text-[#003624] tracking-tight leading-tight">
          {role === 'admin' ? 'Patrol Oversight' : 'Patrol History'}
        </h1>
        <p className="text-[12px] font-medium text-gray-500 mt-0.5">
          Surveillance logs, routes, and officer clearance records.
        </p>
      </div>

      {/* Mobile Search & Filter Chips */}
      <div className="space-y-2.5 mb-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search by area or officer..."
            value={search || ""}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#003624]/20 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {[
            { id: 'ALL', label: 'All Records' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#003624] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-slate-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patrol Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span className="material-symbols-outlined text-[36px] text-gray-300 mb-2">search_off</span>
            <p className="text-[13px] font-bold text-gray-600">No patrols match your search.</p>
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
              className="mt-3 text-[11px] font-bold text-[#003624] underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filtered.map(p => (
            <PatrolCard key={p.id} patrol={p} active={false} onClick={() => onSelect(p)} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Mobile-only detail screen ────────────────────────────────────────────
function PatrolDetail({ patrol, onBack, patrols, onSelect, role }) {
  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-[#f8fafc] font-manrope">
      {/* Sticky Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-[#003624] px-4 py-3 flex items-center justify-between shadow-md border-b border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[12px] font-bold transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to List</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            Patrol #{patrol.id}
          </span>
        </div>
      </div>

      {/* Detail Content Container */}
      <div className="p-3.5 sm:p-6">
        <DetailPanel patrol={patrol} />
      </div>

      {/* Other patrols scroller */}
      <div className="px-3.5 sm:px-6 pb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black text-gray-400 tracking-[0.15em] uppercase">Other Recent Patrols</p>
          <button onClick={onBack} className="text-[11px] font-bold text-[#003624] underline">View All</button>
        </div>
        <div className="space-y-2.5">
          {patrols.filter(p => p.id !== patrol.id).slice(0, 4).map(p => (
            <PatrolCard key={p.id} patrol={p} active={false} onClick={() => onSelect(p)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Small reusable components ────────────────────────────────────────────
function Section({ label, badge, badgeColor = 'bg-[#39E58C]/20 text-[#1A5C3A]', children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        {badge && <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, val }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-[#F0FAF4] flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[#1A5C3A] text-[16px]">{icon}</span>
      </div>
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">{label}</p>
        <p className="font-black text-[14px] text-[#000] leading-tight">{val}</p>
      </div>
    </div>
  );
}
