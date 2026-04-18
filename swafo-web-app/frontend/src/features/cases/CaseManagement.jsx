import React, { useState, useMemo, useEffect } from 'react';

export default function CaseManagement() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' or 'mine'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Severity');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/violations/list/')
      .then(res => res.json())
      .then(data => {
        setViolations(Array.isArray(data) ? data : (data.results || []));
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching violations:", err);
        setLoading(false);
      });
  }, []);

  const getPriority = (v) => {
    const category = v.rule_details?.category || '';
    if (category.toLowerCase().includes('major')) return 'Major';
    if (category.toLowerCase().includes('minor')) return 'Minor';
    return 'General';
  };

  const filteredCases = useMemo(() => {
    const results = violations.filter(v => {
      const studentName = v.student_details?.user_details?.full_name || '';
      const caseId = `CAS-${new Date(v.timestamp).getFullYear()}-${v.id.toString().padStart(3, '0')}`;
      
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           caseId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const statusMap = { 'Open': 'OPEN', 'Under Review': 'UNDER_REVIEW', 'Resolved': 'RESOLVED' };
      const matchesStatus = statusFilter === 'All Status' || v.status === statusMap[statusFilter];
      
      const severity = getPriority(v);
      const matchesPriority = priorityFilter === 'All Severity' || severity === priorityFilter;
      const matchesTab = filterTab === 'all' || true; 
      
      return matchesSearch && matchesStatus && matchesPriority && matchesTab;
    });
    
    return results;
  }, [violations, searchQuery, statusFilter, priorityFilter, filterTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priorityFilter, filterTab]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCases.slice(start, start + itemsPerPage);
  }, [filteredCases, currentPage]);

  const priorityStats = useMemo(() => {
    const total = violations.length || 1;
    const high = violations.filter(v => getPriority(v) === 'Major').length;
    const medium = violations.filter(v => getPriority(v) === 'General').length;
    const low = violations.filter(v => getPriority(v) === 'Minor').length;

    return {
      high: { count: high, percent: Math.round((high / total) * 100) },
      medium: { count: medium, percent: Math.round((medium / total) * 100) },
      low: { count: low, percent: Math.round((low / total) * 100) }
    };
  }, [violations]);

  const stats = {
    total: violations.length,
    open: violations.filter(v => v.status === 'OPEN').length,
    underReview: violations.filter(v => v.status === 'UNDER_REVIEW').length,
    resolved: violations.filter(v => v.status === 'RESOLVED').length,
  };

  const exportToCSV = () => {
    const headers = ['Case ID', 'Student Name', 'Violation Type', 'Severity', 'Date', 'Status'];
    const rows = filteredCases.map(v => [
      `CAS-${new Date(v.timestamp).getFullYear()}-${v.id.toString().padStart(3, '0')}`,
      v.student_details?.user_details?.full_name || 'N/A',
      v.rule_details?.category || 'General',
      getPriority(v),
      new Date(v.timestamp).toLocaleDateString(),
      v.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SWAFO_Cases_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#003624] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-pjs font-bold text-[#003624]">Loading Case Files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up pb-10 px-4">
      <div className="flex flex-col gap-6 mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-[36px] font-pjs font-extrabold text-[#003624] tracking-tight">
            Case Management
          </h1>
          
          <div className="flex p-1.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 shadow-sm">
            <button onClick={() => setFilterTab('all')} className={`px-8 py-2.5 rounded-xl text-[14px] font-bold transition-all ${filterTab === 'all' ? 'bg-[#003624] text-white shadow-lg' : 'text-emerald-700'}`}>All Cases</button>
            <button onClick={() => setFilterTab('mine')} className={`px-8 py-2.5 rounded-xl text-[14px] font-bold transition-all ${filterTab === 'mine' ? 'bg-[#003624] text-white shadow-lg' : 'text-emerald-700'}`}>My Assignments</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12">
        {[
          { label: 'TOTAL CASES', value: stats.total, sub: 'Live Database', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600', hasIcon: true },
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
              {stat.hasIcon && <span className="material-symbols-outlined text-[16px]">database</span>}
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row items-start gap-10">
        <div className="flex-1 w-full flex flex-col gap-8">
          
          <div className="bg-[#F0F4F4]/80 p-3 rounded-[2rem] flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input type="text" placeholder="Search student name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white rounded-2xl py-3.5 pl-14 pr-4 text-[14px] font-manrope font-medium outline-none border-2 border-transparent focus:border-[#003624] transition-all shadow-sm h-[52px]" />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="bg-white px-5 rounded-2xl text-[14px] font-bold text-slate-600 h-[52px] md:w-[180px] border-2 border-transparent focus:border-[#003624] outline-none transition-all cursor-pointer"
              >
                <option>All Status</option>
                <option>Open</option>
                <option>Under Review</option>
                <option>Resolved</option>
              </select>

              <select 
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value)} 
                className="bg-white px-5 rounded-2xl text-[14px] font-bold text-slate-600 h-[52px] md:w-[180px] border-2 border-transparent focus:border-[#003624] outline-none transition-all cursor-pointer"
              >
                <option>All Severity</option>
                <option>Major</option>
                <option>Minor</option>
                <option>General</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-[0_4px_40px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-white">
              <h2 className="text-[20px] font-pjs font-bold text-[#111827]">All Cases</h2>
              <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 text-[#009b69] hover:text-[#003624] text-[14px] font-bold px-5 py-2.5 hover:bg-emerald-50 rounded-xl transition-all"
              >
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
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type / Severity</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-manrope">
                  {paginatedCases.map((v) => {
                    const studentName = v.student_details?.user_details?.full_name || 'Unknown Student';
                    const caseId = `CAS-${new Date(v.timestamp).getFullYear()}-${v.id.toString().padStart(3, '0')}`;
                    const date = new Date(v.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const severity = getPriority(v);
                    
                    return (
                      <tr key={v.id} className="group hover:bg-emerald-50/30 transition-all duration-300">
                        <td className="px-10 py-6 font-bold text-[#003624] text-[14px]">{caseId}</td>
                        <td className="px-10 py-6"><span className="text-[15px] font-bold text-[#111827]">{studentName}</span></td>
                        <td className="px-10 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-[14px] font-semibold text-slate-700 truncate max-w-[200px]">{v.rule_details?.category || 'General'}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${severity === 'Major' ? 'text-red-500' : severity === 'Minor' ? 'text-orange-500' : 'text-blue-500'}`}>
                              {severity} Offense
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-6"><span className="text-[13px] font-semibold text-slate-500">{date}</span></td>
                        <td className="px-10 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${v.status === 'OPEN' ? 'bg-orange-50 text-orange-600' : v.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:bg-[#003624] hover:text-white transition-all shadow-sm">
                            <span className="material-symbols-outlined">chevron_right</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
              <span className="text-[13px] font-semibold text-slate-400">
                Showing {Math.min(filteredCases.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredCases.length, currentPage * itemsPerPage)} of {filteredCases.length}
              </span>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 disabled:opacity-30"><span className="material-symbols-outlined text-[20px]">chevron_left</span></button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl font-bold text-[14px] ${currentPage === i + 1 ? 'bg-[#003624] text-white shadow-lg' : 'bg-white text-slate-400'}`}>{i + 1}</button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 disabled:opacity-30"><span className="material-symbols-outlined text-[20px]">chevron_right</span></button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[360px] shrink-0 flex flex-col gap-8">
          <div className="bg-[#004D33] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl group">
            <div className="absolute top-[-50%] right-[-50%] w-[150%] h-[150%] bg-[#005c3d] rounded-full opacity-40 blur-3xl"></div>
            <div className="relative z-10 flex flex-col gap-10">
              <h3 className="text-[28px] font-pjs font-bold leading-[1.1] tracking-tight">Priority<br/>Breakdown</h3>
              <div className="flex flex-col gap-8">
                <ProgressItem label="Major Violations" percent={priorityStats.high.percent} color="bg-white" />
                <ProgressItem label="Minor Violations" percent={priorityStats.low.percent} color="bg-white/60" />
                <ProgressItem label="General" percent={priorityStats.medium.percent} color="bg-white/30" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_4px_40px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <h3 className="text-[18px] font-pjs font-bold text-[#111827]">Recent Activity</h3>
              <span className="text-[11px] font-black text-[#009b69] tracking-widest uppercase">Today</span>
            </div>
            <div className="flex flex-col gap-8">
              <ActivityItem icon="add_circle" color="bg-orange-50 text-orange-600" title="New Case Recorded" sub="System Sync Active" time="Live" />
              <ActivityItem icon="check_circle" color="bg-emerald-50 text-emerald-600" title="Auto-Validation" sub="Status: Healthy" time="Now" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressItem({ label, percent, color }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between text-[11px] font-black tracking-widest uppercase opacity-60">
        <span>{label}</span>
        <span className="text-white opacity-100">{percent}%</span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function ActivityItem({ icon, color, title, sub, time }) {
  return (
    <div className="flex gap-5 items-start group cursor-pointer hover:translate-x-1 transition-transform">
      <div className={`w-11 h-11 rounded-xl ${color} flex justify-center items-center shrink-0 border border-current opacity-[0.85]`}>
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
