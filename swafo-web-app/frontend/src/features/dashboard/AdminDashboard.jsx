import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  BarChart3, 
  ArrowUpRight, 
  MoreVertical,
  ChevronRight,
  Gavel
} from 'lucide-react';
import { API_ENDPOINTS } from '../../api/config';
import ViolationsOverTimeChart from '../analytics/ViolationsOverTimeChart';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    setLoading(true);
    fetch(`${API_ENDPOINTS.ADMIN_DASHBOARD}?range=${timeRange}`)
      .then(res => {
        if (!res.ok) throw new Error("API UNREACHABLE");
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.warn("API Unavailable: Resetting metrics to zero.");
        setData({
            director_alert_queue: [],
            policy_breakdown: [],
            status_distribution: { total: 0, breakdown: [] },
            stats: { active_cases: 0, repeat_offenders: 0, active_patrols: 0, violations_today: 0, pending_director_decisions: 0 },
            hotspots: [],
            temporal: [
                { day: 'MON', value: 0 }, { day: 'TUE', value: 0 }, { day: 'WED', value: 0 }, 
                { day: 'THU', value: 0 }, { day: 'FRI', value: 0 }, { day: 'SAT', value: 0 }, { day: 'SUN', value: 0 }
            ],
            recent_violations: []
        });
        setLoading(false);
      });
  }, [timeRange]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#003624] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-pjs font-bold text-[#003624]">Aggregating Campus Intelligence...</p>
        </div>
      </div>
    );
  }

  const { stats, hotspots, temporal } = data;
  const resolutionRate = data.status_distribution?.total > 0 
    ? Math.round(((data.status_distribution.breakdown.filter(b => ['CLOSED', 'DISMISSED'].includes(b.status)).reduce((acc, curr) => acc + curr.count, 0)) / data.status_distribution.total) * 100)
    : 0;

  return (
    <div className="animate-fade-in space-y-8 pb-16">
      
      {/* ══════════════════════════════ 1. TOP KPI DASHBOARD ══════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Institutional Infractions */}
        <div 
          onClick={() => navigate('/admin/cases')}
          className="bg-white rounded-[1.5rem] p-7 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between cursor-pointer hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group"
        >
           <div className="flex justify-between items-start">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-tight group-hover:text-emerald-600 transition-colors">Institutional<br/>Infractions</span>
              <ShieldAlert size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
           </div>
           <div className="flex items-end gap-3 mt-4">
              <h3 className="text-[44px] font-pjs font-black text-[#003624] tracking-tighter leading-none">{data.status_distribution.total}</h3>
              <div className="flex items-center gap-1 text-rose-500 text-[12px] font-black mb-1">
                 <TrendingUp size={12} className="rotate-45" /> 12%
              </div>
           </div>
        </div>

        {/* Pending Director Decisions */}
        <div 
          onClick={() => navigate('/admin/cases')}
          className="bg-white rounded-[1.5rem] p-7 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between cursor-pointer hover:border-amber-500/20 hover:shadow-xl hover:shadow-amber-900/5 transition-all group"
        >
           <div className="flex justify-between items-start">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-tight group-hover:text-amber-600 transition-colors">Pending Decisions</span>
              <Clock size={20} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
           </div>
           <div className="flex items-end gap-3 mt-4">
              <h3 className="text-[44px] font-pjs font-black text-[#003624] tracking-tighter leading-none">{stats.pending_director_decisions.toString().padStart(2, '0')}</h3>
              <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black mb-1 opacity-40">
                 ↘ 05
              </div>
           </div>
        </div>

        {/* Institutional Resolution Rate */}
        <div className="bg-white rounded-[1.5rem] p-7 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between group">
           <div className="flex justify-between items-start">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-tight">Resolution Rate</span>
              <BarChart3 size={20} className="text-slate-300" />
           </div>
           <div className="flex items-end gap-3 mt-4">
              <h3 className="text-[44px] font-pjs font-black text-[#003624] tracking-tighter leading-none">{resolutionRate}%</h3>
              <div className="flex items-center gap-1 text-emerald-500 text-[12px] font-black mb-1">
                 ↑ 4%
              </div>
           </div>
        </div>

        {/* Active Campus Surveillance */}
        <div 
          onClick={() => navigate('/admin/patrols')}
          className="bg-white rounded-[1.5rem] p-7 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between cursor-pointer hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-900/5 transition-all group"
        >
           <div className="flex justify-between items-start">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-tight group-hover:text-indigo-600 transition-colors">Active Officers</span>
              <Users size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
           </div>
           <div className="flex items-center gap-4 mt-4">
              <h3 className="text-[44px] font-pjs font-black text-[#003624] tracking-tighter leading-none">{stats.active_patrols.toString().padStart(2, '0')}</h3>
              <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded uppercase tracking-widest border border-emerald-100">
                 Operational
              </div>
           </div>
        </div>
      </div>

      {/* ══════════════════════════════ 2. TRENDS & HOTSPOTS COMPACT SPLIT ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Temporal Trends Chart */}
        <div className="lg:col-span-8 flex flex-col group h-full relative">
           <ViolationsOverTimeChart 
             analytics={data} 
             headerActions={
                <div className="flex bg-slate-50 p-1 rounded-xl gap-1 mr-2">
                  <button 
                    onClick={() => setTimeRange('week')}
                    className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${timeRange === 'week' ? 'bg-white text-[#003624] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Week
                  </button>
                  <button 
                    onClick={() => setTimeRange('month')}
                    className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${timeRange === 'month' ? 'bg-white text-[#003624] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Month
                  </button>
                </div>
             } 
           />
        </div>

        {/* Hotspots Side Panel */}
        <div className="lg:col-span-4 bg-white rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                 <MapPin size={20} />
              </div>
              <h3 className="text-[18px] font-pjs font-black text-[#003624] tracking-tight uppercase">Hotspots</h3>
           </div>

           <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2 scrollbar-hide">
              {hotspots.slice(0, 3).map((h, i) => {
                const badgeColors = [
                   'bg-rose-50 text-rose-500 border-rose-100',
                   'bg-amber-50 text-amber-500 border-amber-100',
                   'bg-indigo-50 text-indigo-500 border-indigo-100',
                   'bg-slate-50 text-slate-500 border-slate-100'
                ];
                const colorClass = badgeColors[i] || badgeColors[3];
                return (
                  <div key={i} className="group p-4 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-500 flex items-center gap-5 cursor-pointer">
                     <div className={`w-10 h-10 rounded-full border ${colorClass} text-[11px] font-black flex items-center justify-center shadow-sm`}>
                        {(i + 1).toString().padStart(2, '0')}
                     </div>
                     <div className="flex-1">
                        <h4 className="text-[14px] font-black text-gray-800 leading-tight mb-0.5">{h.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Campus Hotspot</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-[16px] font-black text-[#003624]">{h.count.toString().padStart(2, '0')}</span>
                        <TrendingUp size={14} className={h.count > 5 ? 'text-rose-500' : 'text-emerald-500'} />
                     </div>
                  </div>
                );
              })}
           </div>

           <button 
             onClick={() => navigate('/admin/analytics')}
             className="w-full mt-6 py-3.5 rounded-xl border-2 border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-[#003624] hover:text-white hover:border-[#003624] transition-all"
           >
              View All Zones
           </button>
        </div>
      </div>

      {/* ══════════════════════════════ 3. DECISION QUEUE & POLICY (INVESTIGATION VIEW) ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Director Decision Queue - Table Layout */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col">
           <div className="flex justify-between items-center mb-8 px-2">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#003624] flex items-center justify-center">
                    <Gavel size={18} />
                 </div>
                 <h3 className="text-[18px] font-pjs font-black text-[#003624] tracking-tight uppercase">Director Decision Queue</h3>
              </div>
              <div className="px-3 py-1 bg-rose-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-rose-900/20">
                 Priority
              </div>
           </div>
           
           <div className="flex-1 overflow-x-auto">
              <table className="w-full">
                 <thead>
                    <tr className="border-b border-gray-50">
                       <th className="text-left py-4 px-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Principal Party</th>
                       <th className="text-left py-4 px-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Escalation Date</th>
                       <th className="text-left py-4 px-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Severity</th>
                       <th className="text-right py-4 px-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50/50">
                    {data.director_alert_queue?.map((s, i) => (
                      <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                         <td className="py-5 px-2">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-emerald-50 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                                  <Users size={18} className="text-[#003624]" />
                               </div>
                               <div>
                                  <p className="text-[13px] font-black text-gray-900 leading-none mb-1">{s.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{s.college} • ID: #{s.id?.slice(-5) || '?????'}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-5 px-2">
                             <p className="text-[12px] font-bold text-gray-600">{s.date}</p>
                          </td>
                          <td className="py-5 px-2">
                             <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${s.distinct_rules > 2 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                {s.distinct_rules > 2 ? 'Critical' : 'Major'}
                             </span>
                          </td>
                          <td className="py-5 px-2 text-right">
                             <button 
                              onClick={() => navigate('/admin/students/' + s.id)}
                              className="px-5 py-2 rounded-xl bg-[#003624] text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all"
                             >
                                Review
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
              {(!data.director_alert_queue || data.director_alert_queue.length === 0) && (
                <div className="py-20 text-center">
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No high-priority decisions pending</p>
                </div>
              )}
           </div>
        </div>

        {/* Policy Compliance Distribution */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
           <div className="flex justify-between items-start mb-10">
              <div>
                 <h3 className="text-[18px] font-pjs font-black text-[#003624] tracking-tight uppercase mb-1">Policy Compliance Distribution</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Current quarter categorical analysis</p>
              </div>
              <BarChart3 size={20} className="text-emerald-400" />
           </div>

           <div className="space-y-8">
              {data.policy_breakdown?.map((p, i) => {
                const total = data.status_distribution.total || 1;
                const pct = (p.count / total) * 100;
                return (
                  <div key={i} className="group">
                    <div className="flex justify-between items-end mb-2.5 px-0.5">
                      <span className="text-[13px] font-black text-gray-700 tracking-tight">{p.name}</span>
                      <span className="text-[14px] font-black text-[#003624]">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                       <div 
                        className={`h-full rounded-full transition-all duration-1000 ${p.name.includes('Major') ? 'bg-[#003624]' : p.name.includes('Traffic') ? 'bg-slate-300' : 'bg-emerald-600'}`} 
                        style={{ width: `${pct}%` }}
                       ></div>
                    </div>
                  </div>
                )
              })}
           </div>
        </div>
      </div>
    </div>
  );
}
