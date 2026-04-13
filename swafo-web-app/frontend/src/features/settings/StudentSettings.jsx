import React, { useState } from 'react';

export default function StudentSettings() {
  const [formData, setFormData] = useState({
    preferredName: 'Michael Villan',
    studentId: '202330485',
    academicEmail: 'hhiueasd@dlsud.edu.ph',
    biography: 'A third-year Bachelor of Science in Computer Science student,'
  });

  const [notifications, setNotifications] = useState({
    violations: true,
    handbook: false,
    security: true
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-in-up pb-12">
      
      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <div className="mb-2">
        <h1 className="text-[2.2rem] font-pjs font-bold text-[#1a1a1a] tracking-tight mb-1">System Configuration</h1>
        <p className="text-portal-text-muted/60 font-manrope text-[15px]">
          Refine your academic digital environment. Manage your personal identity, notification throughput, and security protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ═══════════════════════ LEFT COLUMN: PROFILE ═══════════════════════ */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-black/5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-pjs font-bold text-[#1a1a1a] mb-1">Profile Information</h2>
              <p className="text-[13px] font-manrope text-portal-text-muted/50">Update your public academic persona and contact details.</p>
            </div>
            <div className="text-[#006b5d]/40">
              <span className="material-symbols-outlined text-[32px]">contact_page</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-pjs font-bold text-portal-text-muted/40 uppercase tracking-widest pl-1">Preferred Name</label>
              <input 
                name="preferredName"
                value={formData.preferredName}
                onChange={handleInputChange}
                className="w-full bg-[#f4f7f6] border-none rounded-2xl py-4 px-6 text-[14px] font-manrope font-semibold text-[#1a1a1a] focus:ring-2 focus:ring-[#006b5d]/10 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-pjs font-bold text-portal-text-muted/40 uppercase tracking-widest pl-1">Student ID</label>
              <input 
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                className="w-full bg-[#f4f7f6] border-none rounded-2xl py-4 px-6 text-[14px] font-manrope font-semibold text-[#1a1a1a] focus:ring-2 focus:ring-[#006b5d]/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-[10px] font-pjs font-bold text-portal-text-muted/40 uppercase tracking-widest pl-1">Academic Email</label>
            <input 
              name="academicEmail"
              value={formData.academicEmail}
              onChange={handleInputChange}
              className="w-full bg-[#f4f7f6] border-none rounded-2xl py-4 px-6 text-[14px] font-manrope font-semibold text-[#1a1a1a] focus:ring-2 focus:ring-[#006b5d]/10 transition-all outline-none"
            />
          </div>

          <div className="space-y-2 mb-10 flex-grow">
            <label className="text-[10px] font-pjs font-bold text-portal-text-muted/40 uppercase tracking-widest pl-1">Biography</label>
            <textarea 
              name="biography"
              value={formData.biography}
              onChange={handleInputChange}
              rows="4"
              className="w-full bg-[#f4f7f6] border-none rounded-2xl py-4 px-6 text-[14px] font-manrope font-semibold text-[#1a1a1a] focus:ring-2 focus:ring-[#006b5d]/10 transition-all outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-6 mt-auto">
            <button className="text-[14px] font-pjs font-bold text-[#006b5d] hover:text-[#004d43] transition-colors">Cancel</button>
            <button className="bg-[#006b5d] text-white px-10 py-3.5 rounded-full font-pjs font-bold text-[14px] shadow-lg hover:bg-[#004d43] active:scale-95 transition-all">Save Changes</button>
          </div>
        </div>

        {/* ═══════════════════════ RIGHT COLUMN: STATUS & NOTIFS ═══════════════════════ */}
        <div className="space-y-8 h-full flex flex-col">
          
          {/* Account Verification Card */}
          <div className="bg-[#006b5d] p-8 rounded-[2rem] shadow-[0_12px_40px_rgba(0,107,93,0.15)] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[50%] h-full pointer-events-none opacity-10 bg-gradient-to-l from-white to-transparent" />
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2bd99b]" />
              <span className="text-[9px] font-pjs font-bold uppercase tracking-widest text-[#2bd99b]">Good Standing</span>
            </div>
            
            <h3 className="text-[22px] font-pjs font-bold mb-1">Account Verified</h3>
            <p className="text-white/60 text-[12px] font-manrope mb-8 leading-relaxed">
              Last identity check performed 2 days ago.
            </p>
            
            <button className="flex items-center gap-2 text-[13px] font-pjs font-bold hover:gap-3 transition-all outline-none">
              Review Credentials
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* Notifications Panel */}
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-black/5 flex-grow">
            <h3 className="text-[18px] font-pjs font-bold text-[#1a1a1a] mb-6">Notifications</h3>
            
            <div className="space-y-5">
              <NotificationItem 
                icon="mail" 
                title="Violation Updates" 
                active={notifications.violations} 
                onToggle={() => toggleNotification('violations')}
              />
              <NotificationItem 
                icon="menu_book" 
                title="Handbook Updates" 
                active={notifications.handbook} 
                onToggle={() => toggleNotification('handbook')}
              />
              <NotificationItem 
                icon="security" 
                title="Security Digest" 
                active={notifications.security} 
                onToggle={() => toggleNotification('security')}
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
            <p className="text-[13px] font-manrope text-portal-text-muted/50">Manage your authentication methods and active sessions across devices.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Logout All Button */}
            <button className="flex items-center gap-4 bg-red-50 hover:bg-red-100 transition-colors px-6 py-4 rounded-3xl group">
              <div className="w-10 h-10 rounded-2xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
                <span className="material-symbols-outlined text-[22px]">logout</span>
              </div>
              <div className="text-left leading-tight">
                <p className="text-[14px] font-pjs font-bold text-[#ba1a1a]">Logout All Devices</p>
                <p className="text-[10px] font-pjs font-bold text-[#ba1a1a]/40 uppercase tracking-widest">3 Sessions Active</p>
              </div>
            </button>

            {/* 2FA Status Button */}
            <button className="flex items-center gap-4 bg-[#f4f7f6] px-6 py-4 rounded-3xl group">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center relative">
                <div className="w-full h-full rounded-2xl bg-[#2bd99b]/20 absolute animate-ping opacity-20" />
                <div className="w-6 h-6 rounded-full bg-[#2bd99b] relative z-10" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[14px] font-pjs font-bold text-[#1a1a1a]">Two-Factor Auth</p>
                <p className="text-[10px] font-pjs font-bold text-[#006b5d] uppercase tracking-widest">Status: Active</p>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
          {/* Device History */}
          <div className="lg:col-span-2 space-y-4">
            <p className="text-[10px] font-pjs font-bold text-portal-text-muted/40 uppercase tracking-widest pl-1 mb-4">Device History</p>
            
            <DeviceItem 
              icon="laptop_mac" 
              name="MacBook Pro 16”" 
              details="Silang, Cavite • Current Session" 
              status="ACTIVE" 
              isCurrent 
            />
            
            <DeviceItem 
              icon="smartphone" 
              name="iPhone 15 Pro" 
              details="Bacoor, Cavite • 3 hours ago" 
              status="REVOKE" 
            />
          </div>

          {/* Privacy & Data Box */}
          <div className="bg-[#0e211b] p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16" />
            <h4 className="text-[14px] font-pjs font-bold text-white mb-2">Privacy & Data</h4>
            <p className="text-white/40 text-[11px] font-manrope leading-relaxed mb-6">
              The Academic Curator encrypts your personal data using AES-256 standards. Your handbook violations are archived but strictly confidential.
            </p>
            <button className="text-[12px] font-pjs font-bold text-white underline underline-offset-4 decoration-white/20 hover:decoration-white transition-all outline-none">
              Download Data Archive
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

function DeviceItem({ icon, name, details, status, isCurrent }) {
  return (
    <div className="flex items-center justify-between bg-[#f4f7f6] p-5 rounded-2xl border border-transparent hover:border-black/5 transition-all">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-portal-text-muted/40">
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        <div>
          <h4 className="text-[15px] font-pjs font-bold text-[#1a1a1a]">{name}</h4>
          <p className="text-[12px] font-manrope text-portal-text-muted/40">{details}</p>
        </div>
      </div>
      
      <button className={`text-[10px] font-pjs font-bold px-3 py-1.5 rounded-lg tracking-widest transition-all ${
        status === 'ACTIVE' 
          ? 'bg-[#2bd99b] text-[#003624]' 
          : 'text-[#ba1a1a] hover:bg-red-50'
      }`}>
        {status}
      </button>
    </div>
  );
}
