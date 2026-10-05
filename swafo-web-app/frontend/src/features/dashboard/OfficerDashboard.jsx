import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../api/config';
import { BarChart2, PieChart, ArrowRight, Shield, AlertTriangle, Clock, ChevronRight } from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const officerName = user?.name || user?.full_name || 'Officer';
  const firstName = officerName.replace(/^Officer\s+/i, '').split(' ')[0] || 'Officer';

  const fetchDashboard = () => {
    setLoading(true);
    setFetchError(null);
    const url = user?.email 
      ? `${API_ENDPOINTS.OFFICER_DASHBOARD}?email=${encodeURIComponent(user.email)}`
      : API_ENDPOINTS.OFFICER_DASHBOARD;
      
    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (json.error) {
           console.error("Dashboard API Error:", json.error);
           setFetchError(json.error);
           setLoading(false);
           return;
        }
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching dashboard:", err);
        setFetchError("Unable to connect to the institutional server.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="relative mb-4">
          <div className="w-12 h-12 border-4 border-emerald-100 border-t-[#003624] rounded-full animate-spin"></div>
        </div>
        <p className="font-pjs font-bold text-sm text-[#003624]">Loading Dashboard Analytics...</p>
        <p className="text-xs text-gray-400 mt-1">Fetching live officer workstation feeds</p>
      </div>
    );
  }

  if (fetchError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle size={28} />
        </div>
        <h3 className="font-pjs font-extrabold text-lg text-gray-900 mb-1">Failed to load analytics</h3>
        <p className="text-xs text-gray-500 max-w-sm mb-5">{fetchError || "Dashboard data could not be retrieved."}</p>
        <button
          onClick={fetchDashboard}
          className="px-5 py-2.5 bg-[#003624] hover:bg-[#004d33] text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats = {}, violations_by_type = [], status_distribution = {}, recent_violations = [] } = data;

  // Safe status distribution calculations
  const breakdown = status_distribution?.breakdown || [];
  const totalCases = status_distribution?.total || 0;
  const closedCases = breakdown.filter(s =>
    ['CLOSED', 'DISMISSED', 'DECISION_RENDERED'].includes((s.status || '').toUpperCase())
  ).reduce((acc, curr) => acc + (curr.count || 0), 0);
  const pendingCases = Math.max(0, totalCases - closedCases);
  const safeTotal = totalCases > 0 ? totalCases : 1;
  const closedPct = totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0;
  const pendingPct = totalCases > 0 ? (100 - closedPct) : 0;

  // Safe violations by type
  const maxTypeCount = violations_by_type.length > 0 ? Math.max(...violations_by_type.map(v => v.count || 0), 1) : 1;
  const barColors = ['#064e3b', '#059669', '#10b981', '#34d399'];

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in-up pb-10 px-1 sm:px-4">
      {/* ══════════════════════════════ HEADER ══════════════════════════════ */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-5 sm:mb-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active Shift
            </span>
            <span className="text-[11px] font-semibold text-gray-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl sm:text-[32px] font-pjs font-extrabold text-[#111827] tracking-tight leading-tight">
            Welcome back, {firstName}!
          </h1>
          <p className="text-xs sm:text-[14px] text-gray-500 font-medium mt-0.5 leading-snug">
            Here's your live operational summary and daily assignments.
          </p>
        </div>

        <button
          onClick={() => navigate('/officer/violations/new')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-[#003624] hover:bg-[#004d33] active:scale-95 text-white rounded-xl text-xs sm:text-[13px] font-bold shadow-md shadow-emerald-950/15 transition-all cursor-pointer shrink-0 mt-0.5 sm:mt-0"
        >
          <span className="material-symbols-outlined text-[17px] sm:text-[18px]">edit_note</span>
          <span className="whitespace-nowrap">Record Violation</span>
        </button>
      </div>

      {/* ══════════════════════════════ STAT CARDS (2x2 on Mobile, 4-col on Desktop) ══════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <StatCard 
          label="LIVE TODAY"
          value={stats.violations_today ?? 0}
          subtitle="New Violations Today"
          icon="warning"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard 
          label="PENDING"
          value={stats.active_cases ?? 0}
          subtitle="Total Pending Cases"
          icon="assignment"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard 
          label="ON PATROL"
          value={stats.active_patrols ?? 0}
          subtitle="Active Patrol Sessions"
          icon="radio_button_checked"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <StatCard 
          label="MY WORKLOAD"
          value={stats.my_workload ?? 0}
          subtitle="My Assigned Cases"
          icon="person"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* ══════════════════════════════ MAIN BENTO GRID ══════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        
        {/* LEFT COLUMN: QUICK ACTIONS (4-SQUARE GRID) */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-3 sm:gap-4">
          <QuickActionButton 
            onClick={() => navigate('/officer/patrols')}
            icon="ads_click"
            label="START PATROL"
            description="Launch mobile zone"
          />
          <QuickActionButton 
            onClick={() => navigate('/officer/patrol-history')}
            icon="history"
            label="VIEW HISTORY"
            description="Shift logbook"
          />
          <QuickActionButton 
            onClick={() => navigate('/officer/violations/new')}
            icon="edit_note"
            label="RECORD VIOLATION"
            description="New incident file"
          />
          <QuickActionButton 
            onClick={() => navigate('/officer/cases')}
            icon="folder_open"
            label="MANAGE CASES"
            description="Disciplinary desk"
          />
        </div>

        {/* MIDDLE COLUMN: VIOLATIONS BY TYPE */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100/80 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h2 className="text-sm sm:text-[16px] font-pjs font-extrabold text-gray-800 tracking-tight">Violations by Type</h2>
                <p className="text-[11px] text-gray-400 font-medium">Top reported categories</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <BarChart2 size={16} />
              </div>
            </div>

            {violations_by_type.length > 0 ? (
              <div className="space-y-4 sm:space-y-5">
                {violations_by_type.slice(0, 4).map((v, i) => {
                  const percentage = Math.round(((v.count || 0) / maxTypeCount) * 100);
                  return (
                    <div key={i} className="group">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate max-w-[170px]">
                          {v.name || 'General'}
                        </span>
                        <span className="text-xs sm:text-[13px] font-black text-slate-900 tabular-nums">
                          {v.count}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-700 ease-out" 
                          style={{ 
                            width: `${Math.max(percentage, 6)}%`, 
                            backgroundColor: barColors[i % barColors.length] 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                <Shield size={32} className="text-gray-300 mb-2" />
                <p className="text-xs font-semibold">No violations recorded yet</p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-400 font-medium">Institutional Handbook Standards</span>
            <button 
              onClick={() => navigate('/officer/analytics')}
              className="text-[#003624] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: CASE STATUS DISTRIBUTION */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100/80 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-sm sm:text-[16px] font-pjs font-extrabold text-gray-800 tracking-tight">Case Status Distribution</h2>
                <p className="text-[11px] text-gray-400 font-medium">Resolution workload ratio</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <PieChart size={16} />
              </div>
            </div>

            {/* Donut Chart */}
            <div className="relative w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] mx-auto my-4 sm:my-6 flex items-center justify-center">
              <svg width="170" height="170" viewBox="0 0 190 190" className="transform -rotate-90 w-full h-full">
                  <circle cx="95" cy="95" r="75" fill="none" stroke="#f1f5f9" strokeWidth="22" />
                  {(() => {
                    const circumference = 2 * Math.PI * 75;
                    const closedFrac = closedCases / safeTotal;
                    const pendingFrac = pendingCases / safeTotal;

                    const closedDash = `${closedFrac * circumference} ${circumference}`;
                    const pendingDash = `${pendingFrac * circumference} ${circumference}`;
                    const pendingOffset = -(closedFrac * circumference);

                    return (
                      <>
                        {/* Closed/Resolved Segment (Emerald) */}
                        <circle cx="95" cy="95" r="75" fill="none"
                          stroke="#10b981"
                          strokeWidth="22"
                          strokeDasharray={closedDash}
                          strokeDashoffset="0"
                          strokeLinecap="butt"
                          className="transition-all duration-1000"
                        />
                        {/* Pending Segment (Light Red) */}
                        <circle cx="95" cy="95" r="75" fill="none"
                          stroke="#fca5a5"
                          strokeWidth="22"
                          strokeDasharray={pendingDash}
                          strokeDashoffset={pendingOffset}
                          strokeLinecap="butt"
                          className="transition-all duration-1000"
                        />
                      </>
                    );
                  })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-[30px] font-pjs font-black text-slate-900 leading-none">
                  {totalCases}
                </span>
                <span className="text-[8px] sm:text-[9px] font-black text-slate-400 tracking-[0.18em] uppercase mt-1">
                  Total Cases
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 leading-tight">Closed ({closedCases})</span>
                <span className="text-[10px] font-medium text-slate-400">{closedPct}% resolved</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#fca5a5] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 leading-tight">Pending ({pendingCases})</span>
                <span className="text-[10px] font-medium text-slate-400">{pendingPct}% ongoing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════ RECENT VIOLATIONS (Mobile Card List + Desktop Table) ══════════════════════════════ */}
      <div className="mt-6 sm:mt-8 bg-white rounded-2xl sm:rounded-[2rem] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-gray-100/80 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-7 pb-4 gap-3 border-b border-gray-100">
           <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-[19px] font-pjs font-extrabold text-gray-900 leading-tight">Recent Violations</h2>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">Live Feed</span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-0.5">Campus incidents logged across active patrols</p>
           </div>
           <button 
            onClick={() => navigate('/officer/cases')}
            className="self-start sm:self-auto text-xs font-bold text-[#064e3b] bg-emerald-50 hover:bg-emerald-100 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
           >
            <span>View All Cases</span>
            <ArrowRight size={14} />
           </button>
        </div>

        {/* ── MOBILE CARD VIEW (< lg) ── */}
        <div className="lg:hidden p-4 space-y-3">
          {recent_violations.length > 0 ? (
            recent_violations.map((v) => {
              const fullName = v.student_details?.user_details?.full_name || 'System Student';
              const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
              const status = (v.status || 'OPEN').toUpperCase();
              const time = v.timestamp ? new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today';
              const dateStr = v.timestamp ? new Date(v.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
              
              const statusBadgeStyles = {
                'CLOSED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
                'DISMISSED': 'bg-slate-100 text-slate-600 border-slate-200',
                'OPEN': 'bg-rose-50 text-rose-700 border-rose-100',
                'AWAITING_DECISION': 'bg-amber-50 text-amber-700 border-amber-100',
                'DECISION_RENDERED': 'bg-indigo-50 text-indigo-700 border-indigo-100'
              };

              return (
                <div 
                  key={v.id} 
                  onClick={() => navigate('/officer/cases')}
                  className="p-4 bg-slate-50/70 hover:bg-emerald-50/40 rounded-xl border border-gray-100 transition-all active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#003624] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-pjs font-bold text-[14px] text-gray-900 truncate">{fullName}</p>
                        <p className="text-[10px] font-bold text-gray-400 tracking-tight">{v.student_details?.student_number || 'ID Pending'}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border uppercase tracking-wider shrink-0 ${statusBadgeStyles[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {status === 'CLOSED' ? 'Closed' : status === 'DISMISSED' ? 'Dismissed' : status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-200/50 text-[11px]">
                    <div className="flex items-center gap-1.5 text-gray-500 font-semibold truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                      <span className="truncate">{v.rule_details?.category || 'General Violation'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 font-medium shrink-0 ml-2">
                      <Clock size={12} />
                      <span>{dateStr} {time}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-gray-400 text-xs font-semibold">
              No recent violation logs detected.
            </div>
          )}
        </div>

        {/* ── DESKTOP TABLE VIEW (>= lg) ── */}
        <div className="hidden lg:block w-full px-6 lg:px-8 pb-6 pt-3 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">
                <th className="py-3 px-4">Student Identity</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent_violations.map((v) => {
                const fullName = v.student_details?.user_details?.full_name || 'System Student';
                const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
                const status = (v.status || 'OPEN').toUpperCase();
                const statusColors = {
                  'CLOSED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  'DISMISSED': 'bg-slate-100 text-slate-600 border-slate-200',
                  'OPEN': 'bg-rose-50 text-rose-700 border-rose-100',
                  'AWAITING_DECISION': 'bg-amber-50 text-amber-700 border-amber-100',
                  'DECISION_RENDERED': 'bg-indigo-50 text-indigo-700 border-indigo-100'
                };
                const time = v.timestamp ? new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                const date = v.timestamp ? new Date(v.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                
                return (
                  <tr 
                    key={v.id} 
                    onClick={() => navigate('/officer/cases')}
                    className="hover:bg-emerald-50/30 transition-all cursor-pointer group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-[#003624] text-white font-bold text-xs flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-pjs font-bold text-[14px] text-slate-800 leading-tight group-hover:text-[#003624] transition-colors">{fullName}</p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{v.student_details?.student_number || 'ID Pending'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-bold text-slate-700">{v.rule_details?.category || 'General Violation'}</span>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-500">
                      {date} • {time}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`inline-block px-3 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider ${statusColors[status] || 'bg-slate-100 text-slate-600'}`}>
                        {status === 'CLOSED' ? 'Closed' : status === 'DISMISSED' ? 'Dismissed' : status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {recent_violations.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-400 text-xs font-semibold">
                    No recent activity detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle, icon, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-[1.75rem] p-4 sm:p-5 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 tracking-[0.14em] uppercase truncate pr-1">
          {label}
        </span>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${iconBg} flex flex-shrink-0 items-center justify-center ${iconColor} shadow-sm group-hover:scale-110 transition-transform`}>
          <span className="material-symbols-outlined text-[15px] sm:text-[16px] font-bold">{icon}</span>
        </div>
      </div>
      <div>
        <h3 className="text-2xl sm:text-[34px] font-pjs font-black text-slate-900 tracking-tight leading-none mb-1">
          {typeof value === 'number' ? value.toString().padStart(2, '0') : value}
        </h3>
        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-tight leading-snug truncate">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function QuickActionButton({ onClick, icon, label, description }) {
  return (
    <button 
      onClick={onClick}
      className="bg-slate-50/80 group aspect-square p-3.5 sm:p-5 rounded-2xl sm:rounded-[2rem] flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2.5 transition-all duration-300 shadow-sm border border-slate-200/60 hover:bg-[#003624] hover:border-[#003624] hover:shadow-xl hover:shadow-emerald-950/20 active:scale-95 cursor-pointer"
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white shadow-sm border border-slate-200/60 flex items-center justify-center text-slate-600 group-hover:bg-white/10 group-hover:border-white/20 group-hover:text-emerald-400 transition-all duration-300">
        <span className="material-symbols-outlined text-[20px] sm:text-[24px] group-hover:scale-110 transition-transform">
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <span className="block font-pjs font-black text-[10px] sm:text-[11px] text-slate-800 tracking-wider leading-tight group-hover:text-white transition-colors">
          {label}
        </span>
        {description && (
          <span className="hidden sm:block text-[9px] font-semibold text-slate-400 group-hover:text-emerald-200/80 mt-0.5 truncate transition-colors">
            {description}
          </span>
        )}
      </div>
    </button>
  );
}
