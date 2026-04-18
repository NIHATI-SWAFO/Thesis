import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const email = user?.email;

  useEffect(() => {
    if (email) {
      fetch(`http://localhost:8000/api/users/profile-by-email/?email=${email}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setProfile(data);
          }
        })
        .catch(err => console.error("Profile fetch error:", err))
        .finally(() => setLoading(false));
    }
  }, [email]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003624]"></div>
      </div>
    );
  }

  const fullName = profile?.user_details?.full_name || accounts[0]?.name || "Student Name";
  const studentId = profile?.student_number || "---";
  const course = profile?.course || "---";
  const yearLevel = profile?.year_level || "-";

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 animate-fade-in-up">
      
      {/* ══════════════════════════ PROFILE HEADER ══════════════════════════ */}
      <section className="flex flex-col md:flex-row items-center md:items-end gap-6 px-4 relative">
        {/* Profile Image Container */}
        <div className="relative shrink-0">
          <div className="w-[110px] h-[110px] rounded-3xl bg-[#003624] flex items-center justify-center ring-4 ring-white shadow-xl relative overflow-hidden text-white">
            <span className="material-symbols-outlined text-[70px] opacity-90">account_circle</span>
          </div>
          {/* Verified Badge */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-portal-primary rounded-full border-[3px] border-white flex items-center justify-center shadow-lg text-white">
            <span className="material-symbols-outlined text-[16px] fill-1">verified</span>
          </div>
        </div>

        {/* Info Content */}
        <div className="flex-grow pb-2">
          <h1 className="text-[2.25rem] font-pjs font-bold text-[#1a1a1a] leading-tight mb-1.5 tracking-tight">
            {fullName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-portal-text-muted font-manrope font-semibold text-lg">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-portal-primary/60 text-[20px]">school</span>
              Year {yearLevel}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
            <span>{course}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
            <span className="text-portal-primary/70 font-bold">ID: {studentId}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 pb-4">
          <button className="bg-[#006b5d] text-white px-6 py-2.5 rounded-xl font-pjs font-bold text-[13px] flex items-center gap-2 hover:bg-[#004d33] transition-all transform active:scale-95 shadow-md shadow-emerald-900/10">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Export Profile
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ══════════════════════════ ACADEMIC STATUS ══════════════════════════ */}
        <div className="lg:col-span-5">
          <SectionCard title="Academic Status" icon="analytics">
            <div className="space-y-4">
              <StatusRow label="Enrollment" status="Active" type="success" />
              <StatusRow label="Standing" status="Good Standing" type="success" />
              
              <div className="mt-5 pt-5 border-t border-emerald-50/50">
                <p className="text-[9px] uppercase font-pjs font-bold text-portal-text-muted/50 tracking-widest mb-1.5">Current Semester</p>
                <h4 className="text-lg font-pjs font-bold text-[#003624] tracking-tight">2ND SEMESTER SY 2025 - 2026</h4>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ══════════════════════════ ACCOUNT DETAILS ══════════════════════════ */}
        <div className="lg:col-span-7">
          <SectionCard bgColor="bg-[#e9eded]">
            <div className="flex flex-col justify-center h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                <DetailItem 
                  icon="alternate_email" 
                  label="School Email" 
                  value="tld0283@dlsud.edu.ph" 
                  iconBg="bg-white" 
                  iconColor="text-emerald-600" 
                />
                <DetailItem 
                  icon="account_balance" 
                  label="College" 
                  value="College of Information and Computer Studies" 
                  iconBg="bg-white" 
                  iconColor="text-emerald-600" 
                />
                 <DetailItem 
                  icon="account_tree" 
                  label="Department & Level" 
                  value="Computer Science (Third Year)" 
                  iconBg="bg-white" 
                  iconColor="text-emerald-600" 
                />
                <DetailItem 
                  icon="call" 
                  label="Contact Number" 
                  value="0917263547" 
                  iconBg="bg-white" 
                  iconColor="text-emerald-600" 
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ══════════════════════════ PRIVACY & SECURITY ══════════════════════════ */}
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

        {/* ══════════════════════════ DIGITAL ID & DOCUMENTS ══════════════════════════ */}
        <div className="lg:col-span-6">
          <SectionCard title="Digital ID & Documents" icon="badge" subtitle="Access verified academic certificates">
             <div className="space-y-3">
               <DocumentLink title="Digital Student ID" subtitle="Last synced 2 hours ago" icon="id_card" actionIcon="visibility" />
               <DocumentLink title="Transcript of Records" subtitle="Ready for download (Unofficial)" icon="description" actionIcon="download" />
             </div>
          </SectionCard>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════ SUB-COMPONENTS ══════════════════════════ */

function SectionCard({ title, icon, subtitle, children, bgColor = "bg-white" }) {
  return (
    <div className={`${bgColor} p-5 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/5 h-full group transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex flex-col justify-between`}>
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

function StatusRow({ label, status, type }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-manrope font-semibold text-portal-text text-lg">{label}</span>
      <span className={`px-5 py-2 rounded-2xl text-[13px] font-bold font-pjs uppercase tracking-tight shadow-sm ${
        type === 'success' ? 'bg-[#d1fadf] text-[#006b5d]' : 'bg-amber-100 text-amber-700'
      }`}>
        {status}
      </span>
    </div>
  );
}

function DetailItem({ icon, label, value, iconBg, iconColor }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="space-y-0.5">
        <p className="text-[11px] font-pjs font-bold text-portal-text-muted uppercase tracking-widest">{label}</p>
        <p className="font-manrope font-bold text-[#003624] leading-tight text-[15px]">{value}</p>
      </div>
    </div>
  );
}

function DocumentLink({ title, subtitle, icon, actionIcon }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-50/50 hover:bg-[#ecf6f3]/30 transition-all cursor-pointer group shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <div>
          <h5 className="font-pjs font-bold text-[#003624] text-[13px] leading-none mb-1 text-left">{title}</h5>
          <p className="text-[11px] font-manrope font-medium text-portal-text-muted/50">{subtitle}</p>
        </div>
      </div>
      <button className="w-10 h-10 rounded-full flex items-center justify-center text-portal-text-muted/40 group-hover:bg-[#006b5d] group-hover:text-white transition-all shadow-sm">
        <span className="material-symbols-outlined text-[18px]">{actionIcon}</span>
      </button>
    </div>
  );
}
