import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../api/config';

// Institutional Student Profile & Violation History Detail View

export default function StudentProfileDetail({ role = 'officer' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Student Profile
        const profileResp = await fetch(`${API_ENDPOINTS.SEARCH_USERS}?q=${encodeURIComponent(id)}`);
        const profiles = await profileResp.json();
        const profile = Array.isArray(profiles) && profiles.length > 0 ? profiles[0] : null;

        // 2. Fetch Violation History
        const historyResp = await fetch(`${API_ENDPOINTS.VIOLATIONS_LIST}?student_id=${encodeURIComponent(id)}`);

        const historyData = await historyResp.json();

        setStudentData(profile);
        setHistory(Array.isArray(historyData) ? historyData : (historyData.results || []));
        setLoading(false);
      } catch (err) {
        console.error("Error syncing student detail:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-t-4 border-b-4 border-[#004d33] rounded-full animate-spin"></div>
          <p className="text-[16px] sm:text-[18px] font-pjs font-extrabold text-[#004d33] animate-pulse">Syncing Academic Record...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] px-4 text-center">
        <span className="material-symbols-outlined text-[54px] sm:text-[64px] text-red-300 mb-4">person_off</span>
        <h2 className="text-[20px] sm:text-[24px] font-pjs font-extrabold text-slate-800 mb-4">Student Profile Not Found</h2>
        <p className="text-slate-500 text-sm max-w-sm mb-6">No matching record found for student identifier #{id}.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-[#004d33] text-white rounded-xl font-bold shadow-lg hover:bg-[#003624] transition-all cursor-pointer">
          Go Back to Records
        </button>
      </div>
    );
  }

  const student = {
    name: studentData.user_details?.full_name || 'N/A',
    id: studentData.student_number || id,
    status: 'ENROLLED',
    college: studentData.course || 'N/A',
    year: `${studentData.year_level || 1} Year`,
    email: studentData.user_details?.email || 'N/A',
    dept: studentData.course || 'N/A',
    initials: (studentData.user_details?.full_name || 'S').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    stats: {
      total: studentData.violation_count || 0,
      active: history.filter(h => !['CLOSED', 'DISMISSED'].includes(h.status)).length,
      closed: history.filter(h => ['CLOSED', 'DISMISSED'].includes(h.status)).length
    },
    isRepeatOffender: studentData.is_repeat_offender
  };

  const riskStanding = studentData?.risk_standing || {
    tier: 'LOW',
    standing: 'Good Standing',
    score: studentData?.risk_score || 0,
    clearance_impact: 'CLEARED',
    honors_eligibility: 'ELIGIBLE',
    gmc_status: 'AVAILABLE',
    handbook_citation: 'Section 14',
    consequence_summary: "Unrestricted institutional clearance (§14). Eligible for Dean's List and Latin Honors; unconditional Good Moral Certificate issuance.",
    color: 'emerald',
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-12 sm:pb-24 px-2.5 sm:px-8 animate-fade-in-up font-manrope">
      
      {/* ══════════════════════════════ HEADER ══════════════════════════════ */}
      <div className="flex items-center gap-3.5 sm:gap-6 mb-6 sm:mb-12 pt-3 sm:pt-8">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl sm:rounded-2xl bg-white border border-[#f1f5f9] text-[#004d33] hover:text-white hover:bg-[#004d33] transition-all shadow-sm active:scale-95 group shrink-0 cursor-pointer"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[28px]">arrow_back</span>
        </button>
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-[32px] md:text-[40px] font-pjs font-extrabold text-[#004d33] tracking-tight leading-none mb-1 sm:mb-2">Student Records</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0"></span>
            <p className="text-[12px] sm:text-[16px] text-[#64748b] font-semibold uppercase tracking-wider truncate">{student.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-10 items-start">
        
        {/* ══════════════════════════════ LEFT COLUMN ══════════════════════════════ */}
        <div className="lg:col-span-4 flex flex-col gap-5 sm:gap-8">
          
          {/* Card: Student Profile */}
          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)] relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6 sm:mb-10 relative z-10">
              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] sm:text-[11px] font-pjs font-black text-[#004d33] opacity-50 uppercase tracking-[0.25em]">STUDENT PROFILE</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest border ${
                    riskStanding.clearance_impact === 'CLEARED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    riskStanding.clearance_impact === 'HOLD' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    §14 {riskStanding.clearance_impact}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest border ${
                    riskStanding.tier === 'LOW' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {riskStanding.handbook_citation}
                  </span>
                </div>
              </div>
              <div className="px-3 py-1 bg-[#f0f9f4] border border-[#dcfce7] text-[#10b981] text-[9.5px] font-black rounded-full tracking-widest shadow-xs uppercase">
                {student.status}
              </div>
            </div>

            <div className="flex flex-col items-center text-center mb-6 sm:mb-10 relative z-10">
              <div className="relative mb-3 sm:mb-5">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2.25rem] bg-gradient-to-br from-[#f1f8e9] to-white border-4 border-white shadow-lg flex items-center justify-center text-[28px] sm:text-[38px] font-pjs font-black text-[#004d33]">
                  {student.initials}
                </div>
              </div>
              <p className="text-[10px] font-pjs font-black text-slate-300 uppercase tracking-[0.25em] mb-1">STUDENT ID</p>
              <h2 className="text-[26px] sm:text-[36px] font-pjs font-black text-[#003624] tracking-tighter leading-none">{student.id}</h2>
            </div>

            <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6 border-t border-slate-50 pt-5 sm:pt-8 relative z-10">
              <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6">
                <DetailItem label="COLLEGE" value={student.college} />
                <DetailItem label="YEAR LEVEL" value={student.year} />
              </div>
              <DetailItem label="EMAIL ADDRESS" value={student.email} />
              <DetailItem label="DEPARTMENT" value={student.dept} />
            </div>
          </div>

          {/* Jelly/Glass Card: Violation Summary */}
          <div className="bg-[#f8fafc]/60 backdrop-blur-2xl rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden">
             <div className="flex justify-between items-start mb-4 sm:mb-8">
              <h3 className="text-[10px] sm:text-[11px] font-pjs font-black text-[#004d33] opacity-50 uppercase tracking-[0.25em] leading-snug">
                VIOLATION<br/>SUMMARY
              </h3>
              {student.isRepeatOffender && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#fff1f2]/80 backdrop-blur-sm border border-[#ffe4e6]/50 text-[#e11d48] rounded-xl shadow-xs">
                  <span className="material-symbols-outlined text-[15px]">error</span>
                  <span className="text-[8.5px] font-black uppercase tracking-wider leading-none">REPEAT<br/>OFFENDER</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <SummaryGridBox label="TOTAL" value={student.stats.total} highlight />
              <SummaryGridBox label="ONGOING" value={student.stats.active} orange />
              <SummaryGridBox label="CLOSED" value={student.stats.closed} green />
            </div>
          </div>

          {/* Institutional Standing & Privileges Card */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#f1f5f9] shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[11px] font-pjs font-black text-[#004d33] opacity-40 uppercase tracking-[0.4em] leading-[1.8]">
                  BEHAVIORAL<br/>STANDING
                </h3>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block border border-slate-200">
                  {riskStanding.handbook_citation}
                </span>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border block ${
                  riskStanding.tier === 'LOW' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  riskStanding.tier === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  riskStanding.tier === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {riskStanding.standing}
                </span>
                <span className="text-[12px] font-black font-mono text-slate-500 mt-1 block">
                  {studentData.risk_score || 0} pts
                </span>
              </div>
            </div>

            {/* Impact Summary */}
            <div className={`p-4 rounded-2xl border text-[12px] leading-relaxed font-medium ${
              riskStanding.tier === 'LOW' ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950' :
              riskStanding.tier === 'CRITICAL' ? 'bg-rose-50/70 border-rose-200 text-rose-950' :
              riskStanding.tier === 'HIGH' ? 'bg-orange-50/70 border-orange-200 text-orange-950' :
              'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}>
              {riskStanding.consequence_summary}
            </div>

            {/* Privileges Matrix */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Institutional Clearance</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  riskStanding.clearance_impact === 'CLEARED' ? 'bg-emerald-100 text-emerald-800' :
                  riskStanding.clearance_impact === 'HOLD' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  §14 {riskStanding.clearance_impact}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Dean's List &amp; Honors</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  riskStanding.honors_eligibility === 'ELIGIBLE' ? 'bg-emerald-100 text-emerald-800' :
                  riskStanding.honors_eligibility === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {riskStanding.honors_eligibility.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Good Moral Certificate</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  riskStanding.gmc_status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                  riskStanding.gmc_status === 'DEFERRED' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {riskStanding.gmc_status}
                </span>
              </div>
            </div>

            {/* Recency notice */}
            <p className="text-[10px] text-slate-400 text-center italic">
              Score decays with a 30-day half-life without re-offense.
            </p>
          </div>

        </div>

        {/* ══════════════════════════════ RIGHT COLUMN ══════════════════════════════ */}
        <div className="lg:col-span-8 px-0 sm:px-2">
          <div className="flex justify-between items-center mb-4 sm:mb-8">
            <h3 className="text-[10px] sm:text-[11px] font-pjs font-black text-[#004d33] opacity-50 uppercase tracking-[0.25em]">VIOLATION HISTORY</h3>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {history.length} {history.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          <div className="relative pl-5 sm:pl-12 border-l-2 border-slate-200 ml-2 sm:ml-4 flex flex-col gap-5 sm:gap-10">
            {history.length > 0 ? (
              history.map((item) => {
                const date = new Date(item.timestamp);
                const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const isTerminal = ['CLOSED', 'DISMISSED'].includes(item.status);
                
                return (
                  <div key={item.id} className="relative">
                    {/* Timeline Indicator */}
                    <div className={`absolute -left-[27px] sm:-left-[55px] top-5 sm:top-8 w-5 h-5 sm:w-8 sm:h-8 rounded-full border-3 sm:border-4 border-white shadow-md transition-all z-10 ${!isTerminal ? 'bg-rose-500' : 'bg-slate-300'}`}>
                       {!isTerminal && <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-25"></div>}
                    </div>
                    
                    {/* Case Card */}
                    <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 md:p-10 border border-[#f1f5f9] shadow-[0_10px_40px_rgba(0,0,0,0.01)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.03)] transition-all duration-300 group relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${!isTerminal ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-6 gap-3 sm:gap-6">
                        <div>
                          <h4 className="text-[17px] sm:text-[24px] font-pjs font-black text-[#003624] tracking-tight mb-1 transition-colors">
                            {item.rule_details?.category || 'Infraction'}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-[13px] font-bold text-slate-400">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px] sm:text-[17px]">calendar_today</span>{formattedDate}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px] sm:text-[17px]">schedule</span>{formattedTime}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          <span className={`px-3 py-1 rounded-xl text-[9px] sm:text-[10px] font-black tracking-wider uppercase ${
                            isTerminal ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {item.status.replace(/_/g, ' ')}
                          </span>
                          {item.corrective_action?.includes('Probation') && (
                            <span className="px-3 py-1 rounded-xl text-[9px] sm:text-[10px] font-black tracking-wider uppercase bg-red-50 text-[#c62828] border border-red-100">
                              REPEAT
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50/70 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 mb-4 sm:mb-8 border border-slate-100 relative">
                        <p className="text-[12px] sm:text-[15px] font-medium text-[#475569] leading-relaxed relative z-10 italic">
                           "{item.description || 'No detailed incident description provided.'}"
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 pt-1">
                        <HistoryColumn label="HANDBOOK RULE" value={`${item.rule_details?.rule_code || 'RULE'}: ${item.rule_details?.description || 'Policy'}`} />
                        <HistoryColumn label="CORRECTIVE ACTION" value={item.prescribed_sanction || item.corrective_action || 'Institutional Review'} />
                        <HistoryColumn label="REPORTING OFFICER" value={item.officer_name || 'Institutional Staff'} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 sm:py-16 text-center bg-white rounded-2xl sm:rounded-[2.5rem] border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-[32px] sm:text-[44px] text-slate-300 mb-2">history</span>
                <p className="text-[14px] sm:text-[16px] font-pjs font-bold text-slate-400">No violation history found for this student.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <p className="text-[9.5px] font-pjs font-black text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-[13px] sm:text-[14px] font-bold text-[#003624] tracking-tight leading-snug truncate">{value}</p>
    </div>
  );
}

function SummaryGridBox({ label, value, highlight, orange, green }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl py-3.5 sm:py-6 flex flex-col items-center justify-center transition-all duration-300 shadow-xs border border-[#f1f5f9]">
      <p className={`text-[22px] sm:text-[32px] font-pjs font-black leading-none mb-1 sm:mb-2 ${
        highlight ? 'text-[#004d33]' : 
        orange ? 'text-[#ef6c00]' : 
        green ? 'text-[#2e7d32]' : 'text-slate-300'
      }`}>{value}</p>
      <p className="text-[9px] font-pjs font-black text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function HistoryColumn({ label, value }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0"></span>
        <p className="text-[9.5px] font-pjs font-black text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-[12.5px] sm:text-[13.5px] font-bold leading-snug tracking-tight text-[#003624] line-clamp-2">
        {value}
      </p>
    </div>
  );
}
