import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../api/config';

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
  const [patrols, setPatrols]         = useState([]);
  const [selected, setSelected]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 1024);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    loadPatrols();
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
      if (sorted.length > 0) setSelected(sorted[0]);
    } catch (e) {
      const localData = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
      setPatrols(localData);
      if (localData.length > 0) setSelected(localData[0]);
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
    <div className="flex items-center justify-center h-[60vh]">
      <p className="font-manrope font-bold text-gray-400">No patrol records found.</p>
    </div>
  );

  // ── MOBILE: full-screen detail for selected ───────────────────────────────
  if (isMobile) {
    return selected
      ? <PatrolDetail patrol={selected} onBack={() => setSelected(null)} patrols={patrols} onSelect={setSelected} />
      : <PatrolList patrols={patrols} onSelect={setSelected} />;
  }

  // ── DESKTOP: split-pane ───────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto px-8 pt-10 pb-24 font-manrope animate-fade-in">

      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-1">Patrol Archive</p>
          <h1 className="font-manrope font-black text-[40px] text-[#000] leading-none tracking-tight">Patrol History</h1>
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
          <DetailPanel patrol={selected} />
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
  const photos = typeof p.photos_count === 'number' ? p.photos_count
    : Array.isArray(p.capturedPhotos) ? p.capturedPhotos.length : 0;

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-[24px] p-5 cursor-pointer transition-all duration-200 overflow-hidden
        ${active
          ? 'shadow-lg ring-2 ring-[#1A5C3A]/20'
          : 'shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-white'}`}
    >
      {/* accent bar */}
      <div className={`absolute top-0 left-0 w-[3px] h-full bg-[#1A5C3A] transition-transform duration-300 ${active ? 'scale-y-100' : 'scale-y-0'}`} />

      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-black text-[16px] text-[#000] leading-tight truncate max-w-[200px]">
            {p.location || 'Campus Patrol'}
          </h3>
          <p className="text-[11px] font-bold text-gray-400 mt-0.5">
            {fmtDate(p.start_time || p.actual_start)}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${st.bg} ${st.text}`}>
          {p.status?.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 mt-3 pt-3 border-t border-gray-50">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-[#1A5C3A]">timer</span>
          {mins}m
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-[#1A5C3A]">photo_camera</span>
          {photos} photos
        </span>
        <span className={`flex items-center gap-1.5 ${viol > 0 ? 'text-red-500' : ''}`}>
          <span className={`material-symbols-outlined text-[14px] ${viol > 0 ? 'text-red-400' : 'text-gray-300'}`}>warning</span>
          {viol} violations
        </span>
      </div>
    </div>
  );
}

// ── Full detail panel (desktop right pane & mobile detail screen) ──────────
function DetailPanel({ patrol: p }) {
  if (!p) return null;

  const startIso  = p.start_time  || p.actual_start;
  const endIso    = p.end_time    || p.actual_end;
  const mins      = durationMins(startIso, endIso);
  const sc        = score(p);
  const officer   = p.officer_details?.full_name || 'Officer on Duty';
  const shift     = p.shift_type || '--';
  const photos    = typeof p.photos_count === 'number' ? p.photos_count
    : Array.isArray(p.capturedPhotos) ? p.capturedPhotos.length : 0;
  const viol      = p.violations_count ?? 0;
  const notes     = p.notes || null;
  const checkpoints = Array.isArray(p.checkpoints_data) ? p.checkpoints_data : [];
  const capturedPhotos = Array.isArray(p.capturedPhotos) ? p.capturedPhotos : [];

  return (
    <div className="rounded-[32px] overflow-hidden shadow-2xl">

      {/* ── Dark header (PATROL COMPLETE style) ── */}
      <div className="bg-[#0D2F1E] px-8 pt-8 pb-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#1A5C3A] border-2 border-[#39E58C]/30 flex items-center justify-center mb-4 shadow-lg">
            <span className="material-symbols-outlined text-[#39E58C] text-[28px]">verified</span>
          </div>
          <p className="text-[10px] font-black text-[#39E58C] tracking-[0.3em] uppercase mb-2">
            {p.status === 'COMPLETED' ? 'Patrol Complete' : p.status?.replace('_', ' ')}
          </p>
          <h2 className="font-black text-[28px] text-white leading-tight mb-1">
            {p.location || 'Campus Patrol'}
          </h2>
          <p className="text-[13px] font-bold text-white/50">
            {fmtDate(startIso)} · {p.location}
          </p>
        </div>

        {/* Metric tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: 'timer',        label: 'Total Time',  val: `${mins}m`   },
            { icon: 'photo_camera', label: 'Photos',      val: photos       },
            { icon: 'trending_up',  label: 'Score',       val: `${sc}%`     },
          ].map(m => (
            <div key={m.label} className="bg-[#1A3825] rounded-[18px] py-4 md:py-5 flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-[#39E58C] text-[20px] md:text-[22px]">{m.icon}</span>
              <p className="font-black text-[20px] md:text-[22px] text-white leading-none">{m.val}</p>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Light body ── */}
      <div className="bg-white px-8 py-6 space-y-6">

        {/* Session Overview */}
        <Section label="Session Overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
            <InfoRow icon="login"      label="Time Started" val={fmtTime(startIso)} />
            <InfoRow icon="logout"     label="Time Ended"   val={fmtTime(endIso)} />
            <InfoRow icon="badge"      label="Officer"      val={officer} />
            <InfoRow icon="schedule"   label="Shift"        val={shift} />
            <InfoRow icon="straighten" label="Distance"     val={`${(p.distance_km || 0).toFixed(2)} km`} />
            <InfoRow icon="location_on" label="Area"        val={p.location || '--'} />
          </div>
        </Section>

        {/* Violation Counter — NEW */}
        <Section label="Violations Recorded" badge={viol > 0 ? `${viol} RECORDED` : 'NONE'} badgeColor={viol > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}>
          <div className={`flex items-center gap-4 p-4 rounded-[16px] ${viol > 0 ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${viol > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <span className={`material-symbols-outlined text-[22px] ${viol > 0 ? 'text-red-500' : 'text-gray-300'}`}>warning</span>
            </div>
            <div>
              <p className={`font-black text-[32px] leading-none ${viol > 0 ? 'text-red-600' : 'text-gray-300'}`}>{viol}</p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {viol === 0 ? 'No violations during this patrol' : `violation${viol > 1 ? 's' : ''} recorded`}
              </p>
            </div>
          </div>
        </Section>

        {/* Officer Notes — NEW */}
        {notes && (
          <Section label="Officer Notes">
            <div className="bg-amber-50 border border-amber-100 rounded-[16px] p-4 flex gap-3">
              <span className="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">sticky_note_2</span>
              <p className="text-[13px] font-medium text-gray-700 leading-relaxed">{notes}</p>
            </div>
          </Section>
        )}

        {/* Patrol Route */}
        {checkpoints.length > 0 && (
          <Section label="Patrol Route">
            <div className="space-y-0">
              {checkpoints.map((cp, i) => (
                <div key={i} className="flex gap-3 relative">
                  {/* connector line */}
                  {i < checkpoints.length - 1 && (
                    <div className="absolute left-[15px] top-8 w-[2px] h-full bg-gray-100 z-0" />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 mt-1
                    ${i === 0 ? 'bg-[#1A5C3A]' : i === checkpoints.length - 1 ? 'bg-[#39E58C]' : 'bg-white border-2 border-gray-200'}`}>
                    {i === 0
                      ? <span className="material-symbols-outlined text-white text-[14px]">radio_button_checked</span>
                      : i === checkpoints.length - 1
                        ? <span className="material-symbols-outlined text-[#003624] text-[14px]">flag</span>
                        : <span className="text-[11px] font-black text-gray-400">{i + 1}</span>
                    }
                  </div>
                  <div className="flex-1 flex justify-between items-start py-2 pb-4">
                    <div>
                      <p className="font-bold text-[14px] text-[#000]">{cp.name || cp.building || `Checkpoint ${i + 1}`}</p>
                      {cp.note && <p className="text-[11px] text-gray-400 font-medium">{cp.note}</p>}
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 shrink-0 ml-2">{cp.time || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Evidence Photos */}
        {capturedPhotos.length > 0 && (
          <Section label="Evidence" badge={`${capturedPhotos.length} PHOTOS`}>
            <div className="grid grid-cols-3 gap-3">
              {capturedPhotos.slice(0, 6).map((ph, i) => (
                <div key={i} className="aspect-square rounded-[16px] overflow-hidden bg-gray-100">
                  <img src={ph.url || ph} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              {capturedPhotos.length > 6 && (
                <div className="aspect-square rounded-[16px] bg-gray-100 flex items-center justify-center">
                  <p className="font-black text-gray-400 text-[13px]">+{capturedPhotos.length - 6}</p>
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
function PatrolList({ patrols, onSelect }) {
  return (
    <div className="flex-1 overflow-y-auto pb-[100px] bg-[#F5F5F5] px-5 pt-6 no-scrollbar font-manrope">
      <p className="text-[9px] font-black text-gray-400 tracking-[0.1em] uppercase mb-1">Archive</p>
      <h1 className="font-black text-[28px] text-[#000] leading-none tracking-tight mb-6">Patrol History</h1>
      <div className="space-y-3.5">
        {patrols.map(p => (
          <PatrolCard key={p.id} patrol={p} active={false} onClick={() => onSelect(p)} />
        ))}
      </div>
    </div>
  );
}

// ── Mobile-only detail screen ────────────────────────────────────────────
function PatrolDetail({ patrol, onBack, patrols, onSelect }) {
  return (
    <div className="flex-1 overflow-y-auto pb-[100px] bg-[#F5F5F5] no-scrollbar font-manrope">
      {/* back button */}
      <button
        onClick={onBack}
        className="absolute top-5 left-5 z-[60] w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 active:scale-90 transition-all shadow-xl"
      >
        <span className="material-symbols-outlined text-white text-[24px]">arrow_back</span>
      </button>
      <DetailPanel patrol={patrol} />

      {/* other patrols scroller */}
      <div className="px-5 mt-6">
        <p className="text-[9px] font-black text-gray-400 tracking-[0.1em] uppercase mb-3">Other Records</p>
        <div className="space-y-3">
          {patrols.filter(p => p.id !== patrol.id).slice(0, 5).map(p => (
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
