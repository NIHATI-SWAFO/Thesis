import { Link, Outlet, useLocation } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";

const navItems = [
  { name: 'Dashboard', path: '/student/dashboard', icon: 'dashboard' },
  { name: 'Academic Profile', path: '/student/profile', icon: 'account_circle' },
  { name: 'Violation Records', path: '/student/violations', icon: 'gavel' },
  { name: 'Campus Handbook', path: '/student/handbook', icon: 'menu_book' },
  { name: 'ChatBot', path: '/student/chatbot', icon: 'chat_bubble' },
  { name: 'Settings', path: '/student/settings', icon: 'settings' },
];

export default function StudentLayout() {
  const location = useLocation();
  const { accounts } = useMsal();
  const fullName = accounts.length > 0 ? accounts[0].name : 'Student';

  return (
    <div className="flex h-screen bg-portal-bg font-manrope selection:bg-portal-primary selection:text-white">
      
      {/* ══════════════════════════════ SIDEBAR ══════════════════════════════ */}
      {/* ══════════════════════════════ SIDEBAR ══════════════════════════════ */}
      <aside className="fixed left-0 top-0 h-screen w-[270px] z-50 bg-[#F7F9FB] flex flex-col py-10 shadow-[20px_0_60px_rgba(0,0,0,0.03)] border-r border-emerald-50/50 rounded-r-[3.5rem]">
        
        {/* Brand */}
        <div className="px-8 mb-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#003624] flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-2xl fill-1">school</span>
          </div>
          <div className="flex flex-col">
            <span className="font-pjs font-extrabold text-2xl tracking-tighter text-[#003624] leading-none">SWAFO</span>
            <span className="font-manrope text-[9px] uppercase tracking-[0.3em] text-emerald-600 font-bold mt-1">Academic Portal</span>
          </div>
        </div>

        {/* User Info (Mini Profile) */}
        <div className="px-8 mb-10">
          <div className="flex items-center gap-4 p-1">
            <div className="w-14 h-14 rounded-2xl bg-[#003624] ring-1 ring-[#003624]/10 flex items-center justify-center relative overflow-hidden shadow-sm">
                <span className="material-symbols-outlined text-white text-[40px] opacity-90">account_circle</span>
                <div className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <p className="text-[15px] font-pjs font-bold text-[#1a1a1a] leading-tight">{fullName}</p>
              <p className="text-[11px] font-manrope text-emerald-600/80 font-bold uppercase tracking-wider">BCS33 STUDENT</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-5 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/student/dashboard' && location.pathname === '/student');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-[#003624] text-white shadow-xl shadow-emerald-900/20' 
                    : 'text-slate-500 hover:text-[#003624] hover:bg-emerald-50/50'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-1' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[14px] font-pjs ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Action Button */}
        <div className="px-6 mt-auto">
          <button className="w-full py-4 bg-[#006b5d] text-white rounded-2xl font-pjs font-bold text-[14px] flex items-center justify-center gap-3 hover:bg-[#004d33] transition-all shadow-lg shadow-emerald-900/10 active:scale-95 group">
            Contact Registrar
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════ CONTENT AREA ══════════════════════════════ */}
      <div className="flex-1 ml-[270px] flex flex-col h-full overflow-hidden">
        
        {/* Topbar */}
        <header className="h-[72px] px-8 bg-white flex items-center justify-between z-30 relative shadow-[0_4px_30px_rgba(0,0,0,0.06)]">
          {/* Search */}
          <div className="flex-1 max-w-[500px] relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-portal-text-muted/40 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search academic records, handbooks, or AI curator..."
              className="block w-full rounded-xl border-none bg-portal-bg/40 py-3 pl-12 pr-4 text-portal-text focus:ring-2 focus:ring-portal-primary/20 text-[13px] font-manrope font-medium placeholder:text-portal-text-muted/30 outline-none transition-all"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg text-portal-text-muted hover:bg-portal-sidebar/5 transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="p-2 rounded-lg text-portal-text-muted hover:bg-portal-sidebar/5 transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
            </button>
            
            <div className="flex items-center gap-4 ml-2 pl-4 border-l border-emerald-50">
              <span className="text-[14px] font-pjs font-bold text-portal-primary hidden xl:block leading-none uppercase tracking-tight">{fullName}</span>
              <div className="w-10 h-10 rounded-full bg-[#003624] flex items-center justify-center ring-4 ring-emerald-50/20 shadow-sm overflow-hidden text-white">
                <span className="material-symbols-outlined text-[28px]">account_circle</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-8 py-8 pt-10 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

