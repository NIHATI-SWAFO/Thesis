import { useMsal } from "@azure/msal-react";
import { 
  ShieldCheck, ArrowRight, Send, Clock, MapPin, Calendar, 
  CheckCircle2, History, Bot, BookOpen, UserCircle2, Eye
} from 'lucide-react';

export default function StudentDashboard() {
  const { accounts } = useMsal();
  const firstName = accounts.length > 0 ? accounts[0].name.split(' ')[0] : 'Student';

  return (
    <div className="max-w-[1120px] pb-16">
      
      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <div className="flex items-end justify-between mb-10 animate-fade-in-up">
        <div>
          <h1 className="text-[2.75rem] font-bold tracking-[-0.04em] text-gray-900 mb-2 leading-[1.05]">
            Welcome back, {firstName} :)
          </h1>
          <p className="text-[1.05rem] text-gray-500 font-medium">
            Your academic journey is looking pristine today.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-swafo-700 px-5 py-3 rounded-full shadow-lg shadow-swafo-700/20 shrink-0">
          <ShieldCheck className="h-[18px] w-[18px] text-swafo-200" strokeWidth={2.5} />
          <span className="text-[12px] font-bold tracking-widest text-white uppercase">Good Standing</span>
        </div>
      </div>

      {/* ═══════════════════════ STAT CARDS ═══════════════════════ */}
      <div className="grid grid-cols-4 gap-5 mb-12">
        <StatCard icon={<DollarIcon />} iconBg="bg-swafo-50" iconColor="text-swafo-600" value="02" label="TOTAL VIOLATIONS" valueColor="text-swafo-700" labelColor="text-swafo-400" delay="1" />
        <StatCard icon={<Clock className="w-[18px] h-[18px]" strokeWidth={2.5} />} iconBg="bg-orange-50" iconColor="text-orange-500" value="01" label="PENDING" valueColor="text-orange-500" labelColor="text-orange-400" delay="2" />
        <StatCard icon={<Eye className="w-[18px] h-[18px]" strokeWidth={2.5} />} iconBg="bg-blue-50" iconColor="text-blue-500" value="0" label="UNDER REVIEW" valueColor="text-blue-500" labelColor="text-blue-400" delay="3" />
        <StatCard icon={<CheckCircle2 className="w-[18px] h-[18px]" strokeWidth={2.5} />} iconBg="bg-emerald-50" iconColor="text-emerald-500" value="01" label="RESOLVED" valueColor="text-emerald-600" labelColor="text-emerald-400" delay="4" />
      </div>

      {/* ═══════════════════════ ACADEMIC SERVICES ═══════════════════════ */}
      <h2 className="text-[1.4rem] font-bold text-swafo-800 mb-5 tracking-tight animate-fade-in-up animate-delay-3">Academic Services</h2>
      
      <div className="grid grid-cols-12 gap-5 mb-14">
        
        {/* Complete Academic Profile — Tall Green Hero Card */}
        <div className="col-span-4 bg-gradient-to-br from-swafo-700 via-swafo-600 to-swafo-800 rounded-[28px] p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[280px] shadow-xl shadow-swafo-700/15 group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-swafo-700/25 animate-fade-in-up animate-delay-3">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-[140px] h-[140px] rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-14 -left-8 w-[120px] h-[120px] rounded-full bg-white/[0.03]" />
          
          <div>
            <div className="w-11 h-11 rounded-full border-2 border-white/15 flex items-center justify-center mb-7 bg-white/[0.08] backdrop-blur-sm">
              <UserCircle2 className="w-5 h-5 text-white/80" strokeWidth={2} />
            </div>
            <h3 className="text-[1.7rem] font-bold leading-[1.15] tracking-tight">
              Complete<br />Academic<br />Profile
            </h3>
          </div>
          <button className="bg-white text-swafo-700 mt-6 py-3 px-7 rounded-full font-bold text-[13px] self-start hover:bg-swafo-50 transition-colors shadow-sm group-hover:shadow-md">
            Manage Details
          </button>
        </div>

        {/* Campus Handbook — Medium White Card */}
        <div className="col-span-4 bg-white rounded-[28px] p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-swafo-100/40 flex flex-col justify-between min-h-[280px] group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up animate-delay-4">
          <div>
            <div className="w-11 h-11 bg-swafo-600 rounded-xl flex items-center justify-center mb-6 shadow-sm shadow-swafo-600/20">
              <BookOpen className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <h3 className="text-[1.2rem] font-bold text-gray-900 mb-2.5">Campus Handbook</h3>
            <p className="text-[14px] font-medium text-gray-400 leading-relaxed">
              Review official rules, regulations, and student responsibilities.
            </p>
          </div>
          <a href="#" className="text-swafo-600 font-bold text-[13px] mt-5 flex items-center gap-1.5 group-hover:gap-3 transition-all">
            Download PDF <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Right column — two stacked cards */}
        <div className="col-span-4 flex flex-col gap-5">
          
          {/* Violation History */}
          <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-swafo-100/40 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group animate-fade-in-up animate-delay-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-swafo-50 text-swafo-600 flex items-center justify-center">
                <History className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900">Violation History</h4>
                <p className="text-[12px] font-semibold text-swafo-400 mt-0.5">Archive of past records</p>
              </div>
            </div>
            <ArrowRight className="w-[18px] h-[18px] text-swafo-200 group-hover:text-swafo-600 group-hover:translate-x-1 transition-all" />
          </div>

          {/* AI Curator */}
          <div className="bg-swafo-900 rounded-[20px] p-6 text-white flex-1 flex flex-col justify-between shadow-lg shadow-swafo-900/20 animate-fade-in-up animate-delay-5">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-swafo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h4 className="text-[16px] font-bold">AI Curator</h4>
              </div>
              <p className="text-[12px] font-medium text-white/50 leading-relaxed">
                Ask anything about campus rules or your standing.
              </p>
            </div>
            
            <div className="relative mt-4">
              <input 
                type="text" 
                placeholder="Type here..." 
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-full py-3 pl-4.5 pr-11 text-[12px] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-swafo-400 focus:bg-white/[0.1] transition-all font-medium"
              />
              <button className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-swafo-600 hover:bg-swafo-500 rounded-full flex items-center justify-center transition-colors shadow-sm">
                <Send className="w-3.5 h-3.5 text-white ml-0.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ RECENT VIOLATIONS ═══════════════════════ */}
      <div className="flex items-center justify-between mb-5 animate-fade-in-up animate-delay-5">
        <h2 className="text-[1.4rem] font-bold text-swafo-800 tracking-tight">Recent Violations</h2>
        <a href="#" className="text-[11px] font-extrabold text-swafo-600 hover:text-swafo-800 tracking-widest uppercase transition-colors">
          See All
        </a>
      </div>

      <div className="space-y-4 animate-fade-in-up animate-delay-5">
        {/* Violation 1 */}
        <ViolationCard
          title="Unauthorized Area Access"
          location="ICTC Building"
          date="SEP 28, 2023"
          time="04:30 PM"
          status="resolved"
          action="Incident documented. Mandatory attendance at the Campus Safety Seminar scheduled for next Monday."
        />

        {/* Violation 2 */}
        <ViolationCard
          title="Dress Code Violation"
          location="JFH Building"
          date="OCT 12, 2023"
          time="09:15 AM"
          status="under review"
          action="Please ensure proper attire according to Section 4.2 of the Handbook. Compliance required by next check-in."
        />
      </div>
    </div>
  );
}

