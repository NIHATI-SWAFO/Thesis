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
          <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-gray-100/50 flex flex-col relative min-h-[120px]">
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#009b69]"></div>
            
            <div className="p-6 flex flex-col justify-between h-full pl-8">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{card.title}</span>
              </div>
              
              <div className="flex justify-between items-end mt-4">
                <span className="text-[36px] font-pjs font-black text-[#0f172a] leading-none">{card.value}</span>
                <div className="w-10 h-10 rounded-full bg-emerald-50/50 border border-emerald-100/50 flex items-center justify-center text-[#9acbae]">
                   <span className="material-symbols-outlined text-[22px]">{card.icon}</span>
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
            
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-gray-100 flex min-h-[220px]">
              {/* Map Placeholder - FILL THE CELL */}
              <div className="w-[45%] bg-[#9ac2c5] relative overflow-hidden">
                <img 
                  src={pinpointImg}
                  alt="Live Map"
                  className="w-full h-full object-cover animate-pulse-slow"
                />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                   <p className="text-[11px] font-black text-white uppercase tracking-[0.2em] bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg">Live Map Interface</p>
                </div>
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-3 shadow-md border border-white">
                   <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
                   <span className="text-[10px] font-black text-[#064e3b] uppercase tracking-wider">GPS SIGNAL STABLE</span>
                </div>
              </div>

              {/* Patrol Details - MATCHING TARGET UI SPACING */}
              <div className="flex-1 px-10 py-10 flex flex-col justify-between">
                <div>
                   <div className="flex justify-between items-center mb-6">
                      <span className="bg-[#dcfce7] text-[#065f46] text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-tight">
                        {activePatrol.building}
                      </span>
                      <span className="text-[13px] text-gray-500 font-medium">Started: {activePatrol.startTime}</span>
                   </div>
                   
                   <h3 className="text-[26px] font-pjs font-extrabold text-[#003624] mb-8 leading-[1.2]">
                     {activePatrol.location}
                   </h3>
                   
                   <div className="flex items-center gap-4 mb-2">
                      <div className="w-14 h-14 rounded-full bg-[#1e293b] flex items-center justify-center p-0.5 shadow-sm overflow-hidden">
                         {/* Placeholder illustration style avatar */}
                         <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[32px]">person</span>
                         </div>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[18px] font-bold text-[#003624] leading-tight">{activePatrol.officer}</span>
                         <span className="text-[14px] text-gray-400 font-medium tracking-tight">{activePatrol.rank}</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-4 mt-8">
                   <button className="flex-1 bg-[#005e43] text-white py-4 rounded-2xl font-pjs font-bold text-[15px] hover:bg-[#004d35] transition-all shadow-md active:scale-[0.98]">
                      View Details
                   </button>
                   <button className="w-14 h-14 rounded-2xl bg-[#e5e7eb] flex items-center justify-center text-[#374151] hover:bg-gray-300 transition-all active:scale-95">
                      <span className="material-symbols-outlined text-[24px] font-bold">more_horiz</span>
                   </button>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════ RECENT COMPLETED PATROLS ══════════════════════════════ */}
          <div>
            <div className="flex justify-between items-end mb-6">
               <h2 className="text-[18px] font-pjs font-bold text-gray-900">Recent Completed Patrols</h2>
               <button className="text-[10px] font-black text-[#005e43] uppercase tracking-widest hover:underline underline-offset-4">Full Archive &rsaquo;</button>
            </div>
            
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-gray-100/50 overflow-hidden">
               <div className="grid grid-cols-4 py-4 px-8 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/30">
                  <div>Patrol Route</div>
                  <div>Officer</div>
                  <div>Stats</div>
                  <div className="text-right pr-4">Action</div>
               </div>
               
               <div className="divide-y divide-gray-50">
                  {completedPatrols.map((patrol, idx) => (
                    <div key={idx} className="grid grid-cols-4 items-center py-6 px-8 hover:bg-gray-50 transition-colors cursor-pointer group">
                       <div className="flex flex-col">
                          <span className="text-[14px] font-pjs font-bold text-[#003624] mb-1">{patrol.route}</span>
                          <span className="text-[11px] text-gray-400 font-bold leading-none">{patrol.status}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${patrol.officer.avatarColor} text-emerald-600 font-bold text-[10px] flex items-center justify-center shadow-sm`}>
                             {patrol.officer.initial}
                          </div>
                          <span className="text-[13px] font-bold text-gray-900">{patrol.officer.name}</span>
                       </div>
                       <div className="flex items-center gap-5 text-gray-400">
                          <div className="flex items-center gap-1.5">
                             <span className="material-symbols-outlined text-[16px]">schedule</span>
                             <span className="text-[12px] font-bold text-gray-600">{patrol.stats.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <span className="material-symbols-outlined text-[16px]">content_paste</span>
                             <span className="text-[12px] font-bold text-gray-600">{patrol.stats.incidents}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <button className="text-[11px] font-black text-[#005e43] uppercase tracking-tighter hover:bg-[#005e43] hover:text-white px-4 py-2 rounded-lg transition-all border border-[#005e43]/20">
                             View History
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
           <div className="bg-[#005e43] rounded-[2.5rem] p-10 text-white relative h-full flex flex-col shadow-[0_20px_60px_rgba(0,54,36,0.15)] overflow-hidden">
              {/* Decorative Circle Gradients */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                 <div className="w-14 h-14 bg-[#117153] rounded-2xl flex items-center justify-center mb-8 shadow-inner border border-white/5">
                    <span className="material-symbols-outlined text-[28px] text-emerald-200">content_paste_search</span>
                 </div>
                 
                 <h2 className="text-[28px] font-pjs font-black mb-3 leading-tight tracking-tight">Patrol Best<br/>Practices</h2>
                 <p className="text-[14px] text-emerald-100/60 font-medium mb-10 leading-relaxed max-w-[200px]">
                   Ensure institutional standards are met during every active curatorial monitoring session.
                 </p>

                 <ul className="space-y-10 mb-auto">
                   {[
                     { title: 'Timestamped Photos', desc: 'Every major zone entry requires a verified visual log.' },
                     { title: 'Recommended Routes', desc: 'Follow pre-calculated paths to optimize site coverage.' },
                     { title: 'Report Violations', desc: 'Immediate escalation for high-priority security breaches.' },
                     { title: 'Proper Documentation', desc: 'Concise, professional language in all curation notes.' }
                   ].map((item, idx) => (
                     <li key={idx} className="flex gap-5 group cursor-default">
                        <div className="w-7 h-7 rounded-full border-2 border-[#10b981] bg-[#10b981]/20 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_12px_rgba(16,185,129,0.2)] group-hover:bg-[#10b981] transition-all duration-300">
                           <span className="material-symbols-outlined text-[18px] font-black text-white scale-90">check</span>
                        </div>
                        <div>
                           <h4 className="text-[15px] font-extrabold text-white leading-none mb-1.5 tracking-tight group-hover:text-emerald-200 transition-colors">{item.title}</h4>
                           <p className="text-[12px] text-emerald-100/40 font-medium leading-[1.4] transition-colors">{item.desc}</p>
                        </div>
                     </li>
                   ))}
                 </ul>

                 <div className="bg-[#004d35] rounded-3xl p-8 mt-12 border border-white/5 shadow-inner backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100/50">Weekly Compliance</span>
                       <span className="text-[18px] font-pjs font-black text-emerald-300">94%</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#003624]/50 rounded-full overflow-hidden p-0.5">
                       <div className="h-full bg-[#10b981] rounded-full shadow-[0_0_15px_#10b981]" style={{ width: '94%' }}></div>
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
