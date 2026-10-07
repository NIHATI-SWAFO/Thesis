import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../../api/config";
import BarcodeRegistrationModal from "../../components/BarcodeRegistrationModal";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [violations, setViolations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  const displayName = profile?.user_details?.full_name || profile?.user?.full_name || user?.name || user?.email?.split('@')[0] || 'Student';
  const rawFirstName = displayName.split(' ')[0] || 'Student';
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();

  const fetchData = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const profileResp = await fetch(`${API_ENDPOINTS.PROFILE_BY_EMAIL}?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`);
      if (profileResp.ok) setProfile(await profileResp.json());

      const violationsResp = await fetch(`${API_ENDPOINTS.VIOLATIONS_LIST}?email=${user.email}`);
      if (violationsResp.ok) {
        const violationsData = await violationsResp.json();
        setViolations(Array.isArray(violationsData) ? violationsData : (violationsData.results || []));
      }
    } catch (err) {
      console.error("Dashboard sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleTakeAction = (v) => {
    setSelectedViolation(v);
    setShowModal(true);
  };

  const totalCount = violations.length;
  const closedCount = violations.filter(v => ['CLOSED', 'DISMISSED'].includes(v.status)).length;
  const pendingCount = totalCount - closedCount;

  // Algorithmic Standing derived directly from Backend Serializer
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

  if (loading && !violations.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-[#003624] rounded-full animate-spin mb-4" />
        <p className="font-pjs font-bold text-sm text-[#003624]">Syncing Student Records...</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to institutional database</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8 animate-fade-in-up pb-10">

      {/* ═══════════════════════ HEADER & GREETING ═══════════════════════ */}
      <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-emerald-100/60 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#003624] text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/20">
            <span className="material-symbols-outlined text-[30px] sm:text-[34px]">school</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-manrope font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100">
                Student Portal
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-pjs font-bold text-[#003624] tracking-tight leading-tight truncate">
              Welcome back, {firstName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 font-manrope">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-100/80 font-mono font-bold text-[11px]">
                <span className="material-symbols-outlined text-[14px] text-emerald-700">badge</span>
                {profile?.student_number || '---'}
              </span>
              <span className="text-slate-300 font-bold">•</span>
              <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium text-xs truncate max-w-[280px] sm:max-w-none">
                <span className="material-symbols-outlined text-[14px] text-slate-400">account_balance</span>
                {profile?.course || 'Academic Program'}
              </span>
            </div>
          </div>
        </div>

        {/* Unified Status & Clearance Capsule */}
        <div className="flex items-center divide-x divide-slate-100 bg-slate-50/90 rounded-2xl border border-slate-200/70 p-1.5 sm:p-2 shadow-xs shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
          {/* Disciplinary Standing */}
          <Link
            to="/student/profile"
            title="View conduct standing and handbook details on Academic Profile"
            className="flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 text-center no-underline group hover:bg-white rounded-xl transition-all cursor-pointer"
          >
            <span className="text-[10px] font-pjs font-bold text-slate-400 uppercase tracking-wider block">
              Standing
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                standingData.tier === 'LOW' ? 'bg-emerald-500 ring-2 ring-emerald-100' :
                standingData.tier === 'CRITICAL' ? 'bg-rose-500 ring-2 ring-rose-100' :
                standingData.tier === 'HIGH' ? 'bg-orange-500 ring-2 ring-orange-100' :
                'bg-amber-500 ring-2 ring-amber-100'
              }`} />
              <span className={`text-xs font-pjs font-bold truncate ${
                standingData.tier === 'LOW' ? 'text-emerald-800' :
                standingData.tier === 'CRITICAL' ? 'text-rose-700' :
                standingData.tier === 'HIGH' ? 'text-orange-700' :
                'text-amber-800'
              }`}>
                {standingData.standing}
              </span>
            </div>
          </Link>

          {/* Institutional Clearance */}
          <Link
            to="/student/profile"
            title="View institutional clearance status on Academic Profile"
            className="flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 text-center no-underline group hover:bg-white rounded-xl transition-all cursor-pointer"
          >
            <span className="text-[10px] font-pjs font-bold text-slate-400 uppercase tracking-wider block">
              Clearance
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                standingData.clearance_impact === 'CLEARED' ? 'bg-emerald-500 ring-2 ring-emerald-100' :
                standingData.clearance_impact === 'HOLD' ? 'bg-rose-500 ring-2 ring-rose-100' :
                'bg-amber-500 ring-2 ring-amber-100'
              }`} />
              <span className={`text-xs font-pjs font-bold truncate ${
                standingData.clearance_impact === 'CLEARED' ? 'text-emerald-800' :
                standingData.clearance_impact === 'HOLD' ? 'text-rose-700' :
                'text-amber-800'
              }`}>
                {standingData.clearance_impact === 'HOLD' ? 'On Hold' :
                 standingData.clearance_impact === 'CLEARED' ? 'Cleared' :
                 'Conditional'}
              </span>
            </div>
          </Link>

          {/* Physical ID Barcode */}
          <button
            onClick={() => setShowBarcodeModal(true)}
            title={profile?.barcode_value ? `Linked Barcode: ${profile.barcode_value} (Click to re-scan)` : 'Click to link your physical ID barcode'}
            className="flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 text-center group hover:bg-white rounded-xl transition-all cursor-pointer"
          >
            <span className="text-[10px] font-pjs font-bold text-slate-400 uppercase tracking-wider block">
              ID Barcode
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                profile?.barcode_value ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-slate-400'
              }`} />
              <span className={`text-xs font-pjs font-bold truncate ${
                profile?.barcode_value ? 'text-emerald-800' : 'text-slate-600'
              }`}>
                {profile?.barcode_value ? 'Linked' : 'Not Linked'}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* ═══════════════════════ UNLINKED BARCODE PROMPT BANNER ═══════════════════════ */}
      {profile && !profile.barcode_value && (
        <section className="bg-gradient-to-r from-[#003624] to-[#015237] text-white p-5 md:p-6 rounded-2xl sm:rounded-3xl shadow-lg border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <span className="material-symbols-outlined text-[28px]">barcode_scanner</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-pjs font-bold text-[16px] leading-tight">
                  Link Physical ID Barcode
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  Not Linked
                </span>
              </div>
              <p className="font-manrope text-[12px] text-emerald-100/70 mt-1 max-w-xl">
                Upload a photo or scan your physical DLSU-D ID barcode to activate instant officer scanning during campus patrols.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBarcodeModal(true)}
            className="shrink-0 bg-white hover:bg-emerald-50 text-[#003624] font-pjs font-black text-[12px] px-6 py-3 rounded-xl uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
            Register Barcode
          </button>
        </section>
      )}


      {/* Stats row removed for brevity in display, but remains functional in code */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-1 max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:gap-4 max-md:pb-2 max-md:[&::-webkit-scrollbar]:hidden max-md:[scrollbar-width:none]">
        <StatCard icon="history" label="Violation History" value={totalCount.toString().padStart(2, '0')} iconBg="bg-slate-100" iconColor="text-slate-600" delay="1" />
        <StatCard icon="pending" label="Pending Actions" value={pendingCount.toString().padStart(2, '0')} iconBg="bg-[#fee4e2]" iconColor="text-[#d92d20]" delay="2" />
        <StatCard icon="check_circle" label="Closed Records" value={closedCount.toString().padStart(2, '0')} iconBg="bg-[#d1fadf]" iconColor="text-[#006b5d]" delay="3" />
      </section>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Link to="/student/profile" className="block relative overflow-hidden bg-[#0A3D2E] p-8 max-md:py-5 max-md:px-6 rounded-[2rem] text-white min-h-[220px] max-md:min-h-[160px] flex flex-col justify-between shadow-xl group cursor-pointer transition-all border border-white/5">
            <div className="relative z-10">
              <h3 className="text-2xl max-md:text-lg font-pjs font-bold mb-2">Complete Academic Profile</h3>
              <p className="text-white/50 mb-5 text-[15px]">Manage your institutional credentials and semester enrollment details.</p>
              <button className="bg-white text-[#0A3D2E] px-7 py-2.5 rounded-xl font-pjs font-bold text-[12px]">Manage Details</button>
            </div>
          </Link>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/student/handbook"><LinkCard icon="menu_book" title="Campus Handbook" linkText="PDF Download" linkIcon="picture_as_pdf" /></Link>
            <Link to="/student/violations"><LinkCard icon="gavel" title="Violation History" description="Review incident logs and corrective actions." /></Link>
          </div>
        </div>
        <div className="lg:col-span-1">
          <Link to="/student/chatbot" className="bg-[#006b5d] p-8 max-md:py-5 max-md:px-6 rounded-[2rem] text-white shadow-xl h-full flex flex-col relative overflow-hidden max-md:min-h-[160px]">
            <div className="w-12 h-12 rounded-xl bg-[#2bd99b] flex items-center justify-center mb-5"><span className="material-symbols-outlined">auto_awesome</span></div>
            <h3 className="text-xl max-md:text-lg font-pjs font-bold mb-2">AI Curator</h3>
            <p className="text-white/60 text-[13px] mb-8">Ask anything about campus rules or guidelines.</p>
            <div className="mt-auto bg-white/10 rounded-2xl p-4 text-[12px] italic text-white/50 border border-white/10">"What are the curfew hours for dormitories?"</div>
          </Link>
        </div>
      </div>

      {/* ═══════════════════════ RECENT VIOLATIONS FEED ═══════════════════════ */}
      <section className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-sm border border-emerald-100/50">
        <div className="flex items-center justify-between mb-5 sm:mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-xl font-pjs font-bold text-[#003624]">Recent Incident Logs</h3>
            <p className="text-xs text-slate-400 font-manrope mt-0.5">Official disciplinary entries recorded under your student profile</p>
          </div>
          <Link
            to="/student/violations"
            className="text-xs font-pjs font-bold text-[#003624] hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 px-3.5 py-1.5 rounded-xl uppercase tracking-wider transition-colors flex items-center gap-1"
          >
            <span>All Records</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="space-y-3.5 sm:space-y-4">
          {violations.length > 0 ? (
            violations.slice(0, 3).map(v => (
              <ViolationCard
                key={v.id}
                violation={v}
                onTakeAction={handleTakeAction}
              />
            ))
          ) : (
            <div className="py-12 sm:py-14 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[30px]">verified_user</span>
              </div>
              <h4 className="text-sm font-pjs font-bold text-[#003624]">Exemplary Standing</h4>
              <p className="text-xs text-slate-400 font-manrope max-w-sm mx-auto mt-1">
                You currently have no recorded infractions or open disciplinary cases. Keep up the good work!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════ CASE DETAILS MODAL ═══════════════════════ */}
      {showModal && selectedViolation && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-[520px] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="px-6 py-5 bg-[#003624] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">gavel</span>
                </div>
                <div>
                  <h3 className="font-pjs font-bold text-base leading-tight">Case Information</h3>
                  <p className="text-[11px] text-emerald-300 font-manrope">Ref #{selectedViolation.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${['CLOSED', 'DISMISSED'].includes(selectedViolation.status) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                  Status: {selectedViolation.status?.replace(/_/g, ' ')}
                </span>
                <h4 className="text-lg font-pjs font-bold text-slate-900 leading-snug">
                  {selectedViolation.rule_details?.title || selectedViolation.rule_details?.category || "Policy Violation"}
                </h4>
                {selectedViolation.rule_details?.description && (
                  <p className="text-xs text-slate-500 font-manrope mt-1 leading-relaxed">
                    {selectedViolation.rule_details.description}
                  </p>
                )}
              </div>

              {/* Metadata Box */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Location</p>
                  <p className="font-semibold text-slate-700 mt-0.5 truncate">{selectedViolation.location || 'Campus Ground'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Date Logged</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{new Date(selectedViolation.timestamp).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Sanction Box */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider mb-1">Prescribed Action / Sanction</p>
                <p className="text-xs font-semibold text-[#003624] leading-relaxed">
                  {selectedViolation.prescribed_sanction || selectedViolation.director_sanction || "Case is under review by SWAFO Disciplinary Board."}
                </p>
              </div>

              {selectedViolation.director_remarks && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Director's Notes</p>
                  <p className="text-xs text-slate-600 italic">"{selectedViolation.director_remarks}"</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  window.open(`mailto:swafo@dlsud.edu.ph?subject=Appeal Request: Case ${selectedViolation?.id}&body=Name: ${displayName}%0D%0AStudent Number: ${profile?.student_number}%0D%0AViolation: ${selectedViolation?.rule_details?.title || selectedViolation?.rule_details?.category}%0D%0AReason for Appeal: `);
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

      {/* Barcode Registration Modal */}
      <BarcodeRegistrationModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        profile={profile}
        onSuccess={(newBarcode) => {
          setProfile(prev => ({ ...prev, barcode_value: newBarcode }));
        }}
      />
    </div>
  );
}

/* ═══════════════════════ SUB-COMPONENTS ═══════════════════════ */

function StatCard({ icon, label, value, subtitle, iconBg, iconColor, highlight }) {
  return (
    <div className={`bg-white p-6 max-md:p-4 rounded-2xl flex items-center gap-5 max-md:gap-4 border border-transparent shadow-sm group hover:-translate-y-1 transition-all max-md:min-w-[80%] max-md:snap-center`}>
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
        <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <p className="text-[9px] sm:text-[11px] font-pjs text-slate-400 font-bold uppercase tracking-wider truncate mb-0.5">
          {label}
        </p>
        <h3 className="text-xl sm:text-3xl font-extrabold font-pjs text-slate-900 leading-tight">
          {value}
        </h3>
        <p className="hidden sm:block text-[10px] text-slate-400 font-medium font-manrope mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function ServiceCard({ to, icon, title, description, badge, badgeColor, highlight }) {
  return (
    <Link
      to={to}
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${highlight
          ? 'bg-gradient-to-br from-[#003624] to-[#004d33] text-white border-[#003624] shadow-md'
          : 'bg-white text-slate-800 border-slate-100 hover:border-emerald-200'
        }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${highlight ? 'bg-white/15 text-emerald-300' : 'bg-emerald-50 text-[#003624]'
            }`}>
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
          </div>
          {badge && (
            <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <h4 className={`text-sm sm:text-base font-pjs font-bold mb-1 leading-snug ${highlight ? 'text-white' : 'text-slate-900 group-hover:text-[#003624]'
          }`}>
          {title}
        </h4>
        <p className={`text-xs font-manrope line-clamp-2 leading-relaxed ${highlight ? 'text-emerald-100/80' : 'text-slate-400'
          }`}>
          {description}
        </p>
      </div>

      <div className="flex items-center gap-1 text-[11px] font-bold mt-4 pt-3 border-t border-slate-100/50">
        <span className={highlight ? 'text-emerald-300' : 'text-emerald-700'}>Access Service</span>
        <span className="material-symbols-outlined text-[15px] group-hover:translate-x-1 transition-transform">
          arrow_forward
        </span>
      </div>
    </Link>
  );
}

function ViolationCard({ violation, onTakeAction }) {
  const isClosed = ['CLOSED', 'DISMISSED'].includes(violation.status);
  const title = violation.rule_details?.title || violation.rule_details?.category || "Policy Violation";

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 hover:border-emerald-100 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${isClosed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
            {isClosed ? 'Resolved' : violation.status?.replace(/_/g, ' ')}
          </span>
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
            Ref #{violation.id}
          </span>
        </div>

        <h4 className="text-sm sm:text-base font-bold text-slate-900 font-pjs tracking-tight leading-snug">
          {title}
        </h4>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium font-manrope mt-2">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
            {violation.location || 'Campus'}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-slate-400">event</span>
            {new Date(violation.timestamp).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-end">
        <button
          onClick={() => onTakeAction(violation)}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-pjs text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${isClosed
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-[#003624] hover:bg-[#004d33] text-white shadow-sm'
            }`}
        >
          <span>View Details</span>
          <span className="material-symbols-outlined text-[16px]">visibility</span>
        </button>
      </div>
    </div>
  );
}

function LinkCard({ icon, title, description, linkText, linkIcon }) {
  return (
    <div className="bg-slate-50/80 p-6 rounded-[1.5rem] flex flex-col justify-between hover:bg-emerald-50/40 transition-all shadow-sm group cursor-pointer border border-slate-100 hover:border-emerald-200 min-h-[158px]">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#003624] text-white flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        {linkText && (
          <div className="flex items-center gap-1.5 text-[#006b5d] text-[12px] font-bold font-pjs group-hover:translate-x-1 transition-transform">
            <span>{linkText}</span>
            {linkIcon && <span className="material-symbols-outlined text-[16px]">{linkIcon}</span>}
          </div>
        )}
      </div>
      <div>
        <h4 className="font-pjs font-bold text-slate-900 text-lg mb-1 leading-tight">{title}</h4>
        {description && <p className="text-slate-400 font-manrope text-xs leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}

