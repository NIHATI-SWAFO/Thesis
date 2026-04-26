import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../api/config';

export default function CaseManagement({ role }) {
  const { user } = useAuth();
  const [violations, setViolations] = useState([]);
  const [officers, setOfficers] = useState([]);
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

  useEffect(() => {
    if (role === 'admin') {
      fetch(API_ENDPOINTS.USERS_BY_ROLE('OFFICER'))
        .then(res => res.json())
        .then(data => setOfficers(data))
        .catch(err => console.error("Error fetching officers:", err));
    }
  }, [role]);

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
                           caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           v.student_details?.student_number?.includes(searchQuery);
      
      const statusMap = { 
        'All Status': 'ALL',
        'Open': 'OPEN', 
        'Awaiting Decision': 'AWAITING_DECISION', 
        'Decision Rendered': 'DECISION_RENDERED', 
        'Dismissed': 'DISMISSED',
        'Closed': 'CLOSED' 
      };
      const matchesStatus = statusFilter === 'All Status' || v.status === statusMap[statusFilter];
      
      const severity = getPriority(v);
      const matchesPriority = priorityFilter === 'All Severity' || severity === priorityFilter;
      
      // Assignment Filter:
      // - Officers: 'mine' tab shows only cases assigned to them
      // - Admins (Director): 'mine' tab shows cases assigned to them PLUS all active Director Decision cases
      const isDirectorDecisionCase = v.requires_director_decision && !['CLOSED', 'DISMISSED'].includes(v.status);
      const matchesTab = filterTab === 'all' 
        || (v.assigned_to_details?.email === user?.email)
        || (role === 'admin' && isDirectorDecisionCase);
      
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
    awaiting: violations.filter(v => v.status === 'AWAITING_DECISION').length,
    closed: violations.filter(v => ['CLOSED', 'DISMISSED'].includes(v.status)).length,
  };

  const [selectedCase, setSelectedCase] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = (caseId, newStatus) => {
    const v = violations.find(v => v.id === caseId);
    
    // AUTO-ADJUDICATION LOGIC:
    // If submitting for decision and it's a "Clear Table" case, bypass the Director queue
    if (newStatus === 'AWAITING_DECISION' && v && !v.requires_director_decision) {
      handleRenderDecision(caseId, v.prescribed_sanction, 'Institutional decision automatically rendered based on Handbook Section 27 Sanction Table.');
      return;
    }

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

  const handleRenderDecision = (caseId, sanction, remarks) => {
    setIsUpdating(true);
    fetch(API_ENDPOINTS.VIOLATIONS_UPDATE_STATUS(caseId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: 'DECISION_RENDERED',
        director_sanction: sanction,
        director_remarks: remarks
      })
    })
    .then(res => res.json())
    .then(updated => {
      setViolations(prev => prev.map(v => v.id === caseId ? updated : v));
      setSelectedCase(updated);
      setIsUpdating(false);
    })
    .catch(err => {
      console.error("Adjudication error:", err);
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
            ? { ...v, assigned_to_details: assignment } 
            : v
        ));
        // Sync modal state
        setSelectedCase(prev => prev ? { ...prev, assigned_to_details: assignment } : null);
      }
      setIsUpdating(false);
    })
    .catch(err => {
      console.error("Assignment error:", err);
      setIsUpdating(false);
    });
  };

  const handleAssignCase = (caseId, officerEmail) => {
    setIsUpdating(true);
    fetch(API_ENDPOINTS.VIOLATIONS_ASSIGN(caseId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: officerEmail })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const officer = officers.find(o => o.email === officerEmail);
        const assignment = { email: officerEmail, full_name: officer?.full_name || 'System Officer' };
        setViolations(prev => prev.map(v => 
          v.id === caseId 
            ? { ...v, assigned_to_details: assignment } 
            : v
        ));
        // Sync modal state
        setSelectedCase(prev => prev ? { ...prev, assigned_to_details: assignment } : null);
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
            <button onClick={() => setFilterTab('all')} className={`px-8 py-2.5 rounded-xl text-[14px] font-bold transition-all ${filterTab === 'all' ? 'bg-[#003624] text-white shadow-lg' : 'text-emerald-700'}`}>
              {role === 'admin' ? 'All Institutional Cases' : 'All Cases'}
            </button>
            <button onClick={() => setFilterTab('mine')} className={`px-8 py-2.5 rounded-xl text-[14px] font-bold transition-all ${filterTab === 'mine' ? 'bg-[#003624] text-white shadow-lg' : 'text-emerald-700'}`}>
              {role === 'admin' ? 'My Adjudications' : 'My Assignments'}
            </button>
          </div>
        </div>
      </div>
      
      {role === 'admin' && violations.some(v => v.requires_director_decision && !['CLOSED', 'DISMISSED', 'DECISION_RENDERED'].includes(v.status)) && (
        <div className="mb-12 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-xl shadow-rose-900/5">
            <div className="w-20 h-20 rounded-3xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
              <span className="material-symbols-outlined text-[40px] fill-1">gavel</span>
            </div>
            <div className="flex-1">
              <h3 className="text-[24px] font-pjs font-bold text-rose-900 mb-2">Institutional Adjudication Required</h3>
              <p className="text-[15px] text-rose-700/80 font-medium leading-relaxed max-w-[700px]">
                There are active cases flagged under <strong>Section 27.3.5 (Multi-Nature Major Offenses)</strong>. 
                These require a formal Director's decision to determine final sanctions.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[42px] font-pjs font-black text-rose-500 leading-none">
                {violations.filter(v => v.requires_director_decision && !['CLOSED', 'DISMISSED', 'DECISION_RENDERED'].includes(v.status)).length}
              </span>
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Active Cases</span>
            </div>

          </div>
        </div>
      )}

      {/* ── DYNAMIC METRIC CALCULATIONS ── */}
      {(() => {
        const now = new Date();
        const thisMonthCases = violations.filter(v => new Date(v.timestamp).getMonth() === now.getMonth()).length;
        const lastMonthCases = violations.filter(v => new Date(v.timestamp).getMonth() === (now.getMonth() - 1 + 12) % 12).length;
        const growth = lastMonthCases === 0 ? (thisMonthCases > 0 ? 100 : 0) : Math.round(((thisMonthCases - lastMonthCases) / lastMonthCases) * 100);
        
        const majorUnderReview = violations.filter(v => v.status === 'OPEN' && getPriority(v) === 'Major').length;
        const resolutionRate = stats.total === 0 ? 0 : Math.round((stats.closed / stats.total) * 100);
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
                <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${openLoad}%` }}></div>
              </div>
            </div>

            {/* Card 3: Awaiting Decision */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-4 hover:translate-y-[-4px] transition-all duration-300">
              <span className="text-[12px] font-pjs font-black text-slate-400 tracking-widest uppercase">AWAITING DECISION</span>
              <span className="text-[52px] font-pjs font-bold text-[#003624] leading-none tracking-tighter">{stats.awaiting.toLocaleString()}</span>
              <div className={`flex items-center gap-2 font-black text-[13px] mt-2 ${majorUnderReview > 0 ? 'text-red-500' : 'text-emerald-600/60'}`}>
                <span className="material-symbols-outlined text-[20px]">{majorUnderReview > 0 ? 'gavel' : 'hourglass_top'}</span>
                {majorUnderReview > 0 ? `${majorUnderReview} High Priority` : 'Queue Status Normal'}
              </div>
            </div>

            {/* Card 4: Closed / Dismissed */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-4 hover:translate-y-[-4px] transition-all duration-300">
              <span className="text-[12px] font-pjs font-black text-slate-400 tracking-widest uppercase">COMPLETED</span>
              <span className="text-[52px] font-pjs font-bold text-[#003624] leading-none tracking-tighter">{stats.closed.toLocaleString()}</span>
              <div className="flex items-center gap-2 text-emerald-600 font-black text-[13px] mt-2">
                <span className="material-symbols-outlined text-[20px]">verified</span>
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
                <option>Awaiting Decision</option>
                <option>Decision Rendered</option>
                <option>Dismissed</option>
                <option>Closed</option>
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
                    {role === 'admin' && (
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Handling Officer</th>
                    )}
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
                    const isTerminal = ['CLOSED', 'DISMISSED'].includes(v.status);
                    
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
                        {role === 'admin' && (
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-inner">
                                <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                              </div>
                              <span className="text-[13px] font-bold text-slate-600">
                                {v.assigned_to_details?.full_name || (
                                  v.requires_director_decision ? (
                                    <span className="text-[#003624] font-black uppercase tracking-tighter text-[11px]">SWAFO Director</span>
                                  ) : (
                                    <span className="text-slate-400 italic font-medium">Unassigned</span>
                                  )
                                )}
                              </span>
                            </div>
                          </td>
                        )}
                        <td className="px-10 py-8">
                           <div className="flex flex-col">
                              <span className="text-[14px] font-bold text-slate-700">{date}</span>
                              <span className="text-[11px] font-medium text-slate-400">{time}</span>
                           </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className={`inline-flex items-center justify-center whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border gap-1.5 ${
                            v.status === 'OPEN' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                            v.status === 'AWAITING_DECISION' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            v.status === 'DECISION_RENDERED' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                            v.status === 'DISMISSED' ? 'bg-slate-50 text-slate-500 border-slate-200' : 
                            'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              v.status === 'OPEN' ? 'bg-rose-500 animate-pulse' : 
                              v.status === 'AWAITING_DECISION' ? 'bg-amber-500' : 
                              v.status === 'DECISION_RENDERED' ? 'bg-indigo-500' : 
                              v.status === 'DISMISSED' ? 'bg-slate-400' : 
                              'bg-white'
                            }`}></span>
                            {v.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <button 
                            onClick={() => setSelectedCase(v)}
                            className="text-[13px] font-bold text-[#003624] hover:text-[#009b69] transition-all flex items-center gap-1 ml-auto"
                          >
                            {isTerminal ? 'View Case' : 'Manage Details'}
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
                    sub={<span className="flex items-center gap-1.5 truncate">
                      {(v.rule_details?.category || 'General').replace(/^(Major|Minor|General)\s*[—\-]\s*/i, '')} 
                      <span className="opacity-40">•</span>
                      <span className="whitespace-nowrap">{v.status.replace('_', ' ')}</span>
                    </span>} 
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
      {selectedCase && ReactDOM.createPortal(
        <CaseDetailModal 
          caseData={selectedCase} 
          onClose={() => setSelectedCase(null)} 
          onUpdate={handleStatusUpdate}
          onClaim={handleClaimCase}
          onAssign={handleAssignCase}
          onAdjudicate={handleRenderDecision}
          isUpdating={isUpdating}
          currentUser={user}
          officers={officers}
          role={role}
        />,
        document.body
      )}
    </div>
  );
}

function CaseDetailModal({ caseData, onClose, onUpdate, onClaim, onAssign, onAdjudicate, isUpdating, currentUser, officers, role }) {
  const caseId = `CAS-${new Date(caseData.timestamp).getFullYear()}-${caseData.id.toString().padStart(3, '0')}`;
  const date = new Date(caseData.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const time = new Date(caseData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isUnassigned = !caseData.assigned_to_details;
  const isAssignedToMe = caseData.assigned_to_details?.email === currentUser?.email;
  const isTerminal = ['CLOSED', 'DISMISSED'].includes(caseData.status);
  
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [selectedSanction, setSelectedSanction] = useState('');
  const [isAdjudicationOpen, setIsAdjudicationOpen] = useState(caseData.status === 'AWAITING_DECISION');
  const [isDelegationOpen, setIsDelegationOpen] = useState(!caseData.assigned_to_details && caseData.status === 'OPEN');

  return (
    <div 
      className="fixed inset-0 z-[100] flex justify-center p-6 bg-emerald-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[2.5rem] w-full max-w-[800px] h-fit my-auto overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.3)] border border-white/20 animate-in zoom-in-95 duration-300"
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
              <span className={`inline-flex items-center whitespace-nowrap px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest ${
                caseData.status === 'OPEN' ? 'bg-rose-500/20 text-rose-300' : 
                caseData.status === 'AWAITING_DECISION' ? 'bg-amber-500/20 text-amber-300' : 
                caseData.status === 'DECISION_RENDERED' ? 'bg-indigo-500/20 text-indigo-300' : 
                isTerminal ? 'bg-emerald-500/20 text-emerald-300' : 
                'bg-slate-500/20 text-slate-300'
              }`}>
                {caseData.status.replace(/_/g, ' ')}
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

          {caseData.status === 'AWAITING_DECISION' && (
            <div className="mb-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] flex items-center gap-5">
               <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-900/20">
                  <span className="material-symbols-outlined text-[24px] fill-1">gavel</span>
               </div>
               <div>
                  <h4 className="text-[14px] font-black text-rose-200 uppercase tracking-widest leading-none mb-1">Awaiting Institutional Decision</h4>
                  <p className="text-[12px] text-rose-100 font-medium opacity-80">This case has been submitted for formal review. The SWAFO Director must now render a decision or dismiss the case.</p>
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

          {/* Institutional Adjudication Section */}
          {(role === 'admin' || (role === 'officer' && !caseData.requires_director_decision)) && caseData.status === 'AWAITING_DECISION' && (
            <div className={`border-2 rounded-[2rem] transition-all duration-300 ${isAdjudicationOpen ? 'bg-rose-50/50 border-rose-100 p-8' : 'bg-rose-50/20 border-rose-50 p-4'}`}>
              <button 
                onClick={() => setIsAdjudicationOpen(!isAdjudicationOpen)}
                className="w-full flex items-center justify-between outline-none"
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${isAdjudicationOpen ? 'text-rose-500' : 'text-rose-300'}`}>gavel</span>
                  <h3 className={`text-[16px] font-black uppercase tracking-widest ${isAdjudicationOpen ? 'text-rose-900' : 'text-rose-400'}`}>
                    {caseData.requires_director_decision ? "Director's Adjudication" : "Staff Adjudication"}
                  </h3>
                </div>
                <span className={`material-symbols-outlined transition-transform duration-300 ${isAdjudicationOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              
              {isAdjudicationOpen && (
                <div className="mt-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
                  {/* Sanction dropdown — full width */}
                  <select 
                    value={selectedSanction}
                    onChange={(e) => setSelectedSanction(e.target.value)}
                    className="w-full bg-white border-2 border-rose-200 rounded-xl px-5 py-3 text-[14px] font-bold text-rose-900 outline-none focus:border-rose-500 transition-all"
                  >
                    <option value="">Select Formal Sanction...</option>
                    {caseData.prescribed_sanction && (
                      <option value={caseData.prescribed_sanction}>Recommended: {caseData.prescribed_sanction}</option>
                    )}
                    <option value="Sanction 1: Written Reprimand & Community Service">Sanction 1: Written Reprimand & Community Service</option>
                    <option value="Sanction 2: Disciplinary Probation (1 Semester)">Sanction 2: Disciplinary Probation (1 Semester)</option>
                    <option value="Sanction 3: Suspension (1 Year)">Sanction 3: Suspension (1 Year)</option>
                    <option value="Sanction 4: Dismissal / Expulsion Recommendation">Sanction 4: Dismissal / Expulsion Recommendation</option>
                  </select>

                  {/* Render Decision — full width */}
                  <button 
                    disabled={!selectedSanction || isUpdating}
                    onClick={() => onAdjudicate(caseData.id, selectedSanction, 'Institutional decision rendered by SWAFO Director.')}
                    className="w-full bg-[#003624] text-white py-3 rounded-xl text-[14px] font-black uppercase tracking-widest hover:bg-[#004d35] transition-all disabled:opacity-30 shadow-lg shadow-emerald-950/10 flex items-center justify-center gap-2"
                  >
                    {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[18px]">gavel</span>}
                    Render Decision
                  </button>

                  {/* Dismiss row */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-rose-100">
                    <p className="text-[12px] text-rose-700/60 font-medium italic flex-1">Or if the violation is invalid or requires no action:</p>
                    <button 
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'DISMISSED')}
                      className="bg-rose-100 text-rose-700 px-6 py-2 rounded-lg text-[12px] font-black uppercase tracking-widest hover:bg-rose-200 transition-all disabled:opacity-30 whitespace-nowrap"
                    >
                      Dismiss Case
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {(caseData.status === 'DECISION_RENDERED' || isTerminal) && caseData.director_sanction && (
            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-emerald-600 fill-1">verified</span>
                <h3 className="text-[16px] font-black text-emerald-900 uppercase tracking-widest">Institutional Verdict</h3>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-1">Prescribed Sanction</p>
                <p className="text-[18px] font-bold text-slate-800 mb-4">{caseData.director_sanction}</p>
                <p className="text-[13px] font-medium text-slate-500 bg-slate-50 p-4 rounded-xl italic">
                  "{caseData.director_remarks}"
                </p>
              </div>
            </div>
          )}

          {/* Officer Delegation Section */}
          {role === 'admin' && !isTerminal && (
            <div className={`border-2 rounded-[2rem] transition-all duration-300 ${isDelegationOpen ? 'bg-indigo-50/50 border-indigo-200 p-8' : 'bg-indigo-50/30 border-indigo-100 p-4'}`}>
              <button 
                onClick={() => setIsDelegationOpen(!isDelegationOpen)}
                className="w-full flex items-center justify-between outline-none"
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${isDelegationOpen ? 'text-indigo-600' : 'text-indigo-400'}`}>assignment_ind</span>
                  <h3 className={`text-[16px] font-black uppercase tracking-widest ${isDelegationOpen ? 'text-indigo-900' : 'text-indigo-800/60'}`}>Staff Delegation</h3>
                </div>
                <div className="flex items-center gap-3">
                  {caseData.assigned_to_details && !isDelegationOpen && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                      {caseData.assigned_to_details.full_name}
                    </span>
                  )}
                  <span className={`material-symbols-outlined transition-transform duration-300 ${isDelegationOpen ? 'rotate-180' : 'text-slate-400'}`}>expand_more</span>
                </div>
              </button>

              {isDelegationOpen && (
                <div className="mt-8 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-4">
                    <select 
                      value={selectedOfficer}
                      onChange={(e) => setSelectedOfficer(e.target.value)}
                      className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-5 py-3 text-[14px] font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"
                    >
                      <option value="">Choose Officer to Delegate...</option>
                      {officers.map(off => (
                        <option key={off.email} value={off.email}>{off.full_name}</option>
                      ))}
                    </select>
                    <button 
                      disabled={!selectedOfficer || isUpdating}
                      onClick={() => onAssign(caseData.id, selectedOfficer)}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-[14px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-30 shadow-lg shadow-indigo-900/10"
                    >
                      Delegate Case
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Logging Officer</p>
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
                  {isTerminal ? 'Institutional Record Locked'
                    : caseData.status === 'DECISION_RENDERED' ? 'Awaiting Fulfillment'
                    : caseData.status === 'AWAITING_DECISION' ? 'Pending Institutional Decision'
                    : (caseData.requires_director_decision && role === 'admin') ? "Director's Case — §27.3.5"
                    : isUnassigned ? 'Unclaimed Violation'
                    : caseData.requires_director_decision ? 'Reserved for Director'
                    : 'Ready for Auto-Sanction'}
                </h4>
                <p className="text-[13px] text-slate-400 font-medium">
                  {isTerminal ? 'This institutional record is closed and archived.'
                    : caseData.status === 'DECISION_RENDERED' ? 'Waiting for the student to serve the rendered sanction.'
                    : caseData.status === 'AWAITING_DECISION' ? 'Awaiting formal sanction from the SWAFO Director.'
                    : (caseData.requires_director_decision && role === 'admin') ? 'Multi-nature major offense — only you may adjudicate.'
                    : isUnassigned ? 'Review details and take action to begin resolution.'
                    : caseData.requires_director_decision ? 'This case is reserved for the SWAFO Director.'
                    : 'Submit to instantly apply handbook-prescribed sanction.'}
                </p>
            </div>

            <div className="flex gap-4">
              {isTerminal ? (
                role === 'admin' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => onUpdate(caseData.id, 'OPEN')}
                    className="bg-slate-200 text-slate-700 px-10 py-4 rounded-xl text-[14px] font-pjs font-bold hover:bg-slate-300 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {isUpdating ? <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">history</span>}
                    RE-OPEN CASE
                  </button>
                )

              ) : (caseData.requires_director_decision && role === 'admin') ? (
                // Director fast-track: skip self-claim, show actions directly
                <div className="flex gap-3">
                  {caseData.status === 'OPEN' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'AWAITING_DECISION')}
                      className="bg-rose-600 text-white px-8 py-4 rounded-xl text-[14px] font-pjs font-bold hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/10 flex items-center gap-3 disabled:opacity-50"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">gavel</span>}
                      ESCALATE TO DECISION
                    </button>
                  )}
                  {caseData.status === 'DECISION_RENDERED' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'CLOSED')}
                      className="bg-[#003624] text-white px-8 py-4 rounded-xl text-[14px] font-pjs font-bold hover:bg-[#004d35] transition-all shadow-xl shadow-emerald-950/10 flex items-center gap-3 disabled:opacity-50"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">task_alt</span>}
                      CLOSE CASE (FULFILLED)
                    </button>
                  )}
                </div>

              ) : isUnassigned ? (
                <>
                  {caseData.requires_director_decision && role !== 'admin' ? (
                    <div className="flex items-center gap-3 px-8 py-4 bg-rose-50 border border-rose-200 rounded-xl">
                      <span className="material-symbols-outlined text-[20px] text-rose-500">gavel</span>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-black text-rose-700 uppercase tracking-widest">Reserved for Director</span>
                        <span className="text-[11px] text-rose-500 font-medium">§27.3.5 — Only the SWAFO Director may handle this case</span>
                      </div>
                    </div>
                  ) : caseData.status === 'AWAITING_DECISION' && role !== 'admin' ? (
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
                      SELF-CLAIM CASE
                    </button>
                  )}
                </>

              ) : isAssignedToMe ? (
                <div className="flex gap-3">
                  {caseData.status === 'OPEN' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'AWAITING_DECISION')}
                      className="bg-amber-100 text-amber-700 px-6 py-4 rounded-xl text-[14px] font-pjs font-bold hover:bg-amber-200 transition-all flex items-center gap-3 disabled:opacity-50 border border-amber-200"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">send</span>}
                      SUBMIT FOR DECISION
                    </button>
                  )}
                  {caseData.status === 'DECISION_RENDERED' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'CLOSED')}
                      className="bg-[#003624] text-white px-8 py-4 rounded-xl text-[14px] font-pjs font-bold hover:bg-[#004d35] transition-all shadow-xl shadow-emerald-950/10 flex items-center gap-3 disabled:opacity-50"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">task_alt</span>}
                      CLOSE CASE (FULFILLED)
                    </button>
                  )}
                </div>

              ) : (
                <div className="flex gap-3">
                  {caseData.status === 'DECISION_RENDERED' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'CLOSED')}
                      className="bg-[#003624] text-white px-8 py-4 rounded-xl text-[14px] font-pjs font-bold hover:bg-[#004d35] transition-all shadow-xl shadow-emerald-950/10 flex items-center gap-3 disabled:opacity-50"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">task_alt</span>}
                      CLOSE CASE (FULFILLED)
                    </button>
                  )}
                  <div className="flex items-center gap-2 bg-slate-50 px-6 py-3 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                      <img src={`https://ui-avatars.com/api/?name=${caseData.assigned_to_details?.full_name || 'Staff'}&background=cbd5e1&color=64748b`} alt="officer" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">Staff Record</span>
                  </div>
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
