import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/officer/dashboard', icon: 'dashboard' },
  { name: 'Patrol Monitoring', path: '/officer/patrols', icon: 'visibility' },
  { name: 'Record Violation', path: '/officer/violations/new', icon: 'gavel' },
  { name: 'Case Management', path: '/officer/cases', icon: 'folder_open' },
  { name: 'Student Records', path: '/officer/students', icon: 'people' },
  { name: 'Reports & Analytics', path: '/officer/reports', icon: 'bar_chart' },
  { name: 'Patrol History', path: '/officer/patrol-history', icon: 'history' },
];

export default function OfficerLayout() {
  const { instance } = useMsal();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
  };

  // Logic to hide bottom nav on specific screens
  const hideBottomNav = location.pathname.includes('expanded-map') || location.pathname.includes('summary');

  return (
    <div className="flex h-screen bg-[#F5F5F5] font-manrope selection:bg-portal-primary selection:text-white">
      
      {/* ══════════════════════════════ SIDEBAR (DESKTOP ONLY) ══════════════════════════════ */}
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
            )
          })}
        </nav>
        <div className="px-5 mt-auto flex flex-col gap-1 pt-6">
          <button className="flex items-center gap-4 px-6 py-3 rounded-full text-slate-500 hover:text-[#003624] hover:bg-emerald-50 transition-all w-full text-left"><span className="material-symbols-outlined text-[20px]">help_outline</span><span className="text-[13px] font-pjs font-semibold">Help Center</span></button>
          <button onClick={handleLogout} className="flex items-center gap-4 px-6 py-3 rounded-full text-red-500 hover:bg-red-50 transition-all w-full text-left"><span className="material-symbols-outlined text-[20px]">logout</span><span className="text-[13px] font-pjs font-semibold">Logout</span></button>
        </div>
      </aside>

      {/* ══════════════════════════════ CONTENT AREA ══════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden shrink-0 lg:ml-[270px]">
        
        {/* MOBILE HEADER (Image 1 Replica) */}
        <header className="lg:hidden h-[90px] bg-white border-b border-gray-50 flex items-center justify-between px-6 shrink-0 z-[5001]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-[#1A5C3A] border border-emerald-100/50 shadow-sm"><span className="material-symbols-outlined text-[20px]">visibility</span></div>
            <span className="font-pjs font-black text-[#1A5C3A] text-[18px] tracking-tight">Patrol Monitoring</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                <span className="text-[13px] font-black text-[#000000] leading-none mb-1">Officer Timothy</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">SWAFO Officer</span>
             </div>
             <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover" /></div>
          </div>
        </header>

        {/* Topbar: Translucent Emerald Glass (DESKTOP ONLY) */}
        <header className="hidden lg:flex sticky top-0 h-[80px] px-10 bg-[#003624]/90 backdrop-blur-xl items-center justify-between z-40 relative shrink-0 border-b border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
          <div className="flex-1 max-w-[500px] relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-[20px]">search</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search academic records, handbook..." className="block w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-12 pr-4 text-white text-[13px] font-manrope font-semibold placeholder:text-white/30 outline-none" />
          </div>
          <div className="flex items-center gap-4 ml-6 pl-8 border-l border-white/10">
            <div className="flex flex-col items-end"><span className="text-[14px] font-pjs font-bold text-white mb-1">Officer Timothy</span><span className="text-[10px] text-emerald-400/80 font-black uppercase">SWAFO Officer</span></div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20"><span className="material-symbols-outlined text-[28px]">account_circle</span></div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-0 lg:px-10 py-0 lg:py-8 custom-scrollbar">
          <Outlet />
        </main>

        {/* MOBILE BOTTOM NAV (Image 1 Replica) */}
        {!hideBottomNav && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[100px] bg-white border-t border-gray-100 flex items-center justify-around px-2 z-[5000] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] pb-4">
            <button onClick={() => navigate('/officer/dashboard')} className="flex flex-col items-center gap-1.5 px-4 group active:scale-95 transition-all">
              <span className={`material-symbols-outlined text-[26px] ${location.pathname.includes('dashboard') ? 'text-[#1A5C3A] font-black' : 'text-gray-300'}`}>grid_view</span>
              <span className={`text-[9px] font-black uppercase tracking-widest ${location.pathname.includes('dashboard') ? 'text-[#1A5C3A]' : 'text-gray-300'}`}>DASHBOARD</span>
            </button>
            
            <div className="relative -top-8">
              <button onClick={() => navigate('/officer/patrols')} className="w-[84px] h-[84px] bg-[#1A5C3A] rounded-full border-[7px] border-white shadow-2xl shadow-[#1A5C3A]/30 flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-white text-[34px] fill-1">visibility</span>
              </button>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-[#1A5C3A] uppercase tracking-widest">PATROL</span>
            </div>

            <button onClick={() => navigate('/officer/violations/new')} className="flex flex-col items-center gap-1.5 px-4 group active:scale-95 transition-all">
              <span className={`material-symbols-outlined text-[26px] ${location.pathname.includes('violations/new') ? 'text-[#1A5C3A] font-black' : 'text-gray-300'}`}>warning</span>
              <span className={`text-[9px] font-black uppercase tracking-widest ${location.pathname.includes('violations/new') ? 'text-[#1A5C3A]' : 'text-gray-300'}`}>VIOLATION</span>
            </button>

            <button className="flex flex-col items-center gap-1.5 px-4 opacity-40">
              <span className="material-symbols-outlined text-[26px] text-gray-300">folder</span>
              <span className={`text-[9px] font-black uppercase tracking-widest text-gray-300`}>CASES</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
