import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/common/NotificationBell';

const navItems = [
  { name: 'Dashboard', path: '/student/dashboard', icon: 'dashboard' },
  { name: 'Academic Profile', path: '/student/profile', icon: 'account_circle' },
  { name: 'Violation Records', path: '/student/violations', icon: 'gavel' },
  { name: 'SWAFO Connect', path: '/student/freedom-wall', icon: 'campaign' },
  { name: 'Campus Handbook', path: '/student/handbook', icon: 'menu_book' },
  { name: 'ChatBot', path: '/student/chatbot', icon: 'chat_bubble' },
  { name: 'Settings', path: '/student/settings', icon: 'settings' },
];

export default function StudentLayout() {
  const { instance } = useMsal();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [topSearch, setTopSearch] = useState('');

  const handleLogout = () => {
    logout();
  };

  const fullName = user?.name || user?.email?.split('@')[0] || 'Student';
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'ST';

  return (
    <div className="flex h-screen bg-portal-bg font-manrope selection:bg-portal-primary selection:text-white">
      
      {/* ══════════════════════════════ DESKTOP SIDEBAR ══════════════════════════════ */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[270px] z-50 bg-[#F7F9FB] flex-col py-8 shadow-[20px_0_60px_rgba(0,0,0,0.03)] border-r border-emerald-50/50 rounded-r-[3.5rem]">
        
        {/* Brand */}
        <div className="px-8 mb-8 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#003624] flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-2xl fill-1">school</span>
          </div>
          <div className="flex flex-col">
            <span className="font-pjs font-extrabold text-[#003624] text-[17px] tracking-tight leading-none mb-1">SWAFO PORTAL</span>
            <span className="font-manrope text-[9px] uppercase tracking-wide text-gray-500 font-bold max-w-[120px] leading-[1.2]">STUDENT WELFARE AND FORMATION OFFICE</span>
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
              <span className="text-[12px] font-pjs font-bold text-[#003624] truncate leading-tight">{fullName}</span>
              <span className="text-[9px] font-bold text-emerald-700/80 uppercase tracking-wider">SWAFO Student</span>
            </div>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-4 px-6 py-2.5 rounded-full text-slate-500 hover:text-[#003624] hover:bg-emerald-50 transition-all w-full text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            <span className="text-[13px] font-pjs font-semibold">Help Center</span>
          </button>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-4 px-6 py-2.5 rounded-full text-red-500 hover:bg-red-50 transition-all w-full text-left cursor-pointer"
          >
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
                <span className="font-manrope text-[9px] uppercase tracking-[0.2em] text-emerald-400/80 font-black leading-none">Student Portal</span>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-transform cursor-pointer"
              aria-label="Close menu"
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

          {/* Student Info & Actions in Drawer Footer */}
          <div className="px-4 mt-auto pt-4 border-t border-white/10 flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt={fullName} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-white truncate leading-tight">{fullName}</span>
                <span className="text-[9px] text-emerald-400/80 font-black uppercase tracking-wider">SWAFO Student</span>
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
      <div className="flex-1 lg:ml-[270px] flex flex-col h-full overflow-hidden shrink-0">
        
        {/* MOBILE HEADER (Cohesive Dark Green Theme) */}
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
              <span className="font-manrope text-[8.5px] uppercase tracking-[0.2em] text-emerald-400/80 font-black leading-none">Student Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <NotificationBell isDarkBg={true} role="student" />
            <div 
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex flex-col text-right">
                <span className="text-[12px] font-bold text-white leading-tight truncate max-w-[110px]">
                  {fullName}
                </span>
                <span className="text-[8.5px] text-emerald-400/80 font-black uppercase tracking-wider leading-none">
                  Student
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt={fullName} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Topbar (Desktop) */}
        <header className="hidden lg:flex h-[72px] px-8 bg-white items-center justify-between z-30 relative shadow-[0_4px_30px_rgba(0,0,0,0.06)] shrink-0">
          {/* Search */}
          <div className="flex-1 max-w-[500px] relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-portal-text-muted/40 text-[20px]">search</span>
            <input
              type="text"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder="Search academic records, handbooks, or AI curator..."
              className="block w-full rounded-xl border-none bg-portal-bg/40 py-3 pl-12 pr-4 text-portal-text focus:ring-2 focus:ring-portal-primary/20 text-[13px] font-manrope font-medium placeholder:text-portal-text-muted/30 outline-none transition-all"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 relative">
            <NotificationBell isDarkBg={false} role="student" />

            <button 
              onClick={() => setShowHelp(!showHelp)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 group relative ${showHelp ? 'bg-[#003624] text-white shadow-lg' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
              aria-label="Help Center"
            >
              <span className="material-symbols-outlined text-[22px]">help_outline</span>
            </button>

            {/* Help Modal Overlay */}
            {showHelp && (
              <div className="absolute top-14 right-10 w-[280px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-emerald-50 z-50 animate-fade-in-up overflow-hidden">
                <div className="p-6 bg-[#003624] text-white text-center">
                  <span className="material-symbols-outlined text-3xl mb-2">support_agent</span>
                  <h4 className="font-pjs font-bold">Help Center</h4>
                  <p className="text-[11px] opacity-70">Need assistance? We're here.</p>
                </div>
                <div className="p-4 space-y-2">
                  <button onClick={() => { navigate('/student/handbook'); setShowHelp(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-all text-left group/item cursor-pointer">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">book</span>
                    <span className="text-[13px] font-bold text-[#1a1a1a] group-hover/item:translate-x-1 transition-transform">Read Student FAQ</span>
                  </button>
                  <button onClick={() => { navigate('/student/chatbot'); setShowHelp(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-all text-left group/item cursor-pointer">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">chat</span>
                    <span className="text-[13px] font-bold text-[#1a1a1a] group-hover/item:translate-x-1 transition-transform">Talk to AI Curator</span>
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4 ml-2 pl-6 border-l border-emerald-50/50">
              <div className="text-right hidden md:block">
                <p className="text-[14px] font-pjs font-bold text-[#1a1a1a] leading-tight">{fullName}</p>
                <p className="text-[10px] font-manrope text-emerald-600 font-bold uppercase tracking-wider">Authenticated Student</p>
              </div>
              <div 
                onClick={() => navigate('/student/profile')}
                className="w-10 h-10 rounded-xl bg-emerald-50 text-[#003624] flex items-center justify-center ring-1 ring-emerald-100/50 shadow-sm overflow-hidden group cursor-pointer hover:bg-[#003624] hover:text-white transition-all duration-300"
              >
                <span className="material-symbols-outlined text-[24px]">account_circle</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8 custom-scrollbar pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* MOBILE BOTTOM NAVIGATION (Sleek Native Tab Bar) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-white/95 backdrop-blur-md border-t border-gray-200/80 flex items-center justify-around px-2 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
          <NavButton 
            active={location.pathname === '/student/dashboard' || location.pathname === '/student'} 
            onClick={() => navigate('/student/dashboard')}
            icon="dashboard"
            label="Home"
          />
          <NavButton 
            active={location.pathname.startsWith('/student/violations')} 
            onClick={() => navigate('/student/violations')}
            icon="gavel"
            label="Records"
          />
          <NavButton 
            active={location.pathname.startsWith('/student/freedom-wall')} 
            onClick={() => navigate('/student/freedom-wall')}
            icon="campaign"
            label="Connect"
          />
          <NavButton 
            active={location.pathname.startsWith('/student/chatbot')} 
            onClick={() => navigate('/student/chatbot')}
            icon="chat_bubble"
            label="AI Help"
          />
          <NavButton 
            active={location.pathname.startsWith('/student/profile')} 
            onClick={() => navigate('/student/profile')}
            icon="person"
            label="Profile"
          />
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button 
      type="button"
      onClick={onClick} 
      className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer ${
        active ? 'text-[#003624]' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <div className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-emerald-100 text-[#003624]' : ''}`}>
        <span className={`material-symbols-outlined text-[21px] ${active ? 'fill-1' : ''}`}>{icon}</span>
      </div>
      <span className={`text-[9px] mt-0.5 tracking-tight uppercase ${active ? 'font-black text-[#003624]' : 'font-bold'}`}>
        {label}
      </span>
    </button>
  );
}

