import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const MOCK_HISTORY = [
  {
    id: 1,
    title: 'Unauthorized Area Access',
    date: 'April 08, 2026',
    time: '09:45 AM',
    status: ['UNDER REVIEW', 'REPEAT'],
    description: 'Student was apprehended by security while attempting to access the restricted faculty server room in the Main Building. No valid authorization or escort was present.',
    rule: 'Section 5.1: Restricted Premises',
    action: "Subject to Dean's disciplinary hearing; temporary suspension of facility access cards.",
    officer: 'Chief S. Lumaban',
    active: true
  },
  {
    id: 2,
    title: 'Dress Code Violation',
    date: 'April 05, 2026',
    time: '08:15 AM',
    status: ['RESOLVED'],
    description: 'Student failed to wear the prescribed department uniform on a Monday. Claimed uniform was not dry due to weather conditions.',
    rule: 'Section 3.2: Uniform Policy',
    action: 'Written warning issued; Student rendered 2 hours of community service at the campus library.',
    officer: 'Officer C. Dalisay',
    active: false
  }
];

export default function StudentProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const student = {
    name: 'Nica Estelle R. Desacola',
    id: id || '202330445',
    status: 'ENROLLED',
    college: 'Engineering',
    year: '3rd Year',
    email: 'dnr3947@dlsud.edu.ph',
    dept: 'Computer Engineering',
    initials: 'ND',
    stats: {
      total: 2,
      pending: 0,
      resolved: 1
    }
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
            {MOCK_HISTORY.map((item) => (
              <div key={item.id} className="relative">
                {/* Timeline Indicator */}
                <div className={`absolute -left-[71px] top-10 w-10 h-10 rounded-full border-[8px] border-white shadow-xl transition-all z-10 ${item.active ? 'bg-[#10b981]' : 'bg-slate-200'}`}>
                   {item.active && <div className="absolute inset-0 rounded-full bg-[#10b981] animate-ping opacity-20"></div>}
                </div>
                
                {/* Case Card (RESTORED TO SOLID WHITE) */}
                <div className="bg-white rounded-[3rem] p-12 border border-[#f1f5f9] shadow-[0_10px_40px_rgba(0,0,0,0.01)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.03)] transition-all duration-500 group relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-2 h-full ${item.active ? 'bg-[#10b981]' : 'bg-slate-200'}`}></div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-8">
                    <div>
                      <h4 className="text-[30px] font-pjs font-black text-[#003624] tracking-tight mb-3 transition-colors">{item.title}</h4>
                      <div className="flex items-center gap-4 text-[14px] font-bold text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">calendar_today</span>{item.date}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">schedule</span>{item.time}</span>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      {item.status.map(s => (
                        <span key={s} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black tracking-widest shadow-sm uppercase ${
                          s === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 
                          s === 'REPEAT' ? 'bg-red-50 text-[#c62828]' : 'bg-orange-50 text-[#ef6c00]'
                        }`}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50/50 rounded-[2rem] p-10 mb-12 border border-slate-50 relative">
                    <span className="absolute -top-4 -left-2 text-[60px] font-serif text-slate-100 leading-none pointer-events-none opacity-40">“</span>
                    <p className="text-[17px] font-medium text-[#475569] leading-[1.8] relative z-10 pl-4 py-2">
                       {item.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
                    <HistoryColumn label="HANDBOOK RULE" value={item.rule} />
                    <HistoryColumn label="CORRECTIVE ACTION" value={item.action} />
                    <HistoryColumn label="REPORTING OFFICER" value={item.officer} />
                  </div>

                  <div className="pt-10 border-t border-slate-50 flex justify-end">
                    <button className="flex items-center gap-4 text-[13px] font-pjs font-black text-[#004d33] hover:text-[#10b981] transition-all uppercase tracking-[0.2em] group">
                      View Case Overview
                      <span className="material-symbols-outlined text-[24px] group-hover:translate-x-2 transition-transform duration-300">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
