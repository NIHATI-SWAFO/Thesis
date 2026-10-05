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
        console.error("Failed to submit appeal");
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
    <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8 animate-fade-in-up pb-12">

      {/* ══════════════════════════ HEADER ══════════════════════════ */}
      <section className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-emerald-100/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-manrope font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              SWAFO Conduct Portal
            </span>
            <span className="text-xs text-slate-400 font-medium">Official Registry</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-pjs font-bold text-[#003624] tracking-tight leading-tight">
            Violation Records &amp; History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-manrope mt-1 max-w-2xl leading-relaxed">
            Transparent view of recorded campus incidents, disciplinary actions, and remediation pathways.
          </p>
        </div>

        <button
          onClick={handleExportClick}
          className="self-start md:self-center px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/40 text-slate-700 font-pjs font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-700">download</span>
          Export Records (.CSV)
        </button>
      </section>

      {/* ══════════════════════════ METRICS OVERVIEW ══════════════════════════ */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-pjs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Active Obligations
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-pjs text-slate-900 leading-none">
              {pendingCount.toString().padStart(2, '0')}
            </h3>
            <p className="text-[11px] text-amber-700 font-medium font-manrope mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {pendingCount > 0 ? "Requires review or appeal" : "All cases cleared"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">hourglass_top</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-pjs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Resolved Cases
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-pjs text-slate-900 leading-none">
              {closedCount.toString().padStart(2, '0')}
            </h3>
            <p className="text-[11px] text-emerald-700 font-medium font-manrope mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Finalized or Dismissed
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">check_circle</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-pjs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Conduct Standing
            </p>
            <h3 className="text-base sm:text-lg font-bold font-pjs text-slate-900 leading-tight">
              {isProbation ? "Disciplinary Probation" : pendingCount > 0 ? "Under Review" : "Good Standing"}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium font-manrope mt-1">
              Total lifetime: {totalRecords} record(s)
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isProbation ? 'bg-rose-50 text-rose-600' : pendingCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-700'
            }`}>
            <span className="material-symbols-outlined text-[24px]">
              {isProbation ? 'gavel' : pendingCount > 0 ? 'info' : 'verified'}
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ FILTER TABS & SEARCH BAR ══════════════════════════ */}
      <section className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-pjs font-bold transition-all cursor-pointer ${activeTab === 'ALL'
                ? 'bg-white text-[#003624] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            All ({totalRecords})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-pjs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'PENDING'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <span>Pending ({pendingCount})</span>
            {pendingCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
          </button>
          <button
            onClick={() => setActiveTab('CLOSED')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-pjs font-bold transition-all cursor-pointer ${activeTab === 'CLOSED'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            Resolved ({closedCount})
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-[280px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records by title, rule or ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 font-manrope transition-all"
          />
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

                  {/* Violation Title & Description */}
                  <div className="mb-4">
                    <h3 className="text-base sm:text-xl font-pjs font-bold text-slate-900 leading-snug tracking-tight">
                      {violation.title}
                    </h3>
                    {violation.ruleDescription && violation.ruleDescription !== violation.title && (
                      <p className="text-xs sm:text-sm text-slate-500 font-manrope mt-1.5 leading-relaxed">
                        {violation.ruleDescription}
                      </p>
                    )}
                  </div>

                  {/* Incident Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-xl sm:rounded-2xl border border-slate-100 mb-4 text-xs font-manrope">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-700 text-[18px] shrink-0 mt-0.5">location_on</span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location Recorded</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{violation.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-700 text-[18px] shrink-0 mt-0.5">shield</span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Logging Authority</p>
                        <p className="font-semibold text-slate-700 mt-0.5 truncate">{violation.officer}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action & Sanction Banner */}
                  <div className={`p-4 rounded-xl sm:rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${isClosed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/60 border-amber-200/70'
                    }`}>
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isClosed ? 'bg-emerald-600 text-white shadow-xs' : 'bg-amber-500 text-white shadow-xs'
                        }`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {isClosed ? 'check_circle' : 'gavel'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isClosed ? 'text-emerald-800' : 'text-amber-900'}`}>
                          {isClosed ? "Director's Final Decision" : "Prescribed Action / Remediation"}
                        </p>
                        <p className="text-xs sm:text-[13px] font-bold text-slate-800 font-manrope mt-0.5 leading-snug">
                          {violation.sanction}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTakeAction(violation)}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-pjs text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95 ${isClosed
                          ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs'
                          : 'bg-[#003624] hover:bg-[#004d33] text-white shadow-sm'
                        }`}
                    >
                      <span>View Details</span>
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </section>

      {/* ══════════════════════════ INQUIRY & APPEAL BANNER ══════════════════════════ */}
      <section className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-pjs font-bold text-[#003624]">Questions about a violation record?</h3>
          <p className="text-xs text-slate-500 font-manrope mt-0.5 max-w-xl leading-relaxed">
            Students may request clarification, present justification, or submit a formal appeal to the SWAFO Discipline Office within 14 calendar days of case filing.
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

      {/* ══════════════════════════ CASE DETAILS MODAL ══════════════════════════ */}
      {showModal && selectedViolation && createPortal(
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
      )}

    </div>
  );
}
