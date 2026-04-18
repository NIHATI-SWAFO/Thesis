import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Users,
  ChevronDown,
  Download,
  MoreHorizontal,
  ShieldAlert,
  BarChart3,
  Loader2
} from 'lucide-react';
import { API_ENDPOINTS } from '../../api/config';

const ICON_MAP = {
  warning: AlertTriangle,
  calendar: Calendar,
  verified: CheckCircle2,
  people: Users
};

const COLLEGE_ACRONYMS = {
  "College of Business Administration and Accountancy": "CBAA",
  "College of Criminal Justice Education": "CCJE",
  "College of Education": "COED",
  "College of Engineering, Architecture and Technology": "CEAT",
  "College of Information and Computer Studies": "CICS",
  "College of Liberal Arts and Communication": "CLAC",
  "College of Science": "COS",
  "College of Tourism and Hospitality Management": "CTHM"
};

export default function ReportsAnalytics() {
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_ENDPOINTS.OFFICER_DASHBOARD)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching analytics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="w-16 h-16 text-[#004d33] animate-spin mb-4" />
        <p className="text-[18px] font-pjs font-extrabold text-[#004d33]">Generating Compliance Intelligence...</p>
      </div>
    );
  }

  const analytics = data || {};

  return (
    <div className="max-w-[1400px] mx-auto pb-24 px-8 animate-fade-in font-manrope">
      
      {/* ══════════════════════════════ HEADER ══════════════════════════════ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 pt-10">
        <div>
          <h1 className="text-[48px] font-pjs font-extrabold text-[#004d33] tracking-tighter leading-none mb-4">Reports & Analytics</h1>
          <p className="text-[18px] text-[#64748b] font-medium max-w-[600px] leading-relaxed">
            A comprehensive diagnostic overview of institutional compliance, patrol efficiency, and behavioral trends across campus colleges.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <button className="flex items-center gap-3 px-6 py-3 bg-white border border-[#f1f5f9] rounded-2xl text-[15px] font-bold text-[#475569] shadow-sm hover:bg-gray-50 transition-all">
              {timeFilter}
              <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
          <button className="flex items-center gap-3 px-8 py-3 bg-[#004d33] text-white rounded-2xl text-[15px] font-black shadow-lg shadow-[#004d33]/20 hover:scale-[1.02] active:scale-95 transition-all">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* ══════════════════════════════ KPI GRID ══════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {(analytics.kpis || []).map((kpi, idx) => {
          const Icon = ICON_MAP[kpi.icon] || AlertTriangle;
          const kpiColor = kpi.label.includes('TOTAL') ? 'text-red-600 bg-red-50/50 border-red-100' : 
                         kpi.label.includes('ACTIVE') ? 'text-emerald-600 bg-emerald-50/50 border-emerald-100' :
                         kpi.label.includes('RESOLUTION') ? 'text-blue-600 bg-blue-50/50 border-blue-100' : 
                         'text-emerald-600 bg-emerald-50/50 border-emerald-100';
          
          return (
            <div key={idx} className="bg-white rounded-[2.5rem] p-10 border border-[#f1f5f9] shadow-[0_10px_40px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 ring-1 ring-transparent hover:ring-[#f1f5f9]">
              <div className="flex justify-between items-start mb-10 relative z-10">
                <span className="text-[12px] font-pjs font-bold text-slate-600 tracking-[0.1em] uppercase">{kpi.label}</span>
                <div className={`w-11 h-11 flex items-center justify-center rounded-2xl border ${kpiColor} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                  <Icon size={22} strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="flex flex-col gap-2 relative z-10">
                <span className="text-[48px] font-pjs font-black text-[#003624] tracking-tighter leading-none mb-2">{kpi.value}</span>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center text-[14px] font-bold px-2 py-0.5 rounded-lg ${kpi.trendUp ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {kpi.trendUp ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                    {kpi.trend}
                  </span>
                  <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest leading-none">vs last month</span>
                </div>
              </div>
              
              {/* Subtle background decoration */}
              <div className={`absolute -bottom-6 -right-6 w-24 h-24 bg-current opacity-[0.02] rounded-full transition-transform group-hover:scale-150 duration-700 ${kpiColor.split(' ')[0]}`}></div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════ MAIN CHARTS ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* Violations Over Time - High-Fidelity Bar Chart */}
        <div className="bg-white rounded-[3rem] p-12 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-[#004d33] opacity-40" />
              <h3 className="text-[22px] font-pjs font-black text-[#003624] tracking-tight">Violations Over Time</h3>
            </div>
            <button className="text-[13px] font-black text-[#10b981] uppercase tracking-widest hover:underline transition-all">View Detailed View</button>
          </div>
          <div className="h-[300px] flex items-end justify-between px-4 gap-4 relative">
            <div className="absolute top-1/2 left-0 w-full border-t border-slate-100 z-0"></div>
            { (analytics.temporal || []).map((d, i) => {
              const maxVal = Math.max(...analytics.temporal.map(t => t.value), 1);
              const height = (d.value / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-6 z-10 group cursor-pointer h-[240px] justify-end">
                  <div className="w-full max-w-[60px] bg-slate-50 rounded-2xl relative overflow-hidden h-full flex items-end">
                    <div 
                      className={`w-full rounded-2xl transition-all duration-1000 shadow-sm ease-out origin-bottom ${d.value === maxVal ? 'bg-[#004d33]' : 'bg-[#004d33]/40 group-hover:bg-[#004d33]/60'}`}
                      style={{ height: `${height}%` }}
                    >
                      {d.value === maxVal && <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse"></div>}
                    </div>
                  </div>
                  <span className="text-[11px] font-pjs font-black text-slate-400 tracking-wider whitespace-nowrap">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Violations by Type - Refined Ranking */}
        <div className="bg-white rounded-[3rem] p-12 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-[22px] font-pjs font-black text-[#003624] tracking-tight">Violations by Type</h3>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-colors text-slate-300">
              <MoreHorizontal />
            </button>
          </div>
          <div className="flex flex-col gap-10">
            { (analytics.byType || []).map((item, i) => (
              <div key={i} className="flex flex-col gap-4 group">
                <div className="flex justify-between items-center">
                  <span className="text-[15px] font-bold text-[#475569] group-hover:text-[#003624] transition-colors">{item.type}</span>
                  <span className="text-[15px] font-black text-[#003624]">{item.percentage}%</span>
                </div>
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                  <div 
                    className="h-full bg-[#004d33] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,77,51,0.1)]"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ══════════════════════════════ LOWER ANALYTICS ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* Case Status Distribution - Simplified CLOSED vs PENDING */}
        <div className="bg-white rounded-[3rem] p-12 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
          <h3 className="text-[22px] font-pjs font-black text-[#003624] tracking-tight mb-12">Case Status Distribution</h3>
          <div className="flex items-center justify-center gap-20 pt-6">
            <div className="relative w-[240px] h-[240px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f8fafc" strokeWidth="12" fill="transparent" />
                {/* Segment 1: CLOSED */}
                <circle 
                  cx="50" cy="50" r="40" 
                  stroke="#004d33" strokeWidth="12" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={251.2 * (1 - (analytics.distribution?.[0]?.percentage / 100 || 0))} 
                  fill="transparent"
                  className="transition-all duration-1000 ease-in-out"
                />
                {/* Segment 2: PENDING */}
                <circle 
                  cx="50" cy="50" r="40" 
                  stroke="#10b981" strokeWidth="12" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={251.2 * (1 - (analytics.distribution?.[1]?.percentage / 100 || 0))} 
                  style={{ transform: `rotate(${360 * (analytics.distribution?.[0]?.percentage / 100 || 0)}deg)`, transformOrigin: '50% 50%' }}
                  fill="transparent"
                  className="transition-all duration-1000 delay-200 ease-in-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-[48px] font-pjs font-black text-[#003624] tracking-tighter leading-none">
                  {analytics.stats?.active_cases || 0}
                </span>
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest text-center mt-2">PENDING CASES</span>
              </div>
            </div>
            <div className="flex flex-col gap-8">
              {(analytics.distribution || []).map((d, i) => (
                <div key={i} className="flex items-center gap-5 group cursor-pointer">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: d.color }}></div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-black text-[#003624] tracking-tight">{d.percentage}%</span>
                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">{d.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Violations by College - Polished Horizontal Bars */}
        <div className="bg-white rounded-[3rem] p-12 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
          <h3 className="text-[22px] font-pjs font-black text-[#003624] tracking-tight mb-12">Violations by College</h3>
          <div className="flex flex-col gap-9">
            {(analytics.byCollege || []).map((col, i) => {
              const maxCollegeVal = Math.max(...analytics.byCollege.map(c => c.count), 1);
              const acronym = COLLEGE_ACRONYMS[col.name] || col.name.split(' ').map(w => w[0]).join('');
              return (
                <div key={i} className="flex items-center gap-8 group">
                  <span className="w-16 text-[10px] font-black text-slate-400 tracking-wider group-hover:text-[#003624] transition-colors truncate" title={col.name}>
                    {acronym}
                  </span>
                  <div className="flex-1 h-9 bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100/50">
                    <div 
                      className="h-full bg-emerald-950/80 rounded-xl transition-all duration-1000 ease-out group-hover:bg-[#004d33] group-hover:shadow-[0_0_20px_rgba(0,77,51,0.2)]" 
                      style={{ width: `${(col.count / maxCollegeVal) * 100}%` }}
                    >
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-white/90 drop-shadow-sm">{col.count}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ══════════════════════════════ FIELD intelligence ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Top Violation Types List */}
        <div className="lg:col-span-5 bg-white rounded-[3rem] p-12 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
          <h3 className="text-[22px] font-pjs font-black text-[#003624] tracking-tight mb-12">Top Violation Types</h3>
          <div className="flex flex-col gap-10">
            {(analytics.topAlerts || []).map((alert, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-6">
                  <span className="text-[28px] font-pjs font-black text-emerald-100 group-hover:text-emerald-500/20 transition-all duration-500 scale-90 group-hover:scale-100">{alert.rank}</span>
                  <div>
                    <h5 className="text-[17px] font-black text-[#003624] mb-1 group-hover:translate-x-1 transition-transform">{alert.type}</h5>
                    <p className="text-[13px] font-bold text-slate-400">{alert.location}</p>
                  </div>
                </div>
                <div className={`px-5 py-2.5 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${alert.statusColor} group-hover:shadow-sm`}>
                  {alert.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patrol Statistics - High Contrast Dark Card */}
        <div className="lg:col-span-7 bg-[#004d33] rounded-[3rem] p-12 shadow-[0_30px_70px_rgba(0,45,30,0.15)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none group-hover:bg-white/10 transition-colors duration-1000"></div>
          
          <div className="flex items-center gap-5 mb-16 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/5">
              <ShieldAlert className="text-white scale-110" size={26} />
            </div>
            <div>
              <h3 className="text-[26px] font-pjs font-black text-white tracking-tight leading-none mb-1">Patrol Statistics</h3>
              <p className="text-[13px] font-bold text-emerald-300/40 uppercase tracking-widest">Global Fleet Health</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-16 relative z-10">
            <PatrolStat label="TOTAL PATROLS" value={analytics.patrol_stats?.total || '0'} subValue="This Semester" />
            <PatrolStat label="ACTIVE PATROLS" value={analytics.active_patrols || '0'} subValue="Currently on site" glow />
            <PatrolStat label="PHOTOS CAPTURED" value={analytics.patrol_stats?.photos || '0'} subValue="Evidence stored safely" />
            <PatrolStat label="AVG DURATION" value={analytics.patrol_stats?.duration || '0m'} subValue="Per sector patrol" />
          </div>
        </div>

      </div>
    </div>
  );
}

function PatrolStat({ label, value, subValue, glow }) {
  return (
    <div className="flex flex-col gap-3 group">
      <div className="flex items-center gap-2">
         {glow && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>}
         <span className="text-[11px] font-pjs font-black text-emerald-300/40 uppercase tracking-[0.3em]">{label}</span>
      </div>
      <div className="flex flex-col">
        <span className={`text-[52px] font-pjs font-black text-white tracking-tighter leading-none mb-3 transition-all group-hover:scale-105 origin-left duration-500`}>
          {value}
        </span>
        <span className="text-[13px] font-bold text-emerald-300/60 transition-colors group-hover:text-white/80">{subValue}</span>
      </div>
    </div>
  );
}
