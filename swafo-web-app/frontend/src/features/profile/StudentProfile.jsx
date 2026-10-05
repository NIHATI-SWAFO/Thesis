import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../../api/config";
import BarcodeRegistrationModal from "../../components/BarcodeRegistrationModal";

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIdModal, setShowIdModal] = useState(false);
  const [showDocNotice, setShowDocNotice] = useState(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  const email = user?.email;


  const fetchProfile = () => {
    if (email) {
      fetch(`${API_ENDPOINTS.PROFILE_BY_EMAIL}?email=${email}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setProfile(data);
          }
        })
        .catch(err => console.error("Profile fetch error:", err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [email]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-[#003624] rounded-full animate-spin mb-4" />
        <p className="font-pjs font-bold text-sm text-[#003624]">Loading Academic Profile...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving institutional student records</p>
      </div>
    );
  }

  const fullName = profile?.user_details?.full_name || profile?.user?.full_name || user?.name || user?.email?.split('@')[0] || "Student Name";
  const studentId = profile?.student_number || "---";
  const course = profile?.course || "Academic Program";
  const yearLevel = profile?.year_level || "1";
  const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || "ST";
  const violationCount = profile?.violation_count || 0;
  const isCleared = profile?.clearance_status !== 'HOLD';

  const handleExportProfile = () => {
    window.print();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8 animate-fade-in-up pb-12">
      
      {/* ══════════════════════════ PROFILE HERO HEADER ══════════════════════════ */}
      <section className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-emerald-100/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left w-full md:w-auto">
          {/* Avatar with Initials */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-[#003624] flex items-center justify-center ring-4 ring-emerald-50 shadow-lg text-white font-pjs font-extrabold text-2xl sm:text-3xl">
              {initials}
            </div>
            {/* Verified Academic Badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center shadow text-white" title="Verified University Student">
              <span className="material-symbols-outlined text-[15px] sm:text-[17px] fill-1">verified</span>
            </div>
          </div>

          {/* Info Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100/70 text-emerald-800">
                Official Student Record
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                Regular Enrolled
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-pjs font-bold text-slate-900 tracking-tight leading-tight">
              {fullName}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 font-manrope font-medium">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">badge</span>
                ID: {studentId}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">school</span>
                Year {yearLevel}
              </span>
              <span className="text-slate-300">•</span>
              <span className="truncate max-w-[240px] sm:max-w-none">{course}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <button 
            onClick={() => setShowIdModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-[#003624] font-pjs font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            Digital Student ID
          </button>
          <button 
            onClick={handleExportProfile}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#003624] hover:bg-[#004d33] text-white font-pjs font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-950/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print Record
          </button>
        </div>
      </section>

      {/* ══════════════════════════ METRICS OVERVIEW ══════════════════════════ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatusCard 
          label="Enrollment Status"
          value="Enrolled (Regular)"
          badge="Active SY 2025-2026"
          icon="check_circle"
          color="text-emerald-700"
          bg="bg-emerald-50"
        />
        <StatusCard 
          label="Conduct Standing"
          value={violationCount >= 5 ? "Disciplinary Probation" : violationCount >= 2 ? "Under Review" : "Good Standing"}
          badge={violationCount === 0 ? "Clean Record" : `${violationCount} Infractions`}
          icon="gavel"
          color={violationCount >= 5 ? "text-rose-700" : violationCount >= 2 ? "text-amber-700" : "text-[#006b5d]"}
          bg={violationCount >= 5 ? "bg-rose-50" : violationCount >= 2 ? "bg-amber-50" : "bg-emerald-50"}
        />
        <StatusCard 
          label="SWAFO Clearance"
          value={isCleared ? "Clearance Cleared" : "Clearance On Hold"}
          badge={isCleared ? "Eligible" : "Pending Office Action"}
          icon="verified_user"
          color={isCleared ? "text-emerald-700" : "text-rose-700"}
          bg={isCleared ? "bg-emerald-50" : "bg-rose-50"}
        />
        <StatusCard 
          label="Academic Year"
          value={`Year ${yearLevel} - 2nd Sem`}
          badge="Graduation Track"
          icon="calendar_month"
          color="text-slate-700"
          bg="bg-slate-100"
        />
      </section>

      {/* ══════════════════════════ MAIN CONTENT TWO-COLUMN ══════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
        
        {/* LEFT COLUMN: Institutional Profile Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-7">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#003624] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">account_circle</span>
                </div>
                <div>
                  <h3 className="font-pjs font-bold text-base text-slate-900 leading-tight">Institutional Enrollment Data</h3>
                  <p className="text-xs text-slate-400 font-manrope">Verified records from Registrar &amp; SWAFO office</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <ProfileItem 
                icon="badge" 
                label="Student Number" 
                value={studentId} 
              />
              <ProfileItem 
                icon="alternate_email" 
                label="Institutional Email" 
                value={profile?.user_details?.email || email || "---"} 
              />
              <ProfileItem 
                icon="account_balance" 
                label="College / Department" 
                value={course} 
              />
              <ProfileItem 
                icon="school" 
                label="Academic Degree" 
                value={course} 
              />
              <ProfileItem 
                icon="history_edu" 
                label="Semester Term" 
                value="2nd Semester SY 2025 - 2026" 
              />
              <ProfileItem 
                icon="verified" 
                label="SSO Identity" 
                value="Verified Microsoft Entra (Azure AD)" 
              />
            </div>
          </div>

          {/* Quick Access to Violations */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">gavel</span>
              </div>
              <div>
                <h4 className="text-sm font-pjs font-bold text-slate-900 leading-tight">Conduct Records Log</h4>
                <p className="text-xs text-slate-400 font-manrope mt-0.5">
                  {violationCount === 0 
                    ? "Your record is completely clear with no active sanctions." 
                    : `You have ${violationCount} recorded disciplinary infraction(s).`}
                </p>
              </div>
            </div>
            <Link 
              to="/student/violations" 
              className="w-full sm:w-auto px-5 py-2.5 bg-[#003624] hover:bg-[#004d33] text-white rounded-xl font-pjs font-bold text-xs uppercase tracking-wider transition-all text-center shrink-0 cursor-pointer shadow-sm"
            >
              View Disciplinary File
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Official Documents & Security */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Academic Standing & Privileges Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-7">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#003624] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">analytics</span>
                </div>
                <div>
                  <h3 className="font-pjs font-bold text-base text-slate-900 leading-tight">Academic Standing &amp; Privileges</h3>
                  <p className="text-xs text-slate-400 font-manrope">DLSU-D Student Handbook 2022–2027</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <StatusRow label="Enrollment" status="Active" type="success" />
              {(() => {
                const rs = profile?.risk_standing || {
                  standing: 'Good Standing',
                  tier: 'LOW',
                  clearance_impact: 'CLEARED',
                  honors_eligibility: 'ELIGIBLE',
                  gmc_status: 'AVAILABLE',
                  handbook_citation: 'Section 14',
                };

                const typeMap = {
                  LOW: 'success',
                  MODERATE: 'warning',
                  HIGH: 'orange',
                  CRITICAL: 'error',
                };
                const standingType = typeMap[rs.tier] || 'success';
                const clearanceType = rs.clearance_impact === 'CLEARED' ? 'success' : rs.clearance_impact === 'HOLD' ? 'error' : 'warning';
                const honorsType = rs.honors_eligibility === 'ELIGIBLE' ? 'success' : rs.honors_eligibility === 'UNDER_REVIEW' ? 'warning' : 'error';
                const gmcType = rs.gmc_status === 'AVAILABLE' ? 'success' : rs.gmc_status === 'DEFERRED' ? 'warning' : 'error';

                return (
                  <>
                    <StatusRow label="Behavioral Standing" status={rs.standing} type={standingType} />
                    <StatusRow label="Clearance (§14)" status={rs.clearance_impact} type={clearanceType} />
                    <StatusRow label="Dean's List / Honors" status={rs.honors_eligibility.replace('_', ' ')} type={honorsType} />
                    <StatusRow label="Good Moral (GMC)" status={rs.gmc_status} type={gmcType} />
                  </>
                );
              })()}
            </div>
          </div>

          {/* Documents & Identification Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-7">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#003624] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">id_card</span>
                </div>
                <div>
                  <h3 className="font-pjs font-bold text-base text-slate-900 leading-tight">Identity &amp; Credentials</h3>
                  <p className="text-xs text-slate-400 font-manrope">Digital campus pass &amp; certificates</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Barcode Registration Item */}
              <div 
                onClick={() => setShowBarcodeModal(true)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-700 shadow-xs border border-emerald-50 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-pjs font-bold text-xs text-slate-800 group-hover:text-[#003624] leading-tight truncate">
                      Physical ID Barcode
                    </h5>
                    <p className="text-[10.5px] text-slate-400 font-manrope truncate mt-0.5">
                      {profile?.barcode_value ? `Barcode: ${profile.barcode_value}` : 'Upload ID image or scan barcode'}
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                  profile?.barcode_value ? 'bg-emerald-100 text-[#006b5d]' : 'bg-slate-100 text-slate-600'
                }`}>
                  {profile?.barcode_value ? 'Linked · Manage' : 'Register ID'}
                </span>
              </div>

              <DocRow 
                icon="badge"
                title="Digital Student ID Card"
                subtitle="NFC & Barcode Verified"
                actionText="View ID"
                onClick={() => setShowIdModal(true)}
              />
              <DocRow 
                icon="menu_book"
                title="Campus Student Handbook"
                subtitle="Rules, policies & procedures"
                actionText="Open"
                to="/student/handbook"
              />
              <DocRow 
                icon="verified"
                title="Good Moral Character Status"
                subtitle={profile?.risk_standing?.gmc_status === 'AVAILABLE' ? "Eligible for automatic issuance" : "Under review"}
                actionText="Check"
                onClick={() => setShowDocNotice("Good Moral Certificate")}
              />
              <DocRow 
                icon="description"
                title="Transcript of Records"
                subtitle={profile?.risk_standing?.clearance_impact === 'HOLD' ? 'Locked — Section 14 Clearance Hold' : 'Ready for request'}
                actionText={profile?.risk_standing?.clearance_impact === 'HOLD' ? 'Locked' : 'Request'}
                onClick={() => setShowDocNotice("Transcript Clearance Status")}
              />
            </div>
          </div>

          {/* Security & Access */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-7">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#003624] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">security</span>
                </div>
                <div>
                  <h3 className="font-pjs font-bold text-base text-slate-900 leading-tight">Access &amp; Privacy</h3>
                  <p className="text-xs text-slate-400 font-manrope">University single sign-on credentials</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">lock</span>
                  <span className="font-semibold text-slate-700">Multi-Factor Authentication</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[9.5px] bg-emerald-100 text-emerald-800">
                  Enforced
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified_user</span>
                  <span className="font-semibold text-slate-700">Account Type</span>
                </div>
                <span className="font-bold text-slate-600">Student Account</span>
              </div>
            </div>
          </div>

        </div>

      </div>


      {/* ══════════════════════════ DIGITAL ID MODAL ══════════════════════════ */}
      {showIdModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-100 animate-in zoom-in-95 duration-200">
            
            {/* ID Card Front */}
            <div className="bg-[#003624] text-white p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                    <span className="material-symbols-outlined text-[20px]">school</span>
                  </div>
                  <div>
                    <h3 className="font-pjs font-extrabold text-sm tracking-tight leading-tight">DE LA SALLE UNIVERSITY - DASMARIÑAS</h3>
                    <p className="text-[9px] uppercase tracking-widest text-emerald-300 font-bold">SWAFO Academic Pass</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowIdModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* ID Body */}
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-24 h-28 rounded-2xl bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center text-white shrink-0 shadow-inner">
                  <span className="font-pjs font-black text-3xl">{initials}</span>
                  <span className="text-[8px] uppercase tracking-wider text-emerald-300 font-bold mt-1">Photo ID</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-pjs font-bold text-base text-white truncate leading-snug">{fullName}</h4>
                  <p className="text-xs text-emerald-200 font-mono font-bold mt-0.5 tracking-wider">#{studentId}</p>
                  <p className="text-[11px] text-white/80 font-medium truncate mt-1">{course}</p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Valid SY 2025-2026
                  </div>
                </div>
              </div>
            </div>

            {/* ID Barcode Section */}
            <div className="p-6 bg-slate-50 flex flex-col items-center justify-center border-t border-slate-200/60">
              <div className="w-full h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center px-4 font-mono text-xs tracking-[0.3em] font-bold text-slate-700 shadow-inner">
                |||||| | |||| || |||||| | |||
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1.5">BARCODE ID • {studentId}</p>
              
              <button 
                onClick={() => setShowIdModal(false)}
                className="mt-4 w-full py-2.5 bg-[#003624] text-white rounded-xl font-pjs font-bold text-xs uppercase tracking-wider hover:bg-[#004d33] transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Document Notice Toast / Modal */}
      {showDocNotice && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[26px]">verified</span>
            </div>
            <h3 className="font-pjs font-bold text-base text-slate-900 mb-1">{showDocNotice}</h3>
            <p className="text-xs text-slate-500 font-manrope leading-relaxed mb-5">
              {violationCount === 0 
                ? "Your academic and conduct records are verified. Certificate is approved for official release at the SWAFO Office."
                : "You currently have records requiring review before certificate release. Please visit the SWAFO Discipline Office."}
            </p>
            <button 
              onClick={() => setShowDocNotice(null)}
              className="w-full py-2.5 bg-[#003624] text-white rounded-xl font-pjs font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Barcode Registration Modal */}
      <BarcodeRegistrationModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        profile={profile}
        onSuccess={(newBarcode) => {
          setProfile(prev => ({ ...prev, barcode_value: newBarcode }));
          fetchProfile();
        }}
      />

    </div>
  );
}

/* ══════════════════════════ HELPER COMPONENTS ══════════════════════════ */

function StatusCard({ label, value, badge, icon, color, bg }) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 font-pjs">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
          <span className="material-symbols-outlined text-[17px]">{icon}</span>
        </div>
      </div>
      <div>
        <h4 className="text-sm sm:text-base font-bold text-slate-900 font-pjs leading-tight truncate">
          {value}
        </h4>
        <span className="text-[10px] font-medium text-slate-500 font-manrope mt-0.5 inline-block">
          {badge}
        </span>
      </div>
    </div>
  );
}

function ProfileItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-700 shadow-xs border border-emerald-50 shrink-0 mt-0.5">
        <span className="material-symbols-outlined text-[17px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-pjs mb-0.5">{label}</p>
        <p className="text-xs sm:text-[13px] font-semibold text-slate-800 font-manrope leading-snug break-words">{value}</p>
      </div>
    </div>
  );
}

