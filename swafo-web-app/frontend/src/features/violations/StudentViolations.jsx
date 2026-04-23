import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS } from "../../api/config";

export default function StudentViolations() {
  const { user } = useAuth();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetch(`${API_ENDPOINTS.VIOLATIONS_LIST}?email=${user.email}`)
        .then(res => res.json())
        .then(data => {
          const results = Array.isArray(data) ? data : (data.results || []);
          const transformed = results.map(v => ({
            id: `VR-${new Date(v.timestamp).getFullYear()}-${v.id.toString().padStart(3, '0')}`,
            status: (v.status === 'RESOLVED' || v.status === 'APPEALED') ? "CLOSED" : "PENDING",
            title: v.rule_details?.description || v.rule_details?.title || v.rule_details?.rule_code || "Policy Violation",
            category: v.rule_details?.category || "General Regulation",
            ruleDescription: v.rule_details?.description || "Refer to Student Handbook for complete policy text.",
            incidentLog: v.description || "No specific incident remarks recorded.",
            officer: v.officer_name || "Institutional Authority",
            date: new Date(v.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            time: new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rawId: v.id,
            location: v.location,
            directorRemarks: v.director_remarks,
            actionBox: {
              type: (v.status === 'RESOLVED' || v.status === 'APPEALED') ? "resolved" : "action_required",
              title: (v.status === 'RESOLVED' || v.status === 'APPEALED') 
                ? (v.director_sanction ? "Director's Adjudication" : "Resolution Details") 
                : "Prescribed Action & Next Steps",
              description: v.director_sanction || v.prescribed_sanction || v.corrective_action || "Pending review by SWAFO officer",
              icon: (v.status === 'RESOLVED' || v.status === 'APPEALED') ? "check_circle" : "error"
            }
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
    if (filterStatus === 'ALL') return violations;
    return violations.filter(v => v.status === filterStatus);
  }, [violations, filterStatus]);

  const handleFilterClick = () => {
    if (filterStatus === 'ALL') setFilterStatus('PENDING');
    else if (filterStatus === 'PENDING') setFilterStatus('CLOSED');
    else setFilterStatus('ALL');
  };

  const handleExportClick = () => {
    const headers = ['Ref ID', 'Status', 'Title', 'Date', 'Time', 'Location', 'Action Needed'];
    const csvRows = violations.map(v => [
      v.id,
      v.status,
      `"${v.title}"`,
      `"${v.date}"`,
      `"${v.time}"`,
      `"${v.location}"`,
      `"${v.actionBox.title}: ${v.actionBox.description}"`
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

  const handleAcknowledge = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.VIOLATIONS_UPDATE_STATUS(selectedViolation.rawId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' })
      });
      
      if (response.ok) {
        const updated = await response.json();
        setViolations(prev => prev.map(v => 
          v.rawId === selectedViolation.rawId ? { 
            ...v, 
            status: 'CLOSED', 
            actionBox: { 
              ...v.actionBox, 
              type: 'resolved', 
              title: 'Resolution Details', 
              description: 'Case Acknowledged & Formally Closed by Student',
              icon: 'check_circle' 
            } 
          } : v
        ));
        setShowModal(false);
      }
    } catch (err) {
      console.error("Acknowledgment error:", err);
    }
  };

  if (loading) return <div className="p-20 text-center font-pjs font-bold text-[#003624] animate-pulse">Synchronizing Records...</div>;

  return (
    <div className="max-w-[1100px] mx-auto space-y-10 animate-fade-in-up pb-12">
      
      {/* Page Header */}
      <div className="space-y-3 px-2">
        <h1 className="text-[2.5rem] font-pjs font-bold text-[#1a1a1a] tracking-tight">Violation Records</h1>
        <p className="text-portal-text-muted font-manrope text-[15px] max-w-3xl leading-relaxed">
          As part of our commitment to maintaining the highest institutional standards, this portal provides a transparent view of recorded incidents and subsequent corrective paths.
        </p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/5 flex flex-col justify-between">
          <div>
            <p className="text-[12px] font-pjs font-bold text-[#003624]/40 uppercase tracking-widest leading-none mb-1">Pending Actions</p>
            <h3 className="text-3xl font-bold font-pjs text-[#003624] leading-none">{pendingCount.toString().padStart(2, '0')}</h3>
          </div>
          <div className="flex items-center gap-2 mt-6 text-portal-text-muted/70 text-sm font-manrope font-medium">
            <span className="material-symbols-outlined text-[18px]">hourglass_bottom</span>
            Action Required
          </div>
        </div>

        <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/5 flex flex-col justify-between">
          <div>
            <p className="text-[12px] font-pjs font-bold text-[#003624]/40 uppercase tracking-widest leading-none mb-1">Closed History</p>
            <h3 className="text-3xl font-bold font-pjs text-[#003624] leading-none">{closedCount.toString().padStart(2, '0')}</h3>
          </div>
          <div className="flex items-center gap-2 mt-6 text-portal-text-muted/70 text-sm font-manrope font-medium">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            Resolved
          </div>
        </div>

        <div className={`p-6 rounded-[1.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-500 ${
          isProbation ? 'bg-red-600' : 'bg-[#006b5d]'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative z-10 w-full">
            <p className="text-xs font-pjs font-bold text-white/80 uppercase tracking-widest mb-6">Account Status</p>
            <span className="material-symbols-outlined text-[3.5rem] text-white font-light tracking-tighter mb-4">
              {isProbation ? 'gavel' : 'check_circle'}
            </span>
            <h3 className="text-lg font-pjs font-bold text-white tracking-widest uppercase">
              {isProbation ? 'Disciplinary Probation' : 'Good Standing'}
            </h3>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="mt-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <h2 className="text-[1.5rem] font-pjs font-bold text-[#1a1a1a] tracking-tight">Timeline of Incidents</h2>
          <div className="flex items-center gap-3">
            <button onClick={handleFilterClick} className="px-5 py-2.5 rounded-full border border-emerald-50/80 bg-white hover:bg-emerald-50/50 text-[#1a1a1a] font-pjs font-bold text-[13px] flex items-center gap-2 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[18px] text-portal-text-muted">
                {filterStatus === 'ALL' ? 'filter_list' : 'filter_list_off'}
              </span>
              {filterStatus === 'ALL' ? 'Filter' : `Filtered: ${filterStatus}`}
            </button>
            <button onClick={handleExportClick} className="px-5 py-2.5 rounded-full border border-emerald-50/80 bg-white hover:bg-emerald-50/50 text-[#1a1a1a] font-pjs font-bold text-[13px] flex items-center gap-2 transition-all shadow-sm active:scale-95">
              <span className="material-symbols-outlined text-[18px] text-portal-text-muted">download</span>
              Export Report
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredViolations.length === 0 ? (
            <div className="p-10 text-center text-portal-text-muted bg-white rounded-[1.5rem] border border-black/5">
              No matching records found.
            </div>
          ) : (
            filteredViolations.map((violation) => (
              <div key={violation.id} className="bg-white p-6 sm:p-7 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-black/5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition-all">
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black font-pjs uppercase tracking-[0.2em] shadow-sm ${
                      violation.status === 'PENDING' 
                        ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' 
                        : 'bg-emerald-100/60 text-[#006b5d] ring-1 ring-emerald-200'
                    }`}>
                      {violation.status}
                    </span>
                    <span className="text-[12px] font-manrope font-bold text-slate-400">ID: {violation.id}</span>
                  </div>
                  <div className={`w-10 h-10 flex items-center justify-center rounded-2xl ${
                    violation.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <span className="material-symbols-outlined text-[24px] fill-1">
                      {violation.status === 'PENDING' ? 'pending' : 'verified'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                  <div className="lg:col-span-8 space-y-6">
                    <div>
                      <p className="text-[11px] font-pjs font-black text-emerald-600 uppercase tracking-widest mb-1">{violation.category}</p>
                      <h3 className="text-[1.75rem] font-pjs font-bold text-[#1a1a1a] tracking-tight mb-6 leading-tight">{violation.title}</h3>
                      
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

                  <div className="lg:col-span-4 flex flex-col gap-3">
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
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white"><span className="material-symbols-outlined text-[18px]">person</span></div>
                        <span className="text-[12px] font-pjs font-bold text-white truncate">{violation.officer}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-[2rem] border-2 flex flex-col sm:flex-row items-center gap-6 transition-all duration-300 ${
                  violation.actionBox.type === 'action_required' ? 'bg-amber-50/50 border-amber-200 ring-4 ring-amber-50' : 'bg-emerald-50/30 border-emerald-100 ring-4 ring-emerald-50/20'
                }`}>
                  <div className={`w-14 h-14 shrink-0 rounded-[1.25rem] flex items-center justify-center shadow-lg ${
                    violation.actionBox.type === 'action_required' ? 'bg-amber-500 text-white shadow-amber-900/20' : 'bg-emerald-600 text-white shadow-emerald-900/20'
                  }`}>
                    <span className="material-symbols-outlined text-[28px]">{violation.actionBox.icon}</span>
                  </div>
                  <div className="flex-grow text-center sm:text-left">
                    <h4 className={`text-[11px] font-pjs font-black uppercase tracking-[0.2em] mb-1 ${violation.actionBox.type === 'action_required' ? 'text-amber-700' : 'text-emerald-700'}`}>{violation.actionBox.title}</h4>
                    <p className={`text-[16px] font-pjs font-bold leading-tight ${violation.actionBox.type === 'action_required' ? 'text-amber-900' : 'text-[#003624]'}`}>{violation.actionBox.description}</p>
                    {violation.directorRemarks && (
                      <div className="mt-4 p-4 bg-white/40 rounded-xl border border-emerald-100/30">
                        <p className="text-[10px] font-pjs font-black text-emerald-800/40 uppercase tracking-widest mb-1">Institutional Justification</p>
                        <p className="text-[13px] font-manrope font-medium text-emerald-900/70 italic leading-relaxed">"{violation.directorRemarks}"</p>
                      </div>
                    )}
                  </div>
                  {violation.status === 'PENDING' && (
                    <button 
                      onClick={() => handleTakeAction(violation)}
                      className="px-8 py-3 bg-amber-600 text-white rounded-xl font-pjs font-bold text-[12px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg active:scale-95 shrink-0"
                    >
                      Take Action
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-16 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-emerald-50/80 px-2">
        <div className="max-w-xl text-center md:text-left">
          <h3 className="text-lg font-pjs font-bold text-[#003624] tracking-tight mb-1">Incident Inquiry or Appeal?</h3>
          <p className="text-[13px] font-manrope text-portal-text-muted/80 leading-relaxed">
            Students may contest a record or seek clarification through the SWAFO Discipline Office within 14 school days of the logging date.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button className="px-6 py-3 rounded-full border border-[#006b5d]/30 text-[#006b5d] font-pjs font-bold text-[13px] hover:bg-[#006b5d]/5 transition-all outline-none">Handbook Guidelines</button>
          <a href="mailto:swafo@dlsud.edu.ph" className="px-6 py-3 rounded-full bg-[#006b5d] hover:bg-[#004d33] text-white font-pjs font-bold text-[13px] shadow-[0_8px_20px_rgba(0,107,93,0.2)] transition-all transform active:scale-95 no-underline">Contact SWAFO Office</a>
        </div>
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-[#003624]/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-[500px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="p-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[32px] font-bold">gavel</span>
              </div>
              <h2 className="text-[24px] font-pjs font-extrabold text-[#003624] mb-2 tracking-tight">Case Resolution</h2>
              <p className="text-[14px] text-slate-500 font-manrope leading-relaxed mb-8 max-w-[340px]">
                You are acknowledging the incident record for <span className="font-bold text-slate-900">{selectedViolation?.title}</span>. This will formally index the case as CLOSED.
              </p>
              <div className="w-full space-y-3">
                <button onClick={handleAcknowledge} className="w-full h-[65px] bg-[#003624] text-white rounded-2xl font-pjs font-black text-[13px] uppercase tracking-[0.2em] hover:bg-[#004d33] transition-all shadow-lg shadow-emerald-950/20 active:scale-[0.98]">Acknowledge & Close</button>
                <button onClick={() => { window.open('mailto:swafo@dlsud.edu.ph?subject=Appeal Request: ' + selectedViolation?.id); setShowModal(false); }} className="w-full h-[65px] border-2 border-slate-100 text-slate-600 rounded-2xl font-pjs font-bold text-[13px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-[0.98]">Initiate Appeal</button>
                <button onClick={() => setShowModal(false)} className="mt-4 text-slate-400 font-pjs font-bold text-[11px] uppercase tracking-widest hover:text-[#003624] transition-all">Return to Dashboard</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
