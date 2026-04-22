import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../api/config';
import { ChevronDown, BarChart2, PieChart } from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = user?.email 
      ? `${API_ENDPOINTS.OFFICER_DASHBOARD}?email=${user.email}`
      : API_ENDPOINTS.OFFICER_DASHBOARD;
      
    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (json.error) {
           console.error("Dashboard API Error:", json.error);
           setLoading(false);
           return;
        }
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching dashboard:", err);
        setLoading(false);
      });
  }, [user]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#003624] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-pjs font-bold text-[#003624]">Loading Dashboard Analytics...</p>
        </div>
      </div>
    );
  }

  const { stats, violations_by_type, status_distribution, recent_violations } = data;

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in-up pb-12 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[32px] font-pjs font-extrabold text-[#111827] tracking-tight mb-1">Welcome back!</h1>
        <p className="text-[15px] text-gray-500 font-medium">Here's your overview for today.</p>
      </div>

      {/* ══════════════════════════════ STAT CARDS ROW ══════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard 
          label="LIVE TODAY"
          value={stats.violations_today}
          subtitle="New Violations Today"
          icon="warning"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard 
          label="PENDING"
          value={stats.active_cases}
          subtitle="Total Pending Cases"
          icon="assignment"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard 
          label="ON PATROL"
          value={stats.active_patrols}
          subtitle="Active Patrol Sessions"
          icon="radio_button_checked"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <StatCard 
          label="MY WORKLOAD"
          value={stats.my_workload || 0}
          subtitle="My Assigned Cases"
          icon="person"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* ══════════════════════════════ MAIN BENTO GRID ══════════════════════════════ */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: QUICK ACTIONS (4-SQUARE GRID) */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
          <QuickActionButton 
            onClick={() => navigate('/officer/patrols')}
            icon="ads_click"
            label="START PATROL"
          />
          <QuickActionButton 
            onClick={() => navigate('/officer/patrol-history')}
            icon="history"
            label="VIEW HISTORY"
          />
          <QuickActionButton 
            onClick={() => navigate('/officer/violations/new')}
            icon="edit_note"
            label="RECORD VIOLATION"
          />
          <QuickActionButton 
            onClick={() => navigate('/officer/cases')}
            icon="folder_open"
            label="MANAGE CASES"
          />
        </div>

        {/* MIDDLE COLUMN: VIOLATIONS BY TYPE */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[2.5rem] p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100/80">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-[17px] font-pjs font-black text-gray-800 tracking-tight">Violations by Type</h2>
            <BarChart2 size={18} className="text-slate-300" />
          </div>

          <div className="space-y-7">
            {violations_by_type.slice(0, 4).map((v, i) => {
              const maxCount = violations_by_type[0].count;
              const percentage = (v.count / maxCount) * 100;
              const colors = ['#064e3b', '#059669', '#10b981', '#34d399'];
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{v.name}</span>
                    <span className="text-[14px] font-bold text-slate-900">{v.count}</span>
                  </div>
                  <div className="h-[7px] w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: colors[i % colors.length] }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: CASE STATUS DISTRIBUTION */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[2.5rem] p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100/80">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[17px] font-pjs font-black text-gray-800 tracking-tight">Case Status Distribution</h2>
          </div>

          <div className="relative w-[190px] h-[190px] mx-auto my-10 flex items-center justify-center">
            <svg width="190" height="190" viewBox="0 0 190 190" className="transform -rotate-90">
                <circle cx="95" cy="95" r="75" fill="none" stroke="#f1f5f9" strokeWidth="22" />
                {(() => {
                  const total = status_distribution.total;
                  // Handle inconsistent backend labels (RESOLVED vs CLOSED)
                  const closed = status_distribution.breakdown.find(s => 
                    s.status.toUpperCase() === 'RESOLVED' || s.status.toUpperCase() === 'CLOSED'
                  )?.count || 0;
                  const pending = total - closed;
                  const circumference = 2 * Math.PI * 75;
                  
                  const closedPct = (closed / total) * 100;
                  const pendingPct = (pending / total) * 100;
                  
                  const closedDash = `${(closedPct / 100) * circumference} ${circumference}`;
                  const pendingDash = `${(pendingPct / 100) * circumference} ${circumference}`;
                  const pendingOffset = `-${(closedPct / 100) * circumference}`;

                  return (
                    <>
                      {/* Pending Segment (Light Red) */}
                      {pending > 0 && (
                        <circle cx="95" cy="95" r="75" fill="none" 
                          stroke="#fca5a5" 
                          strokeWidth="22"
                          strokeDasharray={pendingDash}
                          strokeDashoffset={pendingOffset}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      )}
                      {/* Closed Segment (Emerald) */}
                      {closed > 0 && (
                        <circle cx="95" cy="95" r="75" fill="none" 
                          stroke="#10b981" 
                          strokeWidth="22"
                          strokeDasharray={closedDash}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      )}
                    </>
                  );
                })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[32px] font-pjs font-black text-slate-900 leading-none">{status_distribution.total}</span>
              <span className="text-[8px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1">Total Cases</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-auto">
              {(() => {
                const total = status_distribution.total;
                const closed = status_distribution.breakdown.find(s => 
                  s.status.toUpperCase() === 'RESOLVED' || s.status.toUpperCase() === 'CLOSED'
                )?.count || 0;
                const pending = total - closed;
                const closedPct = Math.round((closed / total) * 100);
                const pendingPct = Math.round((pending / total) * 100);

                return (
                  <>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                        <span className="text-[12px] font-bold text-slate-700">Closed</span>
                      </div>
                      <span className="text-[13px] font-medium text-slate-400 ml-4.5">({closedPct}%)</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#fca5a5]"></div>
                        <span className="text-[12px] font-bold text-slate-700">Pending</span>
                      </div>
                      <span className="text-[13px] font-medium text-slate-400 ml-4.5">({pendingPct}%)</span>
                    </div>
                  </>
                );
              })()}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════ RECENT VIOLATIONS TABLE ══════════════════════════════ */}
      <div className="mt-10 bg-white rounded-[2.5rem] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-gray-100/80 overflow-hidden">
        <div className="flex justify-between items-center p-10 pb-4">
           <div>
              <h2 className="text-[20px] font-pjs font-black text-gray-900 leading-tight">Recent Violations</h2>
              <p className="text-[13px] text-gray-400 font-bold uppercase tracking-widest mt-1">Institutional Live Feed</p>
           </div>
           <button 
            onClick={() => navigate('/officer/cases')}
            className="text-[13px] font-bold text-[#064e3b] bg-emerald-50 hover:bg-emerald-100 px-6 py-3 rounded-2xl transition-all active:scale-95"
           >
            View All Cases
           </button>
        </div>

        <div className="w-full px-10 pb-10 pt-4">
           {/* Table Header */}
           <div className="grid grid-cols-5 py-4 px-6 rounded-2xl bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              <div className="col-span-2">Student Identity</div>
              <div className="col-span-1">Classification</div>
              <div className="col-span-1">Timestamp</div>
              <div className="col-span-1 text-right">Status</div>
           </div>

           {/* Table Rows */}
           <div className="space-y-3">
              {recent_violations.map((v) => {
                const fullName = v.student_details?.user_details?.full_name || 'System Student';
                const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2);
                const statusColors = {
                  'RESOLVED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  'OPEN': 'bg-red-50 text-red-700 border-red-100',
                  'UNDER_REVIEW': 'bg-amber-50 text-amber-700 border-amber-100'
                };
                const time = new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={v.id} className="grid grid-cols-5 items-center p-5 bg-white hover:bg-emerald-50/30 rounded-2xl border border-gray-100/60 shadow-sm transition-all cursor-pointer group">
                    <div className="col-span-2 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-[#064e3b] text-white font-bold text-[13px] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">{initials}</div>
                        <div className="flex flex-col">
                            <span className="font-pjs font-bold text-[15px] text-slate-800">{fullName}</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{v.student_details?.student_number}</span>
                        </div>
                    </div>
                    <div className="col-span-1">
                        <span className="text-[13px] font-black text-slate-600 uppercase tracking-tighter">{v.rule_details?.category || 'General'}</span>
                    </div>
                    <div className="col-span-1 text-[13px] font-bold text-slate-400">{time}</div>
                    <div className="col-span-1 text-right">
                        <span className={`inline-block px-4 py-2 text-[10px] font-black rounded-xl border uppercase tracking-wider ${statusColors[v.status] || 'bg-slate-100 text-slate-600'}`}>
                          {v.status === 'RESOLVED' ? 'Closed' : 'Pending'}
                        </span>
                    </div>
                  </div>
                );
              })}
              {recent_violations.length === 0 && <p className="text-center text-gray-400 py-10">No recent activity detected.</p>}
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle, icon, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative flex flex-col justify-between overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <span className="text-[10px] font-black text-slate-400 tracking-[0.15em] uppercase">{label}</span>
        <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center ${iconColor} shadow-sm`}>
          <span className="material-symbols-outlined text-[18px] font-bold">{icon}</span>
        </div>
      </div>
      <div>
        <h3 className="text-[44px] font-pjs font-black text-slate-900 tracking-tighter leading-none mb-1">{value.toString().padStart(2, '0')}</h3>
        <p className="text-[13px] font-bold text-slate-800 tracking-tight">{subtitle}</p>
      </div>
    </div>
  );
}

function QuickActionButton({ onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className="bg-slate-100 group aspect-square p-6 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 transition-all duration-500 shadow-sm border border-slate-200/50 hover:bg-[#064e3b] hover:shadow-2xl hover:shadow-emerald-900/40 active:scale-95 group"
    >
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-1 group-hover:bg-white/10 group-hover:text-white transition-all duration-500">
        <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform duration-500">
          {icon}
        </span>
      </div>
      <span className="font-pjs font-black text-[11px] text-slate-800 tracking-wider leading-tight group-hover:text-white transition-colors duration-500">
        {label}
      </span>
    </button>
  );
}
