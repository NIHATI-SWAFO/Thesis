import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminNavItems = [
  { name: 'Director Overview', path: '/admin/dashboard', icon: 'monitoring' },
  { name: 'Case Oversight', path: '/admin/cases', icon: 'gavel' },
  { name: 'Student Records', path: '/admin/students', icon: 'groups' },
  { name: 'Patrol Oversight', path: '/admin/patrols', icon: 'history', isInProgress: true },
  { name: 'Institutional Analytics', path: '/admin/analytics', icon: 'analytics' },
  { name: 'Handbook Master', path: '/admin/handbook', icon: 'menu_book' },
  { name: 'User Management', path: '/admin/users', icon: 'manage_accounts' },
  { name: 'Campus Map', path: '/admin/campus-map', icon: 'map' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-manrope">
      
      {/* ══════════════════════════════ SIDEBAR ══════════════════════════════ */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] z-50 bg-[#003624] flex flex-col py-10 shadow-2xl">
        
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
        <nav className="flex-1 px-6 space-y-2 overflow-y-auto">
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
                <div className="flex flex-col">
                  <span className={`text-[14px] ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.name}</span>
                  {item.isInProgress && (
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">In Progress</span>
                  )}
                </div>
              </Link>
            )
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
            className="flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all w-full text-left group"
          >
             <span className="material-symbols-outlined text-[22px] group-hover:translate-x-1 transition-transform">logout</span>
             <span className="text-[14px] font-bold">Sign Out System</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════ CONTENT AREA ══════════════════════════════ */}
      <div className="flex-1 ml-[280px] flex flex-col h-full overflow-hidden">
        
        {/* Topbar */}
        <header className="h-[80px] px-12 bg-white flex items-center justify-between z-30 shadow-sm relative">
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

            <button className="relative w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all border border-gray-100">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border-2 border-white"></div>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] px-12 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