function DocRow({ icon, title, subtitle, actionText, onClick, to }) {
  const content = (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-700 shadow-xs border border-emerald-50 shrink-0">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <div className="min-w-0">
          <h5 className="font-pjs font-bold text-xs text-slate-800 group-hover:text-[#003624] leading-tight truncate">{title}</h5>
          <p className="text-[10.5px] text-slate-400 font-manrope truncate mt-0.5">{subtitle}</p>
        </div>
      </div>
      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white px-2.5 py-1 rounded-lg transition-colors shrink-0">
        {actionText}
      </span>
    </div>
  );

  if (to) {
    return <Link to={to} className="block no-underline">{content}</Link>;
  }

  return <div onClick={onClick}>{content}</div>;
}

function StatusRow({ label, status, type }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-manrope font-semibold text-portal-text text-[14px]">{label}</span>
      <span className={`px-4 py-1.5 rounded-2xl text-[12px] font-bold font-pjs uppercase tracking-tight shadow-sm ${
        type === 'success' ? 'bg-[#d1fadf] text-[#006b5d]' : 
        type === 'warning' ? 'bg-amber-100 text-amber-800' :
        type === 'orange' ? 'bg-orange-100 text-orange-800' :
        type === 'error' ? 'bg-red-100 text-red-700' :
        'bg-slate-100 text-slate-600'
      }`}>
        {status}
      </span>
    </div>
  );
}