/* ═══════════════════════ SUB-COMPONENTS ═══════════════════════ */

function DollarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  );
}

function StatCard({ icon, iconBg, iconColor, value, label, valueColor, labelColor, delay }) {
  return (
    <div className={`bg-white rounded-[22px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-swafo-100/30 flex flex-col gap-4 h-[140px] animate-fade-in-up animate-delay-${delay} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default`}>
      <div className={`${iconBg} w-9 h-9 rounded-full flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
      <div>
        <h3 className={`text-[2rem] font-extrabold ${valueColor} tracking-tighter leading-none mb-1`}>{value}</h3>
        <p className={`text-[9px] font-extrabold ${labelColor} uppercase tracking-[0.12em] leading-tight`}>{label}</p>
      </div>
    </div>
  );
}

function ViolationCard({ title, location, date, time, status, action }) {
  const statusConfig = {
    'resolved': { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Resolved' },
    'under review': { bg: 'bg-red-50', text: 'text-red-500', label: 'Under Review' },
    'pending': { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pending' },
  };
  const s = statusConfig[status] || statusConfig['pending'];

  return (
    <div className="bg-white rounded-[22px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-swafo-100/30 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[16px] font-bold text-gray-900 mb-1.5">{title}</h3>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> {location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> {date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> {time}
            </span>
          </div>
        </div>
        <span className={`${s.bg} ${s.text} text-[9px] font-extrabold px-3 py-1.5 rounded-md uppercase tracking-widest shrink-0`}>
          {s.label}
        </span>
      </div>
      
      <div className="bg-swafo-25 rounded-xl p-4.5 border-l-[3px] border-swafo-400">
        <p className="text-[9px] font-extrabold text-swafo-400 uppercase tracking-[0.12em] mb-1.5">Corrective Action</p>
        <p className="text-[13px] text-gray-600 font-medium leading-relaxed">{action}</p>
      </div>
    </div>
  );
}
