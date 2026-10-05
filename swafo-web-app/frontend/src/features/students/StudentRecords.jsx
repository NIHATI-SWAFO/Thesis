import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../api/config';
import { useColleges } from '../../hooks/useColleges';

export default function StudentRecords({ role = 'officer' }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showRiskHelp, setShowRiskHelp] = useState(false);
  const { colleges } = useColleges();
  const itemsPerPage = 10;

  useEffect(() => {
    const url = collegeFilter
      ? `${API_ENDPOINTS.USERS_LIST}?college=${encodeURIComponent(collegeFilter)}`
      : API_ENDPOINTS.USERS_LIST;
    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching students:', err);
        setLoading(false);
      });
  }, [collegeFilter]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const name = student.user_details?.full_name || '';
      const id = student.student_number || '';
      const course = student.course || '';

      const hasUnresolved = (student.violation_count || 0) > 0 && student.has_pending_violations;
      const complianceStatus = student.is_repeat_offender ? 'NON_COMPLIANT' : hasUnresolved ? 'UNDER_REVIEW' : 'COMPLIANT';

      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           id.includes(searchQuery) ||
                           course.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab = activeTab === 'ALL' || complianceStatus === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [searchQuery, students, activeTab]);

  const stats = useMemo(() => {
    return {
      total: students.length,
      compliant: students.filter(s => s.violation_count === 0).length,
      underReview: students.filter(s => (s.violation_count > 0 && s.has_pending_violations && !s.is_repeat_offender)).length,
      nonCompliant: students.filter(s => s.is_repeat_offender).length
    };
  }, [students]);

  const currentData = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handleClearanceToggle = (studentId, currentStatus) => {
    if (role !== 'admin') return;
    
    const newStatus = currentStatus === 'CLEARED' ? 'HOLD' : 'CLEARED';
    
    // In a real app, this would be an API call. For now, we update local state.
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, clearance_status: newStatus } : s
    ));

    // Optional: Call API to persist
    fetch(`${API_ENDPOINTS.USERS_LIST}${studentId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearance_status: newStatus })
    }).catch(err => console.error("Error updating clearance:", err));
  };

  const getRiskLevel = (score) => {
    if (score > 75) return { label: 'CRITICAL', color: 'text-rose-600', bar: 'bg-rose-500', badge: 'bg-rose-50 border-rose-100 text-rose-600' };
    if (score > 50) return { label: 'HIGH', color: 'text-orange-600', bar: 'bg-orange-500', badge: 'bg-orange-50 border-orange-100 text-orange-600' };
    if (score > 25) return { label: 'MODERATE', color: 'text-amber-600', bar: 'bg-amber-400', badge: 'bg-amber-50 border-amber-100 text-amber-600' };
    return { label: 'LOW', color: 'text-emerald-600', bar: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-100 text-emerald-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#003624] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-pjs font-bold text-[#003624]">Institutional Data Synchronizing...</p>
        </div>
      </div>
    );
  }

  const isAdmin = role === 'admin';

  return (
    <div className="max-w-[1600px] mx-auto animate-fade-in-up pb-12">

      {/* ── Risk Help Modal ───────────────────────────────────────────────── */}
      {showRiskHelp && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-emerald-950/60 backdrop-blur-sm"
          onClick={() => setShowRiskHelp(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-[580px] max-h-[92vh] flex flex-col overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.25)] border border-white/20 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#003624] px-5 sm:px-10 py-5 sm:py-8 flex items-start justify-between shrink-0">
              <div>
                <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.25em] sm:tracking-[0.3em] mb-1">Algorithm Transparency</p>
                <h2 className="text-[18px] sm:text-[22px] font-pjs font-bold text-white leading-tight">Temporal Decay Risk Score</h2>
                <p className="text-[12px] sm:text-[13px] text-white/50 mt-1 font-medium">How behavioral risk is calculated</p>
              </div>
              <button
                onClick={() => setShowRiskHelp(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white shrink-0 mt-0.5"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 sm:px-10 py-5 sm:py-8 space-y-5 sm:space-y-7 overflow-y-auto custom-scrollbar">

              {/* What & Why */}
              <div>
                <p className="text-[12px] sm:text-[13px] font-bold text-slate-500 leading-relaxed">
                  A raw violation count treats an incident from <strong className="text-[#003624]">2 years ago</strong> the same as one from <strong className="text-[#003624]">yesterday</strong>. The Risk Score fixes this by measuring <em>how recent and how serious</em> each violation is — giving the Director a number that reflects the student's behavioral state <strong className="text-[#003624]">right now</strong>.
                </p>
              </div>

              {/* Formula */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3">Formula (per violation)</p>
                <div className="bg-[#003624] rounded-xl px-4 sm:px-5 py-3 font-mono text-[11px] sm:text-[13px] text-emerald-300 mb-3 sm:mb-4 overflow-x-auto">
                  score = severity × e<sup>−0.023 × days_ago</sup> × (1.5 if unresolved)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-[11px] sm:text-[12px]">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                    <span className="text-slate-600"><strong>Major violation</strong> — 30 pts base</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <span className="text-slate-600"><strong>Minor violation</strong> — 15 pts base</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0"></span>
                    <span className="text-slate-600"><strong>General</strong> — 10 pts base</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
                    <span className="text-slate-600"><strong>Unresolved</strong> — ×1.5 multiplier</span>
                  </div>
                </div>
              </div>

              {/* Half-life */}
              <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="material-symbols-outlined text-blue-500 text-[24px] sm:text-[28px] shrink-0 mt-0.5">schedule</span>
                <div>
                  <p className="text-[11px] sm:text-[12px] font-black text-blue-800 mb-0.5 sm:mb-1">30-Day Half-Life</p>
                  <p className="text-[11px] sm:text-[12px] text-blue-700 leading-relaxed">A violation loses <strong>50% of its risk weight every 30 days</strong>. A major incident from 6 months ago weighs only ~0.5 pts. A major incident from yesterday weighs 30 pts. This rewards genuine behavioral improvement over time.</p>
                </div>
              </div>

              {/* Risk Tiers */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Interpretation Guide</p>
                <div className="space-y-2">
                  {[
                    { range: '0 – 25', label: 'LOW', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', action: 'No action needed. Student is behaviorally stable.' },
                    { range: '26 – 50', label: 'MODERATE', color: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100', action: 'Emerging pattern. Flag for monitoring.' },
                    { range: '51 – 75', label: 'HIGH', color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100', action: 'Active concern. Schedule counseling or intervention.' },
                    { range: '76 – 100', label: 'CRITICAL', color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100', action: 'Escalate immediately. Clearance HOLD recommended. §27.3.5 review.' },
                  ].map(tier => (
                    <div key={tier.label} className={`flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:px-4 sm:py-3 rounded-xl border ${tier.bg} ${tier.border}`}>
                      <div className={`w-2 h-8 rounded-full ${tier.color} shrink-0 mt-0.5 sm:mt-0`}></div>
                      <div className="w-18 sm:w-20 shrink-0">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${tier.text}`}>{tier.label}</span>
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-500">{tier.range}</p>
                      </div>
                      <p className={`text-[10px] sm:text-[11px] font-medium leading-tight sm:leading-normal ${tier.text}`}>{tier.action}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 sm:mb-10 gap-4 sm:gap-6 px-1">
        <div>
          <h1 className="text-[24px] sm:text-[30px] md:text-[36px] font-pjs font-extrabold text-[#003624] tracking-tight mb-1.5 sm:mb-2">
            Institutional Student Records
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
             <span className="px-2.5 sm:px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-emerald-200 shrink-0">
               {isAdmin ? 'Director Access' : 'Officer Access'}
             </span>
             <p className="text-[11px] sm:text-[12px] md:text-[14px] text-gray-500 font-manrope font-medium italic">
               Master compliance registry and behavioral risk management.
             </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
          {/* College Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              value={collegeFilter}
              onChange={e => { setCollegeFilter(e.target.value); setCurrentPage(1); }}
              className="h-11 sm:h-13 w-full sm:w-auto pl-4 pr-10 bg-white border border-slate-200 sm:border-slate-100 rounded-xl sm:rounded-2xl text-[12px] sm:text-[13px] font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="">All Colleges</option>
              {colleges.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-[300px] xl:w-[340px]">
              <span className="material-symbols-outlined absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 text-slate-300 text-[18px] sm:text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 sm:pl-13 pr-4 sm:pr-6 h-11 sm:h-13 bg-white border border-slate-200 sm:border-slate-100 rounded-xl sm:rounded-2xl text-[13px] sm:text-[14px] font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowRiskHelp(true)}
              title="Risk Scoring Guide"
              className="w-11 h-11 sm:w-13 sm:h-13 shrink-0 rounded-xl sm:rounded-2xl bg-white border border-slate-200 sm:border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Filtering Tabs */}
      <div className="w-full overflow-x-auto scrollbar-hide mb-6 sm:mb-8 pb-1">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/60 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl w-fit min-w-full md:min-w-0">
          {[
            { id: 'ALL', label: 'All Students', count: stats.total },
            { id: 'COMPLIANT', label: '🟢 Compliant', count: stats.compliant },
            { id: 'UNDER_REVIEW', label: '⚪ Review', count: stats.underReview },
            { id: 'NON_COMPLIANT', label: '🔴 Warning', count: stats.nonCompliant },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`px-3.5 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-[13px] font-black uppercase tracking-wider sm:tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-[#003624] shadow-md border border-slate-100' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label} <span className="ml-1 opacity-50 font-bold">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Data View */}
      <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,54,36,0.04)] border border-slate-100 md:border-slate-50 overflow-hidden">
        
        {/* ── DESKTOP VIEW: Full Data Table (Hidden on Mobile) ───────────────── */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px] md:min-w-0">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-6 px-8 lg:px-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">Student / Identification</th>
                <th className="py-6 px-8 lg:px-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">Institutional Compliance</th>
                <th className="py-6 px-8 lg:px-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    Risk Analysis
                    <button
                      onClick={() => setShowRiskHelp(true)}
                      className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 hover:bg-[#003624] hover:text-white transition-all flex items-center justify-center text-[11px] font-black leading-none"
                      title="How is this score calculated?"
                    >
                      ?
                    </button>
                  </div>
                </th>
                {isAdmin && <th className="py-6 px-8 lg:px-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">Clearance Status</th>}
                <th className="py-6 px-8 lg:px-10 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentData.map((student) => {
                const name = student.user_details?.full_name || 'N/A';
                const initials = name && name !== 'N/A' ? name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST';
                const id = student.student_number;
                const hasUnresolved = (student.violation_count || 0) > 0 && student.has_pending_violations; 
                const status = student.is_repeat_offender ? 'NON_COMPLIANT' : hasUnresolved ? 'UNDER_REVIEW' : 'COMPLIANT';
                
                return (
                  <tr key={student.id} className="group hover:bg-emerald-50/10 transition-all duration-300">
                    <td className="py-8 px-8 lg:px-10">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[14px] shadow-inner border transition-transform group-hover:scale-110 duration-500 ${
                          status === 'NON_COMPLIANT' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                          status === 'UNDER_REVIEW' ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[16px] font-pjs font-bold text-[#003624] mb-0.5">{name}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">ID: {id}</span>
                             <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                             <span className="text-[11px] font-bold text-slate-400">{student.course}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-8 px-8 lg:px-10">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border whitespace-nowrap w-fit shadow-sm ${
                          status === 'NON_COMPLIANT' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          status === 'UNDER_REVIEW' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                          'bg-emerald-600 text-white border-emerald-600 shadow-emerald-900/20'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            status === 'NON_COMPLIANT' ? 'bg-rose-500 animate-pulse' :
                            status === 'UNDER_REVIEW' ? 'bg-slate-400' :
                            'bg-white'
                          }`}></span>
                          {status.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 italic">
                          {student.violation_count} Total Violation{student.violation_count !== 1 ? 's' : ''} Recorded
                        </span>
                      </div>
                    </td>
                    <td className="py-8 px-8 lg:px-10">
                       {(() => {
                         const risk = getRiskLevel(student.risk_score || 0);
                         return (
                           <div className="flex flex-col gap-2 min-w-[160px]">
                             <div className="flex items-center justify-between">
                               <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${risk.badge}`}>
                                 <span className={`w-1.5 h-1.5 rounded-full ${risk.bar} ${risk.label === 'CRITICAL' ? 'animate-pulse' : ''}`}></span>
                                 {risk.label}
                               </span>
                               <span className={`text-[16px] font-black ${risk.color}`}>{student.risk_score || 0}</span>
                             </div>
                             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full rounded-full transition-all duration-1000 ease-out ${risk.bar}`}
                                 style={{ width: `${student.risk_score || 0}%` }}
                               ></div>
                             </div>
                             <span className="text-[10px] text-slate-400 font-medium">30-day decay · recency-weighted</span>
                           </div>
                         );
                       })()}
                    </td>
                    {isAdmin && (
                      <td className="py-8 px-8 lg:px-10">
                        <button 
                          onClick={() => handleClearanceToggle(student.id, student.clearance_status)}
                          className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 transition-all group/btn ${
                            student.clearance_status === 'CLEARED' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100' 
                              : 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                           <span className="material-symbols-outlined text-[18px] transition-transform group-hover/btn:rotate-12">
                             {student.clearance_status === 'CLEARED' ? 'verified_user' : 'block'}
                           </span>
                           <span className="text-[12px] font-black uppercase tracking-widest">{student.clearance_status}</span>
                           <span className="material-symbols-outlined text-[16px] opacity-40">sync_alt</span>
                        </button>
                      </td>
                    )}
                    <td className="py-8 px-8 lg:px-10 text-right">
                       <button 
                         onClick={() => navigate(`/${role}/students/${id}`)}
                         className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-[#003624] hover:text-white transition-all shadow-sm border border-slate-100"
                         title="Full Institutional Profile"
                       >
                         <span className="material-symbols-outlined">open_in_new</span>
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── MOBILE VIEW: Touch-Optimized Cards (Hidden on Desktop) ─────────── */}
        <div className="block md:hidden p-3.5 space-y-3">
          {currentData.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-slate-100">
              <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2">person_search</span>
              <p className="text-[13px] font-bold text-slate-500">No student records match criteria.</p>
            </div>
          ) : (
            currentData.map((student) => {
              const name = student.user_details?.full_name || 'N/A';
              const initials = name && name !== 'N/A' ? name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST';
              const id = student.student_number;
              const hasUnresolved = (student.violation_count || 0) > 0 && student.has_pending_violations; 
              const status = student.is_repeat_offender ? 'NON_COMPLIANT' : hasUnresolved ? 'UNDER_REVIEW' : 'COMPLIANT';
              const risk = getRiskLevel(student.risk_score || 0);

              return (
                <div 
                  key={student.id} 
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3 relative hover:border-emerald-300 transition-all"
                >
                  {/* Top Row: Avatar + Name + Student ID + Open Profile Icon */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-[13px] shrink-0 border shadow-inner ${
                        status === 'NON_COMPLIANT' ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                        status === 'UNDER_REVIEW' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-[15px] font-pjs font-bold text-[#003624] leading-tight mb-0.5">
                          {name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-400">
                          <span className="text-slate-500 font-mono">ID: {id}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-slate-600">{student.course || 'No College'}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/${role}/students/${id}`)}
                      className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#003624] hover:text-white flex items-center justify-center border border-slate-200 shrink-0 transition-all"
                      title="Open Profile"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </button>
                  </div>

                  {/* Second Row: Compliance Badge + Violation Count */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                        status === 'NON_COMPLIANT' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                        status === 'UNDER_REVIEW' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                        'bg-emerald-600 text-white border-emerald-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          status === 'NON_COMPLIANT' ? 'bg-rose-500 animate-pulse' :
                          status === 'UNDER_REVIEW' ? 'bg-slate-400' :
                          'bg-white'
                        }`}></span>
                        {status.replace('_', ' ')}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      {student.violation_count || 0} violation{(student.violation_count || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Third Row: Risk Score Bar Card */}
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${risk.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${risk.bar} ${risk.label === 'CRITICAL' ? 'animate-pulse' : ''}`}></span>
                          {risk.label} RISK
                        </span>
                        <button
                          onClick={() => setShowRiskHelp(true)}
                          className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 hover:bg-[#003624] hover:text-white flex items-center justify-center text-[10px] font-black"
                          title="Score explanation"
                        >
                          ?
                        </button>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Score</span>
                        <span className={`text-[16px] font-black ${risk.color}`}>{student.risk_score || 0}</span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out ${risk.bar}`}
                        style={{ width: `${Math.min(100, student.risk_score || 0)}%` }}
                      ></div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium pt-0.5">
                      30-day temporal decay · recency weighted
                    </p>
                  </div>

                  {/* Fourth Row: Admin Clearance Toggle (If Admin) */}
                  {isAdmin && (
                    <div className="pt-1">
                      <button 
                        onClick={() => handleClearanceToggle(student.id, student.clearance_status)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                          student.clearance_status === 'CLEARED' 
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100' 
                            : 'bg-rose-50/80 border-rose-200 text-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">
                            {student.clearance_status === 'CLEARED' ? 'verified_user' : 'block'}
                          </span>
                          <span className="text-[11px] font-black uppercase tracking-wider">
                            Clearance: {student.clearance_status}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider underline flex items-center gap-1 opacity-70">
                          Toggle <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Bottom Action: View Profile */}
                  <button
                    onClick={() => navigate(`/${role}/students/${id}`)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-[#003624] text-slate-700 hover:text-white rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <span>View Academic Profile</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Institutional Pagination */}
        <div className="px-4 sm:px-6 md:px-10 py-5 sm:py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
             <span className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">Pagination Control</span>
             <p className="text-[11px] sm:text-[13px] font-bold text-[#003624]">Showing {currentData.length} of {filteredStudents.length} Records</p>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 disabled:opacity-20 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">chevron_left</span>
            </button>
            
            {/* Desktop page number buttons */}
            <div className="hidden sm:flex gap-1.5 px-2">
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentPage(i + 1)} 
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-[12px] sm:text-[13px] font-black transition-all ${
                    currentPage === i + 1 
                      ? 'bg-[#003624] text-white shadow-lg scale-105' 
                      : 'text-slate-400 hover:bg-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Mobile page indicator */}
            <div className="flex sm:hidden items-center px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-[#003624]">
              {currentPage} / {Math.max(1, totalPages)}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages || totalPages === 0} 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 disabled:opacity-20 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
