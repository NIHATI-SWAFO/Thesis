import React, { useState, useMemo, useEffect } from 'react';
import AppealThreadModal from '../../components/common/AppealThreadModal';

import ReactDOM from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../api/config';
import { useColleges } from '../../hooks/useColleges';

export default function CaseManagement({ role }) {
  const { user } = useAuth();
  const [violations, setViolations] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showAllAppeals, setShowAllAppeals] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Severity');
  const [collegeFilter, setCollegeFilter] = useState('');
  const { colleges } = useColleges();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const url = collegeFilter
      ? `${API_ENDPOINTS.VIOLATIONS_LIST}?college=${encodeURIComponent(collegeFilter)}`
      : API_ENDPOINTS.VIOLATIONS_LIST;
    setLoading(true);

    Promise.all([
      fetch(url).then(r => r.json()),
      fetch(API_ENDPOINTS.VIOLATIONS_APPEALS, { headers: { "Authorization": `Bearer ${user?.token}` } }).then(r => r.json()).catch(() => [])
    ])
      .then(([violData, appealsData]) => {
        setViolations(Array.isArray(violData) ? violData : (violData.results || []));
        setAppeals(Array.isArray(appealsData) ? appealsData : (appealsData.results || []));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, [collegeFilter, user?.token]);

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
    <div className="animate-fade-in-up pb-10 px-2 sm:px-4">
      <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-10 px-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-[32px] md:text-[36px] font-pjs font-extrabold text-[#003624] tracking-tight text-left">
            Case Management
          </h1>

          <div className="flex p-1 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 shadow-sm w-full sm:w-auto">
            <button onClick={() => setFilterTab('all')} className={`flex-1 sm:px-8 py-2.5 rounded-xl text-[12px] md:text-[14px] font-bold transition-all ${filterTab === 'all' ? 'bg-[#003624] text-white shadow-lg' : 'text-emerald-700'}`}>
              {role === 'admin' ? 'Institutional' : 'All Cases'}
            </button>
            <button onClick={() => setFilterTab('mine')} className={`flex-1 sm:px-8 py-2.5 rounded-xl text-[12px] md:text-[14px] font-bold transition-all ${filterTab === 'mine' ? 'bg-[#003624] text-white shadow-lg' : 'text-emerald-700'}`}>
              {role === 'admin' ? 'My Decisions' : 'Assigned'}
            </button>
          </div>
        </div>
      </div>

      {role === 'admin' && violations.some(v => v.requires_director_decision && !['CLOSED', 'DISMISSED', 'DECISION_RENDERED'].includes(v.status)) && (
        <div className="mb-6 sm:mb-10 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-rose-50 border border-rose-100 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 shadow-xl shadow-rose-900/5 text-left">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-3xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
              <span className="material-symbols-outlined text-[28px] sm:text-[40px] fill-1">gavel</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-[24px] font-pjs font-bold text-rose-900 mb-1 sm:mb-2">Institutional Adjudication Required</h3>
              <p className="text-xs sm:text-[15px] text-rose-700/80 font-medium leading-relaxed max-w-[700px]">
                Active cases flagged under <strong>Section 27.3.5 (Multi-Nature Major Offenses)</strong> require a formal Director's decision.
              </p>
            </div>
            <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0">
              <span className="text-3xl sm:text-[42px] font-pjs font-black text-rose-500 leading-none">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            {/* Card 1: Total Cases */}
            <div className="bg-white p-4 sm:p-7 md:p-10 rounded-2xl sm:rounded-[2rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-2 sm:gap-4 hover:translate-y-[-2px] transition-all duration-300">
              <span className="text-[10px] sm:text-[12px] font-pjs font-black text-slate-400 tracking-wider uppercase">TOTAL CASES</span>
              <span className="text-2xl sm:text-[38px] md:text-[52px] font-pjs font-bold text-[#003624] leading-none tracking-tighter">{stats.total.toLocaleString()}</span>
              <div className={`flex items-center gap-1 sm:gap-2 font-black text-[11px] sm:text-[13px] mt-1 sm:mt-2 ${growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                <span className="material-symbols-outlined text-[16px] sm:text-[20px]">{growth >= 0 ? 'trending_up' : 'trending_down'}</span>
                {growth >= 0 ? `+${growth}%` : `${growth}%`}
              </div>
            </div>

            {/* Card 2: Open Cases */}
            <div className="bg-white p-4 sm:p-7 md:p-10 rounded-2xl sm:rounded-[2rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-2 sm:gap-4 hover:translate-y-[-2px] transition-all duration-300">
              <span className="text-[10px] sm:text-[12px] font-pjs font-black text-slate-400 tracking-wider uppercase">OPEN CASES</span>
              <span className="text-2xl sm:text-[38px] md:text-[52px] font-pjs font-bold text-[#003624] leading-none tracking-tighter">{stats.open.toLocaleString()}</span>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 sm:mt-4 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${openLoad}%` }}></div>
              </div>
            </div>

            {/* Card 3: Awaiting Decision */}
            <div className="bg-white p-4 sm:p-7 md:p-10 rounded-2xl sm:rounded-[2rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-2 sm:gap-4 hover:translate-y-[-2px] transition-all duration-300">
              <span className="text-[10px] sm:text-[12px] font-pjs font-black text-slate-400 tracking-wider uppercase">AWAITING</span>
              <span className="text-2xl sm:text-[38px] md:text-[52px] font-pjs font-bold text-[#003624] leading-none tracking-tighter">{stats.awaiting.toLocaleString()}</span>
              <div className={`flex items-center gap-1 sm:gap-2 font-black text-[10px] sm:text-[13px] mt-1 sm:mt-2 ${majorUnderReview > 0 ? 'text-red-500' : 'text-emerald-600/60'}`}>
                <span className="material-symbols-outlined text-[16px] sm:text-[20px]">{majorUnderReview > 0 ? 'gavel' : 'hourglass_top'}</span>
                {majorUnderReview > 0 ? 'Priority' : 'Normal'}
              </div>
            </div>

            {/* Card 4: Closed / Dismissed */}
            <div className="bg-white p-4 sm:p-7 md:p-10 rounded-2xl sm:rounded-[2rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-2 sm:gap-4 hover:translate-y-[-2px] transition-all duration-300">
              <span className="text-[10px] sm:text-[12px] font-pjs font-black text-slate-400 tracking-wider uppercase">COMPLETED</span>
              <span className="text-2xl sm:text-[38px] md:text-[52px] font-pjs font-bold text-[#003624] leading-none tracking-tighter">{stats.closed.toLocaleString()}</span>
              <div className="flex items-center gap-1 sm:gap-2 text-emerald-600 font-black text-[11px] sm:text-[13px] mt-1 sm:mt-2">
                <span className="material-symbols-outlined text-[16px] sm:text-[20px]">verified</span>
                {resolutionRate}% Rate
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex flex-col xl:flex-row items-start gap-8">
        <div className="flex-1 w-full flex flex-col gap-6 sm:gap-8">

          {/* Search and Filters */}
          <div className="bg-[#F0F4F4]/80 p-2.5 sm:p-3 rounded-2xl sm:rounded-[2rem] flex flex-col md:flex-row gap-2.5 sm:gap-4 items-center">
            <div className="relative flex-1 w-full group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Search student name, ID or case #..."
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white rounded-xl sm:rounded-2xl py-3 pl-12 pr-4 text-xs sm:text-[14px] font-manrope font-medium outline-none border-2 border-transparent focus:border-[#003624] transition-all shadow-xs h-[44px] sm:h-[50px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
              <select
                value={collegeFilter || ""}
                onChange={(e) => { setCollegeFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white px-2.5 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold text-slate-700 h-[42px] sm:h-[50px] border-2 border-transparent focus:border-[#003624] outline-none transition-all cursor-pointer truncate"
              >
                <option value="">Colleges: All</option>
                {colleges.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={statusFilter || ""}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white px-2.5 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold text-slate-700 h-[42px] sm:h-[50px] md:w-[160px] border-2 border-transparent focus:border-[#003624] outline-none transition-all cursor-pointer truncate"
              >
                <option>All Status</option>
                <option>Open</option>
                <option>Awaiting Decision</option>
                <option>Decision Rendered</option>
                <option>Dismissed</option>
                <option>Closed</option>
              </select>

              <select
                value={priorityFilter || ""}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-white px-2.5 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold text-slate-700 h-[42px] sm:h-[50px] md:w-[150px] border-2 border-transparent focus:border-[#003624] outline-none transition-all cursor-pointer truncate"
              >
                <option>All Severity</option>
                <option>Major</option>
                <option>Minor</option>
                <option>General</option>
              </select>
            </div>
          </div>

          {/* Cases Container */}
          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-50 shadow-[0_4px_40px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
            <div className="px-5 sm:px-10 py-4 sm:py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-[19px] font-pjs font-extrabold text-[#111827]">
                  {filterTab === 'mine' ? (role === 'admin' ? 'My Adjudication Queue' : 'Assigned Cases') : 'All Case Files'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                  {filteredCases.length}
                </span>
              </div>

              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 text-[#003624] hover:text-emerald-700 text-xs sm:text-[13px] font-bold px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">file_download</span>
                <span className="hidden sm:inline">Export</span> CSV
              </button>
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Case ID</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type & Severity</th>
                    {role === 'admin' && (
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Handling Officer</th>
                    )}
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Logged</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
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
                      <tr key={v.id} onClick={() => setSelectedCase(v)} className="group hover:bg-emerald-50/30 transition-all duration-200 cursor-pointer">
                        <td className="px-8 py-6 font-black text-[#003624] text-[13px]">{caseId}</td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#003624] flex items-center justify-center font-bold text-xs border border-emerald-100 shrink-0">
                              {studentName.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[14px] font-bold text-[#111827] leading-tight truncate max-w-[200px]">{studentName}</span>
                              <span className="text-[11px] font-medium text-slate-400 mt-0.5">ID: {v.student_details?.student_number}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className={`text-[9.5px] font-black uppercase tracking-wider ${severity === 'Major' ? 'text-rose-600' : severity === 'Minor' ? 'text-emerald-700' : 'text-amber-600'}`}>
                              {severity}
                            </span>
                            <span className="text-[13px] font-bold text-slate-700 truncate max-w-[220px]">
                              {(v.rule_details?.category || 'General Violation').replace(/^(Major|Minor|General)\s*[—\-]\s*/i, '')}
                            </span>
                            {v.requires_director_decision && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[13px] text-rose-500 fill-1">gavel</span>
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Director Adjudication</span>
                              </div>
                            )}
                          </div>
                        </td>
                        {role === 'admin' && (
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                <span className="material-symbols-outlined text-[15px] text-slate-400">person</span>
                              </div>
                              <span className="text-xs font-bold text-slate-600 truncate max-w-[140px]">
                                {v.assigned_to_details?.full_name || (
                                  v.requires_director_decision ? (
                                    <span className="text-[#003624] font-black uppercase tracking-tight text-[10.5px]">SWAFO Director</span>
                                  ) : (
                                    <span className="text-slate-400 italic font-medium">Unassigned</span>
                                  )
                                )}
                              </span>
                            </div>
                          </td>
                        )}
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-700">{date}</span>
                            <span className="text-[11px] font-medium text-slate-400">{time}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider border gap-1.5 ${v.status === 'OPEN' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              v.status === 'AWAITING_DECISION' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                v.status === 'DECISION_RENDERED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                  v.status === 'DISMISSED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                    'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'OPEN' ? 'bg-rose-500 animate-pulse' :
                                v.status === 'AWAITING_DECISION' ? 'bg-amber-500' :
                                  v.status === 'DECISION_RENDERED' ? 'bg-indigo-500' :
                                    v.status === 'DISMISSED' ? 'bg-slate-400' :
                                      'bg-white'
                              }`}></span>
                            {v.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCase(v);
                            }}
                            className="text-xs font-bold text-[#003624] hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isTerminal ? 'View' : 'Manage'}</span>
                            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (< md) */}
            <div className="block md:hidden divide-y divide-slate-100 p-2 sm:p-3 space-y-2">
              {paginatedCases.map((v) => {
                const studentName = v.student_details?.user_details?.full_name || 'Unknown Student';
                const caseId = `#CS-${v.id.toString().padStart(5, '0')}`;
                const date = new Date(v.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const time = new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const severity = getPriority(v);
                const isTerminal = ['CLOSED', 'DISMISSED'].includes(v.status);

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedCase(v)}
                    className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/70 hover:bg-emerald-50/40 border border-gray-100 space-y-3 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    {/* Header: Case ID + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-pjs font-extrabold text-[#003624] text-[13px]">{caseId}</span>
                      <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border gap-1 ${v.status === 'OPEN' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          v.status === 'AWAITING_DECISION' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            v.status === 'DECISION_RENDERED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              v.status === 'DISMISSED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                'bg-emerald-600 text-white border-emerald-700'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'OPEN' ? 'bg-rose-500 animate-pulse' :
                            v.status === 'AWAITING_DECISION' ? 'bg-amber-500' :
                              v.status === 'DECISION_RENDERED' ? 'bg-indigo-500' :
                                v.status === 'DISMISSED' ? 'bg-slate-400' :
                                  'bg-white'
                          }`}></span>
                        {v.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#003624] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {studentName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-pjs font-bold text-gray-900 leading-tight truncate">{studentName}</p>
                        <p className="text-[10px] font-semibold text-gray-400 mt-0.5">ID: {v.student_details?.student_number || 'Pending'}</p>
                      </div>
                    </div>

                    {/* Violation Type & Severity */}
                    <div className="bg-white rounded-xl p-2.5 space-y-1 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${severity === 'Major' ? 'bg-rose-50 text-rose-700' : severity === 'Minor' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                          }`}>
                          {severity}
                        </span>
                        <span className="text-[12px] font-bold text-slate-800 truncate">
                          {(v.rule_details?.category || 'General Violation').replace(/^(Major|Minor|General)\s*[—\-]\s*/i, '')}
                        </span>
                      </div>
                      {v.requires_director_decision && (
                        <div className="flex items-center gap-1 text-rose-600 pt-0.5">
                          <span className="material-symbols-outlined text-[13px] fill-1">gavel</span>
                          <span className="text-[9px] font-black uppercase tracking-tight">Director Decision Required</span>
                        </div>
                      )}
                    </div>

                    {/* Handling Officer (if admin) */}
                    {role === 'admin' && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                        <span>
                          {v.assigned_to_details?.full_name || (
                            v.requires_director_decision ? (
                              <span className="text-[#003624] font-black text-[9.5px] uppercase">SWAFO Director</span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )
                          )}
                        </span>
                      </div>
                    )}

                    {/* Date and Action */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200/50">
                      <span className="text-[10.5px] font-medium text-slate-400">{date} • {time}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCase(v);
                        }}
                        className="px-3 py-1 bg-[#003624] text-white rounded-lg text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-xs"
                      >
                        {isTerminal ? 'View File' : 'Manage'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {paginatedCases.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-xs font-semibold">
                  No cases match your filters.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="px-4 sm:px-8 py-3.5 sm:py-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/40">
              <span className="text-xs font-semibold text-slate-500">
                {filteredCases.length > 0
                  ? `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(filteredCases.length, currentPage * itemsPerPage)} of ${filteredCases.length}`
                  : '0 cases'
                }
              </span>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {/* Desktop page pills */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-9 h-9 rounded-xl font-bold text-xs ${currentPage === i + 1 ? 'bg-[#003624] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'} transition-all cursor-pointer`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                {/* Mobile page indicator */}
                <span className="sm:hidden text-xs font-bold text-slate-700 px-2">
                  {currentPage} / {totalPages || 1}
                </span>

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[360px] shrink-0 flex flex-col gap-6 sm:gap-8">
          <div className="bg-[#004D33] rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl group">
            <div className="absolute top-[-50%] right-[-50%] w-[150%] h-[150%] bg-[#005c3d] rounded-full opacity-40 blur-3xl"></div>
            <div className="relative z-10 flex flex-col gap-6 sm:gap-10">
              <h3 className="text-2xl sm:text-[28px] font-pjs font-bold leading-[1.1] tracking-tight">Priority<br />Breakdown</h3>
              <div className="flex flex-col gap-5 sm:gap-8">
                <ProgressItem label="Major Violations" percent={priorityStats.high.percent} color="bg-white" />
                <ProgressItem label="Minor Violations" percent={priorityStats.low.percent} color="bg-white/60" />
                <ProgressItem label="General" percent={priorityStats.medium.percent} color="bg-white/30" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-[0_4px_40px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col gap-6 sm:gap-8">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-[18px] font-pjs font-bold text-[#111827]">Recent Activity</h3>
              <span className="text-[11px] font-black text-[#009b69] tracking-widest uppercase">Today</span>
            </div>
            <div className="flex flex-col gap-5 sm:gap-8">
              {violations.slice(0, 3).map((v) => {
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
                      {(v.rule_details?.category || 'General').replace(/^(Major|Minor|General)\s*[-?"]\s*/i, '')}
                      <span className="opacity-40">&bull;</span>
                      <span className="whitespace-nowrap">{v.status.replace('_', ' ')}</span>
                    </span>}
                    time={`${dateStr}, ${timeStr}`}
                    onClick={() => setSelectedCase(v)}
                  />
                );
              })}
              {violations.length === 0 && (
                <p className="text-[13px] text-slate-400 font-medium italic text-center py-4">No recent activity found.</p>
              )}
            </div>
          </div>

          {/* Pending Appeals Section */}
          {(user?.role === 'DIRECTOR' || user?.role === 'ADMIN') && (
          <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_4px_40px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <h3 className="text-[18px] font-pjs font-bold text-[#111827]">Pending Appeals</h3>
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[11px] font-black">{appeals.filter(a => a.status === 'PENDING').length}</span>
            </div>
            <div className="flex flex-col gap-8">
              {appeals.filter(a => a.status === 'PENDING').slice(0, 4).map(a => {
                const timeStr = new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
                return (
                  <ActivityItem
                    key={a.id}
                    icon="gavel"
                    color="bg-amber-50 text-amber-600"
                    title={a.student_name}
                    sub={<span className="flex items-center gap-1.5 truncate">
                      Ref: {a.violation_code}
                    </span>}
                    time={`${dateStr}, ${timeStr}`}
                    onClick={() => setSelectedAppeal(a)}
                  />
                );
              })}
              {appeals.filter(a => a.status === 'PENDING').length === 0 && (
                <p className="text-[13px] text-slate-400 font-medium italic text-center py-4">No pending appeals.</p>
              )}

              <button
                onClick={() => setShowAllAppeals(true)}
                className="mt-2 w-full py-3.5 bg-slate-50 text-slate-600 rounded-xl font-pjs font-bold text-[12px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">history</span>
                View Appeals History
              </button>
            </div>
          </div>
          )}
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

      {selectedAppeal && (
        <AppealReviewWrapper
          appealData={selectedAppeal}
          onClose={() => setSelectedAppeal(null)}
          user={user}
        />
      )}

      {showAllAppeals && (
        <AllAppealsModal
          appeals={appeals}
          onClose={() => setShowAllAppeals(false)}
          onSelectAppeal={setSelectedAppeal}
        />
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-6 bg-emerald-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-[800px] max-h-[92vh] my-auto flex flex-col overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.3)] border border-white/20 animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="bg-[#003624] p-4 sm:p-6 md:p-8 text-white relative shrink-0">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div>
              <p className="text-[10px] sm:text-[11px] font-black text-white/40 uppercase tracking-widest mb-0.5">Case ID</p>
              <p className="text-sm sm:text-base md:text-[18px] font-bold text-emerald-400">#{caseId}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className={`inline-flex items-center whitespace-nowrap px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9.5px] sm:text-[11px] font-black uppercase tracking-wider ${caseData.status === 'OPEN' ? 'bg-rose-500/20 text-rose-300' :
                caseData.status === 'AWAITING_DECISION' ? 'bg-amber-500/20 text-amber-300' :
                  caseData.status === 'DECISION_RENDERED' ? 'bg-indigo-500/20 text-indigo-300' :
                    isTerminal ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-slate-500/20 text-slate-300'
                }`}>
                {caseData.status.replace(/_/g, ' ')}
              </span>
              <button
                onClick={onClose}
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer text-white"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">close</span>
              </button>
            </div>
          </div>

          <h2 className="text-base sm:text-xl md:text-[24px] font-pjs font-bold leading-snug tracking-tight mb-3 sm:mb-4">
            {caseData.rule_details?.description || caseData.rule_details?.category || 'General Violation'}
          </h2>

          {/* Identity & Time Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 p-3 sm:p-4 bg-black/25 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-emerald-500/40 shrink-0 bg-[#002418]">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(caseData.student_details?.user_details?.full_name || 'Student')}&background=003624&color=fff`}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] sm:text-[14px] font-bold text-white leading-tight truncate">
                  {caseData.student_details?.user_details?.full_name || 'Unknown Student'}
                </span>
                <span className="text-[10px] font-black text-white/50 uppercase tracking-wider">
                  ID: {caseData.student_details?.student_number || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 text-white/70 text-[11px] sm:text-[12px] font-semibold border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-emerald-400">calendar_today</span>
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-emerald-400">schedule</span>
                <span>{time}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section (Scrollable) */}
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {caseData.status === 'AWAITING_DECISION' && (
            <div className="p-3.5 sm:p-5 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[18px] sm:text-[22px] fill-1">gavel</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] sm:text-[13px] font-black text-rose-700 uppercase tracking-wider leading-none mb-1">Awaiting Institutional Decision</h4>
                <p className="text-[11px] sm:text-[12px] text-rose-600 font-medium leading-relaxed">This case has been submitted for formal review. The SWAFO Director must render a decision or dismiss the case.</p>
              </div>
            </div>
          )}

          <div className="bg-[#F0F4F4]/60 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border-l-4 border-emerald-600">
            <p className="text-[13px] sm:text-[15px] font-manrope font-medium text-slate-700 leading-relaxed italic">
              "{caseData.description || 'No detailed account provided.'}"
            </p>
          </div>

          {/* Institutional Adjudication Section */}
          {(role === 'admin' || (role === 'officer' && !caseData.requires_director_decision)) && caseData.status === 'AWAITING_DECISION' && (
            <div className={`border-2 rounded-xl sm:rounded-2xl transition-all duration-300 ${isAdjudicationOpen ? 'bg-rose-50/50 border-rose-100 p-4 sm:p-6' : 'bg-rose-50/20 border-rose-50 p-3.5'}`}>
              <button
                onClick={() => setIsAdjudicationOpen(!isAdjudicationOpen)}
                className="w-full flex items-center justify-between outline-none"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className={`material-symbols-outlined text-[20px] ${isAdjudicationOpen ? 'text-rose-500' : 'text-rose-300'}`}>gavel</span>
                  <h3 className={`text-[12px] sm:text-[15px] font-black uppercase tracking-wider ${isAdjudicationOpen ? 'text-rose-900' : 'text-rose-400'}`}>
                    {caseData.requires_director_decision ? "Director's Adjudication" : "Staff Adjudication"}
                  </h3>
                </div>
                <span className={`material-symbols-outlined transition-transform duration-300 ${isAdjudicationOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {isAdjudicationOpen && (
                <div className="mt-4 sm:mt-5 flex flex-col gap-3 sm:gap-3.5 animate-in slide-in-from-top-2 duration-300">
                  {/* Sanction dropdown */}
                  <select
                    value={selectedSanction || ""}
                    onChange={(e) => setSelectedSanction(e.target.value)}
                    className="w-full bg-white border-2 border-rose-200 rounded-xl px-3.5 py-2.5 text-[12px] sm:text-[13.5px] font-bold text-rose-900 outline-none focus:border-rose-500 transition-all cursor-pointer"
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

                  {/* Render Decision */}
                  <button
                    disabled={!selectedSanction || isUpdating}
                    onClick={() => onAdjudicate(caseData.id, selectedSanction, 'Institutional decision rendered by SWAFO Director.')}
                    className="w-full bg-[#003624] text-white py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-[13px] font-black uppercase tracking-widest hover:bg-[#004d35] transition-all disabled:opacity-30 shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[17px]">gavel</span>}
                    Render Decision
                  </button>

                  {/* Dismiss row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2.5 border-t border-rose-100">
                    <p className="text-[11px] text-rose-700/70 font-medium italic flex-1">Or if the violation is invalid or requires no action:</p>
                    <button
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'DISMISSED')}
                      className="bg-rose-100 text-rose-700 px-4 py-1.5 rounded-lg text-[10.5px] sm:text-[11.5px] font-black uppercase tracking-wider hover:bg-rose-200 transition-all disabled:opacity-30 whitespace-nowrap self-start sm:self-auto cursor-pointer"
                    >
                      Dismiss Case
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {(caseData.status === 'DECISION_RENDERED' || isTerminal) && caseData.director_sanction && (
            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
                <span className="material-symbols-outlined text-emerald-600 fill-1 text-[20px]">verified</span>
                <h3 className="text-[13px] sm:text-[15px] font-black text-emerald-900 uppercase tracking-widest">Institutional Verdict</h3>
              </div>
              <div className="p-3.5 sm:p-5 bg-white rounded-xl border border-emerald-100 shadow-xs">
                <p className="text-[9.5px] sm:text-[10.5px] font-black text-emerald-600 uppercase tracking-widest mb-1">Prescribed Sanction</p>
                <p className="text-[14px] sm:text-[16px] font-bold text-slate-800 mb-2">{caseData.director_sanction}</p>
                <p className="text-[11.5px] sm:text-[12.5px] font-medium text-slate-500 bg-slate-50 p-2.5 sm:p-3 rounded-lg italic">
                  "{caseData.director_remarks}"
                </p>
              </div>
            </div>
          )}

          {/* Officer Delegation Section */}
          {role === 'admin' && !isTerminal && (
            <div className={`border-2 rounded-xl sm:rounded-2xl transition-all duration-300 ${isDelegationOpen ? 'bg-indigo-50/50 border-indigo-200 p-4 sm:p-6' : 'bg-indigo-50/30 border-indigo-100 p-3.5'}`}>
              <button
                onClick={() => setIsDelegationOpen(!isDelegationOpen)}
                className="w-full flex items-center justify-between outline-none"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className={`material-symbols-outlined text-[20px] ${isDelegationOpen ? 'text-indigo-600' : 'text-indigo-400'}`}>assignment_ind</span>
                  <h3 className={`text-[12px] sm:text-[15px] font-black uppercase tracking-wider ${isDelegationOpen ? 'text-indigo-900' : 'text-indigo-800/70'}`}>Staff Delegation</h3>
                </div>
                <div className="flex items-center gap-2">
                  {caseData.assigned_to_details && !isDelegationOpen && (
                    <span className="text-[9px] sm:text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {caseData.assigned_to_details.full_name}
                    </span>
                  )}
                  <span className={`material-symbols-outlined transition-transform duration-300 ${isDelegationOpen ? 'rotate-180' : 'text-slate-400'}`}>expand_more</span>
                </div>
              </button>

              {isDelegationOpen && (
                <div className="mt-4 sm:mt-5 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <select
                      value={selectedOfficer || ""}
                      onChange={(e) => setSelectedOfficer(e.target.value)}
                      className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-3.5 py-2.5 text-[12.5px] sm:text-[13.5px] font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all cursor-pointer"
                    >
                      <option value="">Choose Officer to Delegate...</option>
                      {officers.map(off => (
                        <option key={off.email} value={off.email}>{off.full_name}</option>
                      ))}
                    </select>
                    <button
                      disabled={!selectedOfficer || isUpdating}
                      onClick={() => onAssign(caseData.id, selectedOfficer)}
                      className="bg-indigo-600 text-white px-5 sm:px-6 py-2.5 rounded-xl text-[11px] sm:text-[13px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-30 shadow-md shadow-indigo-900/10 cursor-pointer"
                    >
                      Delegate Case
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Handbook Rule, Location, Logging Officer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1 bg-slate-50/70 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100">
            <div>
              <p className="text-[9.5px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Handbook Rule</p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">menu_book</span>
                <div className="min-w-0">
                  <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 truncate">{caseData.rule_details?.rule_code}</p>
                  <p className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider truncate">{(caseData.rule_details?.category || 'General').replace(/^(Major|Minor|General)\s*[—\-]\s*/i, '')}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[9.5px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">location_on</span>
                <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 truncate">{caseData.location || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-[9.5px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Logging Officer</p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified_user</span>
                <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 truncate">{caseData.officer_name || 'System Admin'}</p>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="pt-4 sm:pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col">
              <h4 className="text-[11px] sm:text-[12px] font-black text-[#003624] uppercase tracking-widest mb-0.5">
                {isTerminal ? 'Institutional Record Locked'
                  : caseData.status === 'DECISION_RENDERED' ? 'Awaiting Fulfillment'
                    : caseData.status === 'AWAITING_DECISION' ? 'Pending Institutional Decision'
                      : (caseData.requires_director_decision && role === 'admin') ? "Director's Case — §27.3.5"
                        : isUnassigned ? 'Unclaimed Violation'
                          : caseData.requires_director_decision ? 'Reserved for Director'
                            : 'Ready for Auto-Sanction'}
              </h4>
              <p className="text-[10.5px] sm:text-[12px] text-slate-400 font-medium">
                {isTerminal ? 'This institutional record is closed and archived.'
                  : caseData.status === 'DECISION_RENDERED' ? 'Waiting for the student to serve the rendered sanction.'
                    : caseData.status === 'AWAITING_DECISION' ? 'Awaiting formal sanction from the SWAFO Director.'
                      : (caseData.requires_director_decision && role === 'admin') ? 'Multi-nature major offense — only you may adjudicate.'
                        : isUnassigned ? 'Review details and take action to begin resolution.'
                          : caseData.requires_director_decision ? 'This case is reserved for the SWAFO Director.'
                            : 'Submit to apply handbook-prescribed sanction.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              {isTerminal ? (
                role === 'admin' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => onUpdate(caseData.id, 'OPEN')}
                    className="w-full sm:w-auto bg-slate-200 text-slate-700 px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-[13px] font-pjs font-bold hover:bg-slate-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdating ? <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[17px] sm:text-[19px]">history</span>}
                    RE-OPEN CASE
                  </button>
                )

              ) : (caseData.requires_director_decision && role === 'admin') ? (
                // Director fast-track: skip self-claim, show actions directly
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                  {caseData.status === 'OPEN' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'AWAITING_DECISION')}
                      className="w-full sm:w-auto bg-rose-600 text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-[13px] font-pjs font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-900/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[17px] sm:text-[19px]">gavel</span>}
                      ESCALATE TO DECISION
                    </button>
                  )}
                  {caseData.status === 'DECISION_RENDERED' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'CLOSED')}
                      className="w-full sm:w-auto bg-[#003624] text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-[13px] font-pjs font-bold hover:bg-[#004d35] transition-all shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[17px] sm:text-[19px]">task_alt</span>}
                      CLOSE CASE (FULFILLED)
                    </button>
                  )}
                </div>

              ) : isUnassigned ? (
                <>
                  {caseData.requires_director_decision && role !== 'admin' ? (
                    <div className="flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl w-full sm:w-auto">
                      <span className="material-symbols-outlined text-[17px] sm:text-[19px] text-rose-500">gavel</span>
                      <div className="flex flex-col">
                        <span className="text-[11px] sm:text-[12px] font-black text-rose-700 uppercase tracking-wider">Reserved for Director</span>
                        <span className="text-[9.5px] sm:text-[10px] text-rose-500 font-medium">§27.3.5 — SWAFO Director Only</span>
                      </div>
                    </div>
                  ) : caseData.status === 'AWAITING_DECISION' && role !== 'admin' ? (
                    <div className="flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 py-2.5 bg-slate-800/50 border border-white/5 rounded-xl text-slate-400 w-full sm:w-auto">
                      <span className="material-symbols-outlined text-[17px] sm:text-[19px]">lock</span>
                      <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-widest">Locked for Director</span>
                    </div>
                  ) : (
                    <button
                      disabled={isUpdating}
                      onClick={() => onClaim(caseData.id)}
                      className="w-full sm:w-auto bg-orange-600 text-white px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-[13px] font-pjs font-bold hover:bg-orange-700 transition-all shadow-md shadow-orange-900/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[17px] sm:text-[19px]">pan_tool</span>}
                      SELF-CLAIM CASE
                    </button>
                  )}
                </>

              ) : isAssignedToMe ? (
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                  {caseData.status === 'OPEN' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'AWAITING_DECISION')}
                      className="w-full sm:w-auto bg-amber-100 text-amber-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-[13px] font-pjs font-bold hover:bg-amber-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-amber-200 cursor-pointer"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[17px] sm:text-[19px]">send</span>}
                      SUBMIT FOR DECISION
                    </button>
                  )}
                  {caseData.status === 'DECISION_RENDERED' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'CLOSED')}
                      className="w-full sm:w-auto bg-[#003624] text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-[13px] font-pjs font-bold hover:bg-[#004d35] transition-all shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[17px] sm:text-[19px]">task_alt</span>}
                      CLOSE CASE (FULFILLED)
                    </button>
                  )}
                </div>

              ) : (
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto items-center">
                  {caseData.status === 'DECISION_RENDERED' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => onUpdate(caseData.id, 'CLOSED')}
                      className="w-full sm:w-auto bg-[#003624] text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-[13px] font-pjs font-bold hover:bg-[#004d35] transition-all shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[17px] sm:text-[19px]">task_alt</span>}
                      CLOSE CASE (FULFILLED)
                    </button>
                  )}
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(caseData.assigned_to_details?.full_name || 'Staff')}&background=cbd5e1&color=64748b`} alt="officer" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-[120px]">
                      {caseData.assigned_to_details?.full_name || 'Staff'}
                    </span>
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

function ActivityItem({ icon, color, title, sub, time, onClick }) {
  return (
    <div onClick={onClick} className="flex gap-5 items-start group cursor-pointer hover:bg-slate-50 p-3 -mx-3 rounded-2xl hover:ring-2 hover:ring-emerald-500/30 transition-all">
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


function AppealReviewWrapper({ appealData, onClose, user }) {
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleUpdate = async (newStatus, remarks) => {
    setIsUpdating(true);
    try {
      const payload = { status: newStatus };
      if (remarks.trim()) {
        payload.reviewer_remarks = remarks;
      }

      const res = await fetch(API_ENDPOINTS.VIOLATIONS_APPEALS_UPDATE(appealData.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const errText = await res.text();
        alert(`Failed to update appeal (${res.status}): ${errText}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Network error: ${err.message}`);
    }
    setIsUpdating(false);
  };

  return (
    <AppealThreadModal
      appeal={appealData}
      onClose={onClose}
      onAction={handleUpdate}
      isUpdating={isUpdating}
      role="OFFICER"
    />
  );
}




function AllAppealsModal({ appeals, onClose, onSelectAppeal }) {
  const [filter, setFilter] = React.useState('ALL');

  const displayed = appeals.filter(a => {
    if (filter === 'PENDING') return a.status === 'PENDING' || a.status === 'REVIEWING';
    if (filter === 'REPLIES') return a.status === 'AWAITING_INFO';
    if (filter === 'RESOLVED') return a.status === 'APPROVED' || a.status === 'REJECTED';
    return true;
  });

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4 sm:p-6 bg-[#003624]/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white rounded-[2rem] w-full max-w-[600px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative" onClick={e => e.stopPropagation()}>

        <div className="shrink-0 p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">history</span>
            </div>
            <h2 className="text-[18px] font-pjs font-extrabold text-[#003624]">Appeals History</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="shrink-0 p-4 border-b border-slate-100 flex gap-2 overflow-x-auto custom-scrollbar bg-white">
          {['ALL', 'PENDING', 'REPLIES', 'RESOLVED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${filter === f ? 'bg-[#003624] text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">
          <div className="flex flex-col gap-3">
            {displayed.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-[32px] text-slate-300 mb-3">inbox</span>
                <p className="text-[14px] font-medium text-slate-500">No appeals found in this category.</p>
              </div>
            ) : (
              displayed.map(a => {
                const timeStr = new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

                let badge = null;
                if (['PENDING', 'REVIEWING'].includes(a.status)) badge = <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">PENDING</span>;
                else if (a.status === 'AWAITING_INFO') badge = <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">REPLY</span>;
                else if (a.status === 'APPROVED') badge = <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">APPROVED</span>;
                else if (a.status === 'REJECTED') badge = <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-700">DENIED</span>;
                else badge = <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700">{a.status}</span>;

                return (
                  <div
                    key={a.id}
                    onClick={() => onSelectAppeal(a)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:ring-2 hover:ring-emerald-500/20 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-bold text-gray-900">{a.student_name}</span>
                        {badge}
                      </div>
                      <p className="text-[12px] font-bold text-slate-500">Ref: {a.violation_code} • Subj: {a.subject}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-slate-400 block">{dateStr}</span>
                      <span className="text-[11px] font-bold text-slate-400 block">{timeStr}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
