import React, { useState, useMemo } from 'react';

const MOCK_CASES = [
  { id: 'CAS-2024-001', student: 'John Doe', studentId: '2021-10023', type: 'Academic Dishonesty', date: '2024-04-10', priority: 'High', status: 'Open', officer: 'Officer Timothy' },
  { id: 'CAS-2024-002', student: 'Jane Smith', studentId: '2022-10542', type: 'Uniform Policy', date: '2024-04-12', priority: 'Medium', status: 'Under Review', officer: 'Officer Timothy' },
  { id: 'CAS-2024-003', student: 'Michael Brown', studentId: '2021-11204', type: 'Missing ID Card', date: '2024-04-08', priority: 'Low', status: 'Resolved', officer: 'Officer Sarah' },
  { id: 'CAS-2024-004', student: 'Emily White', studentId: '2023-10015', type: 'Late Attendance', date: '2024-04-14', priority: 'Low', status: 'Open', officer: 'Officer Timothy' },
  { id: 'CAS-2024-005', student: 'Robert Wilson', studentId: '2022-10987', type: 'Academic Dishonesty', date: '2024-04-05', priority: 'High', status: 'Resolved', officer: 'Officer Sarah' },
  { id: 'CAS-2024-006', student: 'Sarah Davis', studentId: '2024-10001', type: 'Dress Code Violation', date: '2024-04-13', priority: 'Medium', status: 'Under Review', officer: 'Officer Timothy' },
  { id: 'CAS-2024-007', student: 'David Martinez', studentId: '2023-11002', type: 'Unauthorized Entry', date: '2024-04-11', priority: 'High', status: 'Open', officer: 'Officer Sarah' },
  { id: 'CAS-2024-008', student: 'Lisa Taylor', studentId: '2021-10555', type: 'Property Damage', date: '2024-04-09', priority: 'High', status: 'Resolved', officer: 'Officer Timothy' },
  { id: 'CAS-2024-009', student: 'James Anderson', studentId: '2022-10888', type: 'Missing ID Card', date: '2024-04-14', priority: 'Low', status: 'Open', officer: 'Officer Sarah' },
  { id: 'CAS-2024-010', student: 'Rhine Castro', studentId: '2023-091237', type: 'Uniform Policy', date: '2024-04-14', priority: 'Medium', status: 'Under Review', officer: 'Officer Timothy' },
];

