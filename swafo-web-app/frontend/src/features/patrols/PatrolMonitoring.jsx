import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../api/config';

export default function PatrolMonitoring() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [kpis, setKpis] = useState({ active: 1, completedToday: 12, photos: 58, avgDuration: 42 });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch from Backend
      const resp = await fetch(API_ENDPOINTS.PATROLS_HISTORY);
      const serverData = resp.ok ? await resp.json() : [];
      
      // 2. Fetch from Local Fail-Safe
      const localData = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
      
      // 3. Merge & Deduplicate (Local takes priority for "freshness")
      const merged = [...localData];
      serverData.forEach(sPatrol => {
        if (!merged.find(m => m.id === sPatrol.id)) {
          merged.push(sPatrol);
        }
      });

      setHistory(merged.slice(0, 8));
      
      // Update KPIs based on history
      const completedToday = merged.filter(p => {
        const pDate = new Date(p.actual_start || p.created_at).toDateString();
        return pDate === new Date().toDateString();
      }).length;
      
      setKpis(prev => ({ ...prev, completedToday: Math.max(prev.completedToday, completedToday) }));
      
    } catch (e) {
      const localData = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
      setHistory(localData.slice(0, 8));
    }
  };

  const handleStartNewPatrol = () => navigate('/officer/patrols/select');
  const handleViewArchive = (patrol) => navigate(`/officer/patrol-history/${patrol.id || 'local'}`);

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
            <div><p className="font-manrope font-black text-[32px] text-white leading-none mb-0.5 tracking-tight">{kpis.active.toString().padStart(2,'0')}</p><p className="font-black text-[8px] text-white/60 uppercase tracking-widest">ACTIVE PATROLS</p></div>
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
             <div className="flex flex-col items-center border-r border-gray-50 pr-8">
                <span className="text-[36px] font-black text-[#E53935] leading-none mb-0.5">05</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">TOTAL<br/>REPORTS</span>
             </div>
             <div className="flex-1 pl-8 space-y-3">
                <div className="flex justify-between items-center"><div className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 bg-[#1A5C3A] rounded-full" /><span className="text-[13px] font-bold text-gray-600">Uniform</span></div><span className="font-black text-[16px]">3</span></div>
                <div className="flex justify-between items-center"><div className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 bg-[#E53935] rounded-full" /><span className="text-[13px] font-bold text-gray-600">Curfew</span></div><span className="font-black text-[16px]">2</span></div>
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
            <div><p className="font-manrope font-black text-[48px] text-white leading-none mb-1 tracking-tight">{kpis.active.toString().padStart(2,'0')}</p><p className="font-black text-[10px] text-white/50 uppercase tracking-widest">ACTIVE PATROLS</p></div>
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
                    <span className="text-[64px] font-black text-[#E53935] leading-none mb-1">05</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">TOTAL REPORTS</span>
                 </div>
                 <div className="flex-1 pl-14 grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-3"><div className="flex items-center gap-3.5"><div className="w-2.5 h-2.5 bg-[#1A5C3A] rounded-full shadow-[0_0_8px_#1A5C3A]" /><span className="text-[16px] font-bold text-gray-600">Uniform</span></div><span className="font-black text-[22px]">3</span></div>
                    <div className="flex justify-between items-center border-b border-gray-50 pb-3"><div className="flex items-center gap-3.5"><div className="w-2.5 h-2.5 bg-[#E53935] rounded-full shadow-[0_0_8px_#E53935]" /><span className="text-[16px] font-bold text-gray-600">Curfew</span></div><span className="font-black text-[22px]">2</span></div>
                    <div className="flex justify-between items-center opacity-40"><div className="flex items-center gap-3.5"><div className="w-2.5 h-2.5 bg-gray-300 rounded-full" /><span className="text-[16px] font-bold text-gray-600">ID Pass</span></div><span className="font-black text-[22px]">0</span></div>
                    <div className="flex justify-between items-center opacity-40"><div className="flex items-center gap-3.5"><div className="w-2.5 h-2.5 bg-gray-300 rounded-full" /><span className="text-[16px] font-bold text-gray-600">Smoking</span></div><span className="font-black text-[22px]">0</span></div>
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
                     { label: 'Weekly Patrols', val: '24', icon: 'trending_up', color: 'text-blue-500' },
                     { label: 'Evidence Files', val: '142', icon: 'image', color: 'text-purple-500' },
                     { label: 'Areas Covered', val: '86%', icon: 'map', color: 'text-emerald-500' }
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
