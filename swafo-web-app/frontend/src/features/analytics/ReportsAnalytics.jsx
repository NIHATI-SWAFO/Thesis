import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useColleges } from '../../hooks/useColleges';
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
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('Month');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPulse, setShowPulse] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { colleges } = useColleges();

  useEffect(() => {
    const range = timeFilter.toLowerCase();
    setLoading(true);
    const params = new URLSearchParams({ range });
    if (collegeFilter) params.set('college', collegeFilter);
    fetch(`${API_ENDPOINTS.ADMIN_DASHBOARD}?${params.toString()}`)
      .then(res => res.json())
      .then(json => {
        setAnalytics(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching analytics:', err);
        setLoading(false);
      });
  }, [timeFilter, collegeFilter]);

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
    <div className="max-w-[1400px] mx-auto pb-24 px-3 sm:px-6 md:px-8 animate-fade-in font-manrope">
      
      {/* ══════════════════════════════ HEADER ══════════════════════════════ */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 sm:gap-6 mb-6 md:mb-12 pt-4 md:pt-10">
        <div>
          <h1 className="text-[26px] sm:text-[36px] md:text-[48px] font-pjs font-extrabold text-[#004d33] tracking-tighter leading-none mb-2 md:mb-4">Institutional Analytics</h1>
          <p className="text-[12px] sm:text-[15px] md:text-[18px] text-[#64748b] font-medium max-w-[600px] leading-relaxed">
            A comprehensive diagnostic overview of institutional compliance, patrol efficiency, and behavioral trends across campus colleges.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {/* College Filter */}
          <select
            value={collegeFilter || ""}
            onChange={e => setCollegeFilter(e.target.value)}
            className="w-full sm:w-auto px-3 sm:px-5 py-2.5 sm:py-3 bg-white border border-[#f1f5f9] rounded-xl md:rounded-2xl text-[12px] sm:text-[14px] font-bold text-[#475569] shadow-sm hover:bg-gray-50 transition-all outline-none cursor-pointer"
          >
            <option value="">All Colleges</option>
            {colleges.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Time Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 bg-white border border-[#f1f5f9] rounded-xl md:rounded-2xl text-[12px] sm:text-[14px] font-bold text-[#475569] shadow-sm hover:bg-gray-50 transition-all"
            >
              <span>{timeFilter}</span>
              <ChevronDown size={16} className={`${isFilterOpen ? 'rotate-180' : ''} transition-transform`} />
            </button>
            {isFilterOpen && (
              <div className="absolute top-full mt-2 right-0 w-full sm:w-[160px] bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-2">
                {['Month', 'Year'].map(f => (
                  <button
                    key={f}
                    onClick={() => changeFilter(f)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg sm:rounded-xl text-[12px] sm:text-[13px] font-bold transition-colors ${timeFilter === f ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Action Buttons */}
          <div className="col-span-2 sm:col-span-1 flex gap-2 w-full sm:w-auto">
            {collegeFilter && (
              <a
                href={API_ENDPOINTS.COLLEGE_REPORT ? API_ENDPOINTS.COLLEGE_REPORT(collegeFilter) : '#'}
                download
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-rose-600 text-white rounded-xl md:rounded-2xl text-[11px] sm:text-[13px] font-black shadow-lg shadow-rose-600/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Download size={14} />
                <span>Report</span>
              </a>
            )}
            <button
              onClick={handleExport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-[#004d33] text-white rounded-xl md:rounded-2xl text-[11px] sm:text-[13px] font-black shadow-lg shadow-[#004d33]/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════ KPI GRID ══════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-4 mb-6 md:mb-10">
        {[
          ...(analytics.kpis || []),
          {
            label: 'Resolution Speed',
            value: typeof analytics.stats?.avg_resolution_hours === 'number'
              ? (analytics.stats.avg_resolution_hours > 24 
                  ? `${Math.floor(analytics.stats.avg_resolution_hours / 24)}d ${Math.round(analytics.stats.avg_resolution_hours % 24)}h`
                  : `${Math.floor(analytics.stats.avg_resolution_hours)}h ${Math.round((analytics.stats.avg_resolution_hours % 1) * 60)}m`)
              : '--',
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
            if (label.includes('TOTAL')) return kpi.trendUp ? 'Increasing' : 'Improving';
            if (label.includes('PENDING') || label.includes('ACTIVE') || label.includes('ONGOING')) return 'Operational';
            if (label.includes('CLOSED')) return kpi.trendUp ? 'Efficiency' : 'Action';
            if (label.includes('REPEAT')) return kpi.trendUp ? 'Recidivism' : 'Success';
            if (label.includes('SPEED') || label.includes('RESOLUTION')) return 'Efficiency';
            return 'Trend';
          };
          
          return (
            <div 
              key={idx} 
              className={`bg-white rounded-2xl md:rounded-[2rem] p-3.5 sm:p-5 md:p-6 border border-[#f1f5f9] shadow-[0_10px_40px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-all duration-500 ${
                idx === 4 ? 'col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-3 sm:mb-5 relative z-10">
                <span className="text-[9px] sm:text-[10px] font-pjs font-bold text-slate-500 tracking-[0.05em] uppercase truncate pr-1">{kpi.label}</span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 flex-shrink-0 flex items-center justify-center rounded-lg sm:rounded-xl border ${kpiColor} shadow-sm transition-transform duration-500`}>
                  <Icon size={14} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="flex flex-col gap-0.5 sm:gap-1 relative z-10">
                <span className="text-[22px] sm:text-[28px] md:text-[36px] font-pjs font-black text-[#003624] tracking-tighter leading-none mb-0.5 sm:mb-1">{kpi.value}</span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={`flex items-center w-fit text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                    (kpi.isResolution ? kpi.trendUp : (kpi.trendUp && kpi.label.includes('TOTAL'))) ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {kpi.trendUp ? <TrendingUp size={9} className="mr-0.5 sm:mr-1" /> : <TrendingDown size={9} className="mr-0.5 sm:mr-1" />}
                    {kpi.trend}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">
                    {getInsight()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════ MAIN CHARTS ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 md:mb-10">
        
        {/* Violations Over Time — Seasonality Analysis (7-Day SMA) */}
        <div className="overflow-hidden">
          <ViolationsOverTimeChart analytics={analytics} />
        </div>

        {/* Violations by Type - Refined Ranking */}
        <div className="bg-white rounded-2xl md:rounded-[3rem] p-4 sm:p-8 md:p-12 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6 sm:mb-10">
            <h3 className="text-[17px] sm:text-[20px] md:text-[22px] font-pjs font-black text-[#003624] tracking-tight">Violations by Type</h3>
            <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-colors text-slate-300">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
            { (analytics.byType || []).map((item, i) => (
              <div key={i} className="flex flex-col gap-2 group">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] sm:text-[14px] md:text-[15px] font-bold text-[#475569] group-hover:text-[#003624] transition-colors truncate pr-2">{item.type}</span>
                  <span className="text-[12px] sm:text-[14px] md:text-[15px] font-black text-[#003624] shrink-0">{item.percentage}%</span>
                </div>
                <div className="h-2 sm:h-2.5 md:h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 md:mb-10">
        
        {/* Case Status Distribution - Simplified CLOSED vs PENDING */}
        <div className="bg-white rounded-2xl md:rounded-[3rem] p-4 sm:p-8 md:p-12 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
          <h3 className="text-[17px] sm:text-[20px] md:text-[22px] font-pjs font-black text-[#003624] tracking-tight mb-6 sm:mb-10">Case Status Distribution</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 md:gap-16 pt-1 sm:pt-4">
            <div className="relative w-[150px] h-[150px] sm:w-[190px] sm:h-[190px] md:w-[240px] md:h-[240px] shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f8fafc" strokeWidth="16" fill="transparent" />
                {(() => {
                  const dist = analytics.distribution || [];
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
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                <span className="text-[28px] sm:text-[36px] md:text-[48px] font-pjs font-black text-[#003624] tracking-tighter leading-none">
                  {analytics.stats?.active_cases || 0}
                </span>
                <span className="text-[8px] sm:text-[10px] md:text-[12px] font-black text-slate-500 uppercase tracking-widest text-center mt-0.5 sm:mt-1">ACTIVE</span>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col gap-3 sm:gap-6 flex-wrap justify-center">
              {(analytics.distribution || []).map((d, i) => (
                <div key={i} className="flex items-center gap-2.5 sm:gap-4 group cursor-pointer">
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: d.color }}></div>
                  <div className="flex flex-col">
                    <span className="text-[12px] sm:text-[14px] md:text-[15px] font-black text-[#003624] tracking-tight">{d.percentage}%</span>
                    <span className="text-[10px] sm:text-[11px] md:text-[13px] font-bold text-slate-400 uppercase tracking-wider">{d.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Violations by College - Polished Horizontal Bars */}
        <div className="bg-white rounded-2xl md:rounded-[3rem] p-4 sm:p-8 md:p-12 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
          <h3 className="text-[17px] sm:text-[20px] md:text-[22px] font-pjs font-black text-[#003624] tracking-tight mb-6 sm:mb-10">Violations by College</h3>
          <div className="flex flex-col gap-3.5 sm:gap-5 md:gap-6">
            {(analytics.byCollege || []).length === 0 ? (
              <p className="text-[12px] sm:text-[13px] font-bold text-slate-400 py-6 text-center">No college violation records found for this period.</p>
            ) : (
              (analytics.byCollege || []).map((col, i) => {
                const maxCollegeVal = Math.max(...analytics.byCollege.map(c => c.count), 1);
                const acronym = COLLEGE_ACRONYMS[col.name] || (col.name.length <= 6 ? col.name : col.name.split(' ').map(w => w[0]).join(''));
                const pct = (col.count / maxCollegeVal) * 100;
                return (
                  <div key={i} className="flex items-center gap-2.5 sm:gap-4 group">
                    <div className="flex items-center gap-1.5 w-[50px] sm:w-[65px] md:w-[80px] shrink-0">
                      <span className="text-[11px] sm:text-[13px] md:text-[14px] font-bold text-[#475569] group-hover:text-[#003624] transition-colors">{acronym}</span>
                      {i < 3 && <TrendingUp size={11} className="text-rose-500 shrink-0" />}
                    </div>

                    <div className="flex-1 flex items-center gap-2.5 sm:gap-3">
                      <div className="flex-1 h-6 sm:h-7 md:h-9 bg-slate-50 rounded-lg md:rounded-xl overflow-hidden border border-slate-100/50">
                        <div
                          className="h-full bg-emerald-950/80 rounded-lg md:rounded-xl transition-all duration-1000 ease-out group-hover:bg-[#004d33]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] sm:text-[12px] md:text-[13px] font-black text-[#003624] w-5 sm:w-6 text-right shrink-0">{col.count}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ══════════════════════════════ FIELD INTELLIGENCE ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8 mb-12">
        
        {/* Risk Score Leaderboard - Top 10 */}
        <div className="lg:col-span-5 bg-white rounded-2xl md:rounded-[3rem] p-4 sm:p-8 md:p-12 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6 sm:mb-10">
            <div>
              <h3 className="text-[17px] sm:text-[20px] md:text-[22px] font-pjs font-black text-[#003624] tracking-tight mb-0.5 sm:mb-1">Risk Leaderboard</h3>
              <p className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">Top Institutional Risks</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
               <ShieldAlert size={18} />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
            {(analytics.risk_leaderboard || []).length === 0 ? (
              <p className="text-[12px] sm:text-[13px] font-bold text-slate-400 py-6 text-center">No elevated risk patterns flagged.</p>
            ) : (
              (analytics.risk_leaderboard || []).map((student, i) => (
                <div 
                  key={i} 
                  onClick={() => navigate('/admin/students')}
                  className="flex items-center justify-between group cursor-pointer gap-2 p-1 -m-1 rounded-xl hover:bg-slate-50/80 transition-colors"
                  title="View Student Records"
                >
                  <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                    <span className="text-[16px] sm:text-[20px] md:text-[24px] font-pjs font-black text-slate-200 group-hover:text-rose-500/30 transition-all duration-500 w-5 sm:w-7 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <h5 className="text-[12px] sm:text-[14px] md:text-[15px] font-black text-[#003624] mb-0.5 truncate group-hover:text-emerald-700 transition-colors">{student.name}</h5>
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 truncate">{student.college}</p>
                    </div>
                  </div>
                  <div className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-[12px] md:text-[13px] font-black shadow-sm border transition-all duration-300 shrink-0 ${
                    student.score > 75 ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    student.score > 50 ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {student.score}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recidivism Pattern Detection (Behavioral Association Map) */}
        <div className="lg:col-span-7 bg-[#003624] rounded-2xl md:rounded-[3rem] p-4 sm:p-8 md:p-12 shadow-[0_30px_70px_rgba(0,45,30,0.15)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[240px] sm:w-[350px] md:w-[500px] h-[240px] sm:h-[350px] md:h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none group-hover:bg-white/10 transition-colors duration-1000"></div>
          
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-10 md:mb-14 relative z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/5 shrink-0">
              <ShieldAlert className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-[18px] sm:text-[22px] md:text-[26px] font-pjs font-black text-white tracking-tight leading-none mb-1">Recidivism Patterns</h3>
              <p className="text-[10px] sm:text-[11px] md:text-[13px] font-bold text-emerald-300/50 uppercase tracking-widest">Behavioral Association Clusters</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 relative z-10">
            {(analytics.recidivism_patterns || []).length === 0 ? (
              <p className="text-[12px] sm:text-[13px] font-bold text-emerald-200/60 py-6 text-center">No recurring violation sequences detected.</p>
            ) : (
              (analytics.recidivism_patterns || []).map((pattern, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-4 bg-white/5 p-3 sm:p-4 md:p-5 rounded-xl md:rounded-[1.5rem] border border-white/10 hover:bg-white/10 transition-all group/item">
                  {/* Gateway Offense */}
                  <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 min-w-0">
                    <span className="text-[8px] sm:text-[9px] font-black text-emerald-400 uppercase tracking-widest">Gateway</span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-white leading-snug line-clamp-2">{pattern.from}</span>
                  </div>

                  {/* Arrow + Confidence */}
                  <div className="flex flex-col items-center flex-shrink-0 gap-0.5 sm:gap-1 px-1">
                    <span className="text-[10px] sm:text-[12px] md:text-[13px] font-black text-emerald-400">{pattern.confidence}%</span>
                    <div className="w-5 sm:w-7 md:w-8 h-[2px] bg-emerald-500/30 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                    </div>
                  </div>

                  {/* Subsequent Risk */}
                  <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 text-right min-w-0">
                    <span className="text-[8px] sm:text-[9px] font-black text-emerald-400 uppercase tracking-widest">Subsequent</span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-white leading-snug line-clamp-2">{pattern.to}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ══════════════════════════════ COLLAPSIBLE LIVE PULSE BAR ══════════════════════════════ */}
      <div className={`fixed bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 ease-in-out z-[100] ${
        showPulse ? 'w-[94%] max-w-[1400px]' : 'w-[140px] sm:w-[170px] md:w-[200px]'
      }`}>
        <div className={`bg-[#003624]/95 backdrop-blur-xl rounded-full p-2.5 sm:p-3 md:p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] flex items-center overflow-hidden border border-white/10 ring-4 ring-black/5 ${
          showPulse ? 'gap-3 sm:gap-6 md:gap-12' : 'justify-center cursor-pointer hover:scale-105 active:scale-95'
        }`} onClick={() => !showPulse && setShowPulse(true)}>
          
          <div className={`flex items-center gap-2 sm:gap-3 bg-white/10 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full border border-white/10 shrink-0 shadow-inner transition-all ${
            showPulse ? '' : 'bg-transparent border-none px-0'
          }`}>
             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_#34d399]" />
             <span className="text-[10px] sm:text-[11px] md:text-[12px] font-black text-white uppercase tracking-[0.1em] sm:tracking-[0.2em] whitespace-nowrap">
                {showPulse ? 'Operational Pulse' : 'Pulse'}
             </span>
             {showPulse && (
               <button 
                 onClick={(e) => { e.stopPropagation(); setShowPulse(false); }}
                 className="ml-1 p-0.5 hover:bg-white/10 rounded-lg transition-colors"
                 title="Close Pulse"
               >
                 <X size={14} className="text-white/60" />
               </button>
             )}
          </div>
          
          {showPulse && (
            <div className="flex-1 overflow-hidden relative animate-fade-in min-w-0">
               <div className="flex items-center gap-6 sm:gap-12 md:gap-24 whitespace-nowrap animate-marquee py-0.5">
                  {(analytics.live_pulse || []).map((p, i) => (
                    <div key={i} className="flex items-center gap-3 sm:gap-6 md:gap-8 group/pulse shrink-0">
                       <div className="flex flex-col">
                          <span className="text-[8px] sm:text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-0.5 opacity-60">Event</span>
                          <span className="text-[11px] sm:text-[13px] md:text-[15px] font-bold text-white leading-none tracking-tight">{p.id} • {p.type}</span>
                       </div>
                       <div className="h-6 sm:h-8 w-px bg-white/10"></div>
                       <div className="flex flex-col">
                          <span className="text-[8px] sm:text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-0.5 opacity-60">Location</span>
                          <span className="text-[11px] sm:text-[13px] md:text-[15px] font-bold text-white/80 leading-none tracking-tight">{p.location}</span>
                       </div>
                       <div className="ml-2 sm:ml-4 flex items-center">
                          <span className="text-[9px] sm:text-[10px] font-black text-[#003624] bg-emerald-400 px-2 py-0.5 rounded-md sm:rounded-lg shadow-sm">
                            {p.time}
                          </span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
          
          {showPulse && (
            <div className="shrink-0 flex items-center gap-1.5 px-3 sm:px-5 border-l border-white/10">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
               <span className="text-[8px] sm:text-[9px] font-black text-emerald-400 uppercase tracking-widest hidden sm:inline">Active</span>
            </div>
          )}
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