export default function CaseManagement() {
  const [filterTab, setFilterTab] = useState('all'); // 'all' or 'mine'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');

  const filteredCases = useMemo(() => {
    return MOCK_CASES.filter(c => {
      const matchesSearch = c.student.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
      const matchesPriority = priorityFilter === 'All Priority' || c.priority === priorityFilter;
      const matchesTab = filterTab === 'all' || c.officer === 'Officer Timothy';
      return matchesSearch && matchesStatus && matchesPriority && matchesTab;
    });
  }, [searchQuery, statusFilter, priorityFilter, filterTab]);

  const stats = {
    total: MOCK_CASES.length,
    open: MOCK_CASES.filter(c => c.status === 'Open').length,
    underReview: MOCK_CASES.filter(c => c.status === 'Under Review').length,
    resolved: MOCK_CASES.filter(c => c.status === 'Resolved').length,
  };

  return (
    <div className="animate-fade-in-up pb-10 px-4">
      {/* ══════════════ HEADER SECTION ══════════════ */}
      <div className="flex flex-col gap-6 mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-[36px] font-pjs font-extrabold text-[#003624] tracking-tight">
            Case Management
          </h1>
          
          <div className="flex p-1.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 shadow-sm">
            <button 
              onClick={() => setFilterTab('all')}
              className={`px-8 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-300 ${filterTab === 'all' ? 'bg-[#003624] text-white shadow-lg' : 'text-emerald-700 hover:bg-emerald-100/30'}`}
            >
              All Cases
            </button>
            <button 
              onClick={() => setFilterTab('mine')}
              className={`px-8 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-300 ${filterTab === 'mine' ? 'bg-[#003624] text-white shadow-lg' : 'text-emerald-700 hover:bg-emerald-100/30'}`}
            >
              My Assignments
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════ STATS CARDS - REFINED PIXEL PERFECT ══════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12">
        {[
          { label: 'TOTAL CASES', value: stats.total, sub: '12% Month', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600', hasIcon: true },
          { label: 'OPEN CASES', value: stats.open, sub: 'Action Required', badgeBg: 'bg-orange-50', badgeText: 'text-orange-600' },
          { label: 'UNDER REVIEW', value: stats.underReview, sub: 'In Progress', badgeBg: 'bg-blue-50', badgeText: 'text-blue-600' },
          { label: 'RESOLVED', value: stats.resolved, sub: 'All Clear', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-5 hover:translate-y-[-6px] hover:shadow-[0_15px_45px_rgba(0,0,0,0.04)] transition-all duration-500 w-full group"
          >
            <span className="text-[12px] font-pjs font-bold text-emerald-950/40 tracking-[0.1em] uppercase">{stat.label}</span>
            <div className="flex items-center">
               <span className="text-[52px] font-pjs font-bold text-[#003624] tracking-tighter leading-none">{stat.value}</span>
            </div>
            <div className={`w-fit px-5 py-2 rounded-full text-[12px] font-bold ${stat.badgeBg} ${stat.badgeText} flex items-center gap-2 mt-2 transition-transform duration-300 group-hover:scale-105`}>
              {stat.hasIcon && <span className="material-symbols-outlined text-[16px]">trending_up</span>}
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════ CONTENT GRID (ASYMMETRIC) ══════════════ */}
      <div className="flex flex-col xl:flex-row items-start gap-10">
        
        {/* ── LEFT COLUMN (Filter & Table) ── */}
        <div className="flex-1 w-full flex flex-col gap-8">
          
          {/* Filters Bar */}
          <div className="bg-[#F0F4F4]/80 p-3 rounded-[2rem] flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-emerald-500">search</span>
              <input 
                type="text" 
                placeholder="Search student name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white rounded-2xl py-3.5 pl-14 pr-4 text-[14px] font-manrope font-medium outline-none border-2 border-transparent focus:border-emerald-100 transition-all shadow-sm h-[52px]"
              />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white px-5 py-3 rounded-2xl text-[14px] font-bold text-slate-600 outline-none border border-transparent focus:border-emerald-100 transition-all cursor-pointer shadow-sm md:w-[150px] h-[52px] appearance-none"
              >
                <option>All Status</option>
                <option>Open</option>
                <option>Under Review</option>
                <option>Resolved</option>
              </select>

              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-white px-5 py-3 rounded-2xl text-[14px] font-bold text-slate-600 outline-none border border-transparent focus:border-emerald-100 transition-all cursor-pointer shadow-sm md:w-[150px] h-[52px] appearance-none"
              >
                <option>All Priority</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <button className="flex justify-center items-center h-[52px] w-[52px] shrink-0 bg-[#003624] text-white rounded-2xl hover:scale-105 hover:bg-[#004d33] transition-all shadow-lg active:scale-95">
                <span className="material-symbols-outlined text-[24px]">tune</span>
              </button>
            </div>
          </div>

          {/* Main Data Table Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-[0_4px_40px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
            {/* Header + Export */}
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-white">
              <h2 className="text-[20px] font-pjs font-bold text-[#111827]">All Cases</h2>
              <button className="flex items-center gap-2 text-[#009b69] hover:text-[#003624] text-[14px] font-bold transition-all px-4 py-2 hover:bg-emerald-50 rounded-xl">
                <span className="material-symbols-outlined text-[20px]">file_download</span>
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Case ID</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Violation Type</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-manrope">
                  {filteredCases.map((c) => (
                    <tr key={c.id} className="group hover:bg-emerald-50/30 transition-all duration-300">
                      <td className="px-10 py-6 font-bold text-[#003624] text-[14px] whitespace-nowrap">
                        {c.id}
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-[#111827]">{c.student}</span>
                          <span className="text-[12px] font-medium text-slate-400">ID: {c.studentId}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex justify-center items-center shrink-0">
                            <span className="material-symbols-outlined text-[16px] text-slate-500">assignment</span>
                          </div>
                          <span className="text-[14px] font-semibold text-slate-700">{c.type}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-[13px] font-semibold text-slate-500 whitespace-nowrap">{c.date}</span>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          c.status === 'Open' ? 'bg-orange-50 text-orange-600' :
                          c.status === 'Under Review' ? 'bg-blue-50 text-blue-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:bg-[#003624] hover:text-white transition-all shadow-sm">
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCases.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-10 py-20 text-center">
                        <span className="text-slate-400 text-[14px] font-medium">No cases found matching your criteria.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
              <span className="text-[13px] font-semibold text-slate-400">
                Showing entries 1-4 of {filteredCases.length}
              </span>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button className="w-10 h-10 rounded-xl bg-[#003624] text-white flex items-center justify-center font-bold text-[14px] shadow-lg">
                  1
                </button>
                <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Side Sidebar) ── */}
        <div className="w-full xl:w-[360px] shrink-0 flex flex-col gap-8">
          
          {/* Priority Breakdown Card */}
          <div className="bg-[#004D33] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/20 group">
            <div className="absolute top-[-50%] right-[-50%] w-[150%] h-[150%] bg-[#005c3d] rounded-full opacity-40 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
            
            <div className="relative z-10 flex flex-col gap-10">
              <h3 className="text-[28px] font-pjs font-bold leading-[1.1] tracking-tight">Priority<br/>Breakdown</h3>
              
              <div className="flex flex-col gap-8">
                {/* High Priority */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-[11px] font-black tracking-widest uppercase opacity-60">
                    <span>High Priority</span>
                    <span className="text-white opacity-100">33%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full w-[33%] shadow-[0_0_10px_rgba(255,255,255,0.4)]"></div>
                  </div>
                </div>
                {/* Medium Priority */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-[11px] font-black tracking-widest uppercase opacity-60">
                    <span>Medium Priority</span>
                    <span className="text-white opacity-100">33%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white/60 rounded-full w-[33%]"></div>
                  </div>
                </div>
                {/* Low Priority */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-[11px] font-black tracking-widest uppercase opacity-60">
                    <span>Low Priority</span>
                    <span className="text-white opacity-100">33%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white/30 rounded-full w-[33%]"></div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10">
                <p className="text-[14px] font-bold leading-relaxed opacity-80 font-manrope">
                  "2 urgent cases pending reviewer assignment. Recommended to prioritize SW-8104."
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_4px_40px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <h3 className="text-[18px] font-pjs font-bold text-[#111827]">Recent Activity</h3>
              <span className="text-[11px] font-black text-[#009b69] tracking-widest uppercase">Today</span>
            </div>

            <div className="flex flex-col gap-8">
              <ActivityItem icon="add_circle" color="bg-orange-50 text-orange-600" title="New Case Recorded" sub="Rhine Castro (Uniform Policy)" time="10:42 AM" />
              <ActivityItem icon="edit" color="bg-blue-50 text-blue-500" title="Status Updated" sub="Molly Cute → Under Review" time="09:15 AM" />
              <ActivityItem icon="check_circle" color="bg-emerald-50 text-emerald-600" title="Case Resolved" sub="Tim Bennett (Missing ID Card)" time="Yesterday" fade />
            </div>

            <button className="w-full mt-2 py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[12px] font-bold text-slate-400 hover:text-[#003624] hover:border-[#003624]/20 hover:bg-slate-50 transition-all uppercase tracking-widest bg-transparent">
              View Audit Log
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function ActivityItem({ icon, color, title, sub, time, fade }) {
  return (
    <div className={`flex gap-5 items-start ${fade ? 'opacity-50' : ''} group cursor-pointer hover:translate-x-1 transition-transform`}>
      <div className={`w-11 h-11 rounded-xl ${color} flex justify-center items-center shrink-0 border border-current opacity-[0.85] shadow-sm`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[14px] font-bold text-[#111827] leading-tight">{title}</span>
        <span className="text-[13px] font-medium text-slate-400 leading-tight mt-1">{sub}</span>
        <span className="text-[11px] font-semibold text-slate-300 mt-2 uppercase tracking-wide">{time}</span>
      </div>
    </div>
  );
}
