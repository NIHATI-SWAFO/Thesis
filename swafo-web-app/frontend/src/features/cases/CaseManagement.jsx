import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../api/config';

export default function CaseManagement() {
  const { user } = useAuth();
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
    fetch(API_ENDPOINTS.VIOLATIONS_LIST)
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
      const caseId = `#CS-${v.id.toString().padStart(5, '0')}`;
      
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           caseId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const statusMap = { 'Open': 'OPEN', 'Under Review': 'UNDER_REVIEW', 'Pending': 'PENDING', 'Resolved': 'RESOLVED' };
      const matchesStatus = statusFilter === 'All Status' || v.status === statusMap[statusFilter];
      
      const severity = getPriority(v);
      const matchesPriority = priorityFilter === 'All Severity' || severity === priorityFilter;
      
      // Assignment Filter: If 'mine' tab is active, only show cases assigned to current officer
      const matchesTab = filterTab === 'all' || (v.assigned_to_details?.email === user?.email);
      
      return matchesSearch && matchesStatus && matchesPriority && matchesTab;
    });
    
    return results;
  }, [violations, searchQuery, statusFilter, priorityFilter, filterTab, user]);

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

  const [selectedCase, setSelectedCase] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = (caseId, newStatus) => {
    setIsUpdating(true);
    fetch(API_ENDPOINTS.VIOLATIONS_UPDATE_STATUS(caseId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(updated => {
      setViolations(prev => prev.map(v => v.id === caseId ? { ...v, status: newStatus } : v));
      // Sync modal state
      setSelectedCase(prev => prev ? { ...prev, status: newStatus } : null);
      setIsUpdating(false);
    })
    .catch(err => {
      console.error("Update error:", err);
      setIsUpdating(false);
    });
  };

  const handleClaimCase = (caseId) => {
    setIsUpdating(true);
    fetch(API_ENDPOINTS.VIOLATIONS_ASSIGN(caseId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user?.email })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const assignment = { email: user?.email, full_name: user?.name || 'System Officer' };
        setViolations(prev => prev.map(v => 
          v.id === caseId 
            ? { ...v, assigned_to_details: assignment, status: 'UNDER_REVIEW' } 
            : v
        ));
        // Sync modal state
        setSelectedCase(prev => prev ? { ...prev, assigned_to_details: assignment, status: 'UNDER_REVIEW' } : null);
      }
      setIsUpdating(false);
    })
    .catch(err => {
      console.error("Assignment error:", err);
      setIsUpdating(false);
    });
  };

  const exportToCSV = () => {
    const headers = ['Case ID', 'Student Name', 'Violation Type', 'Severity', 'Date', 'Status'];
    const rows = filteredCases.map(v => [
      `#CS-${v.id.toString().padStart(5, '0')}`,
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

      {/* ── DYNAMIC METRIC CALCULATIONS ── */}
      {(() => {
        const now = new Date();
        const thisMonthCases = violations.filter(v => new Date(v.timestamp).getMonth() === now.getMonth()).length;
        const lastMonthCases = violations.filter(v => new Date(v.timestamp).getMonth() === (now.getMonth() - 1 + 12) % 12).length;
        const growth = lastMonthCases === 0 ? (thisMonthCases > 0 ? 100 : 0) : Math.round(((thisMonthCases - lastMonthCases) / lastMonthCases) * 100);
        
        const majorUnderReview = violations.filter(v => v.status === 'UNDER_REVIEW' && getPriority(v) === 'Major').length;
        const resolutionRate = stats.total === 0 ? 0 : Math.round((stats.resolved / stats.total) * 100);
        const openLoad = stats.total === 0 ? 0 : Math.round((stats.open / stats.total) * 100);

        return (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12">
            {/* Card 1: Total Cases */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-4 hover:translate-y-[-4px] transition-all duration-300">
              <span className="text-[12px] font-pjs font-black text-slate-400 tracking-widest uppercase">TOTAL CASES</span>
              <span className="text-[52px] font-pjs font-bold text-[#003624] leading-none tracking-tighter">{stats.total.toLocaleString()}</span>
              <div className={`flex items-center gap-2 font-black text-[13px] mt-2 ${growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                <span className="material-symbols-outlined text-[20px]">{growth >= 0 ? 'trending_up' : 'trending_down'}</span>
                {growth >= 0 ? `+${growth}%` : `${growth}%`} from last month
              </div>
            </div>

            {/* Card 2: Open Cases */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-4 hover:translate-y-[-4px] transition-all duration-300">
              <span className="text-[12px] font-pjs font-black text-slate-400 tracking-widest uppercase">OPEN CASES</span>
              <span className="text-[52px] font-pjs font-bold text-[#003624] leading-none tracking-tighter">{stats.open.toLocaleString()}</span>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-emerald-700 rounded-full transition-all duration-1000" style={{ width: `${openLoad}%` }}></div>
              </div>
            </div>

            {/* Card 3: Under Review */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-4 hover:translate-y-[-4px] transition-all duration-300">
              <span className="text-[12px] font-pjs font-black text-slate-400 tracking-widest uppercase">UNDER REVIEW</span>
              <span className="text-[52px] font-pjs font-bold text-[#003624] leading-none tracking-tighter">{stats.underReview.toLocaleString()}</span>
              <div className={`flex items-center gap-2 font-black text-[13px] mt-2 ${majorUnderReview > 0 ? 'text-red-500' : 'text-emerald-600/60'}`}>
                <span className="material-symbols-outlined text-[20px]">{majorUnderReview > 0 ? 'warning' : 'visibility'}</span>
                {majorUnderReview > 0 ? `${majorUnderReview} High Priority` : 'System Clear'}
              </div>
            </div>

            {/* Card 4: Resolved */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-4 hover:translate-y-[-4px] transition-all duration-300">
              <span className="text-[12px] font-pjs font-black text-slate-400 tracking-widest uppercase">RESOLVED</span>
              <span className="text-[52px] font-pjs font-bold text-[#003624] leading-none tracking-tighter">{stats.resolved.toLocaleString()}</span>
              <div className="flex items-center gap-2 text-emerald-600 font-black text-[13px] mt-2">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                {resolutionRate}% Resolution Rate
              </div>
            </div>
          </div>
        );
      })()}

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
                <option>Pending</option>
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
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type & Severity</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Logged</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-manrope">
                  {paginatedCases.map((v) => {
                    const studentName = v.student_details?.user_details?.full_name || 'Unknown Student';
                    const caseId = `#CS-${v.id.toString().padStart(5, '0')}`;
                    const date = new Date(v.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const time = new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const severity = getPriority(v);
                    const isResolved = v.status === 'RESOLVED';
                    
                    return (
                      <tr key={v.id} className="group hover:bg-emerald-50/20 transition-all duration-300">
                        <td className="px-10 py-8 font-black text-[#009b69] text-[14px]">{caseId}</td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#009b69] flex items-center justify-center font-bold text-[13px] border border-emerald-100">
                               {studentName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[15px] font-bold text-[#111827] leading-tight">{studentName}</span>
                               <span className="text-[11px] font-medium text-slate-400 mt-0.5">ID: {v.student_details?.student_number}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex flex-col gap-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${severity === 'Major' ? 'text-red-500' : severity === 'Minor' ? 'text-[#009b69]' : 'text-orange-500'}`}>
                              {severity}
                            </span>
                            <span className="text-[14px] font-bold text-slate-700 truncate max-w-[200px]">{(v.rule_details?.category || 'General Violation').replace(/^(Major|Minor|General)\s*[—\-]\s*/i, '')}</span>
                            {v.requires_director_decision && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-[14px] text-rose-500 fill-1">gavel</span>
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Director Decision Required</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                           <div className="flex flex-col">
                              <span className="text-[14px] font-bold text-slate-700">{date}</span>
                              <span className="text-[11px] font-medium text-slate-400">{time}</span>
                           </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                            v.status === 'OPEN' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                            v.status === 'UNDER_REVIEW' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                            v.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20'
                          }`}>
                            {v.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <button 
                            onClick={() => setSelectedCase(v)}
                            className="text-[13px] font-bold text-[#003624] hover:text-[#009b69] transition-all flex items-center gap-1 ml-auto"
                          >
                            {isResolved ? 'View Case' : 'Manage Details'}
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
              {violations.slice(0, 3).map((v, i) => {
                const severity = getPriority(v);
                const timeStr = new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = new Date(v.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                
                return (
                  <ActivityItem 
                    key={v.id}
                    icon={severity === 'Major' ? 'priority_high' : 'add_circle'} 
                    color={severity === 'Major' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'} 
                    title={v.student_details?.user_details?.full_name || 'New Case'} 
                    sub={`${(v.rule_details?.category || 'General').replace(/^(Major|Minor|General)\s*[—\-]\s*/i, '')} — ${v.status.replace('_', ' ')}`} 
                    time={`${dateStr}, ${timeStr}`} 
                  />
                );
              })}
              {violations.length === 0 && (
                <p className="text-[13px] text-slate-400 font-medium italic text-center py-4">No recent activity found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {selectedCase && (
        <CaseDetailModal 
          caseData={selectedCase} 
          onClose={() => setSelectedCase(null)} 
          onUpdate={handleStatusUpdate}
          onClaim={handleClaimCase}
          isUpdating={isUpdating}
          currentUser={user}
        />
      )}
    </div>
  );
}

function CaseDetailModal({ caseData, onClose, onUpdate, onClaim, isUpdating, currentUser }) {
  const caseId = `CAS-${new Date(caseData.timestamp).getFullYear()}-${caseData.id.toString().padStart(3, '0')}`;
  const date = new Date(caseData.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const time = new Date(caseData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isUnassigned = !caseData.assigned_to_details;
  const isAssignedToMe = caseData.assigned_to_details?.email === currentUser?.email;
  const isResolved = caseData.status === 'RESOLVED';

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-emerald-950/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[2.5rem] w-full max-w-[800px] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.3)] border border-white/20 animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="bg-[#003624] p-10 pb-8 text-white relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-1">Case ID</p>
              <p className="text-[18px] font-bold text-emerald-400">#{caseId}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest ${caseData.status === 'OPEN' ? 'bg-orange-500/20 text-orange-300' : isResolved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
                {caseData.status}
              </span>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
          
          <h2 className="text-[28px] font-pjs font-bold leading-tight tracking-tight mb-8">
            {caseData.rule_details?.description || caseData.rule_details?.category || 'General Violation'}
          </h2>

          {caseData.requires_director_decision && (
            <div className="mb-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] flex items-center gap-5">
               <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-900/20">
                  <span className="material-symbols-outlined text-[24px] fill-1">gavel</span>
               </div>
               <div>
                  <h4 className="text-[14px] font-black text-rose-200 uppercase tracking-widest leading-none mb-1">Section 27.3.5 Escalation</h4>
                  <p className="text-[12px] text-rose-100 font-medium opacity-80">Only the SWAFO Director can render a decision on this case due to multi-nature major offenses.</p>
               </div>
            </div>
          )}

          {/* Identity & Time Bar */}
          <div className="flex items-center gap-6 p-4 bg-black/20 rounded-[1.5rem] border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/30">
                <img 
                  src={`https://ui-avatars.com/api/?name=${caseData.student_details?.user_details?.full_name}&background=003624&color=fff`} 
                  alt="avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] font-bold text-white">{caseData.student_details?.user_details?.full_name}</span>
                <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">STUDENT NO: {caseData.student_details?.student_number}</span>
              </div>
            </div>
            
            <div className="h-10 w-[1px] bg-white/10"></div>
            
            <div className="flex items-center gap-6 px-4">
              <div className="flex items-center gap-3 text-white/70">
                <span className="material-symbols-outlined text-[20px] text-emerald-400">calendar_today</span>
                <span className="text-[14px] font-bold">{date}</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <span className="material-symbols-outlined text-[20px] text-emerald-400">schedule</span>
                <span className="text-[14px] font-bold">{time}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-10 space-y-10 bg-white">
          <div className="bg-[#F0F4F4]/50 rounded-[2rem] p-8 border-l-4 border-emerald-500">
             <p className="text-[16px] font-manrope font-medium text-slate-700 leading-relaxed italic">
               "{caseData.description || 'No detailed account provided.'}"
             </p>
          </div>

          <div className="grid grid-cols-3 gap-10">
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Handbook Rule</p>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600">menu_book</span>
                  <div>
                    <p className="text-[15px] font-bold text-slate-900">{caseData.rule_details?.rule_code}</p>
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">{(caseData.rule_details?.category || 'General').replace(/^(Major|Minor|General)\s*[—\-]\s*/i, '')}</p>
                  </div>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Location</p>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600">location_on</span>
                <p className="text-[15px] font-bold text-slate-900">{caseData.location || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Officer</p>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600">verified_user</span>
                <p className="text-[15px] font-bold text-slate-900">{caseData.officer_name || 'System Admin'}</p>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
               <h4 className="text-[12px] font-black text-[#003624] uppercase tracking-widest mb-1">
                 {isResolved ? 'Resolution Recorded' : isUnassigned ? 'Unclaimed Violation' : 'Case Assignment'}
               </h4>
               <p className="text-[13px] text-slate-400 font-medium">
                 {isResolved ? 'This institutional record is closed and archived.' : isUnassigned ? 'Review details and claim to begin resolution.' : `Handled by ${caseData.assigned_to_details?.full_name}`}
               </p>
            </div>
            
            <div className="flex gap-4">
              {isResolved ? (
                <button 
                  disabled={isUpdating}
                  onClick={() => onUpdate(caseData.id, 'OPEN')}
                  className="bg-slate-200 text-slate-700 px-10 py-4 rounded-xl text-[14px] font-pjs font-bold hover:bg-slate-300 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isUpdating ? <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">history</span>}
                  RE-OPEN CASE
                </button>
              ) : isUnassigned ? (
                <>
                  {caseData.requires_director_decision && currentUser?.role !== 'ADMIN' ? (
                    <div className="flex items-center gap-3 px-8 py-4 bg-slate-800/50 border border-white/5 rounded-xl text-slate-400">
                       <span className="material-symbols-outlined text-[20px]">lock</span>
                       <span className="text-[13px] font-bold uppercase tracking-widest">Locked for Director</span>
                    </div>
                  ) : (
                    <button 
                      disabled={isUpdating}
                      onClick={() => onClaim(caseData.id)}
                      className="bg-orange-600 text-white px-10 py-4 rounded-xl text-[14px] font-pjs font-bold hover:bg-orange-700 transition-all shadow-xl shadow-orange-900/10 flex items-center gap-3 disabled:opacity-50"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">pan_tool</span>}
                      HANDLE THIS CASE
                    </button>
                  )}
                </>
              ) : isAssignedToMe ? (
                <div className="flex gap-3">
                  {caseData.status !== 'PENDING' && (
                    <button 
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'PENDING')}
                      className="bg-amber-100 text-amber-700 px-6 py-4 rounded-xl text-[14px] font-pjs font-bold hover:bg-amber-200 transition-all flex items-center gap-3 disabled:opacity-50 border border-amber-200"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>}
                      MOVE TO PENDING
                    </button>
                  )}
                  
                  <button 
                    disabled={isUpdating}
                    onClick={() => onUpdate(caseData.id, 'RESOLVED')}
                    className="bg-[#003624] text-white px-8 py-4 rounded-xl text-[14px] font-pjs font-bold hover:bg-[#004d35] transition-all shadow-xl shadow-emerald-950/10 flex items-center gap-3 disabled:opacity-50"
                  >
                    {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">check_circle</span>}
                    MARK AS RESOLVED
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-50 px-6 py-3 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                    <img src={`https://ui-avatars.com/api/?name=${caseData.assigned_to_details?.full_name}&background=cbd5e1&color=64748b`} alt="officer" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">Locked for Review</span>
                </div>
              )}
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
