import React, { useState, useEffect } from 'react';
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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(API_ENDPOINTS.ADMIN_DASHBOARD)
      .then(res => {
        if (!res.ok) throw new Error("API UNREACHABLE");
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Using Institutional Mock Data (API Unavailable)");
        setData({
          status_distribution: { total: 142, breakdown: [{ status: 'RESOLVED', count: 118 }, { status: 'PENDING', count: 24 }] },
          stats: { active_cases: 24, repeat_offenders: 12, active_patrols: 6, violations_today: 4 },
          hotspots: [
            { name: "JFH Corridor", count: 18, trend: "up" },
            { name: "West Parking", count: 12, trend: "down" },
            { name: "Library", count: 9, trend: "stable" },
            { name: "UWear Lab", count: 7, trend: "up" }
          ],
          officer_activity: [
            { name: "Timothy De Guzman", reports: 42, id: "OFF-TIM", status: "On Patrol" },
            { name: "Julian Cruz", reports: 38, id: "OFF-JUL", status: "Active" },
            { name: "Elias Velez", reports: 25, id: "OFF-ELI", status: "Active" }
          ],
          temporal: [
            { day: 'MON', value: 12 }, { day: 'TUE', value: 18 }, { day: 'WED', value: 24 },
            { day: 'THU', value: 15 }, { day: 'FRI', value: 21 }, { day: 'SAT', value: 8 }, { day: 'SUN', value: 4 }
          ],
          byCollege: [
            { name: "Engineering", count: 45 },
            { name: "Business", count: 32 },
            { name: "Arts & Sciences", count: 28 },
            { name: "Tourism", count: 22 }
          ],
          recent_violations: []
        });
        setLoading(false);
      });
  }, []);

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

  const { stats, hotspots, officer_activity, recent_violations, temporal, byCollege } = data;
  const resolutionRate = data.status_distribution?.total > 0 
    ? Math.round(((data.status_distribution.breakdown.find(b => b.status === 'RESOLVED')?.count || 0) / data.status_distribution.total) * 100)
    : 0;

  return (
    <div className="animate-fade-in space-y-10">
      
      {/* ══════════════════════════════ 1. TOP KPI BENTO GRID ══════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Academic Infractions */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between group hover:shadow-[0_30px_70px_rgba(0,0,0,0.06)] transition-all duration-700">
           <div className="flex justify-between items-start mb-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gavel size={28} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                <ArrowUpRight size={12} /> 12% Inc.
              </div>
           </div>
           <div>
              <h3 className="text-[54px] font-pjs font-black text-[#003624] tracking-tighter leading-none mb-4">{data.status_distribution.total}</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">Institutional Infractions</p>
           </div>
        </div>

        {/* Resolution Velocity */}
        <div className="bg-[#003624] rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <BarChart3 size={120} />
           </div>
           <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md text-emerald-400 flex items-center justify-center border border-white/10">
                <Clock size={28} />
              </div>
              <div className="px-3 py-1 bg-white/10 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                Target: 95%
              </div>
           </div>
            <div className="relative z-10">
              <h3 className="text-[54px] font-pjs font-black text-white tracking-tighter leading-none mb-4">
                {resolutionRate}%
              </h3>
              <p className="text-[11px] text-emerald-400/60 font-bold uppercase tracking-[0.2em]">Resolution Velocity</p>
            </div>
        </div>

        {/* High-Risk Students */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between group hover:shadow-[0_30px_70px_rgba(0,0,0,0.06)] transition-all duration-700">
           <div className="flex justify-between items-start mb-10">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert size={28} />
              </div>
              <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Requires Review</span>
           </div>
           <div>
              <h3 className="text-[54px] font-pjs font-black text-gray-900 tracking-tighter leading-none mb-4">{stats.repeat_offenders.toString().padStart(2, '0')}</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">Repeat Offenders</p>
           </div>
        </div>

        {/* Active Campus Surveillance */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between group hover:shadow-[0_30px_70px_rgba(0,0,0,0.06)] transition-all duration-700">
           <div className="flex justify-between items-start mb-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin size={28} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div> Active
              </div>
           </div>
           <div>
              <h3 className="text-[54px] font-pjs font-black text-gray-900 tracking-tighter leading-none mb-4">{stats.active_patrols.toString().padStart(2, '0')}</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">Active Officers</p>
           </div>
        </div>
      </div>

      {/* ══════════════════════════════ 2. TRENDS & HOTSPOTS ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Temporal Trends — Time-Series Bar Chart */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-[20px] font-pjs font-extrabold text-[#003624] tracking-tight uppercase">Temporal Infraction Trends</h3>
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest mt-1">Weekly volume analysis</p>
            </div>
            <div className="flex gap-2">
               {['D', 'W', 'M', 'Y'].map(v => (
                 <button key={v} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${v === 'W' ? 'bg-[#003624] text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>{v}</button>
               ))}
            </div>
          </div>

          <div className="h-[280px] flex items-end justify-between gap-4 px-4">
             {temporal.map((t, i) => {
               const max = Math.max(...temporal.map(item => item.value)) || 1;
               const height = (t.value / max) * 100;
               return (
                 <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full flex flex-col items-center">
                       {/* Value Tooltip */}
                       <div className="absolute -top-10 bg-[#003624] text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                         {t.value}
                       </div>
                       {/* Bar */}
                       <div 
                         className="w-full bg-emerald-50 rounded-t-xl group-hover:bg-[#009b69] transition-all duration-700 relative overflow-hidden"
                         style={{ height: `${height}%` }}
                       >
                         {i === temporal.length - 1 && <div className="absolute inset-x-0 top-0 h-1 bg-emerald-300 animate-pulse"></div>}
                       </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-6 group-hover:text-[#003624] transition-colors">{t.day}</span>
                 </div>
               )
             })}
          </div>
        </div>

        {/* Top Infraction Hotspots */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
           <h3 className="text-[16px] font-pjs font-extrabold text-[#003624] tracking-tight uppercase mb-8">Building Hotspots</h3>
           <div className="space-y-6">
              {hotspots.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-emerald-100 hover:bg-white transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 leading-tight">{h.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{h.count} incidents</p>
                      </div>
                   </div>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${h.trend === 'up' ? 'text-rose-500 bg-rose-50' : h.trend === 'down' ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                      {h.trend === 'up' ? <TrendingUp size={14} /> : h.trend === 'down' ? <TrendingUp size={14} className="rotate-180" /> : <MoreVertical size={14} />}
                   </div>
                </div>
              ))}
              {hotspots.length === 0 && <p className="text-center text-gray-400 py-10">No hotspots detected yet.</p>}
           </div>
        </div>
      </div>

      {/* ══════════════════════════════ 3. USER MANAGEMENT & OFFICER PERFORMANCE ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        
        {/* Officer Performance Table */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-[16px] font-pjs font-extrabold text-[#003624] tracking-tight uppercase">Officer Activity</h3>
              <button className="text-[11px] font-black text-emerald-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-8">Manage Team</button>
           </div>
           
           <div className="space-y-4">
              {officer_activity.map((o, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-white border border-gray-50 rounded-2xl hover:border-emerald-100 hover:shadow-sm transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-[#003624] flex items-center justify-center text-white text-[12px] font-bold shadow-sm uppercase">
                        {o.name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-gray-900 leading-tight">{o.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{o.id}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-10">
                      <div className="flex flex-col items-end">
                        <span className="text-[14px] font-bold text-[#003624] leading-none mb-1">{o.reports}</span>
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Logs</span>
                      </div>
                      <div className="flex flex-col items-end w-[60px]">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${o.status === 'On Patrol' ? 'bg-emerald-500 text-white' : o.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {o.status}
                        </span>
                      </div>
                   </div>
                </div>
              ))}
              {officer_activity.length === 0 && <p className="text-center text-gray-400 py-10">No officer activity recorded.</p>}
           </div>
        </div>

        {/* Student Violation Distribution by College */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-[16px] font-pjs font-extrabold text-[#003624] tracking-tight uppercase">College Distribution</h3>
              <Users size={20} className="text-slate-300" />
           </div>

           <div className="space-y-8">
              {byCollege.map((c, i) => {
                const max = Math.max(...byCollege.map(item => item.count)) || 1;
                const pct = (c.count / max) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-3 px-1">
                      <span className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">{c.name}</span>
                      <span className="text-[14px] font-black text-[#003624]">{c.count} Cases</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
           </div>

           <button className="w-full mt-10 py-5 bg-emerald-50 text-emerald-700 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] hover:bg-emerald-100 transition-all flex items-center justify-center gap-3">
              Generate Institutional Report <ChevronRight size={16} />
           </button>
        </div>
      </div>
    </div>
  );
}
