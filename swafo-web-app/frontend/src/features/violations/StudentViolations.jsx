import React, { useState, useMemo } from 'react';

// Mock data array for testing, ready to be swapped with actual API call
const MOCK_VIOLATIONS = [
  {
    id: "VR-2024-089",
    status: "UNDER REVIEW",
    title: "Unauthorized Area Access",
    date: "October 24, 2023",
    time: "22:45 PM",
    location: "Research Lab Annex - Wing B",
    actionBox: {
      type: "action_required",
      title: "Corrective Action Required",
      description: "Please schedule a formal interview with the Department of Security Ethics within 48 hours. A written explanation regarding the presence in the restricted wing must be submitted via the portal.",
      icon: "info"
    }
  },
  {
    id: "VR-2023-412",
    status: "RESOLVED",
    title: "Dress Code Violation",
    date: "September 12, 2023",
    time: "09:15 AM",
    location: "Central Lecture Hall",
    actionBox: {
      type: "resolved",
      title: "Resolution Details",
      description: "Verbal warning issued and acknowledged. The student has attended the mandatory \"Professional Presentation\" orientation. This matter is officially closed.",
      icon: "check"
    }
  },
  {
    id: "VR-2023-105",
    status: "RESOLVED",
    title: "Noise Disturbance",
    date: "May 04, 2023",
    time: "23:30 PM",
    location: "Student Residence Tower A",
    actionBox: {
      type: "resolved",
      title: "Action History",
      description: "Fine paid in full on May 10, 2023. Community service hours (4 hours) completed at the Campus Botanical Gardens. Case archived.",
      icon: "history"
    }
  }
];

export default function StudentViolations() {
  const [violations, setViolations] = useState(MOCK_VIOLATIONS);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const totalRecords = violations.length;
  const pendingReview = violations.filter(v => v.status === "UNDER REVIEW").length;

  const filteredViolations = useMemo(() => {
    if (filterStatus === 'ALL') return violations;
    return violations.filter(v => v.status === filterStatus);
  }, [violations, filterStatus]);

  const handleFilterClick = () => {
    // Cycle through filter states for easy testing
    if (filterStatus === 'ALL') setFilterStatus('UNDER REVIEW');
    else if (filterStatus === 'UNDER REVIEW') setFilterStatus('RESOLVED');
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
        
        {/* Total Records */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-pjs font-bold text-portal-text-muted/60 uppercase tracking-widest mb-2">Total Records</p>
            <h2 className="text-[3rem] font-pjs font-bold text-[#006b5d] leading-none tracking-tighter">
              {totalRecords.toString().padStart(2, '0')}
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-6 text-[#006b5d] text-sm font-manrope font-semibold">
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
            All documented instances
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-pjs font-bold text-portal-text-muted/60 uppercase tracking-widest mb-2">Pending Review</p>
            <h2 className="text-[3rem] font-pjs font-bold text-[#1a1a1a] leading-none tracking-tighter">
              {pendingReview.toString().padStart(2, '0')}
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-6 text-portal-text-muted/70 text-sm font-manrope font-medium">
            <span className="material-symbols-outlined text-[18px]">hourglass_bottom</span>
            Currently under administrative assessment
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-[#006b5d] p-6 rounded-[1.5rem] shadow-[0_12px_40px_rgba(0,107,93,0.2)] flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative z-10 w-full">
            <p className="text-xs font-pjs font-bold text-white/80 uppercase tracking-widest mb-6">Account Status</p>
            <span className="material-symbols-outlined text-[3.5rem] text-white font-light tracking-tighter mb-4">check_circle</span>
            <h3 className="text-lg font-pjs font-bold text-white tracking-widest uppercase">Good Standing</h3>
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

        {/* Incidents List */}
        <div className="space-y-4">
          {filteredViolations.length === 0 ? (
            <div className="p-10 text-center text-portal-text-muted bg-white rounded-[1.5rem] border border-black/5">
              No matching records found.
            </div>
          ) : (
            filteredViolations.map((violation) => (
            <div key={violation.id} className="bg-white p-6 sm:p-7 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-black/5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition-all">
              
              {/* Card Header (Status, ID, and Action Icon) */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold font-pjs uppercase tracking-widest ${
                    violation.status === 'UNDER REVIEW' 
                      ? 'bg-amber-100/80 text-amber-700' 
                      : 'bg-emerald-100/60 text-[#006b5d]'
                  }`}>
                    {violation.status}
                  </span>
                  <span className="text-[13px] font-manrope font-semibold text-portal-text-muted/60">
                    Ref: #{violation.id}
                  </span>
                </div>
                {violation.status === 'UNDER REVIEW' ? (
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f2fcf8] text-[#006b5d] hover:bg-[#006b5d] hover:text-white transition-all shadow-sm border border-emerald-50">
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center rounded-full">
                    <span className="material-symbols-outlined text-[24px] text-emerald-500">check_circle</span>
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="mb-6">
                <h3 className="text-[1.35rem] font-pjs font-bold text-[#1a1a1a] tracking-tight mb-3">
                  {violation.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-portal-text-muted/80 font-manrope text-[13px] font-medium">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    {violation.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {violation.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {violation.location}
                  </div>
                </div>
              </div>

              {/* Action / Resolution Box */}
              <div className={`p-5 rounded-2xl border-l-[4px] flex items-start gap-4 ${
                violation.actionBox.type === 'action_required'
                  ? 'bg-emerald-50/50 border-[#006b5d]'
                  : 'bg-slate-50 border-slate-300'
              }`}>
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                  violation.actionBox.type === 'action_required'
                    ? 'bg-emerald-100 text-[#006b5d]'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">{violation.actionBox.icon}</span>
                </div>
                <div className="flex-grow pt-0.5">
                  <h4 className={`text-[14px] font-pjs font-bold mb-1 ${
                    violation.actionBox.type === 'action_required'
                      ? 'text-[#003624]'
                      : 'text-[#1a1a1a]'
                  }`}>
                    {violation.actionBox.title}
                  </h4>
                  <p className="text-[13px] font-manrope text-portal-text-muted leading-relaxed">
                    {violation.actionBox.description}
                  </p>
                </div>
              </div>

            </div>
          )))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-16 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-emerald-50/80 px-2">
        <div className="max-w-xl text-center md:text-left">
          <h3 className="text-lg font-pjs font-bold text-[#003624] tracking-tight mb-1">Need to contest a record?</h3>
          <p className="text-[13px] font-manrope text-portal-text-muted/80">
            The Appeal process is open for all "Under Review" statuses within 14 days of the incident date.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button className="px-6 py-3 rounded-full border border-[#006b5d]/30 text-[#006b5d] font-pjs font-bold text-[13px] hover:bg-[#006b5d]/5 transition-all outline-none">
            View Guidelines
          </button>
          <button className="px-6 py-3 rounded-full bg-[#006b5d] hover:bg-[#004d33] text-white font-pjs font-bold text-[13px] shadow-[0_8px_20px_rgba(0,107,93,0.2)] transition-all transform active:scale-95">
            Contact Ombudsman
          </button>
        </div>
      </div>

    </div>
  );
}
