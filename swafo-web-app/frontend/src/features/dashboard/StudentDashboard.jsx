import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../../api/config";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [violations, setViolations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleAcknowledge = async () => {
    if (!selectedViolation) return;
    
    try {
      const resp = await fetch(API_ENDPOINTS.VIOLATIONS_UPDATE_STATUS(selectedViolation.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' })
      });

      if (resp.ok) {
        setShowModal(false);
        fetchData(); // Refresh dashboard
      }
    } catch (err) {
      console.error("Acknowledge error:", err);
    }
  };

  const totalCount = violations.length;
  const closedCount = violations.filter(v => v.status === 'RESOLVED' || v.status === 'APPEALED').length;
  const pendingCount = totalCount - closedCount;

  const isProbation = totalCount >= 5;
  const hasObligation = pendingCount > 0;
  const isGoodStanding = totalCount === 0;

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
        
        <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl shadow-sm border transition-all duration-500 ${
          isGoodStanding ? 'bg-[#d1fadf] text-[#006b5d] border-emerald-200/50' : 
          isProbation ? 'bg-red-50 text-red-600 border-red-100' :
          hasObligation ? 'bg-amber-50 text-amber-700 border-amber-200/50' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
        }`}>
          <span className="material-symbols-outlined text-[18px] fill-1">
            {isGoodStanding ? 'verified' : isProbation ? 'gavel' : 'info'}
          </span>
          <span className="font-pjs font-bold text-[13px] tracking-wide uppercase">
            {isGoodStanding ? 'Good Standing' : isProbation ? 'Disciplinary Probation' : hasObligation ? 'Outstanding Obligation' : 'Cleared Record'}
          </span>
        </div>
      </section>

      {/* Stats row removed for brevity in display, but remains functional in code */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-1">
        <StatCard icon="history" label="Violation History" value={totalCount.toString().padStart(2, '0')} iconBg="bg-slate-100" iconColor="text-slate-600" delay="1" />
        <StatCard icon="pending" label="Pending Actions" value={pendingCount.toString().padStart(2, '0')} iconBg="bg-[#fee4e2]" iconColor="text-[#d92d20]" delay="2" />
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
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link to="/student/handbook"><LinkCard icon="menu_book" title="Campus Handbook" linkText="PDF Download" linkIcon="picture_as_pdf" /></Link>
              <Link to="/student/violations"><LinkCard icon="gavel" title="Violation History" description="Review incident logs and corrective actions." /></Link>
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
              <h2 className="text-[24px] font-pjs font-extrabold text-[#003624] mb-2 tracking-tight">Case Resolution</h2>
              <p className="text-[14px] text-slate-500 font-manrope leading-relaxed mb-8 max-w-[340px]">
                Acknowledge the record for <span className="font-bold text-slate-900">{selectedViolation?.rule_details?.title || 'this policy'}</span> to formally close the case.
              </p>
              <div className="w-full space-y-3">
                <button onClick={handleAcknowledge} className="w-full h-[65px] bg-[#003624] text-white rounded-2xl font-pjs font-black text-[13px] uppercase tracking-[0.2em] hover:bg-[#004d33] transition-all shadow-lg active:scale-[0.98]">Acknowledge & Close</button>
                <button onClick={() => { window.open(`mailto:swafo@dlsud.edu.ph?subject=Appeal Request: ${selectedViolation?.id}`); setShowModal(false); }} className="w-full h-[65px] border-2 border-slate-100 text-slate-600 rounded-2xl font-pjs font-bold text-[13px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-[0.98]">Initiate Appeal</button>
                <button onClick={() => setShowModal(false)} className="mt-4 text-slate-400 font-pjs font-bold text-[11px] uppercase tracking-widest hover:text-[#003624] transition-all outline-none">Return to Dashboard</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
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
  const isClosed = violation.status === 'RESOLVED' || violation.status === 'APPEALED';
  const title = violation.rule_details?.title || violation.rule_details?.category || "Policy Violation";

  return (
    <div className="p-8 rounded-[2.5rem] bg-white border border-emerald-50 shadow-sm flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden group">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${title.includes('MAJOR') ? 'bg-red-500' : 'bg-[#2bd99b]'}`} />
      
      <div className="flex-grow w-full">
        <div className="flex items-center gap-4 mb-5">
          <h4 className="text-[1.25rem] font-bold text-[#003624] font-pjs tracking-tight">{title}</h4>
          <span className={`px-5 py-1.5 text-[9px] font-black rounded-full uppercase tracking-widest ${isClosed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {isClosed ? 'Closed' : 'Pending'}
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
            className="w-full flex items-center justify-center gap-3 bg-[#111827] text-white px-8 py-5 rounded-2xl font-pjs text-[13px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-900 transition-all active:scale-95"
          >
            Acknowledge
            <span className="material-symbols-outlined text-[20px]">drafts</span>
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 py-4 text-[#006b5d] font-bold text-[13px] bg-emerald-50 rounded-2xl">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Resolved
          </div>
        )}
      </div>
    </div>
  );
}
