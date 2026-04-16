import React, { useState } from 'react';
import pinpointImg from '../../assets/pinpoint.jpg';

const statCards = [
  { title: 'Active Patrols', value: '04', icon: 'radar', color: 'text-emerald-500' },
  { title: 'Completed Today', value: '01', icon: 'check_circle', color: 'text-emerald-400' },
  { title: 'Patrol Photos', value: '17', icon: 'image', color: 'text-slate-300' },
  { title: 'Avg Duration', value: '3.5h', icon: 'timer', color: 'text-slate-300' }
];

const completedPatrols = [
  {
    route: 'JFH Kubo',
    status: 'Completed 2h ago',
    officer: { name: 'Harlene Bautista', initial: 'HB', avatarColor: 'bg-emerald-50' },
    stats: { duration: '4h', incidents: 12 }
  },
  {
    route: 'Gate 3',
    status: 'Completed 5h ago',
    officer: { name: 'Boy Kaluoy', initial: 'BK', avatarColor: 'bg-blue-50' },
    stats: { duration: '2.5h', incidents: 8 }
  }
];

export default function PatrolMonitoring() {
  const [activePatrol] = useState({
    location: 'JFH Building - 1st Floor to 2nd Floor',
    building: 'JFH Building',
    startTime: '09:14 AM',
    officer: 'Timothy De Castro',
    rank: 'Junior Patrol Officer'
  });

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in-up">
      {/* ══════════════════════════════ HEADER ══════════════════════════════ */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-[28px] font-pjs font-extrabold text-[#003624] tracking-tight mb-1">Patrol Monitoring</h1>
          <p className="text-[14px] text-gray-500 font-medium">Live oversight and activity tracking for the digital curation patrol.</p>
        </div>
        <button className="bg-[#005e43] text-white px-6 py-2.5 rounded-full font-pjs font-bold text-[13px] flex items-center gap-2 hover:bg-[#004d35] transition-all shadow-lg hover:shadow-emerald-900/20 active:scale-95">
          START NEW PATROL
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>

      {/* ══════════════════════════════ STATS ══════════════════════════════ */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100/50 flex flex-col relative min-h-[140px] group hover:translate-y-[-4px] transition-all duration-500">
            {/* THIN ACCENT LINE - EXACTLY 2.5PX */}
            <div className="absolute left-0 top-6 bottom-6 w-[2.5px] bg-[#10b981] rounded-r-full"></div>
            
            <div className="p-8 flex flex-col justify-between h-full pl-10">
              <div>
                <span className="text-[11px] font-pjs font-bold text-gray-400 uppercase tracking-[0.1em]">{card.title}</span>
              </div>
              
              <div className="flex justify-between items-end mt-4">
                <span className="text-[44px] font-pjs font-bold text-[#0f172a] tracking-tight leading-none group-hover:scale-105 transition-transform duration-500 origin-left">{card.value}</span>
                <div className="w-12 h-12 flex items-center justify-center text-[#10b981]/20 group-hover:text-[#10b981]/40 transition-colors">
                   <span className="material-symbols-outlined text-[32px] font-light">{card.icon}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8 mb-10">
        {/* ══════════════════════════════ ACTIVE PATROLS ══════════════════════════════ */}
        <div className="col-span-2 space-y-8">
          <div>
            <h2 className="text-[18px] font-pjs font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Active Patrols
            </h2>
            
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.03)] border border-gray-100 flex min-h-[260px]">
              {/* Map Placeholder - FILL THE CELL */}
              <div className="w-[45%] bg-[#9ac2c5] relative overflow-hidden group">
                <img 
                  src={pinpointImg}
                  alt="Live Map"
                  className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-110 transition-transform duration-[2000ms]"
                />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                   <p className="text-[10px] font-black text-white uppercase tracking-[0.25em] bg-[#003624]/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">Live Interface Active</p>
                </div>
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-xl border border-white">
                   <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_12px_#10b981] animate-pulse"></span>
                   <span className="text-[11px] font-pjs font-black text-[#064e3b] uppercase tracking-widest">GPS SIGNAL STABLE</span>
                </div>
              </div>

              {/* Patrol Details - MATCHING TARGET UI SPACING */}
              <div className="flex-1 px-12 py-12 flex flex-col justify-between">
                <div>
                   <div className="flex justify-between items-center mb-8">
                      <span className="bg-[#7cfabb] text-[#003624] text-[11px] font-black px-5 py-2 rounded-full uppercase tracking-tighter shadow-sm">
                        {activePatrol.building}
                      </span>
                      <span className="text-[14px] text-gray-400 font-bold leading-none">{activePatrol.startTime}</span>
                   </div>
                   
                   <h3 className="text-[32px] font-pjs font-bold text-[#003624] mb-10 leading-[1.1] tracking-tight">
                     {activePatrol.location}
                   </h3>
                   
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-full bg-[#003624] flex items-center justify-center p-0.5 shadow-xl ring-4 ring-[#7cfabb]/10">
                          <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                             <span className="material-symbols-outlined text-white text-[36px]">person</span>
                          </div>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[20px] font-pjs font-bold text-[#003624] leading-tight">{activePatrol.officer}</span>
                         <span className="text-[15px] text-gray-400 font-bold tracking-tight mt-1">{activePatrol.rank}</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-5 mt-10">
                   <button className="flex-1 bg-[#003624] text-white py-5 rounded-[1.4rem] font-pjs font-bold text-[16px] hover:bg-[#004d33] transition-all shadow-xl shadow-emerald-950/20 active:scale-[0.97]">
                      View Full Assessment
                   </button>
                   <button className="w-16 h-16 rounded-[1.4rem] bg-[#f3f4f6] flex items-center justify-center text-[#111827] hover:bg-gray-200 transition-all active:scale-95 border border-gray-100">
                      <span className="material-symbols-outlined text-[28px] font-bold">more_horiz</span>
                   </button>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════ RECENT COMPLETED PATROLS ══════════════════════════════ */}
          <div>
            <div className="flex justify-between items-end mb-8 px-2">
               <h2 className="text-[22px] font-pjs font-bold text-[#111827] tracking-tight">Recent Activity Archive</h2>
               <button className="text-[11px] font-black text-[#10b981] uppercase tracking-[0.1em] hover:text-[#003624] transition-colors border-b-2 border-[#10b981]/20 pb-1">Full Session Catalog</button>
            </div>
            
            <div className="bg-white rounded-[2.5rem] shadow-[0_10px_50px_rgba(0,0,0,0.02)] border border-gray-100/50 overflow-hidden">
               <div className="grid grid-cols-4 py-5 px-10 border-b border-gray-50 text-[11px] font-pjs font-black text-gray-400 uppercase tracking-widest bg-gray-50/20">
                  <div>Patrol Zone</div>
                  <div>Lead Officer</div>
                  <div>Metric Summary</div>
                  <div className="text-right pr-4">Oversight</div>
               </div>
               
               <div className="divide-y divide-gray-50">
                  {completedPatrols.map((patrol, idx) => (
                    <div key={idx} className="grid grid-cols-4 items-center py-7 px-10 hover:bg-[#f2fcf8]/50 transition-all cursor-pointer group">
                       <div className="flex flex-col">
                          <span className="text-[16px] font-pjs font-bold text-[#003624] mb-1 group-hover:translate-x-1 transition-transform">{patrol.route}</span>
                          <span className="text-[12px] text-gray-400 font-bold leading-none">{patrol.status}</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full ${patrol.officer.avatarColor} text-emerald-700 font-pjs font-black text-[11px] flex items-center justify-center shadow-sm border border-emerald-100`}>
                             {patrol.officer.initial}
                          </div>
                          <span className="text-[14px] font-bold text-[#111827]">{patrol.officer.name}</span>
                       </div>
                       <div className="flex items-center gap-8 text-gray-400">
                          <div className="flex items-center gap-2">
                             <span className="material-symbols-outlined text-[18px]">timer</span>
                             <span className="text-[13px] font-bold text-gray-700">{patrol.stats.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="material-symbols-outlined text-[18px]">photo_library</span>
                             <span className="text-[13px] font-bold text-gray-700">{patrol.stats.incidents}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <button className="text-[11px] font-black text-[#003624] uppercase tracking-tighter hover:bg-[#003624] hover:text-white px-5 py-2.5 rounded-xl transition-all border border-[#003624]/10 shadow-sm">
                             Inspect Log
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════ BEST PRACTICES SIDEBAR ══════════════════════════════ */}
        <div className="space-y-8 h-full">
           <div className="bg-[#005e43] rounded-[2.5rem] p-12 text-white relative h-full flex flex-col shadow-[0_30px_70px_rgba(0,54,36,0.2)] overflow-hidden">
              {/* Shield Watermark Icon - REFINED PIXEL PERFECT */}
              <div className="absolute top-8 right-8 text-white/5 pointer-events-none select-none">
                 <span className="material-symbols-outlined text-[180px] leading-none">shield</span>
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                 {/* Hollow Outline Square Icon */}
                 <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-10 border-2 border-white/20">
                    <span className="material-symbols-outlined text-[32px] text-white">assignment_turned_in</span>
                 </div>
                 
                 <h2 className="text-[34px] font-pjs font-bold mb-4 leading-tight tracking-tight">Patrol Best<br/>Practices</h2>
                 <p className="text-[15px] text-white/50 font-medium mb-12 leading-relaxed">
                   Ensure institutional standards are met during every active curatorial monitoring session.
                 </p>

                 <ul className="space-y-12 mb-auto">
                   {[
                     { title: 'Timestamped Photos', desc: 'Every major zone entry requires a verified visual log.' },
                     { title: 'Recommended Routes', desc: 'Follow pre-calculated paths to optimize site coverage.' },
                     { title: 'Report Violations', desc: 'Immediate escalation for high-priority security breaches.' },
                     { title: 'Proper Documentation', desc: 'Concise, professional language in all curation notes.' }
                   ].map((item, idx) => (
                     <li key={idx} className="flex gap-6 group cursor-default">
                        {/* Hollow Circle Check Icon */}
                        <div className="w-7 h-7 rounded-full border-2 border-white/30 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-500 group-hover:border-[#10b981] group-hover:bg-[#10b981]">
                           <span className="material-symbols-outlined text-[20px] text-white scale-75 group-hover:scale-90 transition-transform">check</span>
                        </div>
                        <div>
                           <h4 className="text-[16px] font-bold text-white mb-2 tracking-tight transition-all duration-300 group-hover:translate-x-1">{item.title}</h4>
                           <p className="text-[13px] text-white/30 font-medium leading-[1.5] transition-colors group-hover:text-white/50">{item.desc}</p>
                        </div>
                     </li>
                   ))}
                 </ul>

                 {/* Transparent Bordered Compliance Box */}
                 <div className="mt-16 p-8 rounded-[1.8rem] border border-white/10 relative overflow-hidden group/box">
                    <div className="flex justify-between items-center mb-5 relative z-10">
                       <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">Weekly Compliance</span>
                       <span className="text-[18px] font-pjs font-black text-emerald-400">94%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
                       <div className="h-full bg-[#10b981] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000 group-hover/box:bg-[#34d399]" style={{ width: '94%' }}></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* ══════════════════════════════ SYSTEM FOOTER ══════════════════════════════ */}
      <div className="bg-[#f2fcf8] border border-emerald-100 rounded-[1.5rem] p-5 flex items-center justify-between shadow-sm animate-pulse-slow">
        <div className="flex items-center gap-4 pl-4">
           <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-[20px]">info</span>
           </div>
           <div>
              <p className="text-[13px] font-pjs font-extrabold text-[#003624] tracking-tight">System Note: Automated Backup Scheduled</p>
              <p className="text-[11px] font-manrope text-emerald-800/60 font-medium">The digital archive will undergo a synchronization cycle today at 11:00 PM PST. Monitoring will remain unaffected.</p>
           </div>
        </div>
        <button className="w-10 h-10 rounded-full hover:bg-emerald-50 transition-all text-emerald-300">
           <span className="material-symbols-outlined">close</span>
        </button>
      </div>

    </div>
  );
}
