import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/common/NotificationBell';

const navItems = [
  { name: 'Dashboard', path: '/officer/dashboard', icon: 'dashboard' },
  { name: 'Patrol Monitoring', path: '/officer/patrols', icon: 'visibility' },
  { name: 'Record Violation', path: '/officer/violations/new', icon: 'gavel' },
  { name: 'Case Management', path: '/officer/cases', icon: 'folder_open' },
  { name: 'Student Records', path: '/officer/students', icon: 'people' },
  { name: 'Reports & Analytics', path: '/officer/analytics', icon: 'bar_chart' },
  { name: 'Patrol History', path: '/officer/patrol-history', icon: 'history' },
  { name: 'Campus Map', path: '/officer/campus-map', icon: 'map' },
];

export default function OfficerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const officerDisplayName = user?.name || user?.full_name || 'SWAFO Officer';

  // Compute clean initials for avatar fallback (e.g. "Erica Aclag" -> "EA")
  const initials = (officerDisplayName || 'SO')
    .replace(/^Officer\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SO';

  // Scroll to top on navigation & close mobile drawer
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#F5F5F5] font-manrope selection:bg-portal-primary selection:text-white overflow-hidden">
      
      {/* ══════════════════════════════ DESKTOP SIDEBAR ══════════════════════════════ */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[270px] z-50 bg-[#F7F9FB] flex-col py-8 shadow-[20px_0_60px_rgba(0,0,0,0.03)] border-r border-emerald-50/50 rounded-r-[3.5rem]">
        {/* Brand */}
        <div className="px-8 mb-8 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#003624] flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-2xl fill-1">school</span>
          </div>
          <div className="flex flex-col">
            <span className="font-pjs font-extrabold text-[#003624] text-[17px] tracking-tight leading-none mb-1">SWAFO PORTAL</span>
            <span className="font-manrope text-[9px] uppercase tracking-wide text-gray-500 font-bold max-w-[120px] leading-[1.2]">Student Welfare and Formation Office</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-5 mt-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-6 py-3.5 rounded-full transition-all duration-300 group ${
                  isActive 
                    ? 'bg-[#009b69] text-white shadow-md shadow-emerald-900/10' 
                    : 'text-[#004d33] hover:bg-emerald-50'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-1 font-bold' : 'font-medium opacity-80'}`}>
                  {item.icon}
                </span>
                <span className={`text-[13px] font-pjs ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile Card & Action */}
        <div className="px-5 mt-auto flex flex-col gap-2 pt-6 border-t border-emerald-50/60">
          <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white border border-emerald-100/60 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#003624] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {initials}
            </div>
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-[12px] font-pjs font-bold text-[#003624] truncate leading-tight">{officerDisplayName}</span>
              <span className="text-[9px] font-bold text-emerald-700/80 uppercase tracking-wider">SWAFO Officer</span>
            </div>
          </div>
          <button className="flex items-center gap-4 px-6 py-2.5 rounded-full text-slate-500 hover:text-[#003624] hover:bg-emerald-50 transition-all w-full text-left cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            <span className="text-[13px] font-pjs font-semibold">Help Center</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-4 px-6 py-2.5 rounded-full text-red-500 hover:bg-red-50 transition-all w-full text-left cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-[13px] font-pjs font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════ MOBILE SLIDE-OVER DRAWER ══════════════════════════════ */}
      <div 
        className={`lg:hidden fixed inset-0 z-[6000] transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <div 
          className={`relative w-[300px] max-w-[85vw] h-full bg-[#003624] text-white flex flex-col py-6 shadow-2xl transition-transform duration-300 ease-out border-r border-emerald-900/50 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="px-6 mb-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <span className="material-symbols-outlined text-[22px] fill-1">school</span>
              </div>
              <div className="flex flex-col">
                <span className="font-pjs font-extrabold text-white text-[17px] tracking-tight leading-none mb-1">SWAFO PORTAL</span>
                <span className="font-manrope text-[9px] uppercase tracking-[0.2em] text-emerald-400/80 font-black leading-none">Officer Station</span>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto sidebar-dark-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 font-bold' 
                      : 'text-emerald-100/70 hover:text-white hover:bg-white/5 font-semibold'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[22px] ${isActive ? 'fill-1' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="text-[13px]">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Officer Info & Actions in Drawer */}
          <div className="px-4 mt-auto pt-4 border-t border-white/10 flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt={officerDisplayName} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-white truncate leading-tight">{officerDisplayName}</span>
                <span className="text-[9px] text-emerald-400/80 font-black uppercase tracking-wider">SWAFO Officer</span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all w-full text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="text-[13px] font-bold">Sign Out System</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════ CONTENT AREA ══════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden shrink-0 lg:ml-[270px]">
        
        {/* MOBILE HEADER */}
        <header className="lg:hidden h-[70px] bg-[#003624] flex items-center justify-between px-5 shrink-0 z-40 border-b border-emerald-900/40">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/15 active:scale-90 transition-transform cursor-pointer"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <div className="flex flex-col">
              <span className="font-pjs font-extrabold text-white text-[16px] tracking-tight leading-none mb-0.5">SWAFO PORTAL</span>
              <span className="font-manrope text-[8.5px] uppercase tracking-[0.2em] text-emerald-400/80 font-black leading-none">Officer Station</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <NotificationBell isDarkBg={true} role="officer" />
            <div 
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex flex-col text-right">
                <span className="text-[12px] font-bold text-white leading-tight truncate max-w-[110px]">
                  {officerDisplayName}
                </span>
                <span className="text-[8.5px] text-emerald-400/80 font-black uppercase tracking-wider leading-none">
                  SWAFO Officer
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt={officerDisplayName} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Topbar: Translucent Emerald Glass (DESKTOP ONLY) */}
        <header className="hidden lg:flex sticky top-0 h-[80px] px-10 bg-[#003624]/90 backdrop-blur-xl items-center justify-between z-40 relative shrink-0 border-b border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
          <div className="flex-1 max-w-[500px] relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-[20px]">search</span>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search academic records, handbook..." 
              className="block w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-12 pr-4 text-white text-[13px] font-manrope font-semibold placeholder:text-white/30 outline-none" 
            />
          </div>
          <div className="flex items-center gap-4 ml-6 pl-8 border-l border-white/10">
            <NotificationBell isDarkBg={true} role="officer" />
            <div className="flex flex-col items-end">
              <span className="text-[14px] font-pjs font-bold text-white mb-1">{officerDisplayName}</span>
              <span className="text-[10px] text-emerald-400/80 font-black uppercase">SWAFO Officer</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20 font-bold text-xs uppercase tracking-wider shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover rounded-2xl" alt={officerDisplayName} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content (Full viewport height on mobile, no cramped bottom bar!) */}
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-10 lg:py-8 pb-6 lg:pb-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
