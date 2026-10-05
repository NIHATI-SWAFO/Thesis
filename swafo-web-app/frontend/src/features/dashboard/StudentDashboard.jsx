import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../../api/config";
import BarcodeRegistrationModal from "../../components/BarcodeRegistrationModal";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [violations, setViolations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  const displayName = profile?.user?.full_name || user?.name || 'Student';
  const firstName = displayName.split(' ')[0];

  const fetchData = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const profileResp = await fetch(`${API_ENDPOINTS.PROFILE_BY_EMAIL}?email=${user.email}`);
      if (profileResp.ok) setProfile(await profileResp.json());

      const violationsResp = await fetch(`${API_ENDPOINTS.VIOLATIONS_LIST}?email=${user.email}`);
      const violationsData = await violationsResp.json();
      setViolations(Array.isArray(violationsData) ? violationsData : (violationsData.results || []));
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

  if (loading && !violations.length) return <div className="p-20 text-center font-pjs font-bold text-[#003624] animate-pulse">Syncing Dashboard...</div>;

  return (
    <div className="max-w-[1580px] mx-auto space-y-6 animate-fade-in-up">

      {/* ═══════════════════════ HERO GREETING ═══════════════════════ */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h2 className="text-[1.85rem] font-pjs font-bold text-[#003624] tracking-tight leading-tight">
            Welcome back, {firstName} :)
          </h2>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
            <div className="flex items-center gap-2 text-portal-text-muted/60 font-manrope font-bold text-[0.85rem] uppercase tracking-widest">
              <span className="material-symbols-outlined text-[18px]">badge</span>
              {profile?.student_number || '---'}
            </div>
            <div className="flex items-center gap-2 text-portal-text-muted/60 font-manrope font-bold text-[0.85rem] uppercase tracking-widest border-l border-slate-200 pl-6">
              <span className="material-symbols-outlined text-[18px]">school</span>
              {profile?.course || '---'}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl shadow-sm border transition-all duration-500 ${
            standingData.tier === 'LOW' ? 'bg-[#d1fadf] text-[#006b5d] border-emerald-200/50' : 
            standingData.tier === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-rose-500/10' :
            standingData.tier === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200/60' :
            'bg-amber-50 text-amber-700 border-amber-200/50'
          }`}>
            <span className="material-symbols-outlined text-[18px] fill-1">
              {standingData.tier === 'LOW' ? 'verified' : standingData.tier === 'CRITICAL' ? 'gavel' : standingData.tier === 'HIGH' ? 'warning' : 'info'}
            </span>
            <span className="font-pjs font-bold text-[13px] tracking-wide uppercase">
              {standingData.standing}
            </span>
          </div>

          <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl shadow-sm border transition-all duration-500 ${
            standingData.clearance_impact === 'HOLD' ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-rose-500/10' :
            standingData.clearance_impact === 'RESTRICTED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
            standingData.clearance_impact === 'CONDITIONAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-[#f8fafc] text-slate-600 border-slate-200'
          }`}>
            <span className="material-symbols-outlined text-[18px]">
              {standingData.clearance_impact === 'HOLD' ? 'block' : standingData.clearance_impact === 'CLEARED' ? 'verified_user' : 'pending_actions'}
            </span>
            <span className="font-pjs font-bold text-[13px] tracking-wide uppercase">
              Clearance (§14): {standingData.clearance_impact === 'HOLD' ? 'Hold' : standingData.clearance_impact === 'CLEARED' ? 'Cleared' : standingData.clearance_impact === 'RESTRICTED' ? 'Restricted' : 'Conditional'}
            </span>
          </div>

          {/* Barcode Quick Action Pill */}
          <button
            onClick={() => setShowBarcodeModal(true)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl shadow-sm border transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer ${
              profile?.barcode_value
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/60'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/60'
            }`}
            title="Click to view, update, or scan ID barcode"
          >
            <span className="material-symbols-outlined text-[18px]">
              {profile?.barcode_value ? 'barcode_scanner' : 'add_photo_alternate'}
            </span>
            <span className="font-pjs font-bold text-[13px] tracking-wide uppercase">
              {profile?.barcode_value ? 'ID Barcode Linked' : 'Link ID Barcode'}
            </span>
          </button>
        </div>
      </section>

      {/* ═══════════════════════ BARCODE REGISTRATION & STATUS BANNER ═══════════════════════ */}
      {profile && (
        !profile.barcode_value ? (
          /* Unlinked State: Invitation to Register */
          <section className="bg-gradient-to-r from-[#003624] to-[#015237] text-white p-5 md:p-6 rounded-[2rem] shadow-lg border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
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
        ) : (
          /* Linked State: Verified Status with Manage / Re-scan Option */
          <section className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#003624] border border-emerald-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">barcode_scanner</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h4 className="font-pjs font-bold text-[16px] text-[#003624] leading-tight">
                    Institutional ID Barcode Linked
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">verified</span> Active
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-manrope text-[12px] text-slate-500">Registered Code:</span>
                  <span className="font-mono text-[12px] font-black text-[#003624] bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {profile.barcode_value}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium hidden md:inline">· Active for officer patrol scanning</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowBarcodeModal(true)}
              className="shrink-0 bg-emerald-50 hover:bg-emerald-100 text-[#003624] border border-emerald-200 font-pjs font-bold text-[12px] px-5 py-2.5 rounded-xl uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Update / Re-Scan ID
            </button>
          </section>
        )
      )}

      {/* ═══════════════════════ INSTITUTIONAL STANDING & PRIVILEGES ═══════════════════════ */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-emerald-100/60 space-y-6">
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
                <h3 className="text-xl font-pjs font-bold text-[#003624]">
                  Institutional Standing &amp; Privileges
                </h3>
                <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {standingData.handbook_citation}
                </span>
              </div>
              <p className="text-[12px] font-manrope text-slate-500 mt-0.5">
                Evaluation of academic honors, privileges, and clearance under the DLSU-D Student Handbook 2022–2027.
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
                  {standingData.honors_eligibility.replace('_', ' ')}
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
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-1">
        <StatCard icon="history" label="Violation History" value={totalCount.toString().padStart(2, '0')} iconBg="bg-slate-100" iconColor="text-slate-600" delay="1" />
        <StatCard icon="pending" label="Active Obligations" value={pendingCount.toString().padStart(2, '0')} iconBg="bg-[#fee4e2]" iconColor="text-[#d92d20]" delay="2" />
        <StatCard icon="check_circle" label="Closed Records" value={closedCount.toString().padStart(2, '0')} iconBg="bg-[#d1fadf]" iconColor="text-[#006b5d]" delay="3" />
      </section>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <Link to="/student/profile" className="block relative overflow-hidden bg-[#0A3D2E] p-8 rounded-[2rem] text-white min-h-[220px] flex flex-col justify-between shadow-xl group cursor-pointer transition-all border border-white/5">
              <div className="relative z-10">
                <h3 className="text-2xl font-pjs font-bold mb-2">Complete Academic Profile</h3>
                <p className="text-white/50 mb-5 text-[15px]">Manage your institutional credentials and semester enrollment details.</p>
                <button className="bg-white text-[#0A3D2E] px-7 py-2.5 rounded-xl font-pjs font-bold text-[12px]">Manage Details</button>
              </div>
           </Link>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to="/student/handbook"><LinkCard icon="menu_book" title="Campus Handbook" linkText="PDF Download" linkIcon="picture_as_pdf" /></Link>
              <Link to="/student/violations"><LinkCard icon="gavel" title="Violation History" description="Review incident logs and corrective actions." /></Link>
              <div onClick={() => setShowBarcodeModal(true)} className="cursor-pointer">
                <LinkCard 
                  icon="badge" 
                  title="Physical ID Barcode" 
                  linkText={profile?.barcode_value ? "Linked · Manage" : "Register ID"} 
                  linkIcon={profile?.barcode_value ? "check_circle" : "add_a_photo"} 
                />
              </div>
           </div>
        </div>
        <div className="lg:col-span-1">
           <Link to="/student/chatbot" className="bg-[#006b5d] p-8 rounded-[2rem] text-white shadow-xl h-full flex flex-col relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-[#2bd99b] flex items-center justify-center mb-5"><span className="material-symbols-outlined">auto_awesome</span></div>
              <h3 className="text-xl font-pjs font-bold mb-2">AI Curator</h3>
              <p className="text-white/60 text-[13px] mb-8">Ask anything about campus rules or guidelines.</p>
              <div className="mt-auto bg-white/10 rounded-2xl p-4 text-[12px] italic text-white/50 border border-white/10">"What are the curfew hours for dormitories?"</div>
           </Link>
        </div>
      </div>

      {/* ═══════════════════════ RECENT VIOLATIONS ═══════════════════════ */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-emerald-100/30">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-pjs font-bold text-[#003624]">Recent Violations</h3>
          <Link to="/student/violations" className="text-[11px] font-pjs font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-[#003624]">View All</Link>
        </div>
        
        <div className="space-y-6">
          {violations.length > 0 ? violations.slice(0, 3).map(v => (
            <ViolationEntry 
              key={v.id}
              violation={v}
              onTakeAction={handleTakeAction}
            />
          )) : (
            <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <p className="text-slate-400 font-manrope font-semibold">No violations on record.</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════ RESOLUTION MODAL ═══════════════════════ */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-[#003624]/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-[500px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="p-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[32px] font-bold">gavel</span>
              </div>
              <h2 className="text-[24px] font-pjs font-extrabold text-[#003624] mb-2 tracking-tight">Case Information</h2>
              <p className="text-[14px] text-slate-500 font-manrope leading-relaxed mb-8 max-w-[340px]">
                This case is currently under <span className="font-bold text-[#003624]">Institutional Review</span>. You may monitor the status or contact SWAFO for clarification.
              </p>
              <div className="w-full space-y-3">
                <button 
                  onClick={() => { 
                    window.open(`mailto:swafo@dlsud.edu.ph?subject=Appeal Request: Case ${selectedViolation?.id}&body=Name: ${displayName}%0D%0AStudent Number: ${profile?.student_number}%0D%0AViolation: ${selectedViolation?.rule_details?.title || selectedViolation?.rule_details?.category}%0D%0AReason for Appeal: `); 
                    setShowModal(false); 
                  }} 
                  className="w-full h-[65px] bg-[#003624] text-white rounded-2xl font-pjs font-black text-[13px] uppercase tracking-[0.2em] hover:bg-[#004d33] transition-all shadow-lg active:scale-[0.98]"
                >
                  Initiate Appeal (Email)
                </button>
                <button onClick={() => setShowModal(false)} className="w-full h-[65px] border-2 border-slate-100 text-slate-600 rounded-2xl font-pjs font-bold text-[13px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-[0.98]">Close Details</button>
              </div>
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

function StatCard({ icon, label, value, iconBg, iconColor, delay }) {
  return (
    <div className={`bg-white p-6 rounded-2xl flex items-center gap-5 border border-transparent shadow-sm group hover:-translate-y-1 transition-all`}>
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
        <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-pjs text-slate-400 font-bold uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-bold font-pjs text-[#1a1a1a]">{value}</h3>
      </div>
    </div>
  );
}

function LinkCard({ icon, title, description, linkText, linkIcon }) {
  return (
    <div className="bg-white p-7 rounded-[2rem] flex flex-col justify-between shadow-sm border border-emerald-100/50 hover:shadow-md transition-all group cursor-pointer min-h-[180px]">
      <div className="w-12 h-12 rounded-2xl bg-[#003624] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
      <div className="mt-4">
        <h4 className="text-xl font-pjs font-bold text-[#003624] mb-2">{title}</h4>
        {linkText ? <span className="inline-flex items-center gap-2 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{linkText}</span> : <p className="text-[13px] text-slate-400">{description}</p>}
      </div>
    </div>
  );
}

function ViolationEntry({ violation, onTakeAction }) {
  const isClosed = ['CLOSED', 'DISMISSED'].includes(violation.status);
  const title = violation.rule_details?.title || violation.rule_details?.category || "Policy Violation";

  return (
    <div className="p-8 rounded-[2.5rem] bg-white border border-emerald-50 shadow-sm flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden group">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${title.includes('MAJOR') ? 'bg-red-500' : 'bg-[#2bd99b]'}`} />
      
      <div className="flex-grow w-full">
        <div className="flex items-center gap-4 mb-5">
          <h4 className="text-[1.25rem] font-bold text-[#003624] font-pjs tracking-tight">{title}</h4>
          <span className={`px-5 py-1.5 text-[9px] font-black rounded-full uppercase tracking-widest ${isClosed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isClosed ? 'Archived' : violation.status.replace(/_/g, ' ')}
          </span>
        </div>
        
        <div className="flex gap-6 text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-6">
           <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">location_on</span>{violation.location}</span>
           <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">calendar_today</span>{new Date(violation.timestamp).toLocaleDateString()}</span>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Prescribed Action</p>
          <p className="text-[14px] text-[#003624] font-manrope font-bold">{violation.prescribed_sanction || "Pending review..."}</p>
        </div>
      </div>

      <div className="shrink-0 w-full lg:w-[200px]">
        {!isClosed ? (
          <button 
            onClick={() => onTakeAction(violation)}
            className="w-full flex items-center justify-center gap-3 bg-[#003624] text-white px-8 py-5 rounded-2xl font-pjs text-[13px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-900 transition-all active:scale-95"
          >
            View Details
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 py-4 text-[#006b5d] font-bold text-[13px] bg-emerald-50 rounded-2xl">
            <span className="material-symbols-outlined text-[20px]">verified</span>
            Case Finalized
          </div>
        )}
      </div>
    </div>
  );
}
