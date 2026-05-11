import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/student/dashboard', icon: 'dashboard' },
  { name: 'Academic Profile', path: '/student/profile', icon: 'account_circle' },
  { name: 'Violation Records', path: '/student/violations', icon: 'gavel' },
  { name: 'Campus Handbook', path: '/student/handbook', icon: 'menu_book' },
  { name: 'ChatBot', path: '/student/chatbot', icon: 'chat_bubble' },
  { name: 'Settings', path: '/student/settings', icon: 'settings' },
];

export default function StudentLayout() {
  const { instance } = useMsal();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const fullName = user?.name || 'Student';

  return (
    <div className="flex h-screen bg-portal-bg font-manrope selection:bg-portal-primary selection:text-white">
      
      {/* ══════════════════════════════ SIDEBAR ══════════════════════════════ */}
      {/* ══════════════════════════════ SIDEBAR ══════════════════════════════ */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[270px] z-50 bg-[#F7F9FB] flex-col py-10 shadow-[20px_0_60px_rgba(0,0,0,0.03)] border-r border-emerald-50/50 rounded-r-[3.5rem]">
        
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
        <div className="px-6 mt-auto space-y-3">
          <button 
            onClick={handleLogout}
            className="w-full py-4 border-2 border-slate-200 text-slate-500 rounded-2xl font-pjs font-bold text-[14px] flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95 group"
          >
            Logout
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>

          <button className="w-full py-4 bg-[#006b5d] text-white rounded-2xl font-pjs font-bold text-[14px] flex items-center justify-center gap-3 hover:bg-[#004d33] transition-all shadow-lg shadow-emerald-900/10 active:scale-95 group">
            Contact SWAFO
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════ CONTENT AREA ══════════════════════════════ */}
      <div className="flex-1 lg:ml-[270px] flex flex-col h-full overflow-hidden shrink-0">
        
        {/* MOBILE HEADER */}
        <header className="lg:hidden h-[80px] bg-white border-b border-gray-50 flex items-center justify-between px-6 shrink-0 z-[5001]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003624] flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[20px] fill-1">school</span>
            </div>
            <div className="flex flex-col">
              <span className="font-pjs font-extrabold text-[#003624] text-[18px] tracking-tight leading-none mb-1">SWAFO</span>
              <span className="font-manrope text-[9px] uppercase tracking-[0.2em] text-emerald-600 font-bold leading-none">Student Portal</span>
            </div>
          </div>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#003624] border border-emerald-100/50 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></div>
          </button>
        </header>

        {/* Topbar (Desktop) */}
        <header className="hidden lg:flex h-[72px] px-8 bg-white items-center justify-between z-30 relative shadow-[0_4px_30px_rgba(0,0,0,0.06)] shrink-0">
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
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowHelp(false);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 relative group ${showNotifications ? 'bg-[#003624] text-white shadow-lg' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute top-14 right-24 w-[320px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-emerald-50 z-50 animate-fade-in-up overflow-hidden">
                <div className="p-6 border-b border-emerald-50 flex items-center justify-between">
                  <h4 className="font-pjs font-bold text-[#003624]">Notifications</h4>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">3 New</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  <div className="p-4 hover:bg-emerald-50/50 transition-colors cursor-pointer border-b border-emerald-50/30">
                    <p className="text-[13px] font-bold text-[#1a1a1a]">System Status: Secure</p>
                    <p className="text-[11px] text-slate-500 mt-1">SWAFO portal is successfully synced with institutional records.</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-widest">Active Session</p>
                  </div>
                  <div className="p-4 hover:bg-emerald-50/50 transition-colors cursor-pointer border-b border-emerald-50/30">
                    <p className="text-[13px] font-bold text-[#1a1a1a]">Academic Profile Updated</p>
                    <p className="text-[11px] text-slate-500 mt-1">Your 2nd Semester 2025-2026 records are now visible.</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-widest">Verified</p>
                  </div>
                  <div className="p-4 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                    <p className="text-[13px] font-bold text-[#1a1a1a]">Campus Handbook Live</p>
                    <p className="text-[11px] text-slate-500 mt-1">Digital rules and regulations have been successfully indexed.</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-widest">Permanent Notice</p>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={() => {
                setShowHelp(!showHelp);
                setShowNotifications(false);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 group relative ${showHelp ? 'bg-[#003624] text-white shadow-lg' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
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
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-all text-left group/item">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">book</span>
                    <span className="text-[13px] font-bold text-[#1a1a1a] group-hover/item:translate-x-1 transition-transform">Read Student FAQ</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-all text-left group/item">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">contact_support</span>
                    <span className="text-[13px] font-bold text-[#1a1a1a] group-hover/item:translate-x-1 transition-transform">Contact SWAFO Support</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-all text-left group/item">
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
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#003624] flex items-center justify-center ring-1 ring-emerald-100/50 shadow-sm overflow-hidden group cursor-pointer hover:bg-[#003624] hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-[24px]">account_circle</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 lg:pt-10 custom-scrollbar pb-[100px] lg:pb-8">
          <Outlet />
        </main>

        {/* MOBILE BOTTOM NAV */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[90px] bg-white border-t border-gray-100 flex items-center justify-around px-2 z-[5000] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-6">
          <NavButton 
            active={location.pathname.includes('dashboard')} 
            onClick={() => navigate('/student/dashboard')}
            icon="dashboard"
            label="HOME"
          />
          <NavButton 
            active={location.pathname.includes('violations')} 
            onClick={() => navigate('/student/violations')}
            icon="gavel"
            label="RECORDS"
          />
          <NavButton 
            active={location.pathname.includes('chatbot')} 
            onClick={() => navigate('/student/chatbot')}
            icon="chat_bubble"
            label="AI CURATOR"
            isCenter={true}
          />
          <NavButton 
            active={location.pathname.includes('handbook')} 
            onClick={() => navigate('/student/handbook')}
            icon="book_4"
            label="GUIDE"
          />
          <NavButton 
            active={location.pathname.includes('profile')} 
            onClick={() => navigate('/student/profile')}
            icon="person"
            label="PROFILE"
          />
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, isCenter = false }) {
  return (
    <button 
      onClick={onClick} 
      className={`relative flex flex-col items-center transition-all duration-300 ${active ? '-top-7' : 'top-0'} ${isCenter && !active ? 'opacity-80' : 'opacity-100'}`}
    >
      {active ? (
        <div className="flex flex-col items-center animate-in zoom-in-75 duration-300">
          <div className="w-[72px] h-[72px] bg-[#1A5C3A] rounded-full border-[6px] border-white shadow-2xl flex items-center justify-center mb-1 active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-white text-[32px] fill-1">{icon}</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter text-[#1A5C3A] whitespace-nowrap">{label}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 group active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[28px] text-slate-400 group-hover:text-slate-600 transition-colors">{icon}</span>
          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-slate-600 transition-colors">{label}</span>
        </div>
      )}
    </button>
  );
}

