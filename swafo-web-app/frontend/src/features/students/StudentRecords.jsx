import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [selectedStudentForPrivileges, setSelectedStudentForPrivileges] = useState(null);
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

      const rawQ = searchQuery.trim();
      const cleanDigits = rawQ.replace(/\D/g, '');
      const strippedQ = (cleanDigits.length === 11 && cleanDigits.startsWith('20')) ? cleanDigits.slice(2) : cleanDigits;
      const barcode = student.barcode_value || '';

      const matchesSearch = name.toLowerCase().includes(rawQ.toLowerCase()) ||
                           id.includes(rawQ) ||
                           (strippedQ && id.includes(strippedQ)) ||
                           barcode.toLowerCase().includes(rawQ.toLowerCase()) ||
                           course.toLowerCase().includes(rawQ.toLowerCase());

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

  const getRiskLevel = (studentOrScore, maybeStanding, maybeStudent) => {
    let student = null;
    let score = 0;
    let studentStanding = null;

    if (studentOrScore && typeof studentOrScore === 'object' && !('tier' in studentOrScore)) {
      student = studentOrScore;
      score = student.risk_score || 0;
      studentStanding = student.risk_standing || null;
    } else {
      score = typeof studentOrScore === 'number' ? studentOrScore : 0;
      studentStanding = maybeStanding || null;
      student = maybeStudent || null;
    }

    const totalVios = student?.violation_count ?? 0;
    const hasPending = student?.has_pending_violations ?? false;
    const isManualHold = student?.clearance_status === 'HOLD' || (studentStanding && studentStanding.clearance_impact === 'HOLD');

    let tier = studentStanding?.tier;

    // Strict alignment: 8+ violations or manual hold MUST be CRITICAL (Disciplinary Probation)
    if (isManualHold || totalVios >= 8 || score > 75) {
      tier = 'CRITICAL';
    } else if (totalVios >= 5 || score > 50) {
      tier = 'HIGH';
    } else if (totalVios >= 2 || hasPending || score > 25) {
      tier = 'MODERATE';
    } else {
      tier = tier || 'LOW';
    }

    if (tier === 'CRITICAL') {
      return {
        label: 'CRITICAL',
        tier: 'CRITICAL',
        standing: 'Disciplinary Probation',
        citation: '',
        consequence: studentStanding?.consequence_summary || 'Clearance placed on HOLD blocking enrollment and graduation. Honors forfeited; referral to SWAFO Director and Student Discipline Board.',
        clearance: studentStanding?.clearance_impact || 'HOLD',
        honors: studentStanding?.honors_eligibility || 'FORFEITED',
        gmc: studentStanding?.gmc_status || 'DENIED',
        color: 'text-rose-600',
        bar: 'bg-rose-500',
        badge: 'bg-rose-50 border-rose-200 text-rose-700',
        privilegePills: {
          clearance: { label: 'HOLD', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: 'block' },
          honors: { label: 'FORFEITED', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: 'cancel' },
          gmc: { label: 'DENIED', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: 'do_not_disturb_on' },
        }
      };
    }
    if (tier === 'HIGH') {
      return {
        label: 'HIGH',
        tier: 'HIGH',
        standing: 'Disciplinary Warning',
        citation: '',
        consequence: studentStanding?.consequence_summary || 'Disqualified from Dean\'s List and Latin Honors. Clearance restricted; Good Moral Certificate withheld.',
        clearance: studentStanding?.clearance_impact || 'RESTRICTED',
        honors: studentStanding?.honors_eligibility || 'DISQUALIFIED',
        gmc: studentStanding?.gmc_status || 'WITHHELD',
        color: 'text-orange-600',
        bar: 'bg-orange-500',
        badge: 'bg-orange-50 border-orange-200 text-orange-700',
        privilegePills: {
          clearance: { label: 'RESTRICTED', bg: 'bg-orange-100 text-orange-800 border-orange-200', icon: 'warning' },
          honors: { label: 'DISQUALIFIED', bg: 'bg-orange-100 text-orange-800 border-orange-200', icon: 'close' },
          gmc: { label: 'WITHHELD', bg: 'bg-orange-100 text-orange-800 border-orange-200', icon: 'pan_tool' },
        }
      };
    }
    if (tier === 'MODERATE') {
      return {
        label: 'MODERATE',
        tier: 'MODERATE',
        standing: 'Under Review',
        citation: '',
        consequence: studentStanding?.consequence_summary || 'Conditional clearance. Honors subject to review; Good Moral Certificate deferred pending case resolution.',
        clearance: studentStanding?.clearance_impact || 'CONDITIONAL',
        honors: studentStanding?.honors_eligibility || 'UNDER_REVIEW',
        gmc: studentStanding?.gmc_status || 'DEFERRED',
        color: 'text-amber-600',
        bar: 'bg-amber-400',
        badge: 'bg-amber-50 border-amber-200 text-amber-700',
        privilegePills: {
          clearance: { label: 'CONDITIONAL', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: 'rule' },
          honors: { label: 'REVIEW', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: 'hourglass_top' },
          gmc: { label: 'DEFERRED', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: 'pending' },
        }
      };
    }
    return {
      label: 'LOW',
      tier: 'LOW',
      standing: 'Good Standing',
      citation: '',
      consequence: studentStanding?.consequence_summary || 'Unrestricted institutional clearance. Eligible for Dean\'s List and Latin Honors; unconditional GMC issuance.',
      clearance: studentStanding?.clearance_impact || 'CLEARED',
      honors: studentStanding?.honors_eligibility || 'ELIGIBLE',
      gmc: studentStanding?.gmc_status || 'AVAILABLE',
      color: 'text-emerald-700',
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      privilegePills: {
        clearance: { label: 'CLEARED', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: 'check_circle' },
        honors: { label: 'ELIGIBLE', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: 'verified' },
        gmc: { label: 'AVAILABLE', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: 'assignment_turned_in' },
      }
    };
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

      {/* ── Handbook & Privileges Explainer Modal ───────────────────────── */}
      {showRiskHelp && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-emerald-950/60 backdrop-blur-md"
          onClick={() => setShowRiskHelp(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-[640px] max-h-[92vh] flex flex-col overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.35)] border border-white/20 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#003624] px-5 sm:px-10 py-5 sm:py-8 flex items-start justify-between shrink-0">
              <div>
                <p className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.25em] sm:tracking-[0.3em] mb-1">DLSU-D Student Handbook 2022–2027</p>
                <h2 className="text-[18px] sm:text-[22px] font-pjs font-bold text-white leading-tight">Institutional Standing &amp; The 3 Core Privileges</h2>
                <p className="text-[12px] sm:text-[13px] text-white/60 mt-1 font-medium">Clearance (§14), Academic Honors, and Good Moral Character</p>
              </div>
              <button
                onClick={() => setShowRiskHelp(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white shrink-0 mt-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 sm:px-10 py-5 sm:py-8 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar flex-1">

              {/* What & Why */}
              <div>
                <p className="text-[12px] sm:text-[13px] font-medium text-slate-600 leading-relaxed">
                  SWAFO evaluates students not as arbitrary numbers, but through the <strong className="text-[#003624]">DLSU-D Student Handbook Disciplinary Framework</strong>. A student's standing directly governs their real-world institutional privileges: enrollment clearance, academic honor qualifications, and official certifications.
                </p>
              </div>

              {/* The 3 Core Stakes */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">The 3 Concrete Stakes</p>
                <div className="space-y-2.5 text-[11.5px] sm:text-[12px]">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-emerald-700 text-[18px] shrink-0 mt-0.5">verified_user</span>
                    <div>
                      <strong className="text-[#003624]">1. Institutional Clearance (Section 14):</strong>
                      <p className="text-slate-600 mt-0.5">Controls registration, add/drop of courses, transcript issuance (OTR), and graduation eligibility.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-amber-700 text-[18px] shrink-0 mt-0.5">workspace_premium</span>
                    <div>
                      <strong className="text-[#003624]">2. Dean's List &amp; Latin Honors:</strong>
                      <p className="text-slate-600 mt-0.5">Academic awards strictly require good conduct standing; warnings or probation disqualify candidate (§26.4, §27.3.5).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-indigo-700 text-[18px] shrink-0 mt-0.5">assignment_turned_in</span>
                    <div>
                      <strong className="text-[#003624]">3. Certificate of Good Moral Character (GMC):</strong>
                      <p className="text-slate-600 mt-0.5">Essential endorsement for PRC board exam applications, scholarship renewal, employment, and law/med school.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Restorative Justice & 30-Day Half-Life */}
              <div className="flex items-start gap-3.5 p-4 sm:p-5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                <span className="material-symbols-outlined text-[#003624] text-[24px] sm:text-[26px] shrink-0 mt-0.5">restore</span>
                <div>
                  <p className="text-[12px] sm:text-[13px] font-bold text-[#003624] mb-0.5">30-Day Half-Life (Restorative Discipline)</p>
                  <p className="text-[11px] sm:text-[12px] text-emerald-900/80 leading-relaxed">
                    Minor violations lose <strong>50% of their weight every 30 days</strong> of sustained good conduct. Resolving pending cases immediately removes the unresolved penalty multiplier, giving students a clear restorative path to rehabilitate their standing.
                  </p>
                </div>
              </div>

              {/* Handbook Standing Tiers Guide */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Institutional Standing Tiers</p>
                <div className="space-y-2.5">
                  {[
                    { 
                      label: 'LOW', 
                      standing: 'Good Standing (§14)', 
                      color: 'bg-emerald-500', 
                      text: 'text-emerald-800', 
                      bg: 'bg-emerald-50/70', 
                      border: 'border-emerald-200/60', 
                      criteria: 'Clean record (0–1 resolved minor violation, 0 pending).',
                      impact: 'Clearance CLEARED; Honors ELIGIBLE; GMC AVAILABLE unconditionally.' 
                    },
                    { 
                      label: 'MODERATE', 
                      standing: 'Under Review (§27.1)', 
                      color: 'bg-amber-400', 
                      text: 'text-amber-800', 
                      bg: 'bg-amber-50/70', 
                      border: 'border-amber-200/60', 
                      criteria: '2–4 infractions, 1 major offense, or active pending case.',
                      impact: 'Clearance CONDITIONAL; Honors subject to semester review; GMC DEFERRED.' 
                    },
                    { 
                      label: 'HIGH', 
                      standing: 'Disciplinary Warning (§26.4)', 
                      color: 'bg-orange-500', 
                      text: 'text-orange-800', 
                      bg: 'bg-orange-50/70', 
                      border: 'border-orange-200/60', 
                      criteria: '5–7 infractions or 2 major offenses. Formation required.',
                      impact: 'Clearance RESTRICTED; Honors DISQUALIFIED; GMC WITHHELD.' 
                    },
                    { 
                      label: 'CRITICAL', 
                      standing: 'Disciplinary Probation (§27.3.5)', 
                      color: 'bg-rose-500', 
                      text: 'text-rose-800', 
                      bg: 'bg-rose-50/70', 
                      border: 'border-rose-200/60', 
                      criteria: '8+ infractions, 3+ major offenses, or manual clearance HOLD.',
                      impact: 'Clearance HOLD (enrollment locked); Honors FORFEITED; GMC DENIED; SDB referral.' 
                    },
                  ].map(tier => (
                    <div key={tier.label} className={`flex items-start gap-3 sm:gap-3.5 p-3 sm:px-4 sm:py-3 rounded-2xl border ${tier.bg} ${tier.border}`}>
                      <div className={`w-2 sm:w-2.5 h-12 rounded-full ${tier.color} shrink-0 mt-0.5`}></div>
                      <div className="w-24 sm:w-28 shrink-0">
                        <span className={`text-[10.5px] font-black uppercase tracking-wider block ${tier.text}`}>{tier.standing}</span>
                        <p className="text-[9.5px] font-bold text-slate-500 mt-0.5">{tier.criteria}</p>
                      </div>
                      <p className={`text-[10.5px] sm:text-[11px] font-medium leading-relaxed ${tier.text} pl-1`}>{tier.impact}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Student Privileges & Standing Dossier Modal ────────────────── */}
      {selectedStudentForPrivileges && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-emerald-950/60 backdrop-blur-md"
          onClick={() => setSelectedStudentForPrivileges(null)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-[680px] max-h-[92vh] flex flex-col overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.35)] border border-white/20 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#003624] px-5 sm:px-8 py-5 sm:py-6 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-black text-[16px] shrink-0">
                  {selectedStudentForPrivileges.user_details?.full_name?.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.25em] mb-0.5">Institutional Standing Dossier</p>
                  <h2 className="text-[18px] sm:text-[20px] font-pjs font-bold text-white leading-tight">
                    {selectedStudentForPrivileges.user_details?.full_name || 'Student Record'}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5 text-white/60 text-[11px] font-medium font-mono">
                    <span>ID: {selectedStudentForPrivileges.student_number}</span>
                    <span>•</span>
                    <span className="truncate max-w-[200px]">{selectedStudentForPrivileges.course || 'Academic Program'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForPrivileges(null)}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white shrink-0 mt-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            {(() => {
              const risk = getRiskLevel(selectedStudentForPrivileges);
              const totalVios = selectedStudentForPrivileges.violation_count || 0;
              const hasPending = selectedStudentForPrivileges.has_pending_violations;

              return (
                <div className="px-5 sm:px-8 py-5 sm:py-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  
                  {/* Current Academic Standing Overview */}
                  <div className={`p-4 rounded-2xl border ${risk.badge} flex flex-col gap-2.5`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${risk.bar} ${risk.tier === 'CRITICAL' ? 'animate-pulse' : ''}`}></span>
                        <span className="text-[15px] font-pjs font-extrabold tracking-tight uppercase">{risk.standing}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                        <span className="bg-white/90 px-2.5 py-0.5 rounded-md border border-black/5">
                          {totalVios} Infraction{totalVios !== 1 ? 's' : ''}
                        </span>
                        {hasPending && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-md">
                            Pending Case
                          </span>
                        )}
                        {selectedStudentForPrivileges.is_repeat_offender && (
                          <span className="bg-rose-100 text-rose-900 border border-rose-200 px-2.5 py-0.5 rounded-md">
                            Repeat Offender
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[12px] font-medium leading-relaxed opacity-90">
                      {risk.consequence}
                    </p>
                  </div>

                  {/* The 3 Core Privileges Grid */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      Privilege Status &amp; Impact
                    </p>

                    {/* Privilege 1: Clearance */}
                    <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#003624] flex items-center justify-center shrink-0 border border-emerald-100">
                          <span className="material-symbols-outlined text-[20px]">verified_user</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-pjs font-bold text-[#003624]">Institutional Clearance</h4>
                          <p className="text-[11.5px] text-slate-500 font-medium">
                            {risk.clearance === 'HOLD' ? 'Enrollment & graduation locked; official transcript requests blocked' :
                             risk.clearance === 'RESTRICTED' ? 'Restricted enrollment; mandatory formation required before registration' :
                             risk.clearance === 'CONDITIONAL' ? 'Conditional clearance; active obligations must be resolved' :
                             'Full unrestricted clearance for enrollment and graduation'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${risk.privilegePills.clearance.bg}`}>
                        {risk.privilegePills.clearance.label}
                      </span>
                    </div>

                    {/* Privilege 2: Honors */}
                    <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shrink-0 border border-amber-100">
                          <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-pjs font-bold text-[#003624]">Dean's List &amp; Latin Honors</h4>
                          <p className="text-[11.5px] text-slate-500 font-medium">
                            {risk.honors === 'FORFEITED' ? 'Permanently forfeited during disciplinary probation period' :
                             risk.honors === 'DISQUALIFIED' ? 'Disqualified from Dean\'s List awards for the current term' :
                             risk.honors === 'UNDER_REVIEW' ? 'Under review pending student clearance committee evaluation' :
                             'Fully eligible for term Dean\'s List and graduation Latin Honors'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${risk.privilegePills.honors.bg}`}>
                        {risk.privilegePills.honors.label}
                      </span>
                    </div>

                    {/* Privilege 3: GMC */}
                    <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center shrink-0 border border-indigo-100">
                          <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-pjs font-bold text-[#003624]">Certificate of Good Moral Character</h4>
                          <p className="text-[11.5px] text-slate-500 font-medium">
                            {risk.gmc === 'DENIED' ? 'Denied; case officially referred to Student Discipline Board' :
                             risk.gmc === 'WITHHELD' ? 'Withheld until all sanction formation requirements are cleared' :
                             risk.gmc === 'DEFERRED' ? 'Deferred pending case resolution with SWAFO' :
                             'Available for immediate official issuance by SWAFO staff'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${risk.privilegePills.gmc.bg}`}>
                        {risk.privilegePills.gmc.label}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 sm:px-8 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
              <button
                onClick={() => {
                  const id = selectedStudentForPrivileges.student_number;
                  setSelectedStudentForPrivileges(null);
                  navigate(`/${role}/students/${id}`);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#003624] text-white hover:bg-[#00271a] text-[12px] font-black transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">folder_open</span>
                <span>Open Student Incident Dossier</span>
              </button>

              <button
                onClick={() => setSelectedStudentForPrivileges(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-[12px] font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
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
              value={collegeFilter || ""}
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
                value={searchQuery || ""}
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
                    Institutional Standing &amp; Privileges
                    <button
                      onClick={() => setShowRiskHelp(true)}
                      className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 hover:bg-[#003624] hover:text-white transition-all flex items-center justify-center text-[11px] font-black leading-none cursor-pointer"
                      title="How is institutional standing & privileges evaluated under the handbook?"
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
                         const risk = getRiskLevel(student);
                         return (
                           <div className="flex flex-col gap-2 min-w-[240px]">
                             {/* 3 Core Stakes Micro-Pills */}
                             <div className="grid grid-cols-3 gap-1.5">
                               <div className={`px-2 py-1.5 rounded-lg text-center border text-[9.5px] font-black tracking-tight ${risk.privilegePills.clearance.bg}`} title="Institutional Clearance">
                                 <span className="block text-[7.5px] opacity-60 font-bold uppercase">Clearance</span>
                                 <span className="truncate block">{risk.privilegePills.clearance.label}</span>
                               </div>
                               <div className={`px-2 py-1.5 rounded-lg text-center border text-[9.5px] font-black tracking-tight ${risk.privilegePills.honors.bg}`} title="Dean's List & Latin Honors">
                                 <span className="block text-[7.5px] opacity-60 font-bold uppercase">Honors</span>
                                 <span className="truncate block">{risk.privilegePills.honors.label}</span>
                               </div>
                               <div className={`px-2 py-1.5 rounded-lg text-center border text-[9.5px] font-black tracking-tight ${risk.privilegePills.gmc.bg}`} title="Good Moral Certificate (GMC)">
                                 <span className="block text-[7.5px] opacity-60 font-bold uppercase">GMC</span>
                                 <span className="truncate block">{risk.privilegePills.gmc.label}</span>
                               </div>
                             </div>

                             {/* Inspect 3 Privileges Button */}
                             <button
                               onClick={() => setSelectedStudentForPrivileges(student)}
                               className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-50/70 hover:bg-[#003624] text-[#003624] hover:text-white border border-emerald-200/80 hover:border-[#003624] text-[10.5px] font-black tracking-wide transition-all shadow-xs group/btn cursor-pointer"
                             >
                               <span className="material-symbols-outlined text-[14px] transition-transform group-hover/btn:scale-110">shield_person</span>
                               <span>Inspect 3 Privileges</span>
                               <span className="material-symbols-outlined text-[13px] opacity-60 ml-auto group-hover/btn:translate-x-0.5 transition-transform">chevron_right</span>
                             </button>
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
              const risk = getRiskLevel(student);

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

                  {/* Third Row: Institutional 3 Privileges Card */}
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-2">
                    {/* 3 Core Stakes Micro-Pills */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className={`px-1.5 py-1 rounded-lg text-center border text-[9px] font-black ${risk.privilegePills.clearance.bg}`}>
                        <span className="block text-[7.5px] opacity-60 font-bold uppercase">Clearance</span>
                        <span className="truncate block">{risk.privilegePills.clearance.label}</span>
                      </div>
                      <div className={`px-1.5 py-1 rounded-lg text-center border text-[9px] font-black ${risk.privilegePills.honors.bg}`}>
                        <span className="block text-[7.5px] opacity-60 font-bold uppercase">Honors</span>
                        <span className="truncate block">{risk.privilegePills.honors.label}</span>
                      </div>
                      <div className={`px-1.5 py-1 rounded-lg text-center border text-[9px] font-black ${risk.privilegePills.gmc.bg}`}>
                        <span className="block text-[7.5px] opacity-60 font-bold uppercase">GMC</span>
                        <span className="truncate block">{risk.privilegePills.gmc.label}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedStudentForPrivileges(student)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-[#003624] text-[#003624] hover:text-white border border-slate-200 hover:border-[#003624] text-[11px] font-black tracking-wide transition-all shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">shield_person</span>
                      <span>Inspect 3 Privileges</span>
                      <span className="material-symbols-outlined text-[13px] opacity-60 ml-auto">chevron_right</span>
                    </button>
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
