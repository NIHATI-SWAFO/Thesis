import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/common/NotificationBell';

const adminNavItems = [
  { name: 'Director Overview', path: '/admin/dashboard', icon: 'monitoring' },
  { name: 'Case Oversight', path: '/admin/cases', icon: 'gavel' },
  { name: 'Student Records', path: '/admin/students', icon: 'groups' },
  { name: 'Patrol Oversight', path: '/admin/patrols', icon: 'history' },
  { name: 'Patrol Assignments', path: '/admin/patrol-assignments', icon: 'assignment_ind' },
  { name: 'Institutional Analytics', path: '/admin/analytics', icon: 'analytics' },
  { name: 'Handbook Master', path: '/admin/handbook', icon: 'menu_book' },
  { name: 'SWAFO Connect', path: '/admin/freedom-wall', icon: 'campaign' },
  { name: 'User Management', path: '/admin/users', icon: 'manage_accounts' },
  { name: 'Campus Map', path: '/admin/campus-map', icon: 'map' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer whenever location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-manrope overflow-hidden">
      
      {/* ══════════════════════════════ DESKTOP SIDEBAR ══════════════════════════════ */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[280px] z-50 bg-[#003624] flex-col py-10 border-r border-emerald-900/50">
        
        {/* Brand */}
        <div className="px-10 mb-12 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
            <span className="material-symbols-outlined text-2xl fill-1">admin_panel_settings</span>
          </div>
          <div className="flex flex-col">
            <span className="font-pjs font-extrabold text-white text-[18px] tracking-tight leading-none mb-1">DIRECTOR</span>
            <span className="font-manrope text-[9px] uppercase tracking-[0.2em] text-emerald-400/60 font-black leading-none">Command Center</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 space-y-2 overflow-y-auto sidebar-dark-scrollbar">
          {adminNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-emerald-100/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`material-symbols-outlined text-[22px] ${isActive ? 'fill-1' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[14px] ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="px-6 mt-auto pt-8 border-t border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-4 px-6 py-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-white leading-none mb-1">{user?.name || 'Director Elias'}</span>
              <span className="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest">SWAFO Director</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all w-full text-left group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px] group-hover:translate-x-1 transition-transform">logout</span>
            <span className="text-[14px] font-bold">Sign Out System</span>
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
          className={`relative w-[300px] max-w-[85vw] h-full bg-[#003624] flex flex-col py-6 shadow-2xl transition-transform duration-300 ease-out border-r border-emerald-900/50 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="px-6 mb-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <span className="material-symbols-outlined text-[22px] fill-1">admin_panel_settings</span>
              </div>
              <div className="flex flex-col">
                <span className="font-pjs font-extrabold text-white text-[17px] tracking-tight leading-none mb-1">DIRECTOR</span>
                <span className="font-manrope text-[9px] uppercase tracking-[0.2em] text-emerald-400/80 font-black leading-none">Command Center</span>
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
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.path;
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

          {/* User Info & Logout in Drawer */}
          <div className="px-4 mt-auto pt-4 border-t border-white/10 flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-white truncate leading-tight">{user?.name || 'Director Elias'}</span>
                <span className="text-[9px] text-emerald-400/80 font-black uppercase tracking-wider">SWAFO Director</span>
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
      <div className="flex-1 lg:ml-[280px] flex flex-col h-full overflow-hidden shrink-0">
        
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
              <span className="font-pjs font-extrabold text-white text-[16px] tracking-tight leading-none mb-0.5">DIRECTOR</span>
              <span className="font-manrope text-[8.5px] uppercase tracking-[0.2em] text-emerald-400/80 font-black leading-none">Command Center</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <NotificationBell isDarkBg={true} role="admin" />
            <div 
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex flex-col text-right">
                <span className="text-[12px] font-bold text-white leading-tight">
                  {user?.name || 'Director Elias'}
                </span>
                <span className="text-[8.5px] text-emerald-400/80 font-black uppercase tracking-wider leading-none">
                  SWAFO Director
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* Topbar (Desktop) */}
        <header className="hidden lg:flex h-[80px] px-12 bg-white items-center justify-between z-30 shadow-sm relative shrink-0">
          <div className="flex flex-col">
            <h2 className="text-[16px] font-pjs font-extrabold text-[#003624] tracking-tight leading-none mb-1 uppercase">Institutional Oversight</h2>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Global Campus Status</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6 border-r border-gray-100">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-black text-[#003624] uppercase tracking-tighter">System Health</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Operational
                </span>
              </div>
            </div>

            <NotificationBell isDarkBg={false} role="admin" />
          </div>
        </header>

        {/* Scrollable Page Content (Full viewport height on mobile, no cramped bottom bar!) */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] px-4 py-6 lg:px-12 lg:py-10 pb-6 lg:pb-10 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
