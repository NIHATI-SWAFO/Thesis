import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function StudentProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Student Profile
        const profileResp = await fetch(`http://127.0.0.1:8000/api/users/search/?q=${id}`);
        const profiles = await profileResp.json();
        const profile = profiles.length > 0 ? profiles[0] : null;

        // 2. Fetch Violation History
        const historyResp = await fetch(`http://127.0.0.1:8000/api/violations/list/?student_id=${id}`);
        const historyData = await historyResp.json();

        setStudentData(profile);
        setHistory(historyData);
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
          <div className="w-20 h-20 border-t-4 border-b-4 border-[#004d33] rounded-full animate-spin"></div>
          <p className="text-[18px] font-pjs font-extrabold text-[#004d33] animate-pulse">Syncing Academic Record...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc]">
        <span className="material-symbols-outlined text-[64px] text-red-200 mb-4">person_off</span>
        <h2 className="text-[24px] font-pjs font-extrabold text-slate-800 mb-6">Student Profile Not Found</h2>
        <button onClick={() => navigate(-1)} className="px-8 py-3 bg-[#004d33] text-white rounded-2xl font-bold shadow-lg hover:bg-[#003624] transition-all">
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
    year: `${studentData.year_level} Year`,
    email: studentData.user_details?.email || 'N/A',
    dept: studentData.course || 'N/A',
    initials: (studentData.user_details?.full_name || 'S').split(' ').map(n => n[0]).join('').toUpperCase(),
    stats: {
      total: studentData.violation_count || 0,
      pending: history.filter(h => h.status !== 'RESOLVED').length,
      resolved: history.filter(h => h.status === 'RESOLVED').length
    },
    isRepeatOffender: studentData.is_repeat_offender
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-24 px-8 animate-fade-in-up font-manrope">
      
      {/* ══════════════════════════════ HEADER ══════════════════════════════ */}
      <div className="flex items-center gap-8 mb-16 pt-10">
        <button 
          onClick={() => navigate(-1)}
          className="w-16 h-16 flex items-center justify-center rounded-[1.75rem] bg-white border border-[#f1f5f9] text-[#004d33] hover:text-white hover:bg-[#004d33] transition-all shadow-sm active:scale-95 group"
        >
          <span className="material-symbols-outlined text-[32px]">arrow_back</span>
        </button>
        <div>
          <h1 className="text-[44px] font-pjs font-extrabold text-[#004d33] tracking-tighter leading-none mb-3">Student Records</h1>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            <p className="text-[18px] text-[#64748b] font-semibold tracking-tight uppercase tracking-[0.1em]">{student.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* ══════════════════════════════ LEFT COLUMN ══════════════════════════════ */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          
          {/* Card: Student Profile (RESTORED TO SOLID WHITE) */}
          <div className="bg-white rounded-[3rem] p-12 border border-[#f1f5f9] shadow-[0_20px_60px_rgba(0,0,0,0.02)] relative overflow-hidden group">
            <div className="flex justify-between items-center mb-16 relative z-10">
              <h3 className="text-[11px] font-pjs font-black text-[#004d33] opacity-40 uppercase tracking-[0.4em]">STUDENT PROFILE</h3>
              <div className="px-4 py-1.5 bg-[#f0f9f4] border border-[#dcfce7] text-[#10b981] text-[10px] font-black rounded-full tracking-widest shadow-sm uppercase">
                {student.status}
              </div>
            </div>

            <div className="flex flex-col items-center text-center mb-16 relative z-10">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-[#f1f8e9] to-white border-[6px] border-white shadow-xl flex items-center justify-center text-[42px] font-pjs font-black text-[#004d33]">
                  {student.initials}
                </div>
              </div>
              <p className="text-[11px] font-pjs font-black text-slate-300 uppercase tracking-[0.3em] mb-2">STUDENT ID</p>
              <h2 className="text-[40px] font-pjs font-black text-[#003624] tracking-tighter leading-none">{student.id}</h2>
            </div>

            <div className="grid grid-cols-1 gap-y-10 border-t border-slate-50 pt-10 relative z-10">
              <div className="grid grid-cols-2 gap-x-8">
                <DetailItem label="COLLEGE" value={student.college} />
                <DetailItem label="YEAR LEVEL" value={student.year} />
              </div>
              <DetailItem label="EMAIL ADDRESS" value={student.email} />
              <DetailItem label="DEPARTMENT" value={student.dept} />
            </div>
          </div>

          {/* Jelly/Glass Card: Violation Summary (PRESERVED AS JELLY) */}
          <div className="bg-[#f8fafc]/40 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden">
             <div className="flex justify-between items-start mb-12">
              <h3 className="text-[11px] font-pjs font-black text-[#004d33] opacity-40 uppercase tracking-[0.4em] leading-[1.8]">
                VIOLATION<br/>SUMMARY
              </h3>
              <div className="flex items-center gap-2.5 px-4 py-2 bg-[#fff1f2]/80 backdrop-blur-sm border border-[#ffe4e6]/50 text-[#e11d48] rounded-2xl shadow-sm">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">REPEAT<br/>OFFENDER</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <SummaryGridBox label="TOTAL" value={student.stats.total} highlight />
              <SummaryGridBox label="PENDING" value={student.stats.pending} orange />
              <SummaryGridBox label="RESOLVED" value={student.stats.resolved} green />
            </div>
          </div>

        </div>

        {/* ══════════════════════════════ RIGHT COLUMN ══════════════════════════════ */}
        <div className="lg:col-span-8 px-4">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-[11px] font-pjs font-black text-[#004d33] opacity-40 uppercase tracking-[0.5em]">VIOLATION HISTORY</h3>
            <div className="w-12 h-12 flex items-center justify-center bg-white rounded-[1.25rem] border border-[#f1f5f9] text-[#004d33] hover:bg-gray-50 transition-all shadow-sm cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
          </div>

          <div className="relative pl-14 border-l-[3px] border-slate-100 ml-6 flex flex-col gap-14">
            {history.length > 0 ? (
              history.map((item) => {
                const date = new Date(item.timestamp);
                const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
                const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const isResolved = item.status === 'RESOLVED';
                
                return (
                  <div key={item.id} className="relative">
                    {/* Timeline Indicator */}
                    <div className={`absolute -left-[71px] top-10 w-10 h-10 rounded-full border-[8px] border-white shadow-xl transition-all z-10 ${!isResolved ? 'bg-[#10b981]' : 'bg-slate-200'}`}>
                       {!isResolved && <div className="absolute inset-0 rounded-full bg-[#10b981] animate-ping opacity-20"></div>}
                    </div>
                    
                    {/* Case Card */}
                    <div className="bg-white rounded-[3rem] p-12 border border-[#f1f5f9] shadow-[0_10px_40px_rgba(0,0,0,0.01)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.03)] transition-all duration-500 group relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-2 h-full ${!isResolved ? 'bg-[#10b981]' : 'bg-slate-200'}`}></div>
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-8">
                        <div>
                          <h4 className="text-[30px] font-pjs font-black text-[#003624] tracking-tight mb-3 transition-colors">
                            {item.rule_details?.category || 'Infraction'}
                          </h4>
                          <div className="flex items-center gap-4 text-[14px] font-bold text-slate-400">
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">calendar_today</span>{formattedDate}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">schedule</span>{formattedTime}</span>
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black tracking-widest shadow-sm uppercase ${
                            isResolved ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-[#ef6c00]'
                          }`}>
                            {item.status}
                          </span>
                          {item.corrective_action?.includes('Probation') && (
                            <span className="px-5 py-2.5 rounded-2xl text-[10px] font-black tracking-widest shadow-sm uppercase bg-red-50 text-[#c62828]">
                              REPEAT
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50/50 rounded-[2rem] p-10 mb-12 border border-slate-50 relative">
                        <span className="absolute -top-4 -left-2 text-[60px] font-serif text-slate-100 leading-none pointer-events-none opacity-40">“</span>
                        <p className="text-[17px] font-medium text-[#475569] leading-[1.8] relative z-10 pl-4 py-2">
                           {item.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
                        <HistoryColumn label="HANDBOOK RULE" value={`${item.rule_details?.rule_code}: ${item.rule_details?.description}`} />
                        <HistoryColumn label="CORRECTIVE ACTION" value={item.prescribed_sanction || item.corrective_action || 'Institutional Review'} />
                        <HistoryColumn label="REPORTING OFFICER" value={item.officer_name || 'Institutional Authority'} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-[48px] text-slate-200 mb-4">history</span>
                <p className="text-[18px] font-pjs font-bold text-slate-400">No violation history found for this student.</p>
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
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-pjs font-black text-slate-300 uppercase tracking-[0.3em]">{label}</p>
      <p className="text-[15px] font-bold text-[#003624] tracking-tight leading-snug">{value}</p>
    </div>
  );
}

function SummaryGridBox({ label, value, highlight, orange, green }) {
  return (
    <div className={`bg-white rounded-[1.75rem] py-8 flex flex-col items-center justify-center transition-all duration-500 shadow-sm border border-[#f1f5f9]`}>
      <p className={`text-[36px] font-pjs font-black leading-none mb-3 ${
        highlight ? 'text-[#004d33]' : 
        orange ? 'text-[#ef6c00]' : 
        green ? 'text-[#2e7d32]' : 'text-slate-200'
      }`}>{value}</p>
      <p className="text-[9px] font-pjs font-black text-slate-300 uppercase tracking-[0.3em]">{label}</p>
    </div>
  );
}

function HistoryColumn({ label, value }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
        <p className="text-[10px] font-pjs font-black text-slate-300 uppercase tracking-[0.25em]">{label}</p>
      </div>
      <p className="text-[15px] font-bold leading-snug tracking-tight text-[#004d33]">
        {value}
      </p>
    </div>
  );
}
