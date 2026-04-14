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
    <div className="animate-fade-in-up pb-10">
      {/* ══════════════ HEADER SECTION ══════════════ */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-[32px] font-pjs font-extrabold text-[#003624] tracking-tight">
            Case Management
          </h1>
          
          <div className="flex p-1 bg-emerald-50/50 rounded-xl border border-emerald-100/50 shadow-sm">
            <button 
              onClick={() => setFilterTab('all')}
              className={`px-6 py-2 rounded-lg text-[13px] font-bold transition-all ${filterTab === 'all' ? 'bg-[#003624] text-white shadow-md' : 'text-emerald-700 hover:bg-emerald-100/50'}`}
            >
              All Cases
            </button>
            <button 
              onClick={() => setFilterTab('mine')}
              className={`px-6 py-2 rounded-lg text-[13px] font-bold transition-all ${filterTab === 'mine' ? 'bg-[#003624] text-white shadow-md' : 'text-emerald-700 hover:bg-emerald-100/50'}`}
            >
              My Assignments
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════ STATS CARDS ══════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'TOTAL CASES', value: stats.total, sub: '12% Month', color: 'border-slate-200', icon: 'folder' },
          { label: 'OPEN CASES', value: stats.open, sub: 'Action Required', color: 'border-red-400', icon: 'error_outline', textColor: 'text-red-600' },
          { label: 'UNDER REVIEW', value: stats.underReview, sub: 'In Progress', color: 'border-amber-400', icon: 'pending_actions', textColor: 'text-amber-600' },
          { label: 'RESOLVED', value: stats.resolved, sub: 'All Clear', color: 'border-emerald-400', icon: 'check_circle_outline', textColor: 'text-emerald-600' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className={`bg-white p-6 rounded-2xl border-b-4 ${stat.color} shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-2 hover:translate-y-[-4px] transition-all duration-300 w-full`}
          >
            <span className="text-[10px] font-pjs font-black text-gray-400 tracking-[0.15em] uppercase">{stat.label}</span>
            <div className="flex items-end justify-between">
               <span className="text-3xl font-pjs font-extrabold text-[#003624]">{stat.value}</span>
               <span className="material-symbols-outlined text-gray-300 text-[24px]">{stat.icon}</span>
            </div>
            <div className={`text-[11px] font-bold ${stat.textColor || 'text-emerald-500'} flex items-center gap-1 mt-1`}>
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════ CONTENT GRID (ASYMMETRIC) ══════════════ */}
      <div className="flex flex-col xl:flex-row items-start gap-6">
        
        {/* ── LEFT COLUMN (Filter & Table) ── */}
        <div className="flex-1 w-full flex flex-col gap-6">
          
          {/* Filters Bar */}
          <div className="bg-[#F0F4F4] p-2.5 rounded-2xl flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-emerald-500">search</span>
              <input 
                type="text" 
                placeholder="Search student name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white rounded-xl py-2.5 pl-12 pr-4 text-[13px] font-manrope font-medium outline-none border border-white focus:border-emerald-200 focus:ring-1 focus:ring-emerald-200 transition-all shadow-sm h-[44px]"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 outline-none border border-transparent focus:border-emerald-200 transition-all cursor-pointer shadow-sm md:w-[130px] h-[44px]"
              >
                <option>All Status</option>
                <option>Open</option>
                <option>Under Review</option>
                <option>Resolved</option>
              </select>

              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-white px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 outline-none border border-transparent focus:border-emerald-200 transition-all cursor-pointer shadow-sm md:w-[130px] h-[44px]"
              >
                <option>All Priority</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <button className="flex justify-center items-center h-[44px] w-[44px] shrink-0 bg-[#D1FAE5] text-emerald-700 rounded-xl hover:bg-emerald-200 transition-all shadow-sm">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
            </div>
          </div>

          {/* Main Data Table Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
            {/* Header + Export */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-[18px] font-pjs font-bold text-[#0f172a]">All Cases</h2>
              <button className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-800 text-[13px] font-bold transition-colors">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Case ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Violation Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/80 font-manrope">
                  {filteredCases.map((c) => (
                    <tr key={c.id} className="group hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#003624] text-[13px] whitespace-nowrap">
                        {c.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-slate-800">{c.student}</span>
                          <span className="text-[11px] font-semibold text-slate-400">ID: {c.studentId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex justify-center items-center shrink-0">
                            <span className="material-symbols-outlined text-[13px] text-slate-500">assignment</span>
                          </div>
                          <span className="text-[13px] font-semibold text-slate-700">{c.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[12px] font-semibold text-slate-500 whitespace-nowrap">{c.date}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          c.status === 'Open' ? 'bg-red-50 text-red-600' :
                          c.status === 'Under Review' ? 'bg-amber-50 text-amber-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-[12px] font-bold text-slate-400 hover:text-[#003624] hover:underline transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                          View Case
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCases.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <span className="text-slate-400 text-[13px] font-medium">No cases found matching your criteria.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/40">
              <span className="text-[12px] font-semibold text-slate-500">
                Showing 1 to {filteredCases.length} of {filteredCases.length} entries
              </span>
              <div className="flex gap-1">
                <button className="w-8 h-8 rounded-lg bg-slate-200/50 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button className="w-8 h-8 rounded-lg bg-[#003624] text-white flex items-center justify-center font-bold text-[13px]">
                  1
                </button>
                <button className="w-8 h-8 rounded-lg bg-slate-200/50 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Side Sidebar) ── */}
        <div className="w-full xl:w-[320px] shrink-0 flex flex-col gap-6">
          
          {/* Priority Breakdown Card */}
          <div className="bg-[#007D54] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-emerald-900/20">
            {/* Soft Spotlight Overlay via pseudo or inline div */}
            <div className="absolute top-[-50%] right-[-50%] w-[150%] h-[150%] bg-[#008a5e] rounded-full opacity-60 blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col gap-6">
              <h3 className="text-[18px] font-pjs font-bold leading-[1.3]">Priority<br/>Breakdown</h3>
              
              <div className="flex flex-col gap-5">
                {/* High Priority */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] font-black tracking-widest uppercase opacity-90">
                    <span>High Priority</span>
                    <span>33%</span>
                  </div>
                  <div className="h-1.5 w-full bg-emerald-800/60 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full w-[33%]"></div>
                  </div>
                </div>
                {/* Medium Priority */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] font-black tracking-widest uppercase opacity-90">
                    <span>Medium Priority</span>
                    <span>33%</span>
                  </div>
                  <div className="h-1.5 w-full bg-emerald-800/60 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full w-[33%]"></div>
                  </div>
                </div>
                {/* Low Priority */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] font-black tracking-widest uppercase opacity-90">
                    <span>Low Priority</span>
                    <span>33%</span>
                  </div>
                  <div className="h-1.5 w-full bg-emerald-800/60 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full w-[33%]"></div>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-[#129167]">
                <p className="text-[12px] font-medium leading-relaxed opacity-90 font-manrope">
                  "2 urgent cases pending reviewer assignment. Recommended to prioritize SW-8104."
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[16px] font-pjs font-bold text-[#0f172a]">Recent Activity</h3>
              <span className="text-[10px] font-black text-emerald-600 tracking-widest uppercase">Today</span>
            </div>

            <div className="flex flex-col gap-6">
              {/* Event 1 */}
              <div className="flex gap-4 items-start">
                <div className="w-[34px] h-[34px] rounded-full bg-emerald-50 flex justify-center items-center shrink-0 border border-emerald-100/50">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">add_circle</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-800 leading-snug">New Case Recorded</span>
                  <span className="text-[12px] font-medium text-slate-500 leading-snug mt-0.5">Rhine Castro (Uniform Policy)</span>
                  <span className="text-[11px] font-semibold text-slate-400 mt-1">10:42 AM</span>
                </div>
              </div>
              
              {/* Event 2 */}
              <div className="flex gap-4 items-start">
                <div className="w-[34px] h-[34px] rounded-full bg-blue-50 flex justify-center items-center shrink-0 border border-blue-100/50">
                  <span className="material-symbols-outlined text-[16px] text-blue-500">edit</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-800 leading-snug">Status Updated</span>
                  <span className="text-[12px] font-medium text-slate-500 leading-snug mt-0.5">Molly Cute → Under Review</span>
                  <span className="text-[11px] font-semibold text-slate-400 mt-1">09:15 AM</span>
                </div>
              </div>

              {/* Event 3 */}
              <div className="flex gap-4 items-start opacity-[0.65]">
                <div className="w-[34px] h-[34px] rounded-full bg-slate-100 flex justify-center items-center shrink-0 border border-slate-200/50">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-800 leading-snug">Case Resolved</span>
                  <span className="text-[12px] font-medium text-slate-500 leading-snug mt-0.5">Tim Bennett (Missing ID Card)</span>
                  <span className="text-[11px] font-semibold text-slate-400 mt-1">Yesterday</span>
                </div>
              </div>
            </div>

            <button className="w-full mt-2 py-3 border border-dashed border-slate-300 rounded-xl text-[11px] font-bold text-slate-500 hover:text-[#003624] hover:border-[#003624] transition-all uppercase tracking-widest bg-transparent">
              View Audit Log
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
