import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../../api/config";
import BarcodeRegistrationModal from "../../components/BarcodeRegistrationModal";
import StudentNumberPromptModal from "../../components/StudentNumberPromptModal";

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showStudentIdModal, setShowStudentIdModal] = useState(false);

  const email = user?.email;

  const fetchProfile = () => {
    if (email) {
      fetch(`${API_ENDPOINTS.PROFILE_BY_EMAIL}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(user?.name || '')}`)
        .then(res => {
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (data && !data.error) {
            setProfile(data);
          }
        })
        .catch(err => console.error("Profile fetch error:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [email]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-[#003624] rounded-full animate-spin"></div>
      </div>
    );
  }

  const fullName = profile?.user_details?.full_name || profile?.user?.full_name || user?.name || user?.email?.split('@')[0] || "Student Name";
  const studentId = profile?.student_number || "---";
  const course = profile?.course || "---";
  const yearLevel = profile?.year_level || "-";

  // Backend Algorithmic Standing data with fallback
  const standingData = profile?.risk_standing || {
    tier: 'LOW',
    standing: 'Good Standing',
    score: 0.0,
    clearance_impact: 'CLEARED',
    honors_eligibility: 'ELIGIBLE',
    gmc_status: 'AVAILABLE',
    handbook_citation: 'Section 14',
    consequence_summary: "Unrestricted institutional clearance (§14). Eligible for Dean's List and Latin Honors; unconditional Good Moral Certificate (GMC) issuance.",
    color: 'emerald',
  };

  const handleExportProfile = () => {
    window.print();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 max-md:space-y-4 animate-fade-in-up max-md:pb-32">
      
      {/* ══════════════════════════ PROFILE HEADER ══════════════════════════ */}
      <section className="flex flex-col md:flex-row items-center md:items-end gap-6 max-md:gap-3 px-4 relative">
        {/* Profile Image Container */}
        <div className="relative shrink-0">
          <div className="w-[110px] h-[110px] max-md:w-20 max-md:h-20 rounded-3xl bg-[#003624] flex items-center justify-center ring-4 ring-white shadow-xl relative overflow-hidden text-white">
            <span className="material-symbols-outlined text-[70px] max-md:text-[48px] opacity-90">account_circle</span>
          </div>
          {/* Verified Badge */}
          <div className="absolute -bottom-1 -right-1 max-md:-bottom-0.5 max-md:-right-0.5 w-8 h-8 max-md:w-6 max-md:h-6 bg-portal-primary rounded-full border-[3px] max-md:border-2 border-white flex items-center justify-center shadow-lg text-white">
            <span className="material-symbols-outlined text-[16px] max-md:text-[12px] fill-1">verified</span>
          </div>
        </div>

        {/* Info Content */}
        <div className="flex-grow pb-2 text-center md:text-left">
          <h1 className="text-[28px] md:text-[2.25rem] max-md:text-[22px] font-pjs font-bold text-[#1a1a1a] leading-tight mb-2 max-md:mb-1 tracking-tight">
            {fullName}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 text-portal-text-muted font-manrope font-semibold text-sm md:text-lg max-md:text-xs">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-portal-primary/60 text-[16px] md:text-[20px]">school</span>
              Year {yearLevel}
            </span>
            <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-emerald-200" />
            <span>{course}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
            <button
              onClick={() => setShowStudentIdModal(true)}
              className="text-portal-primary/70 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              title="Click to update or confirm student ID"
            >
              <span>ID: {studentId}</span>
              <span className="material-symbols-outlined text-[14px]">edit</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 pb-4 max-md:pb-0 max-md:w-full max-md:mt-2">
          <button 
            onClick={handleExportProfile}
            className="bg-[#006b5d] text-white px-6 py-2.5 rounded-xl font-pjs font-bold text-[13px] flex items-center justify-center max-md:w-full gap-2 hover:bg-[#004d33] transition-all transform active:scale-95 shadow-md shadow-emerald-900/10 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Export Profile
          </button>
        </div>
      </section>

      {/* ══════════════════════════ GRID LAYOUT ══════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 px-4">
        
        {/* Academic Status Card */}
        <div className="lg:col-span-5">
          <SectionCard bgColor="bg-[#e9eded]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-manrope font-semibold text-portal-text text-base sm:text-lg">Standing</span>
                <span className={`px-4 py-1.5 rounded-2xl text-[12px] font-bold font-pjs uppercase tracking-tight shadow-sm ${
                  standingData.tier === 'LOW' ? 'bg-[#d1fadf] text-[#006b5d]' :
                  standingData.tier === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {standingData.standing}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-manrope font-semibold text-portal-text text-base sm:text-lg">Clearance</span>
                <span className={`px-4 py-1.5 rounded-2xl text-[12px] font-bold font-pjs uppercase tracking-tight shadow-sm ${
                  standingData.clearance_impact === 'CLEARED' ? 'bg-[#d1fadf] text-[#006b5d]' :
                  standingData.clearance_impact === 'HOLD' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {standingData.clearance_impact === 'CLEARED' ? 'Cleared' : standingData.clearance_impact === 'HOLD' ? 'On Hold' : 'Conditional'}
                </span>
              </div>

              <div className="mt-5 pt-5 border-t border-emerald-50/50">
                <p className="text-[9px] uppercase font-pjs font-bold text-portal-text-muted/50 tracking-widest mb-1.5">Current Semester</p>
                <h4 className="text-base sm:text-lg font-pjs font-bold text-[#003624] tracking-tight">2ND SEMESTER SY 2025 - 2026</h4>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Account Details */}
        <div className="lg:col-span-7">
          <SectionCard bgColor="bg-[#e9eded]">
            <div className="flex flex-col justify-center h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 max-md:grid-cols-2 max-md:gap-4 gap-x-8 gap-y-6">
                <DetailItem 
                  icon="alternate_email" 
                  label="School Email" 
                  value={profile?.user_details?.email || email || "---"} 
                  iconBg="bg-white" 
                  iconColor="text-emerald-600" 
                />
                <DetailItem 
                  icon="account_balance" 
                  label="College" 
                  value={profile?.course?.includes('Computer') ? 'College of Information and Computer Studies' : (profile?.course || '---')} 
                  iconBg="bg-white" 
                  iconColor="text-emerald-600" 
                />
                <DetailItem 
                  icon="account_tree" 
                  label="Department & Level" 
                  value={`${profile?.course || '---'} (Year ${profile?.year_level || '-'})`} 
                  iconBg="bg-white" 
                  iconColor="text-emerald-600" 
                />
                <DetailItem 
                  icon="call" 
                  label="Contact Number" 
                  value="0917-XXX-XXXX (Verified)" 
                  iconBg="bg-white" 
                  iconColor="text-emerald-600" 
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ══════════════════════════ INSTITUTIONAL STANDING & PRIVILEGES (FULL BREAKDOWN) ══════════════════════════ */}
        <div className="lg:col-span-12">
          <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-emerald-100/60 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  standingData.tier === 'LOW' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                  standingData.tier === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  standingData.tier === 'HIGH' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">
                    {standingData.tier === 'LOW' ? 'verified' : standingData.tier === 'CRITICAL' ? 'gavel' : standingData.tier === 'HIGH' ? 'warning' : 'info'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-pjs font-bold text-[#003624]">
                      Institutional Standing &amp; Privileges
                    </h3>
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {standingData.handbook_citation}
                    </span>
                  </div>
                  <p className="text-[12px] font-manrope text-slate-500 mt-0.5">
                    Comprehensive evaluation of academic honors, privileges, and clearance under the DLSU-D Student Handbook 2022–2027.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Recency Risk Score</span>
                  <span className={`text-lg font-black font-mono ${
                    standingData.tier === 'LOW' ? 'text-emerald-700' :
                    standingData.tier === 'CRITICAL' ? 'text-rose-600' :
                    standingData.tier === 'HIGH' ? 'text-orange-600' : 'text-amber-600'
                  }`}>
                    {standingData.score} pts
                  </span>
                </div>
                <span className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border ${
                  standingData.tier === 'LOW' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  standingData.tier === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  standingData.tier === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {standingData.standing}
                </span>
              </div>
            </div>

            {/* Executive Consequence Statement */}
            <div className={`p-4 md:p-5 rounded-2xl border text-[13px] font-manrope leading-relaxed flex items-start gap-3.5 ${
              standingData.tier === 'LOW' ? 'bg-emerald-50/60 border-emerald-100 text-emerald-950' :
              standingData.tier === 'CRITICAL' ? 'bg-rose-50/70 border-rose-200 text-rose-950' :
              standingData.tier === 'HIGH' ? 'bg-orange-50/70 border-orange-200 text-orange-950' :
              'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}>
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5 opacity-80">info</span>
              <div>
                <strong className="font-pjs font-bold uppercase tracking-wider text-[11px] block mb-0.5">Student Consequence Summary:</strong>
                {standingData.consequence_summary}
              </div>
            </div>

            {/* 3 Privileges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">military_tech</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      standingData.honors_eligibility === 'ELIGIBLE' ? 'bg-emerald-100 text-emerald-800' :
                      standingData.honors_eligibility === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {(standingData.honors_eligibility || 'ELIGIBLE').replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-pjs font-bold text-[14px] text-[#003624]">Dean's List &amp; Latin Honors</h4>
                  <p className="font-manrope text-[11px] text-slate-500 mt-1 leading-snug">
                    Academic award qualification contingent on clear disciplinary conduct records.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">account_balance</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      standingData.clearance_impact === 'CLEARED' ? 'bg-emerald-100 text-emerald-800' :
                      standingData.clearance_impact === 'CONDITIONAL' ? 'bg-amber-100 text-amber-800' :
                      standingData.clearance_impact === 'RESTRICTED' ? 'bg-orange-100 text-orange-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {standingData.clearance_impact}
                    </span>
                  </div>
                  <h4 className="font-pjs font-bold text-[14px] text-[#003624]">Institutional Clearance (§14)</h4>
                  <p className="font-manrope text-[11px] text-slate-500 mt-1 leading-snug">
                    Clearance status required for semester enrollment, graduation, and transcript release.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">verified</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      standingData.gmc_status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                      standingData.gmc_status === 'DEFERRED' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {standingData.gmc_status}
                    </span>
                  </div>
                  <h4 className="font-pjs font-bold text-[14px] text-[#003624]">Good Moral Certificate (GMC)</h4>
                  <p className="font-manrope text-[11px] text-slate-500 mt-1 leading-snug">
                    Certification of moral character required for scholarship renewals, transfer, or employment.
                  </p>
                </div>
              </div>
            </div>

            {/* Restorative Justice Principle */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-[11px] font-manrope text-slate-500">
              <span className="material-symbols-outlined text-emerald-700 text-[18px] shrink-0">hourglass_top</span>
              <span>
                <strong className="text-[#003624] font-semibold">Restorative Discipline Principle:</strong> Incident risk weights decay by 50% every 30 days without re-offense. Continued good conduct restores full academic privileges and clearance standing.
              </span>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="lg:col-span-6">
          <SectionCard title="Privacy & Security" icon="policy" subtitle="Manage your account access and credentials" bgColor="bg-[#e9eded]">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-white group cursor-pointer hover:bg-white transition-all">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-portal-text-muted/40 text-[20px]">vpn_key</span>
                  <span className="font-manrope font-bold text-[#1a1a1a]">Two-Factor Authentication</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-1.5 bg-emerald-100 text-[#006b5d] text-[11px] font-bold rounded-full uppercase tracking-widest">Enabled</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Digital ID & Documents */}
        <div className="lg:col-span-6">
          <SectionCard title="Digital ID & Documents" icon="badge" subtitle="Access verified academic certificates" bgColor="bg-[#e9eded]">
             <div className="space-y-3">
               <div 
                 onClick={() => setShowBarcodeModal(true)}
                 className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-50/50 hover:bg-white/80 transition-all cursor-pointer group bg-white/50"
               >
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
                     <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
                   </div>
                   <div>
                     <h5 className="font-pjs font-bold text-[#003624] text-[13px] leading-none mb-1 text-left">Physical ID Barcode</h5>
                     <p className="text-[11px] font-manrope font-medium text-portal-text-muted/60">{profile?.barcode_value ? `Linked (${profile.barcode_value})` : 'Click to register barcode'}</p>
                   </div>
                 </div>
                 <button className="w-8 h-8 rounded-full flex items-center justify-center text-portal-text-muted/40 group-hover:bg-[#006b5d] group-hover:text-white transition-all">
                   <span className="material-symbols-outlined text-[16px]">edit</span>
                 </button>
               </div>

               <DocumentLink title="Digital Student ID" subtitle="Synced with campus directory" icon="id_card" actionIcon="visibility" />
               <DocumentLink title="Transcript of Records" subtitle="Ready for download (Unofficial)" icon="description" actionIcon="download" />
             </div>
          </SectionCard>
        </div>

      </div>

      {/* Barcode Registration Modal */}
      <BarcodeRegistrationModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        studentNumber={studentId}
        onSuccess={(newBarcode) => {
          setProfile(prev => ({ ...prev, barcode_value: newBarcode }));
        }}
      />

      {/* Student Number Confirmation Modal */}
      <StudentNumberPromptModal
        isOpen={showStudentIdModal}
        onClose={() => setShowStudentIdModal(false)}
        user={user}
        profile={profile}
        onSuccess={(updatedProfile) => {
          setProfile(updatedProfile);
        }}
      />
    </div>
  );
}

/* ══════════════════════════ SUB-COMPONENTS ══════════════════════════ */

function SectionCard({ title, icon, subtitle, children, bgColor = "bg-white" }) {
  return (
    <div className={`${bgColor} p-5 max-md:p-4 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/5 h-full group transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex flex-col justify-between`}>
      {title && (
        <div className="flex items-start gap-3 mb-5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#006b5d] border border-emerald-50">
            <span className="material-symbols-outlined fill-1 text-[20px]">{icon}</span>
          </div>
          <div>
            <h3 className="text-lg font-pjs font-bold text-[#1a1a1a] tracking-tight">{title}</h3>
            {subtitle && <p className="text-[13px] font-manrope text-portal-text-muted/60 font-medium mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

function DetailItem({ icon, label, value, iconBg, iconColor }) {
  return (
    <div className="flex items-start gap-4 max-md:gap-2">
      <div className={`w-11 h-11 max-md:w-8 max-md:h-8 max-md:rounded-lg rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 shadow-xs`}>
        <span className="material-symbols-outlined text-[20px] max-md:text-[16px]">{icon}</span>
      </div>
      <div className="space-y-0.5 max-md:space-y-0 overflow-hidden">
        <p className="text-[11px] max-md:text-[9px] font-pjs font-bold text-portal-text-muted uppercase tracking-widest leading-tight">{label}</p>
        <p className="font-manrope font-bold text-[#003624] leading-tight text-[15px] max-md:text-[12px] truncate" title={value}>{value}</p>
      </div>
    </div>
  );
}

function DocumentLink({ title, subtitle, icon, actionIcon }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-50/50 hover:bg-white/80 transition-all cursor-pointer group shadow-xs bg-white/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <div>
          <h5 className="font-pjs font-bold text-[#003624] text-[13px] leading-none mb-1 text-left">{title}</h5>
          <p className="text-[11px] font-manrope font-medium text-portal-text-muted/50">{subtitle}</p>
        </div>
      </div>
      <button className="w-8 h-8 rounded-full flex items-center justify-center text-portal-text-muted/40 group-hover:bg-[#006b5d] group-hover:text-white transition-all">
        <span className="material-symbols-outlined text-[16px]">{actionIcon}</span>
      </button>
    </div>
  );
}
