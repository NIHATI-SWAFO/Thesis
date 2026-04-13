import { useMsal } from "@azure/msal-react";

export default function StudentDashboard() {
  const { accounts } = useMsal();
  const firstName = accounts.length > 0 ? accounts[0].name.split(' ')[0] : 'Student';

  return (
    <div className="max-w-[1580px] mx-auto space-y-6 animate-fade-in-up">

      {/* ═══════════════════════ HERO GREETING ═══════════════════════ */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h2 className="text-[1.85rem] font-pjs font-bold text-[#003624] tracking-tight leading-tight">
            Welcome back, {firstName} :)
          </h2>
          <p className="text-portal-text-muted font-manrope mt-1 font-medium text-[0.95rem]">
            Explore your academic standing and campus activities.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-[#d1fadf] text-[#006b5d] px-5 py-2.5 rounded-2xl shadow-sm border border-emerald-200/50">
          <span className="material-symbols-outlined text-[18px] fill-1">verified</span>
          <span className="font-pjs font-bold text-[13px] tracking-wide uppercase">Good Standing</span>
        </div>
      </section>

      {/* ═══════════════════════ STATS ROW ═══════════════════════ */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
        <StatCard icon="history" label="Total Violations" value="02" iconBg="bg-amber-100" iconColor="text-amber-700" delay="1" />
        <StatCard icon="pending" label="Pending" value="01" iconBg="bg-[#fee4e2]" iconColor="text-[#d92d20]" delay="2" />
        <StatCard icon="visibility" label="Under Review" value="0" iconBg="bg-slate-100" iconColor="text-slate-600" delay="3" />
        <StatCard icon="check_circle" label="Resolved" value="01" iconBg="bg-[#d1fadf]" iconColor="text-[#006b5d]" delay="4" />
      </section>

      {/* ═══════════════════════ MAIN CONTENT GRID ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Primary Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative overflow-hidden bg-[#0A3D2E] p-8 rounded-[2rem] text-white min-h-[220px] flex flex-col justify-between shadow-xl shadow-emerald-900/5 group cursor-pointer transition-all duration-500 border border-white/5">
            <div className="relative z-10 max-w-lg">
              <h3 className="text-2xl font-pjs font-bold leading-tight mb-2 tracking-tight">
                Complete Academic Profile
              </h3>
              <p className="font-manrope text-white/50 mb-5 leading-relaxed font-medium text-base max-w-[80%]">
                Ensure all your credentials and enrollment details are up to date for the current semester.
              </p>
              <button className="bg-white text-[#0A3D2E] px-7 py-2.5 rounded-xl font-pjs font-bold text-[12px] hover:bg-portal-sidebar transition-all transform active:scale-95 shadow-lg">
                Manage Details
              </button>
            </div>
            
            {/* Ultra-Elegant Right-side Graphic (Curved blade-like shapes from Target UI) */}
            <div className="absolute top-0 right-[-10%] w-[60%] h-full pointer-events-none select-none">
              <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent z-0" />
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 400" fill="none">
                <path d="M400 0C320 100 280 250 400 400" stroke="white" strokeWidth="40" strokeOpacity="0.3" />
                <path d="M450 0C370 100 330 250 450 400" stroke="white" strokeWidth="30" strokeOpacity="0.2" />
                <path d="M500 0C420 100 380 250 500 400" stroke="white" strokeWidth="20" strokeOpacity="0.1" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/10 rounded-full blur-[120px]" />
            </div>
          </div>

          {/* Handbook and Violation History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LinkCard icon="menu_book" title="Campus Handbook" linkText="PDF Download" linkIcon="picture_as_pdf" />
            <LinkCard icon="gavel" title="Violation History" description="Review previous incident logs and corrective actions." />
          </div>
        </div>

        {/* Right Column: AI Curator */}
        <div className="lg:col-span-1">
          <div className="bg-portal-primary-container p-8 rounded-[2rem] text-white shadow-xl flex flex-col h-full min-h-[402px] relative overflow-hidden">
            <div className="mb-6 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-portal-primary flex items-center justify-center mb-5 shadow-lg">
                <span className="material-symbols-outlined text-white text-2xl">auto_awesome</span>
              </div>
              <h3 className="text-xl font-pjs font-bold mb-2 uppercase tracking-tight">AI Curator</h3>
              <p className="font-manrope text-white/60 text-[13px] leading-relaxed font-medium">Ask anything about campus rules or academic guidelines.</p>
            </div>
            
            <div className="flex-grow flex flex-col justify-end gap-4 relative z-10">
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl text-[13px] italic font-manrope text-white/50 border border-white/10 leading-relaxed">
                "What are the rules regarding laboratory access after 7 PM?"
              </div>
              <div className="mt-4 bg-portal-surface rounded-2xl p-2 flex items-center shadow-inner">
                <input 
                  type="text" 
                  placeholder="Ask away..." 
                  className="flex-grow bg-transparent border-none focus:ring-0 text-portal-text px-4 py-2 font-manrope font-medium placeholder:text-portal-text-muted/30"
                />
                <button className="w-10 h-10 bg-portal-primary-container text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-portal-primary active:scale-90 transition-all">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ RECENT VIOLATIONS ═══════════════════════ */}
      <div className="bg-portal-surface p-10 rounded-[3rem] shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-emerald-100/30">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-2xl font-pjs font-bold text-[#003624] tracking-tight">Recent Violations</h3>
          <button className="text-[13px] font-pjs font-bold text-[#003624]/40 hover:text-[#003624] tracking-widest uppercase transition-colors">
            View All Records
          </button>
        </div>
        
        <div className="space-y-6">
          <ViolationEntry 
            title="Unauthorized Area Access"
            status="Pending"
            location="ICTC Building"
            date="Oct 24, 2023"
            time="10:45 AM"
            action="Student must attend a disciplinary briefing and complete 4 hours of community service at the ICTC office within 10 days."
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ SUB-COMPONENTS ═══════════════════════ */

function StatCard({ icon, label, value, iconBg, iconColor, delay }) {
  return (
    <div className={`bg-portal-surface p-6 rounded-2xl flex items-center gap-5 border border-transparent hover:border-portal-primary/10 transition-all animate-fade-in-up animate-delay-${delay} shadow-sm group hover:translate-x-1 cursor-default`}>
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
        <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-pjs text-portal-text-muted/60 font-bold uppercase tracking-widest leading-none mb-1">{label}</p>
        <h3 className="text-2xl font-bold font-pjs text-portal-text leading-none">{value}</h3>
      </div>
    </div>
  );
}

function LinkCard({ icon, title, description, linkText, linkIcon }) {
  return (
    <div className="bg-portal-sidebar/50 p-6 rounded-[1.25rem] flex flex-col justify-between hover:bg-portal-surface transition-all shadow-sm group cursor-pointer border border-transparent hover:border-portal-sidebar min-h-[158px]">
      <div className="flex justify-between items-start mb-12">
        <div className="w-12 h-12 rounded-xl bg-portal-primary-container text-white flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="material-symbols-outlined text-portal-text-muted/20 group-hover:text-portal-primary-container group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">arrow_outward</span>
      </div>
      <div>
        <h4 className="text-xl font-pjs font-bold text-portal-primary-container mb-2 uppercase tracking-tight">{title}</h4>
        {linkText ? (
          <div className="inline-flex items-center gap-2 text-sm font-pjs font-bold text-portal-primary-container/60 group-hover:text-portal-primary transition-colors">
            <span className="material-symbols-outlined text-sm">{linkIcon}</span>
            {linkText}
          </div>
        ) : (
          <p className="text-sm font-manrope text-portal-text-muted font-medium">{description}</p>
        )}
      </div>
    </div>
  );
}

function ViolationEntry({ title, status, location, date, time, action }) {
  return (
    <div className="p-6 rounded-2xl bg-portal-bg/50 border-l-4 border-portal-error flex flex-col lg:flex-row items-start lg:items-center gap-6 group hover:translate-x-1 transition-transform">
      <div className="flex-grow">
        <div className="flex items-center gap-3 mb-3">
          <h4 className="text-lg font-bold text-portal-text font-pjs uppercase tracking-tight">{title}</h4>
          <span className="px-3 py-1 bg-portal-error-container text-portal-error text-[10px] font-bold rounded-full uppercase tracking-tighter">
            {status}
          </span>
        </div>
        <div className="flex flex-wrap gap-5 text-[11px] text-portal-text-muted/60 font-bold uppercase tracking-widest mb-4">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">location_on</span>
            {location}
          </span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            {date}
          </span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {time}
          </span>
        </div>
        <div className="bg-portal-surface p-4 rounded-xl border border-portal-sidebar">
          <p className="text-[9px] font-pjs font-bold uppercase text-portal-primary/40 mb-2 tracking-widest">Corrective Action Details</p>
          <p className="text-[13px] text-portal-text font-manrope font-medium leading-relaxed">{action}</p>
        </div>
      </div>
      <button className="shrink-0 flex items-center gap-2 bg-portal-primary-container text-white px-6 py-3 rounded-xl font-pjs text-sm font-bold uppercase tracking-widest shadow-lg hover:bg-portal-primary active:scale-95 transition-all">
        Acknowledge
        <span className="material-symbols-outlined text-sm">edit_note</span>
      </button>
    </div>
  );
}

