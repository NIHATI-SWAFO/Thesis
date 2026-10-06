import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS } from "../../api/config";
import SentAppealsWidget from './SentAppealsWidget';

export default function StudentViolations() {
  const { user } = useAuth();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [mobileTab, setMobileTab] = useState('TIMELINE');
  const [showModal, setShowModal] = useState(false);
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealData, setAppealData] = useState({ subject: '', description: '' });
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setIsAppealing(false);
      setAppealSuccess(false);
      setAppealData({ subject: '', description: '' });
    }, 300);
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealData.subject || !appealData.description) return;

    setIsSubmittingAppeal(true);
    try {
      const payload = {
        violation: selectedViolation.rawId,
        subject: appealData.subject,
        description: appealData.description,
      };

      const res = await fetch(API_ENDPOINTS.VIOLATIONS_APPEALS_SUBMIT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${user.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setAppealSuccess(true);
      } else {
        console.warn("Failed to submit appeal");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetch(`${API_ENDPOINTS.VIOLATIONS_LIST}?email=${user.email}`)
        .then(res => res.json())
        .then(data => {
          const results = Array.isArray(data) ? data : (data.results || []);
          const transformed = results.map(v => ({
            id: `VR-${new Date(v.timestamp).getFullYear()}-${v.id.toString().padStart(3, '0')}`,
            rawId: v.id,
            status: ['CLOSED', 'DISMISSED'].includes(v.status) ? "CLOSED" : "PENDING",
            rawStatus: v.status,
            title: v.rule_details?.title || v.rule_details?.description || v.rule_details?.rule_code || "Policy Violation",
            category: v.rule_details?.category || "General Regulation",
            ruleDescription: v.rule_details?.description || "Refer to Campus Student Handbook for complete policy regulation details.",
            incidentLog: v.description || "Violation recorded during standard campus patrol inspection.",
            officer: v.officer_name || "Institutional Campus Patrol",
            date: new Date(v.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: v.timestamp,
            location: v.location || "Campus Premises",
            directorRemarks: v.director_remarks,
            sanction: v.director_sanction || v.prescribed_sanction || v.corrective_action || "Under Institutional Board Review",
            isMajor: (v.rule_details?.category || '').toUpperCase().includes('MAJOR') || (v.rule_details?.title || '').toUpperCase().includes('MAJOR')
          }));
          setViolations(transformed);
        })
        .catch(err => console.error("Error fetching violations:", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const totalRecords = violations.length;
  const pendingCount = violations.filter(v => v.status === "PENDING").length;
  const closedCount = totalRecords - pendingCount;
  const isProbation = totalRecords >= 5;

  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      const matchesTab = activeTab === 'ALL' || v.status === activeTab;
      const matchesSearch = !searchQuery.trim() ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [violations, activeTab, searchQuery]);

  const handleExportClick = () => {
    const headers = ['Ref ID', 'Status', 'Category', 'Violation Title', 'Date', 'Time', 'Location', 'Prescribed Action'];
    const csvRows = violations.map(v => [
      v.id,
      v.status,
      `"${v.category}"`,
      `"${v.title}"`,
      `"${v.date}"`,
      `"${v.time}"`,
      `"${v.location}"`,
      `"${v.sanction}"`
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_violation_records.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTakeAction = (v) => {
    setSelectedViolation(v);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-[#003624] rounded-full animate-spin mb-4" />
        <p className="font-pjs font-bold text-sm text-[#003624]">Synchronizing Disciplinary Records...</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to institutional records registry</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto space-y-10 max-md:space-y-4 animate-fade-in-up pb-12 max-md:pb-36">

      {/* Page Header */}
      <div className="space-y-3 px-2">
        <h1 className="text-[2.5rem] font-pjs font-bold text-[#1a1a1a] tracking-tight">Violation Records</h1>
        <p className="text-portal-text-muted font-manrope text-[15px] max-w-3xl leading-relaxed">
          As part of our commitment to maintaining the highest institutional standards, this portal provides a transparent view of recorded incidents and subsequent corrective paths.
        </p>
      </div>

      {/* Main Content & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Main 70% Content */}
        <div className="lg:col-span-8 space-y-10">

          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-md:grid max-md:grid-cols-2 max-md:gap-2.5">
            <div className="bg-white p-6 max-md:p-3 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/5 flex flex-col justify-between">
              <div>
                <p className="text-[12px] font-pjs font-bold text-[#003624]/40 uppercase tracking-widest leading-none mb-1">Pending Actions</p>
                <h3 className="text-3xl max-md:text-2xl font-bold font-pjs text-[#003624] leading-none">{pendingCount.toString().padStart(2, '0')}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">hourglass_top</span>
              </div>
            </div>

            <div className="bg-white p-6 max-md:p-3 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/5 flex flex-col justify-between">
              <div>
                <p className="text-[12px] font-pjs font-bold text-[#003624]/40 uppercase tracking-widest leading-none mb-1">Closed History</p>
                <h3 className="text-3xl max-md:text-2xl font-bold font-pjs text-[#003624] leading-none">{closedCount.toString().padStart(2, '0')}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">check_circle</span>
              </div>
            </div>

            <div className={`p-6 rounded-[1.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-500 max-md:col-span-2 max-md:flex-row max-md:p-4 max-md:gap-4 max-md:justify-start ${isProbation ? 'bg-red-600' : 'bg-[#006b5d]'
              }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative z-10 w-full max-md:flex max-md:items-center max-md:text-left max-md:gap-3">
                <p className="text-xs font-pjs font-bold text-white/80 uppercase tracking-widest mb-6 max-md:hidden">Account Status</p>
                <span className="material-symbols-outlined text-[3.5rem] max-md:text-[2rem] text-white font-light tracking-tighter mb-4 max-md:mb-0">
                  {isProbation ? 'gavel' : 'check_circle'}
                </span>
                <div className="max-md:text-left"><p className="text-[10px] font-pjs font-bold text-white/60 uppercase tracking-widest mb-1 md:hidden">Account Status</p><h3 className="text-lg font-pjs font-bold text-white tracking-widest uppercase max-md:text-sm max-md:tracking-wide">
                  {isProbation ? 'Disciplinary Probation' : 'Good Standing'}
                </h3></div>
              </div>
            </div>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="md:hidden flex bg-slate-100 p-1 rounded-xl mt-6">
            <button onClick={() => setMobileTab('TIMELINE')} className={`flex-1 py-2 text-xs font-bold font-pjs rounded-lg transition-all ${mobileTab === 'TIMELINE' ? 'bg-white shadow-sm text-[#003624]' : 'text-slate-500'}`}>Violations Timeline</button>
            <button onClick={() => setMobileTab('APPEALS')} className={`flex-1 py-2 text-xs font-bold font-pjs rounded-lg transition-all ${mobileTab === 'APPEALS' ? 'bg-white shadow-sm text-[#003624]' : 'text-slate-500'}`}>Appeals History</button>
          </div>

          {/* Timeline Section */}
          <div className={`mt-12 max-md:mt-6 space-y-6 ${mobileTab === 'APPEALS' ? 'max-md:hidden' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <h2 className="text-[1.5rem] font-pjs font-bold text-[#1a1a1a] tracking-tight">Timeline of Incidents</h2>
              <div className="flex items-center gap-3 max-md:flex-row max-md:w-full">
                <button onClick={handleFilterClick} className="px-5 max-md:px-3 py-2.5 max-md:py-2 max-md:text-xs max-md:flex-1 max-md:justify-center rounded-full border border-emerald-50/80 bg-white hover:bg-emerald-50/50 text-[#1a1a1a] font-pjs font-bold text-[13px] flex items-center gap-2 transition-all shadow-sm">
                  <span className="material-symbols-outlined text-[18px] text-portal-text-muted">
                    {filterStatus === 'ALL' ? 'filter_list' : 'filter_list_off'}
                  </span>
                  {filterStatus === 'ALL' ? 'Filter' : `Filtered: ${filterStatus}`}
                </button>
                <button onClick={handleExportClick} className="px-5 max-md:px-3 py-2.5 max-md:py-2 max-md:text-xs max-md:flex-1 max-md:justify-center rounded-full border border-emerald-50/80 bg-white hover:bg-emerald-50/50 text-[#1a1a1a] font-pjs font-bold text-[13px] flex items-center gap-2 transition-all shadow-sm active:scale-95">
                  <span className="material-symbols-outlined text-[18px] text-portal-text-muted">download</span>
                  Export Report
                </button>
              </div>
            </div>
          </section>

          {/* ══════════════════════════ INCIDENT CARDS LIST ══════════════════════════ */}
          <section className="space-y-4">
            {filteredViolations.length === 0 ? (
              <div className="py-14 sm:py-20 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-[32px]">folder_open</span>
                </div>
                <h3 className="font-pjs font-bold text-base text-slate-800 mb-1">No Matching Records Found</h3>
                <p className="text-xs text-slate-400 font-manrope max-w-sm mx-auto">
                  {searchQuery
                    ? `No records matching "${searchQuery}". Try adjusting your keywords or clearing the search.`
                    : "There are currently no records listed under this filter category."}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              filteredViolations.map((violation) => {
                const isClosed = violation.status === 'CLOSED';
                return (
                  <div
                    key={violation.id}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100/90 shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Top Banner Stripe */}
                    <div className="p-5 sm:p-7">

                      {/* Card Meta Top Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isClosed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' : 'bg-amber-50 text-amber-800 border border-amber-200/80'
                            }`}>
                            {isClosed ? 'Resolved / Closed' : violation.rawStatus?.replace(/_/g, ' ') || 'Pending Review'}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                            {violation.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{violation.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 font-manrope font-medium">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">event</span>
                            {violation.date} • {violation.time}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                        <div className="lg:col-span-8 space-y-6">
                          <div>
                            <p className="text-[11px] font-pjs font-black text-emerald-600 uppercase tracking-widest mb-1">{violation.category}</p>
                            <h3 className="text-[1.75rem] max-md:text-base font-pjs font-bold max-md:font-semibold text-[#1a1a1a] tracking-tight mb-6 max-md:mb-3 leading-tight">{violation.title}</h3>

                            {violation.ruleDescription && violation.ruleDescription !== violation.title && (
                              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl mb-4">
                                <p className="text-[10px] font-pjs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[14px]">menu_book</span>
                                  Official Handbook Provision
                                </p>
                                <p className="text-[13px] font-manrope text-slate-600 leading-relaxed font-medium">{violation.ruleDescription}</p>
                              </div>
                            )}

                            <div className="px-5 py-5 border-l-4 border-emerald-600/20 bg-emerald-50/10 rounded-r-2xl">
                              <p className="text-[10px] font-pjs font-black text-emerald-600/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">history_edu</span>
                                Officer Incident Log
                              </p>
                              <p className="text-[15px] font-manrope text-[#1a1a1a] leading-relaxed italic font-medium">
                                {violation.incidentLog === "No specific incident remarks recorded."
                                  ? `Violation of ${violation.category} policy recorded at ${violation.location}.`
                                  : `"${violation.incidentLog}"`
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-3 max-md:flex-col">
                          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                            <p className="text-[10px] font-pjs font-black text-slate-400 uppercase tracking-widest mb-4">Incident Metadata</p>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 text-[13px] font-manrope font-semibold text-slate-600">
                                <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_today</span>{violation.date}
                              </div>
                              <div className="flex items-center gap-3 text-[13px] font-manrope font-semibold text-slate-600">
                                <span className="material-symbols-outlined text-[18px] text-slate-400">schedule</span>{violation.time}
                              </div>
                              <div className="flex items-center gap-3 text-[13px] font-manrope font-semibold text-slate-600">
                                <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>{violation.location}
                              </div>
                            </div>
                          </div>
                          <div className="bg-[#003624] p-4 rounded-2xl shadow-lg">
                            <p className="text-[10px] font-pjs font-bold text-white/50 uppercase tracking-widest mb-2">Reporting Authority</p>
                            <div className="flex items-center gap-3 max-md:flex-row max-md:w-full">
                              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white"><span className="material-symbols-outlined text-[18px]">person</span></div>
                              <span className="text-[12px] font-pjs font-bold text-white truncate">{violation.officer}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`p-6 max-md:p-5 rounded-[2rem] border-2 flex flex-col sm:flex-row items-center max-md:items-start max-md:flex-col gap-6 max-md:gap-4 transition-all duration-300 ${violation.actionBox.type === 'action_required' ? 'bg-amber-50/50 border-amber-200 ring-4 ring-amber-50' : 'bg-emerald-50/30 border-emerald-100 ring-4 ring-emerald-50/20'
                        }`}>

                        {/* Desktop Icon - Hidden on Mobile */}
                        <div className={`hidden md:flex w-14 h-14 shrink-0 rounded-[1.25rem] items-center justify-center shadow-lg ${violation.actionBox.type === 'action_required' ? 'bg-amber-500 text-white shadow-amber-900/20' : 'bg-emerald-600 text-white shadow-emerald-900/20'
                          }`}>
                          <span className="material-symbols-outlined text-[28px]">{violation.actionBox.icon}</span>
                        </div>

                        <div className="flex-grow text-center sm:text-left max-md:w-full max-md:text-left">
                          {/* Mobile Header with Inline Icon */}
                          <div className="max-md:flex max-md:items-center max-md:gap-3 max-md:mb-3">
                            <div className={`md:hidden flex w-10 h-10 shrink-0 rounded-xl items-center justify-center shadow-sm ${violation.actionBox.type === 'action_required' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                              <span className="material-symbols-outlined text-[20px]">{violation.actionBox.icon}</span>
                            </div>
                            <h4 className={`text-[11px] font-pjs font-black uppercase tracking-[0.2em] mb-1 max-md:mb-0 ${violation.actionBox.type === 'action_required' ? 'text-amber-700' : 'text-emerald-700'}`}>{violation.actionBox.title}</h4>
                          </div>

                          <p className={`text-[16px] max-md:text-base font-pjs font-bold leading-tight max-md:leading-snug ${violation.actionBox.type === 'action_required' ? 'text-amber-900' : 'text-[#003624]'}`}>{violation.actionBox.description}</p>

                          {violation.directorRemarks && (
                            <div className="mt-4 p-4 bg-white/40 rounded-xl border border-emerald-100/30 w-full">
                              <p className="text-[10px] font-pjs font-black text-emerald-800/40 uppercase tracking-widest mb-1">Institutional Justification</p>
                              <p className="text-[13px] font-manrope font-medium text-emerald-900/70 italic leading-relaxed">"{violation.directorRemarks}"</p>
                            </div>
                          )}
                        </div>

                        {violation.status === 'PENDING' && (
                          <button
                            onClick={() => handleTakeAction(violation)}
                            className="px-8 max-md:px-4 py-3 max-md:py-3.5 max-md:w-full max-md:mt-2 max-md:block bg-[#003624] text-white rounded-xl font-pjs font-bold text-[12px] uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-lg active:scale-95 shrink-0"
                          >
                            <span>View Details</span>
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                          </button>
                  </div>

                    </div>
                  </div>
                ))
            )}
        </div>
      </div>

    </div>
        
        {/* Sidebar 30% Content */ }
  <div className={`lg:col-span-4 space-y-6 ${mobileTab === 'TIMELINE' ? 'max-md:hidden' : ''}`}>
    <SentAppealsWidget />
  </div>
        
      </div >

    <div className="mt-16 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-emerald-50/80 px-2">
      <div className="max-w-xl text-center md:text-left">
        <h3 className="text-lg font-pjs font-bold text-[#003624] tracking-tight mb-1">Incident Inquiry or Appeal?</h3>
        <p className="text-[13px] font-manrope text-portal-text-muted/80 leading-relaxed">
          Students may contest a record or seek clarification through the SWAFO Discipline Office within 14 school days of the logging date.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
        <a
          href="mailto:swafo@dlsud.edu.ph"
          className="w-full sm:w-auto px-5 py-2.5 bg-[#003624] hover:bg-[#004d33] text-white rounded-xl font-pjs font-bold text-xs uppercase tracking-wider transition-all text-center no-underline shadow-sm"
        >
          Email SWAFO Office
        </a>
      </div>
    </section>

  {/* ══════════════════════════ CASE DETAILS MODAL ══════════════════════════ */ }
  {
    showModal && selectedViolation && createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-[540px] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

          {/* Modal Header */}
          <div className="px-6 py-5 bg-[#003624] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[22px]">gavel</span>
              </div>
              <div>
                <h3 className="font-pjs font-bold text-base leading-tight">Case Disciplinary Record</h3>
                <p className="text-xs text-emerald-300 font-mono font-bold">#{selectedViolation.id}</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4 overflow-y-auto font-manrope">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${selectedViolation.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                  {selectedViolation.status === 'CLOSED' ? 'Resolved' : selectedViolation.rawStatus?.replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                  {selectedViolation.category}
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-pjs font-bold text-slate-900 leading-snug">
                {selectedViolation.title}
              </h4>
              {selectedViolation.ruleDescription && (
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <strong className="text-slate-700 block mb-0.5">Handbook Policy Text:</strong>
                  {selectedViolation.ruleDescription}
                </p>
              )}
            </div>

            {/* Incident Metadata */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Location</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedViolation.location}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Date & Time Logged</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedViolation.date} at {selectedViolation.time}</p>
              </div>
            </div>

            {/* Incident Narrative / Remarks */}
            {selectedViolation.incidentLog && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Patrol Officer Log</p>
                <p className="text-slate-700 italic">"{selectedViolation.incidentLog}"</p>
                <p className="text-[10px] text-slate-400 mt-1">— Recorded by {selectedViolation.officer}</p>
              </div>
            )}

            {/* Sanction Details */}
            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs">
              <p className="text-[10px] font-bold uppercase text-emerald-800 mb-1">Sanction / Prescribed Action</p>
              <p className="font-bold text-[#003624] leading-relaxed">
                {selectedViolation.sanction}
              </p>
            </div>

            {selectedViolation.directorRemarks && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Director's Adjudication Remarks</p>
                <p className="text-slate-700 italic">"{selectedViolation.directorRemarks}"</p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                window.open(`mailto:swafo@dlsud.edu.ph?subject=Appeal Request: Case ${selectedViolation?.id}&body=Name: ${user?.name || ''}%0D%0AViolation: ${selectedViolation?.title}%0D%0AReason for Appeal / Clarification: `);
                setShowModal(false);
              }}
              className="flex-1 py-3 bg-[#003624] hover:bg-[#004d33] text-white rounded-xl font-pjs font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer text-center"
            >
              Inquire / Appeal (Email)
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="py-3 px-5 border border-slate-200 text-slate-600 rounded-xl font-pjs font-bold text-xs uppercase tracking-wider hover:bg-white transition-all active:scale-95 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

    </div >
  );
}
