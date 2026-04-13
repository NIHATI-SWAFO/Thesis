import { Link, Outlet, useLocation } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";
import { LayoutDashboard, UserCircle, FolderOpen, BookOpen, Settings, Search, Bell, HelpCircle } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Academic Profile', path: '/student/profile', icon: UserCircle },
  { name: 'Violation Records', path: '/student/violations', icon: FolderOpen },
  { name: 'Campus Handbook', path: '/student/handbook', icon: BookOpen },
  { name: 'Settings', path: '/student/settings', icon: Settings },
];

export default function StudentLayout() {
  const location = useLocation();
  const { accounts } = useMsal();
  const fullName = accounts.length > 0 ? accounts[0].name : 'Student';
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-[#e8f2ee] font-['DM_Sans'] selection:bg-swafo-600 selection:text-white">
      
      {/* ══════════════════════════════ SIDEBAR ══════════════════════════════ */}
      <aside className="w-[260px] bg-white h-full flex flex-col z-20 rounded-r-[28px] shadow-[4px_0_40px_rgba(15,65,41,0.04)] border-r border-swafo-100/50">
        
        {/* Brand */}
        <div className="px-7 pt-9 pb-5 flex items-center gap-3">
          <div className="w-9 h-9 bg-swafo-700 rounded-xl flex items-center justify-center shadow-sm shadow-swafo-700/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px] text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span className="font-bold text-[18px] tracking-tight text-gray-900">SWAFO</span>
        </div>

        {/* User Profile */}
        <div className="mx-5 mb-6 p-3.5 bg-swafo-50 rounded-2xl border border-swafo-100/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-swafo-600 flex items-center justify-center text-white text-[12px] font-bold shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900 truncate leading-tight">{fullName}</p>
              <p className="text-[11px] font-semibold text-swafo-400 mt-0.5">BCS33</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/student/dashboard' && location.pathname === '/student');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-swafo-600 text-white shadow-lg shadow-swafo-600/25' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-swafo-50/80'
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-swafo-600'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[13px] ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-5 pb-6 pt-2">
          <div className="text-[10px] font-bold text-gray-300 tracking-wider uppercase">SWAFO v2.0 &middot; Module 2</div>
        </div>
      </aside>

      {/* ══════════════════════════════ MAIN AREA ══════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Soft radial gradient behind the top area to match the target's organic green wash */}
        <div className="absolute top-0 left-0 right-0 h-[350px] pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#cce8dd] via-[#dff1e8] to-transparent" />
          <div className="absolute top-10 right-40 w-[500px] h-[300px] bg-swafo-200/30 rounded-full blur-[100px]" />
          <div className="absolute -top-20 left-20 w-[400px] h-[350px] bg-swafo-300/20 rounded-full blur-[120px]" />
        </div>

        {/* Topbar */}
        <header className="h-[80px] px-8 flex items-center justify-between z-10 relative">
          {/* Search */}
          <div className="flex-1 max-w-[500px] relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-[16px] w-[16px] text-swafo-600/50" />
            </div>
            <input
              type="text"
              placeholder="Search academic records, handbook..."
              className="block w-full rounded-2xl border-0 bg-white/70 backdrop-blur-lg py-3 pl-11 pr-4 text-gray-900 shadow-sm ring-1 ring-inset ring-swafo-200/40 focus:bg-white focus:ring-2 focus:ring-swafo-600 sm:text-[13px] font-medium placeholder:text-gray-400 outline-none transition-all"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-5 ml-6">
            <button className="relative text-swafo-700 hover:text-swafo-900 transition-colors p-1.5 rounded-lg hover:bg-white/60">
              <Bell className="w-[18px] h-[18px]" strokeWidth={2.5} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-[#dff1e8]" />
            </button>
            <button className="text-swafo-700 hover:text-swafo-900 transition-colors p-1.5 rounded-lg hover:bg-white/60">
              <HelpCircle className="w-[18px] h-[18px]" strokeWidth={2.5} />
            </button>
            
            <div className="flex items-center gap-3 pl-4 ml-1 border-l border-swafo-300/30">
              <span className="text-[13px] font-bold text-gray-800 hidden xl:block">{fullName}</span>
              <div className="w-9 h-9 rounded-full bg-swafo-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto z-10 px-8 pb-10 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
