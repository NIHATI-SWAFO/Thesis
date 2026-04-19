import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS } from "../../api/config";

export default function StudentSettings() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState({
    violationAlerts: true,
    appealUpdates: true,
    handbookChanges: false
  });

  useEffect(() => {
    if (user?.email) {
      fetch(`${API_ENDPOINTS.PROFILE_BY_EMAIL}?email=${user.email}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setProfile(data);
        })
        .catch(err => console.error("Profile fetch error:", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogoutAll = () => {
    if (window.confirm("This will terminate your current session and sign you out of all institutional portals. Proceed?")) {
      logout();
    }
  };

  if (loading) return <div className="p-20 text-center font-pjs font-bold text-[#003624] animate-pulse">Syncing Institutional Credentials...</div>;

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-in-up pb-12">
      
      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <div className="mb-2">
        <h1 className="text-[2.2rem] font-pjs font-bold text-[#1a1a1a] tracking-tight mb-1">Account & Security</h1>
        <p className="text-portal-text-muted/60 font-manrope text-[15px]">
          Manage your institutional identity, disciplinary notification preferences, and portal security protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ═══════════════════════ LEFT COLUMN: PROFILE ═══════════════════════ */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-black/5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-pjs font-bold text-[#1a1a1a] mb-1">Institutional Identity</h2>
              <p className="text-[13px] font-manrope text-portal-text-muted/50">Verified data synced with the University Registrar.</p>
            </div>
            <div className="text-[#006b5d]/40">
              <span className="material-symbols-outlined text-[32px]">verified_user</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-pjs font-bold text-portal-text-muted/40 uppercase tracking-widest pl-1">Legal Full Name</label>
              <div className="w-full bg-[#f4f7f6] rounded-2xl py-4 px-6 text-[14px] font-manrope font-bold text-slate-400 cursor-not-allowed">
                {profile?.user_details?.full_name || user?.name}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-pjs font-bold text-portal-text-muted/40 uppercase tracking-widest pl-1">Student Number</label>
              <div className="w-full bg-[#f4f7f6] rounded-2xl py-4 px-6 text-[14px] font-manrope font-bold text-slate-400 cursor-not-allowed">
                {profile?.student_number}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-[10px] font-pjs font-bold text-portal-text-muted/40 uppercase tracking-widest pl-1">Institutional Email</label>
            <div className="w-full bg-[#f4f7f6] rounded-2xl py-4 px-6 text-[14px] font-manrope font-bold text-slate-400 cursor-not-allowed">
              {user?.email}
            </div>
          </div>

          <div className="space-y-2 mb-10 flex-grow">
            <label className="text-[10px] font-pjs font-bold text-portal-text-muted/40 uppercase tracking-widest pl-1">Course & Department</label>
            <div className="w-full bg-[#f4f7f6] rounded-2xl py-4 px-6 text-[14px] font-manrope font-bold text-[#003624]">
              {profile?.course} (Year {profile?.year_level})
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mb-8">
             <div className="flex gap-4">
                <span className="material-symbols-outlined text-emerald-600">info</span>
                <p className="text-[12px] font-manrope text-emerald-800 leading-relaxed">
                   Core identity fields are locked and managed by the **Office of the Registrar**. If you need to update your official records, please visit the Student Welfare desk at the JFH Building.
                </p>
             </div>
          </div>

          <div className="flex items-center justify-end gap-6 mt-auto">
            <button className="bg-[#006b5d] text-white px-10 py-3.5 rounded-full font-pjs font-bold text-[14px] shadow-lg hover:bg-[#004d43] active:scale-95 transition-all">Request Data Sync</button>
          </div>
        </div>

        {/* ═══════════════════════ RIGHT COLUMN: STATUS & NOTIFS ═══════════════════════ */}
        <div className="space-y-8 h-full flex flex-col">
          
          {/* Account Verification Card */}
          <div className="bg-[#006b5d] p-8 rounded-[2rem] shadow-[0_12px_40px_rgba(0,107,93,0.15)] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[50%] h-full pointer-events-none opacity-10 bg-gradient-to-l from-white to-transparent" />
            <div className="absolute -right-6 -bottom-8 opacity-15 pointer-events-none rotate-12">
              <span className="material-symbols-outlined text-[180px]" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2bd99b]" />
              <span className="text-[9px] font-pjs font-bold uppercase tracking-widest text-[#2bd99b]">Record Active</span>
            </div>
            
            <h3 className="text-[22px] font-pjs font-bold mb-1">SWAFO Identity</h3>
            <p className="text-white/60 text-[12px] font-manrope mb-8 leading-relaxed">
              Your disciplinary profile is linked to your Microsoft SSO credentials.
            </p>
            
            <button className="flex items-center gap-2 text-[13px] font-pjs font-bold hover:gap-3 transition-all outline-none">
              View Digital ID
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* Notifications Panel */}
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-black/5 flex-grow">
            <h3 className="text-[18px] font-pjs font-bold text-[#1a1a1a] mb-6">Communication</h3>
            
            <div className="space-y-5">
              <NotificationItem 
                icon="notifications_active" 
                title="Violation SMS Alerts" 
                active={notifications.violationAlerts} 
                onToggle={() => toggleNotification('violationAlerts')}
              />
              <NotificationItem 
                icon="history_edu" 
                title="Appeal Status Updates" 
                active={notifications.appealUpdates} 
                onToggle={() => toggleNotification('appealUpdates')}
              />
              <NotificationItem 
                icon="menu_book" 
                title="Handbook Revisions" 
                active={notifications.handbookChanges} 
                onToggle={() => toggleNotification('handbookChanges')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ BOTTOM SECTION: SECURITY ═══════════════════════ */}
      <div className="bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-black/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-xl font-pjs font-bold text-[#1a1a1a] mb-1">Security Protocols</h2>
            <p className="text-[13px] font-manrope text-portal-text-muted/50">Manage your portal access and institutional security credentials.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={handleLogoutAll} className="flex items-center gap-4 bg-red-50 hover:bg-red-100 transition-colors px-6 py-4 rounded-3xl group">
              <div className="w-10 h-10 rounded-2xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
                <span className="material-symbols-outlined text-[22px]">logout</span>
              </div>
              <div className="text-left leading-tight">
                <p className="text-[14px] font-pjs font-bold text-[#ba1a1a]">Secure Logout</p>
                <p className="text-[10px] font-pjs font-bold text-[#ba1a1a]/40 uppercase tracking-widest">End Session</p>
              </div>
            </button>

            <button className="flex items-center gap-4 bg-[#f4f7f6] px-6 py-4 rounded-3xl group">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center relative">
                <div className="w-full h-full rounded-2xl bg-[#2bd99b]/20 absolute animate-ping opacity-20" />
                <div className="w-6 h-6 rounded-full bg-[#2bd99b] relative z-10" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[14px] font-pjs font-bold text-[#1a1a1a]">DLSU-D MFA</p>
                <p className="text-[10px] font-pjs font-bold text-[#006b5d] uppercase tracking-widest">Status: Protected</p>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
          <div className="lg:col-span-2">
             <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <h4 className="text-[15px] font-pjs font-bold text-[#003624] mb-4 flex items-center gap-2">
                   <span className="material-symbols-outlined text-emerald-600">verified</span>
                   Authorized Data Access
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Access</p>
                      <p className="text-[13px] font-bold text-[#003624]">SWAFO Discipline Office</p>
                   </div>
                   <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Institutional Oversight</p>
                      <p className="text-[13px] font-bold text-[#003624]">ICTC Office</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Privacy & Data Box */}
          <div className="bg-[#0e211b] p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16" />
            <h4 className="text-[14px] font-pjs font-bold text-white mb-2">Privacy & Data</h4>
            <p className="text-white/40 text-[11px] font-manrope leading-relaxed mb-6">
              The SWAFO Academic Portal encrypts your disciplinary records using AES-256 standards. Your handbook violations are archived for institutional reference but strictly confidential.
            </p>
            <button className="text-[12px] font-pjs font-bold text-white underline underline-offset-4 decoration-white/20 hover:decoration-white transition-all outline-none">
              Download Record Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ icon, title, active, onToggle }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006b5d] flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <p className="text-[14px] font-pjs font-bold text-[#1a1a1a]">{title}</p>
      </div>
      <button 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${active ? 'bg-[#006b5d]' : 'bg-slate-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${active ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}
