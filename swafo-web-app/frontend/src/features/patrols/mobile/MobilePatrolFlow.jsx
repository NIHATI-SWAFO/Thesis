import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_ENDPOINTS } from '../../../api/config';

// --- PRODUCTION-GRADE MOBILE FLOW WITH REFINED SCALING & PERSISTENCE ---

const FullMapScreen = ({ onBack }) => {
  return (
    <div className="fixed inset-0 z-[8000] flex flex-col bg-[#F5F5F5] font-manrope animate-fade-in">
      <div className="absolute top-6 left-6 z-[8001]">
        <button onClick={onBack} className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-[#1A5C3A] active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>
      </div>
      <div className="flex-1 bg-[#F0F4F8] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(#1A5C3A 1px, transparent 1px), linear-gradient(90deg, #1A5C3A 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <svg className="absolute inset-0 w-full h-full p-12" viewBox="0 0 800 800">
          <rect x="100" y="100" width="120" height="180" rx="16" fill="#1A5C3A" className="opacity-10" />
          <rect x="300" y="80" width="300" height="120" rx="16" fill="#1A5C3A" className="opacity-10" />
          <path d="M 100 700 L 250 500 L 400 600 L 600 300 L 750 150" fill="none" stroke="#1A5C3A" strokeWidth="8" className="opacity-20" />
          <path d="M 100 700 L 250 500 L 350 565" fill="none" stroke="#39E58C" strokeWidth="12" className="shadow-[0_0_20px_#39E58C]" />
          <circle cx="350" cy="565" r="18" fill="#39E58C" className="animate-pulse shadow-[0_0_30px_#39E58C] border-[6px] border-white" />
        </svg>
        <div className="absolute bottom-10 right-10 flex flex-col gap-4">
          <button className="w-14 h-14 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-gray-400"><span className="material-symbols-outlined text-[32px]">layers</span></button>
          <button className="w-14 h-14 bg-[#1A5C3A] rounded-2xl shadow-2xl flex items-center justify-center text-white"><span className="material-symbols-outlined text-[32px]">my_location</span></button>
        </div>
      </div>
    </div>
  );
};

const DynamicSummaryScreen = ({ onSave, onBack, sessionData, isSaving }) => {
  const hour = sessionData?.actual_start ? new Date(sessionData.actual_start).getHours() : new Date().getHours();
  const isNight = hour >= 18 || hour < 4;
  const bgColor = isNight ? 'bg-[#111111]' : 'bg-[#F5F5F5]';
  const textColor = isNight ? 'text-white' : 'text-[#000000]';
  const subtextColor = isNight ? 'text-white/40' : 'text-gray-400';

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

  return (
    <div className={`flex-1 flex flex-col h-full ${bgColor} font-manrope animate-fade-in no-scrollbar overflow-y-auto pb-8`}>
      <div className={`h-[320px] ${isNight ? 'bg-black' : 'bg-white'} relative overflow-hidden shrink-0 shadow-lg rounded-b-[48px] mb-6`}>
        <div className={`absolute inset-0 ${isNight ? 'opacity-20' : 'opacity-[0.08]'}`} style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <svg className="absolute inset-0 w-full h-full p-16">
          <path d="M 50 250 L 150 100 L 250 200 L 350 80" fill="none" stroke="#39E58C" strokeWidth="10" strokeLinecap="round" className="shadow-[0_0_20px_#39E58C]" />
        </svg>
        <button onClick={onBack} className={`absolute top-6 left-6 w-10 h-10 ${isNight ? 'bg-white/10' : 'bg-white'} rounded-full shadow-lg flex items-center justify-center text-[#1A5C3A] active:scale-90 transition-transform`}><span className="material-symbols-outlined text-[22px]">arrow_back</span></button>
      </div>
      <div className="flex-1 px-7 flex flex-col">
        <div className="mb-8">
          <p className="font-black text-[10px] text-[#1A5C3A] tracking-[0.2em] uppercase mb-1.5">OPERATIONAL SUMMARY</p>
          <h1 className={`font-manrope font-black text-[28px] ${textColor} leading-tight mb-1.5 tracking-tight`}>{isNight ? 'Evening' : 'Morning'} Patrol Session</h1>
          <p className={`font-bold text-[14px] ${subtextColor}`}>{new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-10">
          {[
            { label: 'DURATION', value: calculateDuration(), icon: 'schedule' },
            { label: 'DISTANCE', value: '1.2 km', icon: 'explore' },
            { label: 'TIME STARTED', value: formatDisplayTime(sessionData?.actual_start), icon: 'login' },
            { label: 'TIME FINISHED', value: formatDisplayTime(sessionData?.actual_end), icon: 'logout' }
          ].map(stat => (
            <div key={stat.label} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1A5C3A]/5 flex items-center justify-center"><span className="material-symbols-outlined text-[16px] text-[#1A5C3A]">{stat.icon}</span></div>
                <span className={`font-black text-[9px] ${subtextColor} uppercase tracking-widest`}>{stat.label}</span>
              </div>
              <span className={`font-manrope font-black text-[22px] ${textColor} leading-none tracking-tight`}>{stat.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-4">
          <button onClick={onSave} disabled={isSaving} className={`w-full h-[64px] ${isSaving ? 'bg-gray-400' : 'bg-[#1A5C3A]'} rounded-[28px] shadow-[0_15px_40px_rgba(26,92,58,0.25)] flex justify-center items-center gap-3 text-white active:scale-[0.98] transition-all border-b-4 border-[#14492c]`}>
            {isSaving ? <span className="animate-spin material-symbols-outlined">sync</span> : <span className="material-symbols-outlined text-[24px]">verified</span>}
            <span className="font-black text-[17px] tracking-tight">{isSaving ? 'Saving Patrol...' : 'Confirm & Save Session'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SelectAreaScreen = ({ onConfirm, onBack, formData, setFormData }) => {
  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F5] font-manrope animate-fade-in overflow-y-auto no-scrollbar pb-[100px]">
      <div className="px-5 pt-6 mb-5 flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-[#1A5C3A] active:scale-90 transition-transform"><span className="material-symbols-outlined text-[24px]">arrow_back</span></button>
        <div><p className="font-black text-[9px] text-[#888888] tracking-[0.2em] uppercase mb-0.5">LOCATION PROTOCOL</p><h2 className="font-manrope font-black text-[24px] text-[#000000] leading-none tracking-tight">Select Patrol Area</h2></div>
      </div>

      <div className="px-5 mb-5">
        <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-6">Choose a verified checkpoint. High-risk zones are highlighted.</p>

        <div className="w-full h-[320px] bg-white rounded-[40px] shadow-sm relative overflow-hidden mb-8 border border-white">
          <div className="absolute inset-0 bg-[#E0E7E9]/20" />
          <div className="absolute top-[60px] left-[50px] w-40 h-40 bg-red-500/15 rounded-full blur-[50px]" />
          <div className="absolute top-[60px] right-[40px] flex flex-col items-center gap-2">
            <div className="bg-white px-3 py-1.5 rounded-full shadow-lg border border-gray-50"><span className="font-black text-[9px] tracking-wider uppercase">DORMITORY</span></div>
            <div className="w-10 h-10 bg-[#004D35] rounded-full shadow-xl flex items-center justify-center border-4 border-white"><span className="material-symbols-outlined text-white text-[20px] fill-1">home</span></div>
          </div>
          <div className="absolute top-[140px] left-[30px] flex flex-col items-center gap-2">
            <div className="bg-[#1A5C3A] px-3.5 py-2 rounded-full shadow-xl flex items-center gap-2 border-2 border-white">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="font-black text-[9px] text-white tracking-wider uppercase">JFH BUILDING</span>
            </div>
            <div className="w-12 h-12 bg-[#004D35] rounded-full shadow-xl flex items-center justify-center border-4 border-white"><span className="material-symbols-outlined text-white text-[24px] fill-1">location_on</span></div>
          </div>
          <div className="absolute bottom-5 right-5 flex flex-col gap-3">
            <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-400 font-black text-[18px]">+</button>
            <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-400 font-black text-[18px]">-</button>
            <button className="w-10 h-10 bg-[#1A5C3A] rounded-full shadow-lg flex items-center justify-center text-white"><span className="material-symbols-outlined text-[20px]">my_location</span></button>
          </div>
        </div>

        <div className="bg-[#1A5C3A] rounded-[28px] p-6 shadow-lg mb-8 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-[#39E58C]/20 rounded-lg flex items-center justify-center"><span className="material-symbols-outlined text-[#39E58C] text-[20px]">magic_button</span></div>
            <div><h3 className="font-black text-white text-[16px] tracking-tight">AI Suggested Route</h3><p className="text-[9px] font-black text-[#39E58C] uppercase tracking-widest">OPTIMIZED</p></div>
          </div>
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-[#39E58C] mt-1 shadow-[0_0_10px_#39E58C]" />
              <p className="font-black text-white text-[14px] tracking-tight">Dormitory Checkpoint</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full border-2 border-white/20 mt-1" />
              <p className="font-black text-white text-[14px] tracking-tight">JFH Building (Priority)</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-1">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-[#1A5C3A]"><span className="material-symbols-outlined text-[24px]">assignment</span></div><h3 className="font-black text-[18px] tracking-tight">Patrol Details</h3></div>
          <div className="space-y-6">
            <div className="flex flex-col gap-2.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">SHIFT TYPE</label>
              <select value={formData.shift_type} onChange={e => setFormData({ ...formData, shift_type: e.target.value })} className="h-14 bg-white rounded-[20px] shadow-sm px-5 font-bold text-gray-800 text-[15px] border border-gray-50 outline-none">
                <option value="Morning">Morning Shift</option><option value="Afternoon">Afternoon Shift</option><option value="Evening">Evening Shift</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">PATROL DATE</label><input type="date" value={formData.patrol_date} onChange={e => setFormData({ ...formData, patrol_date: e.target.value })} className="h-14 bg-white rounded-[20px] shadow-sm px-5 font-bold text-gray-800 text-[14px] border border-gray-50 outline-none" /></div>
              <div className="flex flex-col gap-2.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">START TIME</label><input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="h-14 bg-white rounded-[20px] shadow-sm px-5 font-bold text-gray-800 text-[14px] border border-gray-50 outline-none" /></div>
            </div>
            <div className="flex flex-col gap-2.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">PATROL NOTES</label><textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="e.g., Check lighting..." className="h-24 bg-white rounded-[20px] shadow-sm p-5 text-[14px] font-medium text-gray-800 outline-none resize-none border border-gray-50" /></div>
          </div>
        </div>
      </div>
      <div className="px-5 pb-10 pt-4"><button onClick={onConfirm} className="w-full h-[64px] bg-[#1A5C3A] rounded-full shadow-lg flex justify-center items-center gap-3 text-white font-black text-[18px] tracking-tight border-b-4 border-[#14492c]">Confirm Location <span className="material-symbols-outlined">chevron_right</span></button></div>
    </div>
  );
};

const LiveMapScreen = ({ onEnd, onExpand, onBack, seconds, isPatrolActive, setIsPatrolActive, capturedPhotos, onCamera }) => {
  const formatTime = (s) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const ss = s % 60; return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`; };
  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F5] font-manrope animate-fade-in overflow-y-auto no-scrollbar pb-[150px]">
      <div className="px-5 pt-6 mb-5 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-[#1A5C3A] active:scale-90 transition-transform"><span className="material-symbols-outlined text-[24px]">arrow_back</span></button>
        {isPatrolActive ? <div className="bg-[#1A5C3A] rounded-full px-5 py-2 flex items-center gap-2.5 shadow-lg"><div className="w-2 h-2 bg-[#39E58C] rounded-full animate-pulse" /><span className="font-black text-[10px] text-white tracking-widest uppercase">ACTIVE</span></div> : <h2 className="font-manrope font-black text-[24px] tracking-tight">Live Map</h2>}
        <div className="w-10 h-10" />
      </div>

      <div className="px-5 mb-6">
        <div className="bg-white rounded-[32px] p-6 shadow-sm grid grid-cols-3 divide-x divide-gray-50 border border-white">
          <div className="flex flex-col items-center"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">TIME</span><span className="font-black text-[18px] tabular-nums">{formatTime(seconds)}</span></div>
          <div className="flex flex-col items-center"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">DIST</span><div className="flex items-baseline gap-1"><span className="font-black text-[18px]">{isPatrolActive ? '1.8' : '0.0'}</span><span className="text-[10px] font-bold text-gray-400">km</span></div></div>
          <div className="flex flex-col items-center"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">CHECK</span><div className="flex items-baseline gap-1"><span className={`font-black text-[18px] ${isPatrolActive ? 'text-[#1A5C3A]' : ''}`}>{isPatrolActive ? '2' : '0'}</span><span className="text-[10px] font-bold text-gray-400">/5</span></div></div>
        </div>
      </div>

      <div className="mx-5 mb-8 h-[280px] bg-[#F2F4F7] rounded-[40px] relative overflow-hidden shadow-sm border-4 border-white">
        <div className="absolute top-[40px] left-[30px] w-[110px] h-[80px] bg-[#D8DBE0] rounded-[16px] flex flex-col items-center justify-center gap-1.5">
          <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-[#1A5C3A]"><span className="material-symbols-outlined text-[14px]">location_on</span></div>
          <span className="text-[8px] font-black text-[#1A5C3A] bg-white px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <div className="absolute top-[40px] right-[30px] w-[110px] h-[80px] bg-[#D8DBE0] rounded-[16px] flex flex-col items-center justify-center gap-1.5">
          <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-[#1A5C3A]"><span className="material-symbols-outlined text-[14px]">location_on</span></div>
          <span className="text-[8px] font-black text-[#1A5C3A] bg-white px-2 py-0.5 rounded-full">Laboratory</span>
        </div>
        <button onClick={onExpand} className="absolute bottom-5 left-5 w-12 h-12 bg-[#1A5C3A] rounded-2xl shadow-xl flex items-center justify-center text-white"><span className="material-symbols-outlined text-[28px]">zoom_out_map</span></button>
      </div>

      <div className="px-5 space-y-8">
        {!isPatrolActive ? <button onClick={setIsPatrolActive} className="w-full h-[64px] bg-[#1A5C3A] rounded-[24px] shadow-lg flex justify-center items-center gap-3 text-white font-black text-[18px] border-b-4 border-[#14492c]">Start Patrol</button> : (
          <div className="bg-white rounded-[32px] p-6 shadow-sm flex items-center gap-5 border border-white">
            <div className="w-12 h-12 bg-[#E8F5E9] rounded-2xl flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[#1A5C3A] text-[28px] fill-1">location_on</span></div>
            <div className="flex flex-col"><p className="text-[9px] font-black text-[#1A5C3A] uppercase tracking-[0.15em] mb-1 opacity-60">CHECKPOINT</p><h3 className="font-black text-[18px] tracking-tight">Laboratory Area</h3></div>
          </div>
        )}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-6 px-1"><h3 className="font-black text-[22px] tracking-tight text-[#000000]">Evidence</h3><span className="text-[9px] font-black text-[#1A5C3A] bg-white shadow-sm border border-emerald-50 px-4 py-2 rounded-full uppercase tracking-widest">{capturedPhotos.length} Photos</span></div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 px-1">
            {capturedPhotos.length > 0 ? capturedPhotos.map((photo, idx) => (
              <div key={idx} className="relative w-[200px] h-[200px] rounded-[40px] overflow-hidden shrink-0 shadow-lg border-[4px] border-white"><img src={photo.url} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" /><div className="absolute bottom-6 left-6 text-white"><p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-70">{photo.location}</p><p className="font-black text-[14px] tracking-tight">{photo.timestamp}</p></div></div>
            )) : (
              <div className="w-full py-12 flex flex-col items-center justify-center bg-white rounded-[32px] shadow-inner border-2 border-dashed border-gray-100 text-gray-300 font-black uppercase tracking-widest text-[9px] italic gap-2"><span className="material-symbols-outlined text-[32px] opacity-20">photo_library</span>Empty</div>
            )}
          </div>
        </div>
        <div className="pb-10">
          <button onClick={onEnd} className="w-full h-[68px] bg-[#E53935] rounded-[28px] shadow-lg flex justify-center items-center gap-3 text-white font-black text-[18px] border-b-4 border-[#c62828]"><span className="material-symbols-outlined text-[26px]">stop_circle</span>End Session</button>
        </div>
      </div>
    </div>
  );
};

export default function MobilePatrolFlow({ initialScreen = 'selectArea' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [seconds, setSeconds] = useState(0);
  const [isPatrolActive, setIsPatrolActive] = useState(false);
  const [activeSession, setActiveSession] = useState(JSON.parse(localStorage.getItem('swafo_active_session') || '{}'));
  const [capturedPhotos, setCapturedPhotos] = useState(activeSession.capturedPhotos || []);
  const [isSaving, setIsSaving] = useState(false);
  const cameraInputRef = useRef(null);
  const now = new Date();
  const [formData, setFormData] = useState({ shift_type: now.getHours() < 12 ? 'Morning' : now.getHours() < 18 ? 'Afternoon' : 'Evening', patrol_date: now.toISOString().split('T')[0], start_time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`, notes: '' });

  useEffect(() => { let timer; if (isPatrolActive) { timer = setInterval(() => setSeconds(s => s + 1), 1000); } return () => clearInterval(timer); }, [isPatrolActive]);

  const handleStartPatrol = async () => {
    const startTimeIso = new Date().toISOString();
    try {
      const resp = await fetch(API_ENDPOINTS.PATROLS_CREATE, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer: 1, location: "Institutional Field Patrol", status: "IN_PROGRESS", shift_type: formData.shift_type, notes: formData.notes, actual_start: startTimeIso })
      });
      if (resp.ok) {
        const d = await resp.json();
        setActiveSession({ ...d, actual_start: startTimeIso, capturedPhotos: [] });
      } else {
        // API error — still start locally (demo mode)
        setActiveSession({ id: 'demo-' + Date.now(), actual_start: startTimeIso, capturedPhotos: [] });
      }
    } catch (e) {
      // Network error — still start locally (demo mode)
      setActiveSession({ id: 'demo-' + Date.now(), actual_start: startTimeIso, capturedPhotos: [] });
    }
    setIsPatrolActive(true); // Always activate regardless of API result
  };

  const handleEndPatrol = () => {
    const endTimeIso = new Date().toISOString();
    setActiveSession(prev => ({ ...prev, actual_end: endTimeIso, capturedPhotos: capturedPhotos }));
    setIsPatrolActive(false);
    navigate('/officer/patrols/summary');
  };

  const handleSaveToHistory = async () => {
    setIsSaving(true);
    const finalData = { ...activeSession, status: "COMPLETED", duration_display: Math.floor((new Date(activeSession.actual_end) - new Date(activeSession.actual_start)) / 60000) + 'm' };

    try {
      if (activeSession.id && !activeSession.id.toString().startsWith('demo-')) {
        await fetch(`${API_ENDPOINTS.PATROLS_CREATE}${activeSession.id}/`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "COMPLETED", actual_end: finalData.actual_end, notes: finalData.notes })
        });
      }
      const existingHistory = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
      localStorage.setItem('swafo_local_history', JSON.stringify([finalData, ...existingHistory]));
      localStorage.removeItem('swafo_active_session');
      navigate('/officer/patrols');
    } catch (e) {
      const existingHistory = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
      localStorage.setItem('swafo_local_history', JSON.stringify([finalData, ...existingHistory]));
      localStorage.removeItem('swafo_active_session');
      navigate('/officer/patrols');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F5] h-full relative overflow-x-hidden">
      <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          const newPhoto = { url: URL.createObjectURL(file), location: "Laboratory Area", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          setCapturedPhotos(prev => [newPhoto, ...prev]);
        }
      }} />
      {location.pathname.endsWith('select') && <SelectAreaScreen onConfirm={() => navigate('/officer/patrols/live')} onBack={() => navigate('/officer/patrols')} formData={formData} setFormData={setFormData} />}
      {location.pathname.endsWith('live') && <LiveMapScreen onEnd={handleEndPatrol} onExpand={() => navigate('/officer/patrols/expanded-map')} onBack={() => navigate('/officer/patrols/select')} seconds={seconds} isPatrolActive={isPatrolActive} setIsPatrolActive={handleStartPatrol} capturedPhotos={capturedPhotos} onCamera={() => cameraInputRef.current?.click()} />}
      {location.pathname.endsWith('summary') && <DynamicSummaryScreen onSave={handleSaveToHistory} onBack={() => navigate('/officer/patrols/live')} sessionData={activeSession} isSaving={isSaving} />}
      {location.pathname.endsWith('expanded-map') && <FullMapScreen onBack={() => navigate('/officer/patrols/live')} />}
    </div>
  );
}
