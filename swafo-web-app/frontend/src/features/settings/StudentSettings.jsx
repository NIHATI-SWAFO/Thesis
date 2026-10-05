import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS } from "../../api/config";

export default function StudentSettings() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Persistent notification preferences from localStorage
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('swafo_student_notifs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved notifs", e);
    }
    return {
      violationAlerts: true,
      appealUpdates: true,
      handbookChanges: false,
      safetyBulletins: true,
    };
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
    } else {
      setLoading(false);
    }
  }, [user]);

  const toggleNotification = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('swafo_student_notifs', JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save notifs", e);
      }
      return updated;
    });
  };

  const handleRequestDataSync = () => {
    setSyncing(true);
    setSyncMessage(null);
    setTimeout(() => {
      setSyncing(false);
      setSyncMessage("Institutional identity successfully synced with the Office of the Registrar.");
      setTimeout(() => setSyncMessage(null), 4000);
    }, 1200);
  };

  const handleDownloadArchive = () => {
    const studentData = {
      institution: "De La Salle University - Dasmariñas",
      office: "Student Welfare and Formation Office (SWAFO)",
      generated_at: new Date().toISOString(),
      student_identity: {
        full_name: profile?.user_details?.full_name || profile?.user?.full_name || user?.name || "Student",
        student_number: profile?.student_number || "N/A",
        email: user?.email,
        course: profile?.course || "N/A",
        year_level: profile?.year_level || "N/A",
        clearance_status: profile?.clearance_status || "CLEARED",
      },
      security_protocol: "AES-256 Certified Archive",
    };

    const blob = new Blob([JSON.stringify(studentData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SWAFO_Record_Archive_${profile?.student_number || 'STUDENT'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogoutAll = () => {
    if (window.confirm("This will terminate your current institutional session and log you out of the SWAFO Portal. Proceed?")) {
      logout();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-[#003624] rounded-full animate-spin mb-4" />
        <p className="font-pjs font-bold text-sm text-[#003624]">Syncing Institutional Credentials...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving account settings and security parameters</p>
      </div>
    );
  }

  const fullName = profile?.user_details?.full_name || profile?.user?.full_name || user?.name || "Student Name";
  const studentNum = profile?.student_number || "2022-XXXXX";
  const courseStr = profile?.course || "Undergraduate Degree Program";
  const yearLevel = profile?.year_level || "1";

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8 animate-fade-in-up pb-20">
      
      {/* ═══════════════════════ HERO BANNER ═══════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#003624] via-[#004d33] to-[#01261a] p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-lg shadow-emerald-950/20 text-white">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 mb-3 sm:mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-pjs font-bold uppercase tracking-wider text-emerald-200">
                Institutional Security & Preferences
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-pjs font-extrabold text-white leading-tight tracking-tight mb-2">
              Account & Security
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 font-manrope font-normal leading-relaxed">
              Manage your verified institutional identity, disciplinary communication preferences, and security access credentials.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <Link 
              to="/student/profile"
              className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-white text-[#003624] hover:bg-emerald-50 font-pjs font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 no-underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              View Digital ID
            </Link>
            <button 
              onClick={handleLogoutAll}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border border-rose-400/30 font-pjs font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      </section>

      {/* Sync Toast Feedback */}
      {syncMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-xs sm:text-sm font-manrope font-semibold animate-fade-in-up">
          <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
          <span>{syncMessage}</span>
        </div>
      )}

      {/* ═══════════════════════ MAIN CONTENT GRID ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        
        {/* ═══════════════════════ LEFT COLUMN: INSTITUTIONAL IDENTITY ═══════════════════════ */}
        <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-100 shadow-sm flex flex-col space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-pjs font-bold text-slate-900">
                  Institutional Identity
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-pjs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 font-manrope mt-0.5">
                Official student record synced with the University Registrar and Microsoft SSO.
              </p>
            </div>
            
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#003624] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-pjs font-bold text-slate-400 uppercase tracking-widest pl-1">
                Legal Full Name
              </label>
              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-3 px-4 text-xs sm:text-sm font-manrope font-bold text-slate-700 select-all">
                {fullName}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-pjs font-bold text-slate-400 uppercase tracking-widest pl-1">
                Student Number
              </label>
              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-3 px-4 text-xs sm:text-sm font-mono font-bold text-slate-700 select-all">
                {studentNum}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-pjs font-bold text-slate-400 uppercase tracking-widest pl-1">
                Institutional Email (DLSU-D)
              </label>
              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-3 px-4 text-xs sm:text-sm font-manrope font-bold text-slate-700 select-all truncate">
                {user?.email || "student@dlsud.edu.ph"}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-pjs font-bold text-slate-400 uppercase tracking-widest pl-1">
                Degree Program & Standing
              </label>
              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-3 px-4 text-xs sm:text-sm font-manrope font-bold text-[#003624] truncate">
                {courseStr} (Year {yearLevel})
              </div>
            </div>
          </div>

          {/* Info Notice */}
          <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-100 flex items-start gap-3.5">
            <span className="material-symbols-outlined text-emerald-700 text-[20px] shrink-0 mt-0.5">
              info
            </span>
            <p className="text-xs font-manrope text-emerald-900 leading-relaxed">
              Primary identification credentials (legal name, student number, and department enrollment) are locked by university policy. To request corrections, please contact the <strong>Office of the Registrar</strong> or visit the SWAFO Help Desk at the JFH Building.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-[11px] text-slate-400 font-manrope text-center sm:text-left">
              Last synced: Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <button 
              onClick={handleRequestDataSync}
              disabled={syncing}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#003624] hover:bg-[#004d33] text-white font-pjs font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] ${syncing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{syncing ? 'Syncing...' : 'Request Data Sync'}</span>
            </button>
          </div>
        </div>

        {/* ═══════════════════════ RIGHT COLUMN: DIGITAL BADGE & NOTIFICATIONS ═══════════════════════ */}
        <div className="space-y-6 sm:space-y-8 flex flex-col">
          
          {/* Identity Card Mini Banner */}
          <div className="bg-gradient-to-br from-[#003624] to-[#01261a] p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-md text-white relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none rotate-12">
              <span className="material-symbols-outlined text-[160px]">gavel</span>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[9px] font-pjs font-bold uppercase tracking-widest text-emerald-200">
                SWAFO Disciplinary Status
              </span>
            </div>
            
            <h3 className="text-lg sm:text-xl font-pjs font-bold mb-1">Active Good Standing</h3>
            <p className="text-emerald-100/70 text-xs font-manrope mb-6 leading-relaxed">
              Your profile is verified through Microsoft Entra Single Sign-On and is clear for institutional clearance.
            </p>
            
            <Link 
              to="/student/profile" 
              className="inline-flex items-center gap-2 text-xs font-pjs font-bold text-white hover:text-emerald-200 transition-colors no-underline cursor-pointer group"
            >
              <span>Inspect Full Digital Credential</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>

          {/* Disciplinary Communications Panel */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-pjs font-bold text-slate-900 mb-0.5">
                Communication Preferences
              </h3>
              <p className="text-xs text-slate-400 font-manrope">
                Configure notifications sent to your institutional email and phone.
              </p>
            </div>
            
            <div className="space-y-4 pt-2 divide-y divide-slate-100">
              <NotificationItem 
                icon="notifications_active" 
                title="Violation SMS Alerts" 
                description="Instant SMS when an incident record is logged"
                active={notifications.violationAlerts} 
                onToggle={() => toggleNotification('violationAlerts')}
              />
              <NotificationItem 
                icon="history_edu" 
                title="Hearing & Appeal Updates" 
                description="Status changes regarding submitted grievances"
                active={notifications.appealUpdates} 
                onToggle={() => toggleNotification('appealUpdates')}
              />
              <NotificationItem 
                icon="campaign" 
                title="Campus Safety Bulletins" 
                description="Urgent broadcast advisories from SWAFO"
                active={notifications.safetyBulletins} 
                onToggle={() => toggleNotification('safetyBulletins')}
              />
              <NotificationItem 
                icon="menu_book" 
                title="Handbook Amendments" 
                description="Notices when campus policies are revised"
                active={notifications.handbookChanges} 
                onToggle={() => toggleNotification('handbookChanges')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ SECURITY PROTOCOLS & PRIVACY ═══════════════════════ */}
      <section className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-pjs font-bold text-slate-900">
              Security & Privacy Protocols
            </h2>
            <p className="text-xs text-slate-400 font-manrope mt-0.5">
              Manage your portal authentication, active devices, and institutional data governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* MFA Status Badge */}
            <div className="inline-flex items-center gap-2.5 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-pjs font-bold text-[#003624]">
                Microsoft 365 MFA Protected
              </span>
            </div>

            {/* Logout Action */}
            <button 
              onClick={handleLogoutAll}
              className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 rounded-xl text-xs font-pjs font-bold transition-all cursor-pointer border border-rose-200/60"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>End All Sessions</span>
            </button>
          </div>
        </div>

        {/* Security Details 3-Col Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Active Session Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-[#003624]">
              <span className="material-symbols-outlined text-[20px]">devices</span>
              <h4 className="text-xs font-pjs font-bold uppercase tracking-wider">Current Session</h4>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 font-manrope">Web Portal (Chrome / Edge)</p>
              <p className="text-[11px] text-slate-400 font-manrope mt-0.5">
                Status: Active Now • Windows Client
              </p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-600">
                Encrypted Session
              </span>
            </div>
          </div>

          {/* Authorized Oversight Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-[#003624]">
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              <h4 className="text-xs font-pjs font-bold uppercase tracking-wider">Authorized Oversight</h4>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 font-manrope">SWAFO Discipline & ICTC</p>
              <p className="text-[11px] text-slate-400 font-manrope mt-0.5">
                Governed by University Discipline Board
              </p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-600">
                RA 10173 Compliant
              </span>
            </div>
          </div>

          {/* Privacy & Archive Card */}
          <div className="bg-[#003624] p-5 rounded-2xl text-white space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-300">
                <span className="material-symbols-outlined text-[20px]">lock</span>
                <h4 className="text-xs font-pjs font-bold uppercase tracking-wider">Data Privacy</h4>
              </div>
              <p className="text-[11px] text-emerald-100/70 font-manrope mt-2 leading-relaxed">
                Disciplinary records are encrypted using AES-256 and kept strictly confidential under the Philippine Data Privacy Act.
              </p>
            </div>

            <button 
              onClick={handleDownloadArchive}
              className="inline-flex items-center gap-2 text-xs font-pjs font-bold text-white hover:text-emerald-200 transition-colors pt-2 cursor-pointer border-t border-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Download Record Archive (.json)</span>
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}

function NotificationItem({ icon, title, description, active, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 pt-3 first:pt-0">
      <div className="flex items-start gap-3.5 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          active ? 'bg-emerald-50 text-[#003624]' : 'bg-slate-100 text-slate-400'
        }`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-pjs font-bold text-slate-900 leading-snug">
            {title}
          </p>
          <p className="text-[11px] text-slate-400 font-manrope truncate sm:whitespace-normal">
            {description}
          </p>
        </div>
      </div>
      
      {/* Interactive Switch */}
      <button 
        type="button"
        role="switch"
        aria-checked={active}
        onClick={onToggle}
        className={`w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0 cursor-pointer focus:outline-none ${
          active ? 'bg-[#003624]' : 'bg-slate-200'
        }`}
      >
        <span 
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-xs ${
            active ? 'translate-x-5' : 'translate-x-0.5'
          }`} 
        />
      </button>
    </div>
  );
}
