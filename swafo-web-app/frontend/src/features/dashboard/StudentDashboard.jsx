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
      <div className="bg-portal-surface p-8 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-emerald-100/30">
        <div className="flex items-center justify-between mb-8">
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
    <div className="bg-white p-7 rounded-[2rem] flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-emerald-50/50 hover:shadow-[0_15px_50px_rgba(0,107,93,0.08)] transition-all group cursor-pointer min-h-[180px] hover:-translate-y-1">
      <div className="flex justify-between items-start mb-10">
        <div className="w-12 h-12 rounded-2xl bg-[#003624] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        <span className="material-symbols-outlined text-portal-text-muted/20 group-hover:text-[#006b5d] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">arrow_outward</span>
      </div>
      <div>
        <h4 className="text-xl font-pjs font-bold text-[#003624] mb-2 tracking-tight">{title}</h4>
        {linkText ? (
          <div className="inline-flex items-center gap-2 text-[13px] font-manrope font-bold text-[#006b5d] bg-emerald-50 px-3 py-1 rounded-lg">
            <span className="material-symbols-outlined text-[16px]">{linkIcon}</span>
            {linkText}
          </div>
        ) : (
          <p className="text-[13px] font-manrope text-portal-text-muted/70 font-medium leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}

function ViolationEntry({ title, status, location, date, time, action }) {
  return (
    <div className="p-6 rounded-[1.5rem] bg-white border border-emerald-50/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col lg:flex-row items-start lg:items-center gap-6 group hover:shadow-[0_15px_50px_rgba(186,26,26,0.08)] transition-all hover:-translate-y-1 cursor-default">
      <div className="flex-grow w-full">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-8 w-1 bg-portal-error rounded-full" />
          <h4 className="text-[1.2rem] font-bold text-[#1a1a1a] font-pjs uppercase tracking-tight">{title}</h4>
          <span className="px-4 py-1.5 bg-portal-error-container text-portal-error text-[10px] font-extrabold rounded-full uppercase tracking-widest shadow-sm">
            {status}
          </span>
        </div>
        <div className="flex flex-wrap gap-6 text-[12px] text-portal-text-muted/60 font-manrope font-bold uppercase tracking-widest mb-6 ml-5">
          <span className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px]">location_on</span>
            {location}
          </span>
          <span className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            {date}
          </span>
          <span className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            {time}
          </span>
        </div>
        <div className="bg-[#fcf8f8] p-5 rounded-2xl border border-portal-error/5 ml-5">
          <p className="text-[10px] font-pjs font-bold uppercase text-portal-error/50 mb-2 tracking-widest">Corrective Action Details</p>
          <p className="text-[14px] text-portal-text font-manrope font-medium leading-relaxed">{action}</p>
        </div>
      </div>
      <button className="shrink-0 flex items-center gap-3 bg-[#141d1c] text-white px-8 py-4 rounded-2xl font-pjs text-[13px] font-bold uppercase tracking-widest shadow-lg hover:bg-black active:scale-95 transition-all group/btn self-end lg:self-center">
        Acknowledge
        <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-1 transition-transform">drafts</span>
      </button>
    </div>
  );
}

