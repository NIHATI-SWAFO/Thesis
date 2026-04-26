import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../api/config';

export default function StudentRecords({ role = 'officer' }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'COMPLIANT', 'UNDER_REVIEW', 'NON_COMPLIANT'
  const [showRiskHelp, setShowRiskHelp] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch(API_ENDPOINTS.USERS_LIST)
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching students:", err);
        setLoading(false);
      });
  }, []);

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
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-emerald-950/50 backdrop-blur-sm"
          onClick={() => setShowRiskHelp(false)}
        >
          <div
            className="bg-white rounded-[2.5rem] w-full max-w-[580px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.25)] border border-white/20 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#003624] px-10 py-8 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.3em] mb-1">Algorithm Transparency</p>
                <h2 className="text-[22px] font-pjs font-bold text-white leading-tight">Temporal Decay Risk Score</h2>
                <p className="text-[13px] text-white/50 mt-1 font-medium">How behavioral risk is calculated</p>
              </div>
              <button
                onClick={() => setShowRiskHelp(false)}
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white mt-1"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-10 py-8 space-y-7">

              {/* What & Why */}
              <div>
                <p className="text-[13px] font-bold text-slate-500 leading-relaxed">
                  A raw violation count treats a incident from <strong className="text-[#003624]">2 years ago</strong> the same as one from <strong className="text-[#003624]">yesterday</strong>. The Risk Score fixes this by measuring <em>how recent and how serious</em> each violation is — giving the Director a number that reflects the student's behavioral state <strong className="text-[#003624]">right now</strong>.
                </p>
              </div>

              {/* Formula */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Formula (per violation)</p>
                <div className="bg-[#003624] rounded-xl px-5 py-3 font-mono text-[13px] text-emerald-300 mb-4">
                  score = severity × e<sup>−0.023 × days_ago</sup> × (1.5 if unresolved)
                </div>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
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
              <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="material-symbols-outlined text-blue-500 text-[28px] shrink-0">schedule</span>
                <div>
                  <p className="text-[12px] font-black text-blue-800 mb-1">30-Day Half-Life</p>
                  <p className="text-[12px] text-blue-700 leading-relaxed">A violation loses <strong>50% of its risk weight every 30 days</strong>. A major incident from 6 months ago weighs only ~0.5 pts. A major incident from yesterday weighs 30 pts. This rewards genuine behavioral improvement over time.</p>
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
                    <div key={tier.label} className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${tier.bg} ${tier.border}`}>
                      <div className={`w-2 h-8 rounded-full ${tier.color} shrink-0`}></div>
                      <div className="w-20 shrink-0">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${tier.text}`}>{tier.label}</span>
                        <p className="text-[11px] font-bold text-slate-500">{tier.range}</p>
                      </div>
                      <p className={`text-[11px] font-medium ${tier.text}`}>{tier.action}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
        <div>
          <h1 className="text-[36px] font-pjs font-extrabold text-[#003624] tracking-tight mb-2">
            Institutional Student Records
          </h1>
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200">
               {isAdmin ? 'Director Access' : 'Officer Access'}
             </span>
             <p className="text-[14px] text-gray-500 font-manrope font-medium italic">
               Master compliance registry and behavioral risk management.
             </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-[400px]">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search by name, ID, or course..."
              className="w-full pl-13 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[14px] font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>
      </div>

      {/* Compliance Filtering Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-slate-100/50 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'ALL', label: 'All Students', count: stats.total },
          { id: 'COMPLIANT', label: '🟢 Compliant', count: stats.compliant },
          { id: 'UNDER_REVIEW', label: '⚪ Under Review', count: stats.underReview },
          { id: 'NON_COMPLIANT', label: '🔴 Non-Compliant', count: stats.nonCompliant },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
            className={`px-6 py-3 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-[#003624] shadow-md border border-slate-100' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label} <span className="ml-2 opacity-40 font-bold">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Main Data View */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,54,36,0.04)] border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-6 px-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">Student / Identification</th>
                <th className="py-6 px-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">Institutional Compliance</th>
                <th className="py-6 px-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">
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
                {isAdmin && <th className="py-6 px-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">Clearance Status</th>}
                <th className="py-6 px-10 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentData.map((student) => {
                const name = student.user_details?.full_name || 'N/A';
                const id = student.student_number;
                const hasUnresolved = (student.violation_count || 0) > 0 && student.has_pending_violations; 
                const status = student.is_repeat_offender ? 'NON_COMPLIANT' : hasUnresolved ? 'UNDER_REVIEW' : 'COMPLIANT';
                
                return (
                  <tr key={student.id} className="group hover:bg-emerald-50/10 transition-all duration-300">
                    <td className="py-8 px-10">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[14px] shadow-inner border transition-transform group-hover:scale-110 duration-500 ${
                          status === 'NON_COMPLIANT' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                          status === 'UNDER_REVIEW' ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {name.split(' ').map(n => n[0]).join('')}
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
                    <td className="py-8 px-10">
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
                    <td className="py-8 px-10">
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
                      <td className="py-8 px-10">
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
                    <td className="py-8 px-10 text-right">
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

        {/* Institutional Pagination */}
        <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col">
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Pagination Control</span>
             <p className="text-[13px] font-bold text-[#003624]">Showing {currentData.length} of {filteredStudents.length} Institutional Records</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 disabled:opacity-20 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            
            <div className="flex gap-1.5 px-3">
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentPage(i + 1)} 
                  className={`w-10 h-10 rounded-xl text-[13px] font-black transition-all ${
                    currentPage === i + 1 
                      ? 'bg-[#003624] text-white shadow-lg scale-110' 
                      : 'text-slate-400 hover:bg-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages} 
              className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 disabled:opacity-20 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
