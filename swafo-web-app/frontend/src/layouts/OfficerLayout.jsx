import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";

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
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-portal-bg font-manrope selection:bg-portal-primary selection:text-white">
      
      {/* ══════════════════════════════ SIDEBAR ══════════════════════════════ */}
      <aside className="fixed left-0 top-0 h-screen w-[270px] z-50 bg-[#F7F9FB] flex flex-col py-8 shadow-[20px_0_60px_rgba(0,0,0,0.03)] border-r border-emerald-50/50 rounded-r-[3.5rem]">
        
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
            onClick={() => instance.logoutRedirect()}
            className="flex items-center gap-4 px-6 py-3 rounded-full text-red-500 hover:bg-red-50 transition-all w-full text-left"
          >
             <span className="material-symbols-outlined text-[20px]">logout</span>
             <span className="text-[13px] font-pjs font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════ CONTENT AREA ══════════════════════════════ */}
      <div className="flex-1 ml-[270px] flex flex-col h-full overflow-hidden shrink-0">
        
        {/* Topbar */}
        <header className="h-[72px] px-10 bg-[#F7F9FB] flex items-center justify-between z-30 relative shrink-0">
          {/* Search */}
          <div className="flex-1 max-w-[500px] relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search academic records, handbook..."
              className="block w-full rounded-xl border-none bg-emerald-50/50 py-2.5 pl-12 pr-4 text-portal-text focus:ring-1 focus:ring-emerald-200 text-[13px] font-manrope font-medium placeholder:text-gray-400 outline-none transition-all w-[380px]"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full text-emerald-500 hover:bg-emerald-50 transition-all">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="p-2 rounded-full text-emerald-500 hover:bg-emerald-50 transition-all">
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
            </button>
            
            <div className="flex items-center gap-3 ml-4 pl-6 border-l border-emerald-100">
              <div className="flex flex-col items-end">
                <span className="text-[13px] font-pjs font-bold text-gray-800 leading-none mb-1">Officer Timothy</span>
                <span className="text-[10px] font-manrope text-gray-500 uppercase tracking-widest leading-none">SWAFO Officer</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#003624] flex items-center justify-center shadow-sm overflow-hidden text-white border-2 border-white">
                <span className="material-symbols-outlined text-[24px]">account_circle</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
