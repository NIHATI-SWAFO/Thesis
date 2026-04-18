import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../api/config';

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_ENDPOINTS.OFFICER_DASHBOARD)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching dashboard:", err));
  }, []);

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
    <div className="max-w-[1400px] mx-auto animate-fade-in-up pb-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[28px] font-pjs font-extrabold text-[#003624] tracking-tight mb-1">SWAFO Dashboard</h1>
        <p className="text-[14px] text-gray-500 font-medium">Welcome back! Here's your overview for today.</p>
      </div>

      {/* Stat Cards - High-Fidelity Sync */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-[#f1f5f9] flex flex-col justify-between hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 group">
          <div className="flex items-start justify-between mb-8">
             <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-[24px]">gavel</span>
             </div>
             <span className="px-3 py-1 bg-red-50 text-red-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-red-100">Live Today</span>
          </div>
          <div>
            <h3 className="text-[44px] font-pjs font-black text-[#003624] tracking-tighter leading-none mb-3">{stats.violations_today.toString().padStart(2, '0')}</h3>
            <p className="text-[12px] text-slate-600 font-bold uppercase tracking-[0.1em]">Violations Recorded</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-[#f1f5f9] flex flex-col justify-between hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 group">
          <div className="flex items-start justify-between mb-8">
             <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-[24px]">folder</span>
             </div>
             <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-100">Pending</span>
          </div>
          <div>
            <h3 className="text-[44px] font-pjs font-black text-[#003624] tracking-tighter leading-none mb-3">{stats.active_cases.toString().padStart(2, '0')}</h3>
            <p className="text-[12px] text-slate-600 font-bold uppercase tracking-[0.1em]">Pending Cases</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-[#f1f5f9] flex flex-col justify-between hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 group">
          <div className="flex items-start justify-between mb-8">
             <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-[24px]">shield</span>
             </div>
             <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-100">On Patrol</span>
          </div>
          <div>
            <h3 className="text-[44px] font-pjs font-black text-[#003624] tracking-tighter leading-none mb-3">{stats.active_patrols.toString().padStart(2, '0')}</h3>
            <p className="text-[12px] text-slate-600 font-bold uppercase tracking-[0.1em]">Active Patrols</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-[#f1f5f9] flex flex-col justify-between hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 group">
          <div className="flex items-start justify-between mb-8">
             <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-[24px]">person_alert</span>
             </div>
             <span className="px-3 py-1 bg-slate-50 text-slate-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-slate-100">Flagged</span>
          </div>
          <div>
            <h3 className="text-[44px] font-pjs font-black text-[#003624] tracking-tighter leading-none mb-3">{stats.repeat_offenders.toString().padStart(2, '0')}</h3>
            <p className="text-[12px] text-slate-600 font-bold uppercase tracking-[0.1em]">Repeat Offenders</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-[18px] font-pjs font-bold text-gray-900 mb-1">Quick Actions</h2>
        <p className="text-[12px] text-gray-500 font-medium mb-4">Access frequently used features</p>
        
        <div className="grid grid-cols-4 gap-6">
          <QuickActionButton 
            onClick={() => navigate('/officer/patrol-history')}
            icon="bolt"
            label="Start Patrol"
          />
          <QuickActionButton 
            icon="qr_code_scanner"
            label="Scan Student ID"
          />
          <QuickActionButton 
            onClick={() => navigate('/officer/violations/new')}
            icon="history_edu"
            label="Record Violation"
          />
          <QuickActionButton 
            onClick={() => navigate('/officer/cases')}
            icon="menu_book"
            label="Manage Cases"
          />
        </div>
      </div>

      {/* Main Grid: Graphs & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 w-full min-h-[380px]">
        {/* Violations by Type (Progress Bars) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,54,36,0.04)] border border-gray-100/50 flex flex-col h-full">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-[18px] font-pjs font-bold text-gray-900">Violations by Type</h2>
              <div className="text-[11px] font-bold text-[#005e43] bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors hover:bg-emerald-100">
                 All Time <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </div>
           </div>

           <div className="space-y-8 flex-1 flex flex-col justify-center">
              {violations_by_type.map((v, i) => {
                const maxCount = violations_by_type[0].count;
                const percentage = (v.count / maxCount) * 100;
                const colors = ['#005e43', '#20df7a', '#62b98f', '#aeeecb', '#e8f5ef'];
                return (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[14px] font-pjs font-bold text-gray-700">{v.name}</span>
                      <span className="text-[15px] font-bold text-gray-900">{v.count}</span>
                    </div>
                    <div className="h-3 w-full bg-[#f1f3f5] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: colors[i % colors.length] }}></div>
                    </div>
                  </div>
                );
              })}
              {violations_by_type.length === 0 && <p className="text-center text-gray-400 py-10">No violations recorded yet.</p>}
           </div>
        </div>

        {/* Case Status Distribution — Donut Chart */}
        <div className="bg-[#c2ded1] rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,54,36,0.06)] flex flex-col relative h-full">
           <h2 className="text-[20px] font-pjs font-bold text-gray-900 mb-1 leading-tight">Case Status<br/>Distribution</h2>
           <p className="text-[12px] text-[#0a482e] font-semibold mb-6">Current status of all cases</p>
           
           <div className="relative w-[180px] h-[180px] mx-auto mb-8 flex items-center justify-center">
              {/* SVG Donut Chart */}
              <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                 <circle cx="90" cy="90" r="70" fill="none" stroke="#b0d4c2" strokeWidth="28" opacity="0.3" />
                 
                 {(() => {
                    let cumulativePercentage = 0;
                    const circumference = 2 * Math.PI * 70;
                    const colors = {
                      'CLOSED': '#005e43',
                      'PENDING': '#10b981'
                    };
                    
                    return status_distribution.breakdown.map((s, i) => {
                      const percentage = (s.count / status_distribution.total) * 100;
                      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = `-${(cumulativePercentage / 100) * circumference}`;
                      cumulativePercentage += percentage;
                      
                      return (
                        <circle key={i} cx="90" cy="90" r="70" fill="none" 
                          stroke={colors[s.status] || '#ccc'} 
                          strokeWidth="28"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      );
                    });
                 })()}
              </svg>

              {/* Center white circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-[95px] h-[95px] bg-white rounded-full flex flex-col items-center justify-center shadow-md">
                    <span className="text-[24px] font-pjs font-black text-[#005e43] leading-none">{status_distribution.total}</span>
                    <span className="text-[7px] font-bold text-gray-500 tracking-[0.15em] uppercase mt-1">Total Cases</span>
                 </div>
              </div>
           </div>

           <div className="space-y-4 mt-auto">
               {status_distribution.breakdown.map((s, i) => {
                 const colors = { 'CLOSED': '#005e43', 'PENDING': '#10b981' };
                 const labels = { 'CLOSED': 'Closed', 'PENDING': 'Pending' };
                 const percentage = Math.round((s.count / status_distribution.total) * 100);
                 return (
                   <div key={i} className="flex justify-between text-[13px] font-pjs font-bold text-gray-900 items-center">
                     <div className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[s.status] || '#cbd5e1' }}></div> {labels[s.status] || s.status}
                     </div>
                     <span>{percentage}%</span>
                   </div>
                 );
               })}
           </div>
        </div>
      </div>

      {/* Improved Recent Violations Table */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,54,36,0.04)] border border-gray-100/50 overflow-hidden">
        <div className="flex justify-between items-center p-8 pb-4">
           <div>
              <h2 className="text-[20px] font-pjs font-bold text-gray-900 leading-tight">Recent Violations</h2>
              <p className="text-[13px] text-gray-500 font-medium mt-1">Latest report incidents</p>
           </div>
           <button 
            onClick={() => navigate('/officer/cases')}
            className="text-[13px] font-bold text-[#006f4f] bg-emerald-50/50 hover:bg-emerald-50 px-5 py-2.5 rounded-xl transition-colors"
           >
            View All Cases
           </button>
        </div>

        <div className="w-full px-8 pb-8 pt-2">
           {/* Table Header — gray bar matching mockup */}
           <div className="grid grid-cols-5 py-3.5 px-4 rounded-lg bg-[#f0f1f3] text-[10px] font-extrabold text-[#9ca3af] uppercase tracking-[0.15em] mb-3">
              <div className="col-span-2">Student Name</div>
              <div className="col-span-1">Violation Type</div>
              <div className="col-span-1">Time</div>
              <div className="col-span-1 text-right">Status</div>
           </div>

           {/* Table Rows with Card-style Separation */}
           <div className="space-y-4">
              {recent_violations.map((v) => {
                const fullName = v.student_details?.user_details?.full_name || 'System Student';
                const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2);
                const statusColors = {
                  'CLOSED': 'bg-[#cdefda] text-[#0a5231]',
                  'OPEN': 'bg-[#fae3e3] text-[#b91c1c]',
                  'UNDER_REVIEW': 'bg-[#fae3e3] text-[#b91c1c]',
                  'APPEALED': 'bg-[#fae3e3] text-[#b91c1c]'
                };
                const statusLabels = { 
                  'CLOSED': 'Closed', 
                  'OPEN': 'Pending',
                  'UNDER_REVIEW': 'Pending',
                  'APPEALED': 'Pending'
                };
                const time = new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={v.id} className="grid grid-cols-5 items-center p-4 bg-white hover:bg-[#f8fbf9] rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all cursor-pointer">
                    <div className="col-span-2 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#e8f5ef] text-[#006f4f] font-bold text-[12px] flex items-center justify-center uppercase">{initials}</div>
                        <span className="font-pjs font-bold text-[14px] text-gray-900">{fullName}</span>
                    </div>
                    <div className="col-span-1 text-[13px] font-semibold text-gray-600 truncate pr-4">{v.rule_details?.category || 'General'}</div>
                    <div className="col-span-1 text-[13px] font-medium text-gray-500">{time}</div>
                    <div className="col-span-1 text-right">
                        <span className={`inline-block px-4 py-1.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${statusColors[v.status] || 'bg-gray-100 text-gray-500'}`}>
                          {statusLabels[v.status] || v.status}
                        </span>
                    </div>
                  </div>
                );
              })}
              {recent_violations.length === 0 && <p className="text-center text-gray-400 py-10">No recent violations.</p>}
           </div>
        </div>
      </div>

    </div>
  );
}

function QuickActionButton({ onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className="bg-[#e4e9eb] group p-8 rounded-[1.8rem] flex flex-col items-center justify-center gap-4 transition-all duration-300 transform hover:-translate-y-2 hover:bg-[#004d33] shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95 border border-transparent hover:border-emerald-600/20"
    >
      <span className="material-symbols-outlined text-[32px] text-[#003624] group-hover:text-white transition-colors duration-300">
        {icon}
      </span>
      <span className="font-pjs font-bold text-[14px] text-slate-700 group-hover:text-white transition-colors duration-300">
        {label}
      </span>
    </button>
  );
}
