import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function OfficerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in-up pb-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[28px] font-pjs font-extrabold text-[#003624] tracking-tight mb-1">SWAFO Dashboard</h1>
        <p className="text-[14px] text-gray-500 font-medium">Welcome back! Here's your overview for today.</p>
      </div>

      {/* Stat Cards - Pure white on #f2fcf8 surface */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,54,36,0.04)] border border-gray-100/50 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
             <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#009b69]">
                <span className="material-symbols-outlined text-[20px]">gavel</span>
             </div>
             <span className="px-3 py-1 bg-[#ccefde] text-[#0f603c] text-[9px] font-extrabold rounded-full uppercase tracking-widest">Active Monitoring</span>
          </div>
          <div>
            <h3 className="text-[36px] font-pjs font-black text-gray-900 leading-none mb-1">14</h3>
            <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Violations Today</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,54,36,0.04)] border border-gray-100/50 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
             <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                <span className="material-symbols-outlined text-[20px]">folder</span>
             </div>
             <span className="px-3 py-1 bg-[#ffeded] text-[#b91c1c] text-[9px] font-extrabold rounded-full uppercase tracking-widest">Requires Attention</span>
          </div>
          <div>
            <h3 className="text-[36px] font-pjs font-black text-gray-900 leading-none mb-1">31</h3>
            <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Active Cases</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,54,36,0.04)] border border-gray-100/50 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
             <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#009b69]">
                <span className="material-symbols-outlined text-[20px]">shield</span>
             </div>
             <span className="px-3 py-1 bg-[#ccefde] text-[#0f603c] text-[9px] font-extrabold rounded-full uppercase tracking-widest">On Duty</span>
          </div>
          <div>
            <h3 className="text-[36px] font-pjs font-black text-gray-900 leading-none mb-1">04</h3>
            <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Active Patrols</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,54,36,0.04)] border border-gray-100/50 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
             <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <span className="material-symbols-outlined text-[20px]">person_alert</span>
             </div>
             <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[9px] font-extrabold rounded-full uppercase tracking-widest">Flagged</span>
          </div>
          <div>
            <h3 className="text-[36px] font-pjs font-black text-gray-900 leading-none mb-1">06</h3>
            <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Repeat Offenders</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-[18px] font-pjs font-bold text-gray-900 mb-1">Quick Actions</h2>
        <p className="text-[12px] text-gray-500 font-medium mb-4">Access frequently used features</p>
        
        <div className="grid grid-cols-4 gap-6">
          <button 
            onClick={() => navigate('/officer/patrols')}
            className="bg-[#115e41] text-white p-6 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 shadow-[0_12px_30px_rgba(17,94,65,0.25)] hover:bg-[#0c4731] hover:shadow-[0_12px_30px_rgba(17,94,65,0.4)] transition-all transform hover:-translate-y-1 active:scale-95"
          >
             <span className="material-symbols-outlined text-[32px]">bolt</span>
             <span className="font-pjs font-bold text-[14px]">Start Patrol</span>
          </button>
          
          <button 
            className="bg-[#e4e9eb] text-gray-800 p-6 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 hover:bg-[#d8dfe1] transition-all transform hover:-translate-y-1 active:scale-95 shadow-sm border border-gray-200/50"
          >
             <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
             <span className="font-pjs font-bold text-[14px]">Scan Student ID</span>
          </button>
          
          <button 
            onClick={() => navigate('/officer/violations/new')}
            className="bg-[#e4e9eb] text-gray-800 p-6 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 hover:bg-[#d8dfe1] transition-all transform hover:-translate-y-1 active:scale-95 shadow-sm border border-gray-200/50"
          >
             <span className="material-symbols-outlined text-[32px]">history_edu</span>
             <span className="font-pjs font-bold text-[14px]">Record Violation</span>
          </button>

          <button 
            onClick={() => navigate('/officer/cases')}
            className="bg-[#e4e9eb] text-gray-800 p-6 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 hover:bg-[#d8dfe1] transition-all transform hover:-translate-y-1 active:scale-95 shadow-sm border border-gray-200/50"
          >
             <span className="material-symbols-outlined text-[32px]">menu_book</span>
             <span className="font-pjs font-bold text-[14px]">Manage Cases</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Graphs & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 w-full min-h-[380px]">
        {/* Violations by Type (Progress Bars) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,54,36,0.04)] border border-gray-100/50 flex flex-col h-full">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-[18px] font-pjs font-bold text-gray-900">Violations by Type</h2>
              <div className="text-[11px] font-bold text-[#005e43] bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors hover:bg-emerald-100">
                 Last 30 Days <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </div>
           </div>

           <div className="space-y-8 flex-1 flex flex-col justify-center">
              <div>
                <div className="flex justify-between items-end mb-2">
                   <span className="text-[14px] font-pjs font-bold text-gray-700">Dress Code</span>
                   <span className="text-[15px] font-bold text-gray-900">45</span>
                </div>
                <div className="h-3 w-full bg-[#f1f3f5] rounded-full overflow-hidden">
                   <div className="h-full bg-[#005e43] rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                   <span className="text-[14px] font-pjs font-bold text-gray-700">Unauthorized Area</span>
                   <span className="text-[15px] font-bold text-gray-900">28</span>
                </div>
                <div className="h-3 w-full bg-[#f1f3f5] rounded-full overflow-hidden">
                   <div className="h-full bg-[#20df7a] rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                   <span className="text-[14px] font-pjs font-bold text-gray-700">Late Night Curfew</span>
                   <span className="text-[15px] font-bold text-gray-900">12</span>
                </div>
                <div className="h-3 w-full bg-[#f1f3f5] rounded-full overflow-hidden">
                   <div className="h-full bg-[#62b98f] rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
           </div>
        </div>

        {/* Case Status Distribution — Donut Chart */}
        <div className="bg-[#c2ded1] rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,54,36,0.06)] flex flex-col relative h-full">
           <h2 className="text-[20px] font-pjs font-bold text-gray-900 mb-1 leading-tight">Case Status<br/>Distribution</h2>
           <p className="text-[12px] text-[#0a482e] font-semibold mb-6">Current status of all cases</p>
           
           <div className="relative w-[180px] h-[180px] mx-auto mb-8 flex items-center justify-center">
              {/* SVG Donut Chart */}
              <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                 {/* Background circle */}
                 <circle cx="90" cy="90" r="70" fill="none" stroke="#b0d4c2" strokeWidth="28" opacity="0.3" />
                 
                 {/* Resolved segment — 60% — dark green */}
                 {/* circumference = 2 * π * 70 ≈ 439.82 */}
                 {/* 60% of 439.82 = 263.89. gap = 175.93 */}
                 <circle cx="90" cy="90" r="70" fill="none" stroke="#005e43" strokeWidth="28"
                    strokeDasharray="263.89 439.82"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                 />
                 
                 {/* Under Review segment — 25% — blue */}
                 {/* 25% of 439.82 = 109.96. offset = -263.89 (after green) */}
                 <circle cx="90" cy="90" r="70" fill="none" stroke="#7db5f5" strokeWidth="28"
                    strokeDasharray="109.96 439.82"
                    strokeDashoffset="-263.89"
                    strokeLinecap="round"
                 />
                 
                 {/* Pending segment — 15% — pink */}
                 {/* 15% of 439.82 = 65.97. offset = -(263.89 + 109.96) = -373.85 */}
                 <circle cx="90" cy="90" r="70" fill="none" stroke="#f5c6c6" strokeWidth="28"
                    strokeDasharray="65.97 439.82"
                    strokeDashoffset="-373.85"
                    strokeLinecap="round"
                 />
              </svg>

              {/* Center white circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-[95px] h-[95px] bg-white rounded-full flex flex-col items-center justify-center shadow-md">
                    <span className="text-[24px] font-pjs font-black text-[#005e43] leading-none">124</span>
                    <span className="text-[7px] font-bold text-gray-500 tracking-[0.15em] uppercase mt-1">Total Cases</span>
                 </div>
              </div>
           </div>

           <div className="space-y-4 mt-auto">
              <div className="flex justify-between text-[13px] font-pjs font-bold text-gray-900 items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#005e43]"></div> Resolved
                 </div>
                 <span>60%</span>
              </div>
              <div className="flex justify-between text-[13px] font-pjs font-bold text-gray-900 items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#7db5f5]"></div> Under Review
                 </div>
                 <span>25%</span>
              </div>
              <div className="flex justify-between text-[13px] font-pjs font-bold text-gray-900 items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#f5c6c6]"></div> Pending
                 </div>
                 <span>15%</span>
              </div>
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
              
              <div className="grid grid-cols-5 items-center p-4 bg-white hover:bg-[#f8fbf9] rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all cursor-pointer">
                 <div className="col-span-2 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#e8f5ef] text-[#006f4f] font-bold text-[12px] flex items-center justify-center">JD</div>
                    <span className="font-pjs font-bold text-[14px] text-gray-900">John Doe</span>
                 </div>
                 <div className="col-span-1 text-[13px] font-semibold text-gray-600">Dress Code Violation</div>
                 <div className="col-span-1 text-[13px] font-medium text-gray-500">10:45 AM</div>
                 <div className="col-span-1 text-right">
                    <span className="inline-block px-4 py-1.5 bg-[#cdefda] text-[#0a5231] text-[10px] font-extrabold rounded-full uppercase tracking-wider">Resolved</span>
                 </div>
              </div>

              <div className="grid grid-cols-5 items-center p-4 bg-white hover:bg-[#f4f7fb] rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all cursor-pointer">
                 <div className="col-span-2 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#edf2fa] text-[#2f6ce6] font-bold text-[12px] flex items-center justify-center">SM</div>
                    <span className="font-pjs font-bold text-[14px] text-gray-900">Sarah Miller</span>
                 </div>
                 <div className="col-span-1 text-[13px] font-semibold text-gray-600">Unauthorized Area Access</div>
                 <div className="col-span-1 text-[13px] font-medium text-gray-500">09:12 AM</div>
                 <div className="col-span-1 text-right">
                    <span className="inline-block px-4 py-1.5 bg-[#e2eafb] text-[#1e4eb8] text-[10px] font-extrabold rounded-full uppercase tracking-wider">Under Review</span>
                 </div>
              </div>

              <div className="grid grid-cols-5 items-center p-4 bg-white hover:bg-[#fcf5f5] rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all cursor-pointer">
                 <div className="col-span-2 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#fbe7e7] text-[#dc2626] font-bold text-[12px] flex items-center justify-center">RK</div>
                    <span className="font-pjs font-bold text-[14px] text-gray-900">Robert King</span>
                 </div>
                 <div className="col-span-1 text-[13px] font-semibold text-gray-600">Late Night Curfew Violation</div>
                 <div className="col-span-1 text-[13px] font-medium text-gray-500">Yesterday, 11:30 PM</div>
                 <div className="col-span-1 text-right">
                    <span className="inline-block px-4 py-1.5 bg-[#fae3e3] text-[#b91c1c] text-[10px] font-extrabold rounded-full uppercase tracking-wider">Pending</span>
                 </div>
              </div>

           </div>
        </div>
      </div>

    </div>
  );
}
