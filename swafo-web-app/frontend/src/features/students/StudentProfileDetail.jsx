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
    <div className="max-w-[1400px] mx-auto pb-20 px-6 animate-fade-in-up font-manrope">
      
      {/* ══════════════════════════════ HEADER ══════════════════════════════ */}
      <div className="flex items-center gap-6 mb-12 pt-6">
        <button 
          onClick={() => navigate(-1)}
          className="w-14 h-14 flex items-center justify-center rounded-3xl bg-white border border-[#f1f5f9] text-[#004d33] hover:bg-gray-50 transition-all shadow-sm active:scale-95 group"
        >
          <span className="material-symbols-outlined text-[32px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
        </button>
        <div>
          <h1 className="text-[38px] font-pjs font-extrabold text-[#004d33] tracking-tight leading-none mb-2">Student Records</h1>
          <p className="text-[18px] text-[#94a3b8] font-bold tracking-tight">{student.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* ══════════════════════════════ LEFT COLUMN ══════════════════════════════ */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          
          {/* Student Profile Card */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-[#f1f5f9] shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-[13px] font-pjs font-black text-[#004d33] uppercase tracking-[0.25em]">STUDENT PROFILE</h3>
              <span className="px-5 py-2 bg-[#ecfdf5] text-[#10b981] text-[11px] font-black rounded-xl tracking-widest shadow-sm">
                {student.status}
              </span>
            </div>

            <div className="flex items-center gap-8 mb-14">
              <div className="w-28 h-28 rounded-[2rem] bg-[#aeeecb]/40 flex items-center justify-center text-[32px] font-black text-[#004d33] border-4 border-white shadow-md">
                {student.initials}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[12px] font-pjs font-black text-[#94a3b8] uppercase tracking-[0.2em] mb-1">STUDENT ID</p>
                <p className="text-[34px] font-pjs font-black text-[#003624] leading-none tracking-tight">{student.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-12 gap-x-6">
              <DetailItem label="COLLEGE" value={student.college} />
              <DetailItem label="YEAR LEVEL" value={student.year} />
              <DetailItem label="EMAIL ADDRESS" value={student.email} fullWidth />
              <DetailItem label="DEPARTMENT" value={student.dept} fullWidth />
            </div>
          </div>

          {/* Violation Summary Card */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-[#f1f5f9] shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-start mb-12">
              <h3 className="text-[14px] font-pjs font-black text-[#004d33] uppercase tracking-[0.25em] leading-[1.4]">
                VIOLATION<br/>SUMMARY
              </h3>
              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-[#fef2f2] text-[#ef4444] rounded-2xl shadow-sm">
                <span className="material-symbols-outlined text-[18px]">report_problem</span>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">REPEAT<br/>OFFENDER</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <SummaryBox label="TOTAL" value={student.stats.total} highlight />
              <SummaryBox label="PENDING" value={student.stats.pending} />
              <SummaryBox label="RESOLVED" value={student.stats.resolved} success />
            </div>
          </div>

        </div>

        {/* ══════════════════════════════ RIGHT COLUMN ══════════════════════════════ */}
        <div className="lg:col-span-8">
          <div className="flex justify-between items-center mb-10 px-4">
            <h3 className="text-[14px] font-pjs font-black text-[#004d33] uppercase tracking-[0.3em]">VIOLATION HISTORY</h3>
            <button className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-[#f1f5f9] text-[#004d33] hover:bg-gray-50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
          </div>

          <div className="relative pl-12 border-l-4 border-dashed border-[#ecfdf5] ml-6 flex flex-col gap-12">
            {MOCK_HISTORY.map((item) => (
              <div key={item.id} className="relative">
                {/* Timeline Indicator */}
                <div className={`absolute -left-[64px] top-8 w-8 h-8 rounded-full border-[6px] border-white shadow-lg transition-all z-10 ${item.active ? 'bg-[#10b981] animate-pulse' : 'bg-[#cbd5e1]'}`}></div>
                
                {/* Case Card */}
                <div className="bg-white rounded-[2.5rem] p-12 border border-[#f1f5f9] shadow-[0_4px_40px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_50px_rgba(0,0,0,0.03)] transition-all group overflow-hidden relative">
                  <div className={`absolute top-0 left-0 w-2 h-full ${item.active ? 'bg-[#10b981]' : 'bg-[#cbd5e1]'}`}></div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div>
                      <h4 className="text-[26px] font-pjs font-black text-[#003624] tracking-tight mb-2">{item.title}</h4>
                      <p className="text-[14px] font-bold text-[#94a3b8] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">event</span>
                        {item.date} • {item.time}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {item.status.map(s => (
                        <span key={s} className={`px-5 py-2 rounded-xl text-[11px] font-black tracking-widest shadow-sm ${
                          s === 'RESOLVED' ? 'bg-[#ecfdf5] text-[#10b981]' : 
                          s === 'REPEAT' ? 'bg-[#fff4ed] text-[#f97316]' : 'bg-[#f0f9ff] text-[#0ea5e9]'
                        }`}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#f8fafc]/50 rounded-[1.5rem] p-8 mb-10 border border-gray-50">
                    <p className="text-[16px] font-medium text-[#475569] leading-relaxed italic">
                      "{item.description}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-10 border-t border-gray-50 pt-10">
                    <HistoryDetail label="HANDBOOK RULE" value={item.rule} accent />
                    <HistoryDetail label="CORRECTIVE ACTION" value={item.action} />
                    <HistoryDetail label="REPORTING OFFICER" value={item.officer} accent />
                  </div>

                  <div className="pt-8 border-t border-gray-50 flex justify-end">
                    <button className="flex items-center gap-3 text-[13px] font-pjs font-black text-[#004d33] hover:gap-5 transition-all uppercase tracking-widest group">
                      {item.active ? 'View Full Case Details' : 'View Case Summary'}
                      <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                        {item.active ? 'arrow_forward' : 'arrow_outward'}
                      </span>
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

function DetailItem({ label, value, fullWidth }) {
  return (
    <div className={`flex flex-col gap-2 ${fullWidth ? 'col-span-2' : ''}`}>
      <p className="text-[11px] font-pjs font-black text-[#004d33] uppercase tracking-[0.2em]">{label}</p>
      <p className="text-[17px] font-bold text-[#003624] tracking-tight leading-snug">{value}</p>
    </div>
  );
}

function SummaryBox({ label, value, highlight, success }) {
  return (
    <div className={`bg-white border-2 rounded-3xl py-8 flex flex-col items-center justify-center transition-all ${
      highlight ? 'border-[#ecfdf5]' : success ? 'border-[#ecfdf5]' : 'border-[#f8fafc]'
    }`}>
      <p className={`text-[32px] font-pjs font-black leading-none mb-2 ${
        highlight ? 'text-[#004d33]' : success ? 'text-[#10b981]' : 'text-gray-300'
      }`}>{value}</p>
      <p className="text-[10px] font-pjs font-black text-[#94a3b8] uppercase tracking-widest">{label}</p>
    </div>
  );
}

function HistoryDetail({ label, value, accent }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-pjs font-black text-[#004d33] uppercase tracking-[0.2em] opacity-60">{label}</p>
      <p className={`text-[15px] font-bold leading-snug tracking-tight ${accent ? 'text-[#003624]' : 'text-[#64748b]'}`}>
        {value}
      </p>
    </div>
  );
}
