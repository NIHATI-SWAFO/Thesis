import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../api/config';

export default function PatrolMonitoring() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [kpis, setKpis] = useState({ 
    totalPatrols: 0, completedToday: 0, photos: 0, avgDuration: 0,
    weeklyPatrols: 0, totalEvidence: 0, areasCoveredPercent: 0 
  });
  const [violationsStats, setViolationsStats] = useState({ total_reports: 0, uniform: 0, curfew: 0, id_pass: 0, smoking: 0 });

  // fetch on mount + every 15 seconds so new patrols appear automatically
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);

    fetchData();
    fetchViolations();

    const interval = setInterval(() => {
      fetchData();
      fetchViolations();
    }, 15000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchViolations = async () => {
    try {
      const resp = await fetch(`${API_ENDPOINTS.VIOLATIONS_STATISTICS}?today=true`);
      if (resp.ok) {
        const data = await resp.json();
        setViolationsStats({
          total_reports: data.total_reports,
          uniform: data.categories.uniform,
          curfew: data.categories.curfew,
          id_pass: data.categories.id_pass,
          smoking: data.categories.smoking
        });
      }
    } catch (e) {
      console.error("Failed to fetch violations stats", e);
    }
  };

  const fetchData = async () => {
    try {
      // 1. Fetch patrol history from DB
      const resp = await fetch(API_ENDPOINTS.PATROLS_HISTORY);
      const serverData = resp.ok ? await resp.json() : [];

      // 2. Merge with localStorage (local takes priority for freshness)
      const localData = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
      const merged = [...localData];
      serverData.forEach(sPatrol => {
        if (!merged.find(m => String(m.id) === String(sPatrol.id))) {
          merged.push(sPatrol);
        }
      });

      setHistory(merged.slice(0, 8));

      // ── Compute ALL KPIs directly from the merged patrol list ───────────
      // This keeps everything in sync: add a patrol → numbers update instantly.
      const now = new Date();
      const todayStr   = now.toDateString();                          // e.g. "Thu May 01 2025"
      const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

      // Total Patrols — every patrol ever saved (any status)
      const totalPatrols = merged.length;

      // Completed Today — status COMPLETED and end_time falls on today's calendar date
      // (midnight 12:00am → 11:59pm, not a rolling 24h window)
      const completedToday = merged.filter(p => {
        const endTime = p.end_time || p.actual_end;
        return p.status === 'COMPLETED' && endTime && new Date(endTime).toDateString() === todayStr;
      }).length;

      // Photos Captured — sum across ALL patrols
      // DB patrols have photos_count; local patrols may have capturedPhotos array
      const photos = merged.reduce((sum, p) => {
        const dbCount    = typeof p.photos_count === 'number' ? p.photos_count : 0;
        const localCount = Array.isArray(p.capturedPhotos) ? p.capturedPhotos.length : 0;
        return sum + Math.max(dbCount, localCount);
      }, 0);

      // Avg Duration — average minutes for all completed patrols, clamped to >= 0
      const completedWithTimes = merged.filter(p => {
        const start = p.start_time || p.actual_start;
        const end   = p.end_time   || p.actual_end;
        return p.status === 'COMPLETED' && start && end;
      });
      let avgDuration = 0;
      if (completedWithTimes.length > 0) {
        const totalMs = completedWithTimes.reduce((sum, p) => {
          const start = new Date(p.start_time || p.actual_start);
          const end   = new Date(p.end_time   || p.actual_end);
          return sum + Math.max(0, end - start);
        }, 0);
        avgDuration = Math.max(0, Math.round(totalMs / completedWithTimes.length / 60000));
      }

      // Weekly Patrols (last 7 days, completed)
      const weeklyPatrols = merged.filter(p => {
        const start = p.start_time || p.actual_start;
        return p.status === 'COMPLETED' && start && new Date(start) >= oneWeekAgo;
      }).length;

      setKpis({
        totalPatrols,
        completedToday,
        photos,
        avgDuration,
        weeklyPatrols,
        totalEvidence:       photos,
        areasCoveredPercent: 0,
      });

    } catch (e) {
      console.error('fetchData error:', e);
      const localData = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
      setHistory(localData.slice(0, 8));
    }
  };


  const handleStartNewPatrol = () => {
    sessionStorage.removeItem('swafo_live_patrol_state');
    localStorage.removeItem('swafo_active_session');
    navigate('/officer/patrols/select');
  };
  const handleViewArchive = (patrol) => {
    // Persist the selected patrol data so the detail screen can read it
    sessionStorage.setItem('swafo_viewing_patrol', JSON.stringify(patrol));
    navigate(`/officer/patrol-history/${patrol.id || 'local'}`);
  };

  // 📱 REFINED MOBILE VERSION (COMPACT & SLEEK)
  if (isMobile) {
    return (
      <div className="flex-1 overflow-y-auto pb-[100px] bg-[#F5F5F5] font-manrope animate-fade-in px-5 pt-6 no-scrollbar">
        <div className="mb-6">
          <p className="text-[9px] font-black text-gray-400 tracking-[0.1em] uppercase mb-1">ACTIVITY TRACKING</p>
          <h1 className="font-manrope font-black text-[28px] text-[#000000] leading-none tracking-tight">Patrol Monitoring</h1>
        </div>

        {/* Compact KPI Grid */}
        <div className="grid grid-cols-2 gap-3.5 mb-8">
          <div className="bg-[#1A5C3A] rounded-[24px] p-5 h-[130px] flex flex-col justify-between shadow-lg">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex justify-center items-center backdrop-blur-md"><span className="material-symbols-outlined text-white text-[20px]">explore</span></div>
            <div><p className="font-manrope font-black text-[32px] text-white leading-none mb-0.5 tracking-tight">{kpis.totalPatrols.toString().padStart(2,'0')}</p><p className="font-black text-[8px] text-white/60 uppercase tracking-widest">TOTAL PATROLS</p></div>
          </div>
          <div className="bg-white rounded-[24px] p-5 h-[130px] flex flex-col justify-between shadow-sm border border-white">
            <div className="w-8 h-8 bg-[#E8F5E9] rounded-lg flex justify-center items-center"><span className="material-symbols-outlined text-[#1A5C3A] text-[20px]">check_circle</span></div>
            <div><p className="font-manrope font-black text-[32px] text-[#000000] leading-none mb-0.5 tracking-tight">{kpis.completedToday}</p><p className="font-black text-[8px] text-gray-400 uppercase tracking-widest">COMPLETED TODAY</p></div>
          </div>
          <div className="bg-white rounded-[24px] p-5 h-[130px] flex flex-col justify-between shadow-sm border border-white">
            <div className="w-8 h-8 bg-[#E8F5E9] rounded-lg flex justify-center items-center"><span className="material-symbols-outlined text-[#1A5C3A] text-[20px]">image</span></div>
            <div><p className="font-manrope font-black text-[32px] text-[#000000] leading-none mb-0.5 tracking-tight">{kpis.photos}</p><p className="font-black text-[8px] text-gray-400 uppercase tracking-widest">PHOTOS CAPTURED</p></div>
          </div>
          <div className="bg-white rounded-[24px] p-5 h-[130px] flex flex-col justify-between shadow-sm border border-white">
            <div className="w-8 h-8 bg-[#E8F5E9] rounded-lg flex justify-center items-center"><span className="material-symbols-outlined text-[#1A5C3A] text-[20px]">timer</span></div>
            <div><div className="flex items-baseline gap-1"><p className="font-manrope font-black text-[32px] text-[#000000] leading-none tracking-tight">{kpis.avgDuration}</p><span className="text-[10px] font-black text-gray-400">min</span></div><p className="font-black text-[8px] text-gray-400 uppercase tracking-widest">AVG DURATION</p></div>
          </div>
        </div>

        <button onClick={handleStartNewPatrol} className="w-full h-[60px] bg-[#1A5C3A] rounded-[24px] shadow-xl flex items-center justify-center gap-2.5 text-white font-black text-[16px] tracking-tight mb-10"><span className="material-symbols-outlined text-[20px]">verified</span> Start New Patrol</button>

        <div className="mb-10">
          <div className="flex justify-between items-center mb-5 px-1">
            <h2 className="font-manrope font-black text-[22px] text-[#000000] tracking-tight">Violation Summary</h2>
            <div className="bg-[#39E58C]/20 px-3 py-1 rounded-full"><span className="text-[8px] font-black text-[#1A5C3A] uppercase tracking-widest">TODAY</span></div>
          </div>
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-white flex items-center">
             <div className="flex flex-col items-center border-r border-gray-50 pr-6 shrink-0">
                <span className="text-[36px] font-black text-[#E53935] leading-none mb-0.5">{violationsStats.total_reports.toString().padStart(2, '0')}</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">TOTAL<br/>REPORTS</span>
             </div>
             <div className="flex-1 pl-6 grid grid-cols-2 gap-x-4 gap-y-3">
                <div className={`flex justify-between items-center ${violationsStats.uniform === 0 ? 'opacity-40' : ''}`}><div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 ${violationsStats.uniform > 0 ? 'bg-[#1A5C3A]' : 'bg-gray-300'} rounded-full shrink-0`} /><span className="text-[12px] font-bold text-gray-600">Uniform</span></div><span className="font-black text-[14px]">{violationsStats.uniform}</span></div>
                <div className={`flex justify-between items-center ${violationsStats.curfew === 0 ? 'opacity-40' : ''}`}><div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 ${violationsStats.curfew > 0 ? 'bg-[#E53935]' : 'bg-gray-300'} rounded-full shrink-0`} /><span className="text-[12px] font-bold text-gray-600">Curfew</span></div><span className="font-black text-[14px]">{violationsStats.curfew}</span></div>
                <div className={`flex justify-between items-center ${violationsStats.id_pass === 0 ? 'opacity-40' : ''}`}><div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 ${violationsStats.id_pass > 0 ? 'bg-orange-500' : 'bg-gray-300'} rounded-full shrink-0`} /><span className="text-[12px] font-bold text-gray-600">ID Pass</span></div><span className="font-black text-[14px]">{violationsStats.id_pass}</span></div>
                <div className={`flex justify-between items-center ${violationsStats.smoking === 0 ? 'opacity-40' : ''}`}><div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 ${violationsStats.smoking > 0 ? 'bg-blue-500' : 'bg-gray-300'} rounded-full shrink-0`} /><span className="text-[12px] font-bold text-gray-600">Smoking</span></div><span className="font-black text-[14px]">{violationsStats.smoking}</span></div>
             </div>
          </div>
        </div>


        <section>
          <div className="flex justify-between items-center mb-5 px-1"><h2 className="font-manrope font-black text-[22px] text-[#000000] tracking-tight">Recent Patrols</h2><button className="text-[10px] font-black text-[#1A5C3A] uppercase tracking-widest">View All</button></div>
          <div className="space-y-3.5">
            {history.length > 0 ? history.map((patrol, idx) => (
              <div key={patrol.id || idx} onClick={() => handleViewArchive(patrol)} className="bg-white rounded-[24px] p-4 shadow-sm flex items-center gap-4 border border-white active:scale-[0.98] transition-all cursor-pointer">
                <div className="w-11 h-11 bg-[#F2F4F7] rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-[16px] text-[#000000] truncate tracking-tight leading-none mb-1">{patrol.location || 'Institutional Patrol'}</h3>
                  <div className="flex items-center gap-2.5 text-gray-400 text-[10px] font-bold"><div>Officer Timothy</div><div className="w-1 h-1 bg-gray-200 rounded-full" /><div>{patrol.duration_display || '45m'}</div></div>
                </div>
                <div className="text-right">
                   <div className="bg-[#39E58C]/15 px-1.5 py-0.5 rounded-md mb-0.5"><span className="text-[8px] font-black text-[#1A5C3A]">📷 {patrol.photos_count || (patrol.capturedPhotos ? patrol.capturedPhotos.length : 0)}</span></div>
                   <p className="text-[9px] font-black text-gray-300 uppercase">{patrol.actual_end ? new Date(patrol.actual_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:45 AM'}</p>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-gray-300 font-bold italic text-[11px]">No patrols recorded yet.</p>
            )}
          </div>
        </section>
      </div>
    );
  }

  // 💻 REFINED DESKTOP VERSION (PERFECT SCALE)
  return (
    <div className="flex-1 overflow-y-auto pb-16 scroll-smooth bg-[#F5F5F5] font-manrope animate-fade-in px-10 pt-8 no-scrollbar">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-1.5">ACTIVITY TRACKING</p>
            <h1 className="font-manrope font-black text-[44px] text-[#000000] leading-none tracking-tight">Patrol Monitoring</h1>
          </div>
          <div className="flex items-center gap-3.5 bg-white px-6 py-3 rounded-2xl shadow-sm border border-white mb-1">
             <div className="w-2.5 h-2.5 bg-[#39E58C] rounded-full animate-pulse shadow-[0_0_10px_#39E58C]" />
             <span className="font-black text-[13px] text-[#1A5C3A] uppercase tracking-widest">SYSTEM ONLINE</span>
          </div>
        </div>

        {/* COMPACT 4-COLUMN KPI ROW */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <div className="bg-[#1A5C3A] rounded-[36px] p-8 h-[180px] flex flex-col justify-between shadow-xl shadow-[#1A5C3A]/15">
            <div className="w-11 h-11 bg-white/10 rounded-xl flex justify-center items-center backdrop-blur-md border border-white/10"><span className="material-symbols-outlined text-white text-[24px]">explore</span></div>
            <div><p className="font-manrope font-black text-[48px] text-white leading-none mb-1 tracking-tight">{kpis.totalPatrols.toString().padStart(2,'0')}</p><p className="font-black text-[10px] text-white/50 uppercase tracking-widest">TOTAL PATROLS</p></div>
          </div>
          <div className="bg-white rounded-[36px] p-8 h-[180px] flex flex-col justify-between shadow-sm border border-white">
            <div className="w-11 h-11 bg-[#E8F5E9] rounded-xl flex justify-center items-center"><span className="material-symbols-outlined text-[#1A5C3A] text-[24px]">check_circle</span></div>
            <div><p className="font-manrope font-black text-[48px] text-[#000000] leading-none mb-1 tracking-tight">{kpis.completedToday}</p><p className="font-black text-[10px] text-gray-400 uppercase tracking-widest">COMPLETED TODAY</p></div>
          </div>
          <div className="bg-white rounded-[36px] p-8 h-[180px] flex flex-col justify-between shadow-sm border border-white">
            <div className="w-11 h-11 bg-[#E8F5E9] rounded-xl flex justify-center items-center"><span className="material-symbols-outlined text-[#1A5C3A] text-[24px]">image</span></div>
            <div><p className="font-manrope font-black text-[48px] text-[#000000] leading-none mb-1 tracking-tight">{kpis.photos}</p><p className="font-black text-[10px] text-gray-400 uppercase tracking-widest">PHOTOS CAPTURED</p></div>
          </div>
          <div className="bg-white rounded-[36px] p-8 h-[180px] flex flex-col justify-between shadow-sm border border-white">
            <div className="w-11 h-11 bg-[#E8F5E9] rounded-xl flex justify-center items-center"><span className="material-symbols-outlined text-[#1A5C3A] text-[24px]">timer</span></div>
            <div><div className="flex items-baseline gap-1.5"><p className="font-manrope font-black text-[48px] text-[#000000] leading-none tracking-tight">{kpis.avgDuration}</p><span className="text-[14px] font-black text-gray-400">min</span></div><p className="font-black text-[10px] text-gray-400 uppercase tracking-widest">AVG DURATION</p></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-10">
            <section>
              <div className="flex justify-between items-center mb-6 px-1">
                <h2 className="font-manrope font-black text-[26px] text-[#000000] tracking-tight">Violation Summary</h2>
                <div className="bg-[#39E58C]/15 px-6 py-2 rounded-full"><span className="text-[10px] font-black text-[#1A5C3A] uppercase tracking-widest">STATISTICS TODAY</span></div>
              </div>
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-white flex items-center">
                 <div className="flex flex-col items-center border-r border-gray-50 pr-14 shrink-0">
                    <span className="text-[64px] font-black text-[#E53935] leading-none mb-1">{violationsStats.total_reports.toString().padStart(2, '0')}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">TOTAL REPORTS</span>
                 </div>
                 <div className="flex-1 pl-14 grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className={`flex justify-between items-center border-b border-gray-50 pb-3 ${violationsStats.uniform === 0 ? 'opacity-40' : ''}`}><div className="flex items-center gap-3.5"><div className={`w-2.5 h-2.5 ${violationsStats.uniform > 0 ? 'bg-[#1A5C3A] shadow-[0_0_8px_#1A5C3A]' : 'bg-gray-300'} rounded-full`} /><span className="text-[16px] font-bold text-gray-600">Uniform</span></div><span className="font-black text-[22px]">{violationsStats.uniform}</span></div>
                    <div className={`flex justify-between items-center border-b border-gray-50 pb-3 ${violationsStats.curfew === 0 ? 'opacity-40' : ''}`}><div className="flex items-center gap-3.5"><div className={`w-2.5 h-2.5 ${violationsStats.curfew > 0 ? 'bg-[#E53935] shadow-[0_0_8px_#E53935]' : 'bg-gray-300'} rounded-full`} /><span className="text-[16px] font-bold text-gray-600">Curfew</span></div><span className="font-black text-[22px]">{violationsStats.curfew}</span></div>
                    <div className={`flex justify-between items-center ${violationsStats.id_pass === 0 ? 'opacity-40' : ''}`}><div className="flex items-center gap-3.5"><div className={`w-2.5 h-2.5 ${violationsStats.id_pass > 0 ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' : 'bg-gray-300'} rounded-full`} /><span className="text-[16px] font-bold text-gray-600">ID Pass</span></div><span className="font-black text-[22px]">{violationsStats.id_pass}</span></div>
                    <div className={`flex justify-between items-center ${violationsStats.smoking === 0 ? 'opacity-40' : ''}`}><div className="flex items-center gap-3.5"><div className={`w-2.5 h-2.5 ${violationsStats.smoking > 0 ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-gray-300'} rounded-full`} /><span className="text-[16px] font-bold text-gray-600">Smoking</span></div><span className="font-black text-[22px]">{violationsStats.smoking}</span></div>
                 </div>
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-6 px-1"><h2 className="font-manrope font-black text-[26px] text-[#000000] tracking-tight">Recent Patrol Activity</h2><button className="text-[11px] font-black text-[#1A5C3A] uppercase tracking-widest">View Archives</button></div>
              <div className="space-y-4">
                {history.length > 0 ? history.map((patrol, idx) => (
                  <div key={patrol.id || idx} onClick={() => handleViewArchive(patrol)} className="bg-white rounded-[32px] p-6 shadow-sm flex items-center gap-6 border border-white hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    <div className="w-16 h-16 bg-[#F2F4F7] rounded-[20px] shrink-0 group-hover:scale-105 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-[20px] text-[#000000] truncate tracking-tight leading-none mb-2">{patrol.location || 'Institutional Patrol'}</h3>
                      <div className="flex items-center gap-5 text-gray-400 text-[12px] font-bold">
                        <div>Officer Timothy</div>
                        <div className="w-1 h-1 bg-gray-200 rounded-full" />
                        <div>{patrol.duration_display || '45m Duration'}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                       <div className="bg-[#39E58C]/15 px-3 py-1 rounded-lg mb-1 inline-block"><span className="text-[11px] font-black text-[#1A5C3A]">📷 {patrol.photos_count || (patrol.capturedPhotos ? patrol.capturedPhotos.length : 0)}</span></div>
                       <p className="text-[11px] font-black text-gray-400 uppercase">{patrol.actual_end ? new Date(patrol.actual_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:45 AM • TODAY'}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-10 text-gray-300 font-bold italic">No patrol activity recorded.</p>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
             <div className="bg-white rounded-[36px] p-9 shadow-sm border border-white">
                <h3 className="font-black text-[18px] mb-6 tracking-tight">Quick Insights</h3>
                <div className="space-y-7">
                   {[
                     { label: 'Weekly Patrols', val: kpis.weeklyPatrols.toString(), icon: 'trending_up', color: 'text-blue-500' },
                     { label: 'Total Evidence Files', val: kpis.totalEvidence.toString(), icon: 'image', color: 'text-purple-500' },
                     { label: 'Areas Covered (Each Day)', val: `${kpis.areasCoveredPercent}%`, icon: 'map', color: 'text-emerald-500' }
                   ].map(stat => (
                     <div key={stat.label} className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"><span className={`material-symbols-outlined text-[22px] ${stat.color}`}>{stat.icon}</span></div>
                        <div className="flex-1"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p><p className="font-black text-[20px] tracking-tight">{stat.val}</p></div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="bg-[#1A5C3A]/5 rounded-[36px] p-9 border border-[#1A5C3A]/10">
                <h3 className="font-black text-[16px] mb-3 text-[#1A5C3A]">Security Briefing</h3>
                <p className="text-[13px] font-medium text-gray-600 leading-relaxed italic">"Focus monitoring on the Laboratory exit during evening shifts. Sector 7 high traffic."</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
