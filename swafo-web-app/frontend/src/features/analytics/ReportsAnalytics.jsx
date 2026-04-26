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
  Loader2,
  X,
  Search,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';
import { API_ENDPOINTS } from '../../api/config';
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceArea, ReferenceLine
} from 'recharts';
import ViolationsOverTimeChart from './ViolationsOverTimeChart';

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
  const [timeFilter, setTimeFilter] = useState('Month');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPulse, setShowPulse] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const range = timeFilter.toLowerCase();
    setLoading(true);
    fetch(`${API_ENDPOINTS.ADMIN_DASHBOARD}?range=${range}`)
      .then(res => res.json())
      .then(json => {
        setAnalytics(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching analytics:", err);
        setLoading(false);
      });
  }, [timeFilter]);

  const handleExport = () => {
    if (!analytics) return;
    const csvRows = [];
    csvRows.push("KPI,Value,Trend");
    (analytics.kpis || []).forEach(k => csvRows.push(`${k.label},${k.value},${k.trend}`));
    
    csvRows.push("\nCollege,Violation Count");
    (analytics.byCollege || []).forEach(c => csvRows.push(`${c.name},${c.count}`));

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `SWAFO_Analytics_${timeFilter.replace(' ', '_')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const changeFilter = (filter) => {
    setTimeFilter(filter);
    setIsFilterOpen(false);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="w-16 h-16 text-[#004d33] animate-spin mb-4" />
        <p className="text-[18px] font-pjs font-extrabold text-[#004d33]">Updating Compliance Intelligence...</p>
      </div>
    );
  }

  if (!analytics && !loading) return <div className="p-20 text-center font-bold">Failed to load compliance intelligence.</div>;

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
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-[#f1f5f9] rounded-2xl text-[15px] font-bold text-[#475569] shadow-sm hover:bg-gray-50 transition-all"
            >
              {timeFilter}
              <ChevronDown size={18} className={`${isFilterOpen ? 'rotate-180' : ''} transition-transform`} />
            </button>
            {isFilterOpen && (
              <div className="absolute top-full mt-2 right-0 w-[200px] bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                {['Month', 'Year'].map(f => (
                  <button 
                    key={f}
                    onClick={() => changeFilter(f)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-[14px] font-bold transition-colors ${timeFilter === f ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-3 px-8 py-3 bg-[#004d33] text-white rounded-2xl text-[15px] font-black shadow-lg shadow-[#004d33]/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* ══════════════════════════════ KPI GRID ══════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
        {[
          ...(analytics.kpis || []),
          {
            label: 'Resolution Speed',
            value: analytics.stats?.avg_resolution_hours > 24 
              ? `${Math.floor(analytics.stats.avg_resolution_hours / 24)}d ${Math.round(analytics.stats.avg_resolution_hours % 24)}h`
              : `${Math.floor(analytics.stats.avg_resolution_hours)}h ${Math.round((analytics.stats.avg_resolution_hours % 1) * 60)}m`,
            trend: `${Math.abs(analytics.stats?.resolution_trend || 0)}%`,
            trendUp: (analytics.stats?.resolution_trend || 0) > 0,
            icon: 'Clock',
            isResolution: true
          }
        ].map((kpi, idx) => {
          const Icon = kpi.isResolution ? Clock : (ICON_MAP[kpi.icon] || AlertTriangle);
          const kpiColor = kpi.label.includes('TOTAL') ? 'text-rose-600 bg-rose-50/50 border-rose-100' : 
                         kpi.label.includes('PENDING') || kpi.label.includes('ACTIVE') ? 'text-amber-600 bg-amber-50/50 border-amber-100' :
                         kpi.isResolution ? 'text-indigo-600 bg-indigo-50/50 border-indigo-100' : 
                         'text-emerald-600 bg-emerald-50/50 border-emerald-100';

          const getInsight = () => {
            const label = kpi.label.toUpperCase();
            if (label.includes('TOTAL')) return kpi.trendUp ? 'Volume Increasing' : 'Compliance Improving';
            if (label.includes('PENDING') || label.includes('ACTIVE') || label.includes('ONGOING')) return 'Operational Workload';
            if (label.includes('CLOSED')) return kpi.trendUp ? 'Efficiency Rising' : 'Action Required';
            if (label.includes('REPEAT')) return kpi.trendUp ? 'Recidivism Risk' : 'Intervention Success';
            if (label.includes('SPEED') || label.includes('RESOLUTION')) return 'Institutional Efficiency';
            return 'Institutional Trend';
          };
          
          return (
            <div key={idx} className="bg-white rounded-[2rem] p-6 border border-[#f1f5f9] shadow-[0_10px_40px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 ring-1 ring-transparent hover:ring-[#f1f5f9]">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className="text-[10px] font-pjs font-bold text-slate-500 tracking-[0.1em] uppercase truncate pr-2">{kpi.label}</span>
                <div className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl border ${kpiColor} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                  <Icon size={18} strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="flex flex-col gap-1 relative z-10">
                <span className="text-[36px] font-pjs font-black text-[#003624] tracking-tighter leading-none mb-1">{kpi.value}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`flex items-center text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                    (kpi.isResolution ? kpi.trendUp : (kpi.trendUp && kpi.label.includes('TOTAL'))) ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {kpi.trendUp ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                    {kpi.trend} {kpi.isResolution ? (kpi.trendUp ? 'Slower' : 'Faster') : ''}
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none truncate max-w-full">
                    {kpi.isResolution ? (kpi.value.includes('d') ? '• Delayed' : '• Optimal') : getInsight()}
                  </span>
                </div>
              </div>
              
              <div className={`absolute -bottom-6 -right-6 w-24 h-24 bg-current opacity-[0.02] rounded-full transition-transform group-hover:scale-150 duration-700 ${kpiColor.split(' ')[0]}`}></div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════ MAIN CHARTS ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* Violations Over Time — Seasonality Analysis (7-Day SMA) */}
        <ViolationsOverTimeChart analytics={analytics} />

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
                <circle cx="50" cy="50" r="40" stroke="#f8fafc" strokeWidth="16" fill="transparent" />
                {(() => {
                  const dist = analytics.distribution || [];
                  // Normalize so segments always fill 100% — no gaps
                  const rawTotal = dist.reduce((sum, d) => sum + (d.percentage || 0), 0) || 100;
                  const circumference = 2 * Math.PI * 40;
                  let cumulativeFrac = 0;
                  return dist.map((d, i) => {
                    const frac = (d.percentage || 0) / rawTotal;
                    const strokeDasharray = `${frac * circumference} ${circumference}`;
                    const strokeDashoffset = -(cumulativeFrac * circumference);
                    cumulativeFrac += frac;
                    return (
                      <circle 
                        key={i}
                        cx="50" cy="50" r="40" 
                        stroke={d.color} strokeWidth="16" 
                        strokeDasharray={strokeDasharray} 
                        strokeDashoffset={strokeDashoffset}
                        fill="transparent"
                        strokeLinecap="butt"
                        className="transition-all duration-1000 ease-in-out"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-[48px] font-pjs font-black text-[#003624] tracking-tighter leading-none">
                  {analytics.stats?.active_cases || 0}
                </span>
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest text-center mt-2">ACTIVE CASES</span>
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
          <div className="flex flex-col gap-7">
            {(analytics.byCollege || []).map((col, i) => {
              const maxCollegeVal = Math.max(...analytics.byCollege.map(c => c.count), 1);
              const acronym = COLLEGE_ACRONYMS[col.name] || col.name.split(' ').map(w => w[0]).join('');
              const pct = (col.count / maxCollegeVal) * 100;
              return (
                <div key={i} className="flex items-center gap-4 group">
                  {/* Fixed-width label column — acronym + trending icon */}
                  <div className="flex items-center gap-2 w-[80px] shrink-0">
                    <span className="text-[14px] font-bold text-[#475569] group-hover:text-[#003624] transition-colors">{acronym}</span>
                    {i < 3 && <TrendingUp size={13} className="text-rose-500 shrink-0" />}
                  </div>

                  {/* Bar track + count */}
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-9 bg-slate-50 rounded-xl overflow-hidden border border-slate-100/50">
                      <div
                        className="h-full bg-emerald-950/80 rounded-xl transition-all duration-1000 ease-out group-hover:bg-[#004d33] group-hover:shadow-[0_0_20px_rgba(0,77,51,0.2)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {/* Count always outside the bar — always readable */}
                    <span className="text-[13px] font-black text-[#003624] w-6 text-right shrink-0">{col.count}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* ══════════════════════════════ FIELD intelligence ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Risk Score Leaderboard - Top 10 */}
        <div className="lg:col-span-5 bg-white rounded-[3rem] p-12 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-[22px] font-pjs font-black text-[#003624] tracking-tight mb-1">Risk Score Leaderboard</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Top 10 Institutional Risks</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
               <ShieldAlert size={20} />
            </div>
          </div>
          <div className="flex flex-col gap-8">
            {(analytics.risk_leaderboard || []).map((student, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-6">
                  <span className="text-[24px] font-pjs font-black text-slate-100 group-hover:text-rose-500/20 transition-all duration-500 w-8">{i + 1}</span>
                  <div>
                    <h5 className="text-[15px] font-black text-[#003624] mb-1 group-hover:translate-x-1 transition-transform">{student.name}</h5>
                    <p className="text-[11px] font-bold text-slate-400">{student.college}</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-[13px] font-black shadow-sm border transition-all duration-300 ${
                  student.score > 75 ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  student.score > 50 ? 'bg-orange-50 text-orange-600 border-orange-100' :
                  'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {student.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recidivism Pattern Detection (Behavioral Association Map) */}
        <div className="lg:col-span-7 bg-[#003624] rounded-[3rem] p-12 shadow-[0_30px_70px_rgba(0,45,30,0.15)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none group-hover:bg-white/10 transition-colors duration-1000"></div>
          
          <div className="flex items-center gap-5 mb-16 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/5">
              <ShieldAlert className="text-white scale-110" size={26} />
            </div>
            <div>
              <h3 className="text-[26px] font-pjs font-black text-white tracking-tight leading-none mb-1">Recidivism Pattern Detection</h3>
              <p className="text-[13px] font-bold text-emerald-300/40 uppercase tracking-widest">Behavioral Association Clusters</p>
            </div>
          </div>

          <div className="flex flex-col gap-5 relative z-10">
            {(analytics.recidivism_patterns || []).map((pattern, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 p-5 rounded-[1.5rem] border border-white/10 hover:bg-white/10 transition-all group/item">
                {/* Gateway Offense */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Gateway Offense</span>
                  <span className="text-[11px] font-bold text-white leading-snug line-clamp-2">{pattern.from}</span>
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-wider truncate">{pattern.from_category || pattern.from}</span>
                </div>

                {/* Arrow + Confidence */}
                <div className="flex flex-col items-center flex-shrink-0 gap-1">
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-[2px] bg-emerald-500/30 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                    </div>
                  </div>
                  <span className="text-[13px] font-black text-emerald-400">{pattern.confidence}%</span>
                  <span className="text-[8px] font-bold text-white/40 uppercase">Confidence</span>
                </div>

                {/* Subsequent Risk */}
                <div className="flex-1 flex flex-col gap-1 text-right min-w-0">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Subsequent Risk</span>
                  <span className="text-[11px] font-bold text-white leading-snug line-clamp-2">{pattern.to}</span>
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-wider truncate">{pattern.to_category || pattern.to}</span>
                </div>
              </div>
            ))}

            {(!analytics.recidivism_patterns || analytics.recidivism_patterns.length === 0) && (
              <div className="text-center py-10 opacity-30">
                 <p className="text-white font-bold italic">Collecting behavioral association data...</p>
              </div>
            )}
          </div>
        </div>

      {/* ══════════════════════════════ COLLAPSIBLE LIVE PULSE BAR ══════════════════════════════ */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 transition-all duration-700 ease-in-out z-[100] ${
        showPulse ? 'w-[90%] max-w-[1400px]' : 'w-[200px]'
      }`}>
        <div className={`bg-[#003624]/95 backdrop-blur-xl rounded-[2.5rem] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.3)] flex items-center overflow-hidden border border-white/10 ring-4 ring-black/5 ${
          showPulse ? 'gap-12' : 'justify-center cursor-pointer hover:scale-105'
        }`} onClick={() => !showPulse && setShowPulse(true)}>
          
          <div className={`flex items-center gap-4 bg-white/10 px-6 py-2.5 rounded-2xl border border-white/10 shrink-0 shadow-inner transition-all ${
            showPulse ? '' : 'bg-transparent border-none px-0'
          }`}>
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_#34d399]" />
             <span className="text-[12px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
                {showPulse ? 'Operational Pulse' : 'Live Pulse'}
             </span>
             {showPulse && (
               <button 
                 onClick={(e) => { e.stopPropagation(); setShowPulse(false); }}
                 className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
               >
                 <X size={14} className="text-white/40" />
               </button>
             )}
          </div>
          
          {showPulse && (
            <div className="flex-1 overflow-hidden relative animate-fade-in">
               <div className="flex items-center gap-24 whitespace-nowrap animate-marquee py-1">
                  {(analytics.live_pulse || []).map((p, i) => (
                    <div key={i} className="flex items-center gap-8 group/pulse">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1.5 opacity-60">Real-Time Event</span>
                          <span className="text-[15px] font-bold text-white leading-none tracking-tight">{p.id} • {p.type}</span>
                       </div>
                       <div className="h-10 w-px bg-white/10"></div>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1.5 opacity-60">Location</span>
                          <span className="text-[15px] font-bold text-white/80 leading-none tracking-tight">{p.location}</span>
                       </div>
                       <div className="ml-6 flex items-center gap-3">
                          <span className="text-[11px] font-black text-[#003624] bg-emerald-400 px-3 py-1 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                            {p.time}
                          </span>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-[#003624] to-transparent z-10" />
               <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-[#003624] to-transparent z-10" />
            </div>
          )}
          
          {showPulse && (
            <div className="shrink-0 flex items-center gap-2 px-6 border-l border-white/10 ml-4">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
            </div>
          )}
        </div>
      </div>

        <div className="h-32"></div>
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
