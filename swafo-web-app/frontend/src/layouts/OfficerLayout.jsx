import React, { useState } from 'react';
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
  { name: 'Campus Map', path: '/officer/campus-map', icon: 'map' },
];

export default function OfficerLayout() {
  const { instance } = useMsal();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);


  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-portal-bg font-manrope selection:bg-portal-primary selection:text-white">
      
      {/* ══════════════════════════════ SIDEBAR ══════════════════════════════ */}
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

        {/* Bottom Actions */}
        <div className="px-5 mt-auto flex flex-col gap-1 pt-6">
          <button className="flex items-center gap-4 px-6 py-3 rounded-full text-slate-500 hover:text-[#003624] hover:bg-emerald-50 transition-all w-full text-left">
             <span className="material-symbols-outlined text-[20px]">help_outline</span>
             <span className="text-[13px] font-pjs font-semibold">Help Center</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-6 py-3 rounded-full text-red-500 hover:bg-red-50 transition-all w-full text-left"
          >
             <span className="material-symbols-outlined text-[20px]">logout</span>
             <span className="text-[13px] font-pjs font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════ CONTENT AREA ══════════════════════════════ */}
      <div className="flex-1 lg:ml-[270px] flex flex-col h-full overflow-hidden shrink-0">
        
        {/* Topbar: Translucent Emerald Glass */}
        <header className="hidden lg:flex sticky top-0 h-[80px] px-10 bg-[#003624]/90 backdrop-blur-xl items-center justify-between z-40 relative shrink-0 border-b border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
          <div className="flex-1 max-w-[500px] relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-[20px] group-focus-within:text-emerald-400 transition-colors">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search academic records, handbook..."
              className="block w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-emerald-500/50 text-[13px] font-manrope font-semibold placeholder:text-white/30 outline-none transition-all shadow-inner hover:bg-white/15"
            />
            {searchQuery && (
              <div className="absolute top-full mt-3 left-0 w-full bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-3">Global Search Results</p>
                <div className="max-h-[300px] overflow-y-auto">
                   <div className="p-4 text-center">
                     <p className="text-[13px] font-bold text-[#003624]">Searching for "{searchQuery}"...</p>
                     <p className="text-[11px] text-slate-400 mt-1 italic">Fetching records from Institutional Ledger</p>
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsHelpOpen(false); }}
                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${isNotifOpen ? 'bg-white/20 text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#003624]"></div>
              </button>
              {isNotifOpen && (
                <div className="absolute top-full mt-3 right-0 w-[340px] bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="p-5 border-b border-slate-100/50 flex justify-between items-center">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Notification Pulse</p>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">3 NEW</span>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto p-2">
                    {[
                      { title: 'New Violation Logged', desc: 'Sector A-12: Dress code violation reported.', time: '2m ago' },
                      { title: 'Case Assigned', desc: 'Case #8291 has been moved to your list.', time: '15m ago' },
                      { title: 'Patrol Warning', desc: 'Heavy traffic reported near Gate 2.', time: '1h ago' }
                    ].map((n, i) => (
                      <div key={i} className="p-4 rounded-2xl hover:bg-slate-50/80 transition-all cursor-pointer group mb-1">
                        <p className="text-[13px] font-bold text-[#003624] group-hover:text-emerald-700 transition-colors">{n.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{n.desc}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-3 tracking-wider">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => { setIsHelpOpen(!isHelpOpen); setIsNotifOpen(false); }}
                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${isHelpOpen ? 'bg-white/20 text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              >
                <span className="material-symbols-outlined text-[22px]">help_outline</span>
              </button>
              {isHelpOpen && (
                <div className="absolute top-full mt-3 right-0 w-[260px] bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-4 border-b border-slate-100/50">Support Center</p>
                  <div className="p-2 flex flex-col gap-1">
                    <button className="w-full text-left px-5 py-3.5 rounded-2xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-4 transition-all">
                      <span className="material-symbols-outlined text-[18px]">menu_book</span>
                      Officer Manual
                    </button>
                    <button className="w-full text-left px-5 py-3.5 rounded-2xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-4 transition-all">
                      <span className="material-symbols-outlined text-[18px]">support_agent</span>
                      IT Support
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 ml-6 pl-8 border-l border-white/10">
              <div className="flex flex-col items-end">
                <span className="text-[14px] font-pjs font-bold text-white leading-none mb-2">{user?.name || 'Officer Timothy'}</span>
                <span className="text-[10px] font-manrope text-emerald-400/80 font-black uppercase tracking-[0.2em] leading-none">SWAFO Officer</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-2xl overflow-hidden text-white border border-white/20 hover:bg-white/20 hover:scale-105 transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[28px] fill-1">account_circle</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto lg:px-10 lg:py-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
