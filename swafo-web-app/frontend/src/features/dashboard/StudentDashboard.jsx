import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../../api/config";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [violations, setViolations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const displayName = profile?.user_details?.full_name || profile?.user?.full_name || user?.name || user?.email?.split('@')[0] || 'Student';
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

  const isProbation = totalCount >= 5;
  const hasObligation = pendingCount > 0;
  const isGoodStanding = totalCount === 0;

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
      <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-emerald-100/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#003624] text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/20">
            <span className="material-symbols-outlined text-[30px] sm:text-[34px]">school</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-manrope font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Student Portal
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-pjs font-bold text-[#003624] tracking-tight leading-tight truncate">
              Welcome back, {firstName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 font-medium font-manrope">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">badge</span>
                {profile?.student_number || '---'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">account_balance</span>
                <span className="truncate max-w-[260px] sm:max-w-none">{profile?.course || 'Academic Program'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Status Badges - Always Side-by-Side */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto">
          <div className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 rounded-full border text-[9.5px] sm:text-[12px] font-pjs font-bold tracking-tight uppercase transition-all shadow-xs text-center min-w-0 ${
            isGoodStanding ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
            isProbation ? 'bg-rose-50 text-rose-700 border-rose-200' :
            hasObligation ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className="material-symbols-outlined text-[14px] sm:text-[16px] shrink-0 fill-1">
              {isGoodStanding ? 'verified' : isProbation ? 'gavel' : 'info'}
            </span>
            <span className="truncate">
              {isGoodStanding ? 'Good Standing' : isProbation ? 'Disciplinary Probation' : hasObligation ? 'Outstanding Obligation' : 'Cleared Record'}
            </span>
          </div>

          {profile && profile.clearance_status && (
            <div className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 rounded-full border text-[9.5px] sm:text-[12px] font-pjs font-bold tracking-tight uppercase transition-all shadow-xs text-center min-w-0 ${
              profile.clearance_status === 'HOLD' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50/70 text-emerald-700 border-emerald-200/80'
            }`}>
              <span className="material-symbols-outlined text-[14px] sm:text-[16px] shrink-0">
                {profile.clearance_status === 'HOLD' ? 'block' : 'verified_user'}
              </span>
              <span className="truncate">
                {profile.clearance_status === 'HOLD' ? 'Clearance on Hold' : 'Clearance: Cleared'}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════ STATS OVERVIEW ═══════════════════════ */}
      <section className="grid grid-cols-3 gap-3 sm:gap-6">
        <StatCard 
          icon="history" 
          label="Total Records" 
          value={totalCount.toString().padStart(2, '0')} 
          subtitle="Lifetime entries"
          iconBg="bg-slate-100" 
          iconColor="text-slate-600" 
        />
        <StatCard 
          icon="hourglass_top" 
          label="Pending Review" 
          value={pendingCount.toString().padStart(2, '0')} 
          subtitle="Action required"
          iconBg="bg-amber-50" 
          iconColor="text-amber-600" 
          highlight={pendingCount > 0}
        />
        <StatCard 
          icon="check_circle" 
          label="Resolved Cases" 
          value={closedCount.toString().padStart(2, '0')} 
          subtitle="Closed / Cleared"
          iconBg="bg-emerald-50" 
          iconColor="text-emerald-700" 
        />
      </section>

      {/* ═══════════════════════ QUICK PORTAL SERVICES ═══════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-pjs font-bold text-[#003624]">
            Services & Quick Access
          </h2>
          <span className="text-xs text-slate-400 font-medium">Campus Resources</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          <ServiceCard
            to="/student/violations"
            icon="gavel"
            title="Violation Records"
            description="Inspect detailed incident logs, dates, and sanctions"
            badge={pendingCount > 0 ? `${pendingCount} Pending` : null}
            badgeColor="bg-amber-100 text-amber-800"
          />
          <ServiceCard
            to="/student/profile"
            icon="account_circle"
            title="Academic Profile"
            description="Manage your credentials, enrollment, and college status"
          />
          <ServiceCard
            to="/student/handbook"
            icon="menu_book"
            title="Student Handbook"
            description="Read campus policies, dress code, and guidelines"
          />
          <ServiceCard
            to="/student/chatbot"
            icon="smart_toy"
            title="AI Policy Curator"
            description="Instant answers to handbook questions and procedures"
            highlight={true}
          />
        </div>
      </section>

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
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
                  ['CLOSED', 'DISMISSED'].includes(selectedViolation.status) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
    </div>
  );
}

/* ═══════════════════════ SUB-COMPONENTS ═══════════════════════ */

function StatCard({ icon, label, value, subtitle, iconBg, iconColor, highlight }) {
  return (
    <div className={`bg-white p-3.5 sm:p-5 rounded-2xl border transition-all shadow-sm flex flex-col justify-between ${
      highlight ? 'border-amber-200 ring-2 ring-amber-100/50' : 'border-slate-100'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
          <span className="material-symbols-outlined text-[18px] sm:text-[22px]">{icon}</span>
        </div>
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
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
        highlight 
          ? 'bg-gradient-to-br from-[#003624] to-[#004d33] text-white border-[#003624] shadow-md' 
          : 'bg-white text-slate-800 border-slate-100 hover:border-emerald-200'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
            highlight ? 'bg-white/15 text-emerald-300' : 'bg-emerald-50 text-[#003624]'
          }`}>
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
          </div>
          {badge && (
            <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <h4 className={`text-sm sm:text-base font-pjs font-bold mb-1 leading-snug ${
          highlight ? 'text-white' : 'text-slate-900 group-hover:text-[#003624]'
        }`}>
          {title}
        </h4>
        <p className={`text-xs font-manrope line-clamp-2 leading-relaxed ${
          highlight ? 'text-emerald-100/80' : 'text-slate-400'
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
          <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${
            isClosed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-pjs text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            isClosed 
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
