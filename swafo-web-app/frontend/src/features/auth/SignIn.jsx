import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../lib/authConfig";
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from "../../api/config";
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  ChevronDown,
  Shield,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import swafoLogo from '../../assets/swafo_logo.jpg';
import signinBg from '../../assets/signin_image.png';

export default function SignIn() {
  const { instance, accounts } = useMsal();
  const { loginAsOfficer } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('officer');
  const [showPassword, setShowPassword] = useState(false);
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerError, setOfficerError] = useState('');
  const [officerLoggingIn, setOfficerLoggingIn] = useState(false);

  const handleOfficerSubmit = async (e) => {
    e.preventDefault();
    setOfficerError('');
    if (!officerEmail.trim()) {
      setOfficerError('Please enter your officer email or ID.');
      return;
    }
    setOfficerLoggingIn(true);
    try {
      await loginAsOfficer('', officerEmail.trim(), officerPassword);
      navigate('/officer/dashboard');
    } catch (err) {
      setOfficerError(err.message || 'Invalid credentials. Default password is SwafoOfficer2026.');
    } finally {
      setOfficerLoggingIn(false);
    }
  };

  // If user is already authenticated (came back from Microsoft redirect), go to dashboard
  useEffect(() => {
    if (accounts.length > 0) {
      navigate('/student/dashboard');
    }
  }, [accounts, navigate]);

  const handleMicrosoftLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 font-sans text-gray-900 selection:bg-emerald-200 selection:text-emerald-950 overflow-x-hidden">
      
      {/* =========================================================================
          LEFT HALF (50% on Desktop): Brand Visual & Institutional Showcase
          ========================================================================= */}
      <div className="relative w-full lg:w-1/2 bg-[#00281b] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-14 xl:p-16 overflow-hidden min-h-[460px] lg:min-h-screen">
        {/* Background Campus Image with Emerald Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url(${signinBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#00281b]/95 via-[#003624]/90 to-[#021810]/95 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001f14] via-transparent to-[#002417]/60" />

        {/* Ambient Decorative Light Glows */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top University Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5 sm:gap-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center shrink-0">
            <img src={swafoLogo} alt="SWAFO Logo" className="h-full w-full object-cover rounded-xl" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300 font-pjs">
              De La Salle University - Dasmariñas
            </p>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Student Welfare and Formation Office
            </h1>
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-8 lg:py-12 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3.5 py-1.5 backdrop-blur-md border border-emerald-400/20 text-emerald-200 text-xs font-semibold mb-6 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-300 shrink-0" />
            <span>Official University Formation Portal</span>
          </div>

          <h2 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.05] text-white font-pjs mb-6">
            Curing Campus <br />
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-100 bg-clip-text text-transparent">
              Integrity.
            </span>
          </h2>

          <p className="text-white/85 text-sm sm:text-base leading-relaxed font-manrope font-normal max-w-lg mb-8">
            The Student Welfare and Formation Office is an operating unit under the Office of Student Services (OSS) tasked with maintaining student discipline and facilitating holistic Lasallian formation.
          </p>

          {/* Institutional Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-medium text-white/90">Holistic Formation & Welfare</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-medium text-white/90">Campus Discipline & Patrol</span>
            </div>
          </div>
        </div>

        {/* Left Footer Information */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-white/60 font-manrope gap-2">
          <p>© 2026 De La Salle University - Dasmariñas</p>
          <p className="text-white/50 text-[11px]">Office of Student Services (OSS)</p>
        </div>
      </div>

      {/* =========================================================================
          RIGHT HALF (50% on Desktop): Clean Authentication Portal
          ========================================================================= */}
      <div className="relative w-full lg:w-1/2 bg-white flex flex-col justify-between items-center px-6 sm:px-12 lg:px-14 xl:px-16 py-8 sm:py-12 min-h-screen overflow-y-auto">
        
        {/* Mobile Header (Shown only on small screens where left pane collapses) */}
        <div className="lg:hidden w-full flex items-center justify-center gap-3 pt-2 pb-6 border-b border-gray-100">
          <img src={swafoLogo} alt="SWAFO" className="h-9 w-9 rounded-xl shadow-sm" />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">DLSU-D SWAFO</p>
            <p className="text-xs font-semibold text-gray-600">Student Welfare & Formation Office</p>
          </div>
        </div>

        {/* Center Authentication Card / Form Container */}
        <div className="w-full max-w-[420px] sm:max-w-[440px] my-auto py-6 flex flex-col justify-center">
          
          {/* Form Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center mb-4 shadow-sm">
              <img src={swafoLogo} alt="SWAFO Logo" className="h-10 w-10 rounded-xl object-cover" />
            </div>
            <h2 className="text-2xl sm:text-[1.85rem] font-extrabold text-gray-900 font-pjs tracking-tight">
              Sign In
            </h2>
            <p className="text-xs sm:text-[13px] text-gray-500 font-medium mt-1">
              {activeTab === 'admin' 
                ? 'Access your Director command center' 
                : activeTab === 'officer' 
                ? 'Sign in to administrative workstation' 
                : 'Access student welfare & policy portal'}
            </p>
          </div>

          {/* Segmented Role Switcher Tabs */}
          <div className="relative flex rounded-xl p-1 bg-gray-100 mb-6 border border-gray-200/80 shadow-inner">
            <div 
              className={`absolute inset-y-1 w-[calc(33.33%-4px)] bg-white rounded-lg shadow-sm border border-gray-200/80 transition-transform duration-300 ease-out ${
                activeTab === 'officer' ? 'translate-x-[100%]' : activeTab === 'student' ? 'translate-x-[200%]' : 'translate-x-0'
              }`}
            />
            <button
              type="button"
              className={`relative z-10 flex-1 py-2 text-xs sm:text-[13px] font-bold transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'admin' ? 'text-gray-950 font-extrabold' : 'text-gray-500 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('admin')}
            >
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              className={`relative z-10 flex-1 py-2 text-xs sm:text-[13px] font-bold transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'officer' ? 'text-gray-950 font-extrabold' : 'text-gray-500 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('officer')}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>Officer</span>
            </button>
            <button
              type="button"
              className={`relative z-10 flex-1 py-2 text-xs sm:text-[13px] font-bold transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'student' ? 'text-gray-950 font-extrabold' : 'text-gray-500 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('student')}
            >
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span>Student</span>
            </button>
          </div>

          {/* Tab Form Panels */}
          <div className="min-h-[280px]">
            {/* 1. ADMIN TAB */}
            {activeTab === 'admin' && (
              <form 
                className="flex flex-col space-y-4 animate-in fade-in duration-300" 
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate('/admin/dashboard');
                }}
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
                    Director Email
                  </label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <ShieldCheck className="h-5 w-5 text-gray-400 group-focus-within:text-[#003624] transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/70 py-3 sm:py-3.5 pl-11 pr-4 text-gray-900 focus:bg-white focus:border-[#003624] focus:ring-2 focus:ring-[#003624]/20 transition-all text-xs sm:text-[14px] font-medium outline-none" 
                      placeholder="Director Account" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
                    Master Password
                  </label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#003624] transition-colors" />
                    </div>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/70 py-3 sm:py-3.5 pl-11 pr-4 text-gray-900 focus:bg-white focus:border-[#003624] focus:ring-2 focus:ring-[#003624]/20 transition-all text-xs sm:text-[14px] font-medium outline-none" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="group relative flex w-full items-center justify-center rounded-xl bg-[#003624] px-4 py-3 sm:py-3.5 text-xs sm:text-[14px] font-bold text-white shadow-md shadow-[#003624]/20 hover:bg-[#004730] hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.99]"
                >
                  <span>Access Director Portal</span>
                  <ArrowRight className="absolute right-4 h-4 w-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                <div className="relative pt-2">
                  <div className="absolute inset-0 flex items-center h-px bg-gray-200" />
                  <span className="relative z-10 bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mx-auto block text-center">
                    DIRECTOR ACCESS (DEMO)
                  </span>
                </div>

                <DirectorQuickLogin />
              </form>
            )}

            {/* 2. OFFICER TAB */}
            {activeTab === 'officer' && (
              <form 
                className="flex flex-col space-y-4 animate-in fade-in duration-300" 
                onSubmit={handleOfficerSubmit}
              >
                {officerError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                    {officerError}
                  </div>
                )}

                {/* ID / School Email Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
                    ID / School Email Address
                  </label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <User className="h-5 w-5 text-gray-400 group-focus-within:text-[#003624] transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={officerEmail || ""}
                      onChange={(e) => setOfficerEmail(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/70 py-3 sm:py-3.5 pl-11 pr-4 text-gray-900 focus:bg-white focus:border-[#003624] focus:ring-2 focus:ring-[#003624]/20 transition-all text-xs sm:text-[14px] font-medium outline-none"
                      placeholder="e.g. officer1@dlsud.edu.ph"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                      Password
                    </label>
                    <span className="text-[10px] font-semibold text-gray-400">
                      Default: SwafoOfficer2026
                    </span>
                  </div>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#003624] transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={officerPassword || ""}
                      onChange={(e) => setOfficerPassword(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/70 py-3 sm:py-3.5 pl-11 pr-11 text-gray-900 focus:bg-white focus:border-[#003624] focus:ring-2 focus:ring-[#003624]/20 transition-all text-xs sm:text-[14px] font-medium outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 outline-none cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-700 transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-700 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={officerLoggingIn}
                  className="group relative flex w-full items-center justify-center rounded-xl bg-[#003624] px-4 py-3 sm:py-3.5 text-xs sm:text-[14px] font-bold text-white shadow-md shadow-[#003624]/20 hover:bg-[#004730] hover:shadow-lg active:scale-[0.99] transition-all duration-200 outline-none focus:ring-4 focus:ring-[#003624]/20 disabled:opacity-60 cursor-pointer"
                >
                  {officerLoggingIn ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    <>
                      <span>Sign In to Station</span>
                      <ArrowRight className="absolute right-4 h-4 w-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </>
                  )}
                </button>

                <div className="relative pt-2">
                  <div className="absolute inset-0 flex items-center h-px bg-gray-200" />
                  <span className="relative z-10 bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mx-auto block text-center">
                    QUICK ACCESS (SELECT OFFICER)
                  </span>
                </div>

                <OfficerQuickLogin />
              </form>
            )}

            {/* 3. STUDENT TAB */}
            {activeTab === 'student' && (
              <div className="flex flex-col space-y-4 sm:space-y-5 text-center animate-in fade-in duration-300 pt-1">
                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  className="group flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-xs sm:text-[14px] font-bold text-gray-800 shadow-sm hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <div className="grid grid-cols-2 gap-[2px] w-[18px] h-[18px] shrink-0">
                    <div className="bg-[#f25022]" />
                    <div className="bg-[#7fba00]" />
                    <div className="bg-[#00a4ef]" />
                    <div className="bg-[#ffb900]" />
                  </div>
                  <span>Continue with Microsoft (DLSU-D 365)</span>
                </button>

                <div className="relative pt-1">
                  <div className="absolute inset-0 flex items-center h-px bg-gray-200" />
                  <span className="relative z-10 bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    DEVELOPER ACCESS (DEMO MODE)
                  </span>
                </div>

                <MockLoginSection />

                <div className="rounded-xl bg-emerald-50/70 p-4 border border-emerald-100/90 text-left">
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-emerald-900 leading-relaxed">
                      Students are required to use their official DLSU-D Microsoft 365 organization account (<span className="font-bold">@dlsud.edu.ph</span>) to access the SWAFO portal.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Footer Links */}
        <div className="w-full pt-6 pb-2 border-t border-gray-100 flex items-center justify-center space-x-6 text-center text-[11px] font-bold tracking-wider uppercase text-gray-400">
          <a href="#" className="hover:text-gray-700 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-700 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-700 transition-colors">Help Desk</a>
        </div>
      </div>

    </div>
  );
}

function DirectorQuickLogin() {
  const { loginAsAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <button 
      type="button"
      onClick={async () => {
        await loginAsAdmin("Director Ruel Elias", "admin@dlsud.edu.ph");
        navigate('/admin/dashboard');
      }}
      className="w-full px-4 py-3 bg-[#003624] border border-[#002619] rounded-xl text-xs sm:text-[13px] font-pjs font-bold text-white flex items-center justify-between hover:bg-[#004730] transition-all shadow-sm cursor-pointer"
    >
      <span>Login as Director (Admin)</span>
      <ShieldCheck size={16} className="text-emerald-300 shrink-0" />
    </button>
  );
}

function MockLoginSection() {
  const [students, setStudents] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const { loginAsMock } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(API_ENDPOINTS.USERS_LIST)
      .then(res => res.json())
      .then(data => setStudents(Array.isArray(data) ? data : (data.results || [])))
      .catch(err => console.error("Error fetching students:", err));
  }, []);

  return (
    <div className="relative text-left">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-emerald-50/80 border border-emerald-200/60 rounded-xl text-xs sm:text-[13px] font-pjs font-bold text-[#003624] flex items-center justify-between hover:bg-emerald-100/70 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2.5 truncate">
          <GraduationCap size={16} className="shrink-0 text-emerald-700" />
          <span className="truncate">Select Mock Student (Demo Mode)...</span>
        </div>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[240px] overflow-y-auto divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-150">
          {students.length > 0 ? students.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={async () => {
                await loginAsMock(s);
                navigate('/student/dashboard');
              }}
              className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors group cursor-pointer"
            >
              <p className="text-[13px] font-pjs font-bold text-gray-900 leading-none mb-1 group-hover:text-[#003624]">
                {s.user_details.full_name}
              </p>
              <p className="text-[11px] font-manrope font-semibold text-gray-400">
                {s.course} • <span className="text-[#003624]">{s.student_number}</span>
              </p>
            </button>
          )) : (
            <div className="p-4 text-center text-[12px] font-manrope text-gray-400 italic">
              Fetching student identities...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OfficerQuickLogin() {
  const [isOpen, setIsOpen] = useState(false);
  const { loginAsOfficer } = useAuth();
  const navigate = useNavigate();

  const patrolOfficers = [
    { name: "Erica Aclag", email: "erica.aclag@dlsud.edu.ph", roleBadge: "Patrol Officer" },
    { name: "Rex Ceballos", email: "rex.ceballos@dlsud.edu.ph", roleBadge: "Patrol Officer" },
    { name: "Juan Miguel Diamante", email: "juanmiguel.diamante@dlsud.edu.ph", roleBadge: "Patrol Officer" },
    { name: "Ervin Doroteo", email: "ervin.doroteo@dlsud.edu.ph", roleBadge: "Patrol Officer" },
    { name: "Michael Nicart", email: "michael.nicart@dlsud.edu.ph", roleBadge: "Patrol Officer" },
    { name: "Mhycel Omaña", email: "mhycel.omana@dlsud.edu.ph", roleBadge: "Patrol Officer" },
    { name: "Loren Peñano", email: "loren.penano@dlsud.edu.ph", roleBadge: "Patrol Officer" },
    { name: "Rainger Dela Cruz", email: "rainger.delacruz@dlsud.edu.ph", roleBadge: "Patrol Officer" }
  ];

  const staffOfficers = [
    { name: "Officer Timothy", email: "officer@dlsud.edu.ph", roleBadge: "Staff Officer" },
    { name: "Officer Timothy De Guzman", email: "officer1@dlsud.edu.ph", roleBadge: "Staff Officer" },
    { name: "Officer Maria Santos", email: "officer2@dlsud.edu.ph", roleBadge: "Staff Officer" },
    { name: "Officer Ricardo Reyes", email: "officer3@dlsud.edu.ph", roleBadge: "Staff Officer" },
    { name: "Officer Elena Garcia", email: "officer4@dlsud.edu.ph", roleBadge: "Staff Officer" },
    { name: "Officer Julian Cruz", email: "officer5@dlsud.edu.ph", roleBadge: "Staff Officer" },
    { name: "Officer Sofia Villanueva", email: "officer6@dlsud.edu.ph", roleBadge: "Staff Officer" },
    { name: "Officer Mateo Ramos", email: "officer7@dlsud.edu.ph", roleBadge: "Staff Officer" },
    { name: "Officer Isabella Luna", email: "officer8@dlsud.edu.ph", roleBadge: "Staff Officer" },
    { name: "Officer Gabriel Castro", email: "officer9@dlsud.edu.ph", roleBadge: "Staff Officer" },
    { name: "Officer Beatrice Mendoza", email: "officer10@dlsud.edu.ph", roleBadge: "Staff Officer" }
  ];

  return (
    <div className="relative text-left">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-emerald-50/80 border border-emerald-200/60 rounded-xl text-xs sm:text-[13px] font-pjs font-bold text-[#003624] flex items-center justify-between hover:bg-emerald-100/70 transition-all cursor-pointer"
      >
        <span className="truncate">Select Officer Account...</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 divide-y divide-gray-100">
          <div className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 sticky top-0 border-b border-gray-200">
            Designated Patrol Officers (Active Roster)
          </div>
          {patrolOfficers.map((off, i) => (
            <button
              key={'patrol-' + i}
              type="button"
              onClick={async () => {
                await loginAsOfficer(off.name, off.email);
                navigate('/officer/dashboard');
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-[13px] font-pjs font-bold text-gray-900 leading-none mb-1 group-hover:text-[#003624]">{off.name}</p>
                <p className="text-[10px] font-manrope font-semibold text-gray-400">{off.email}</p>
              </div>
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Patrol
              </span>
            </button>
          ))}

          <div className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 sticky top-0 border-b border-gray-200">
            Station & Security Staff Officers
          </div>
          {staffOfficers.map((off, i) => (
            <button
              key={'staff-' + i}
              type="button"
              onClick={async () => {
                await loginAsOfficer(off.name, off.email);
                navigate('/officer/dashboard');
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-[13px] font-pjs font-bold text-gray-900 leading-none mb-1 group-hover:text-[#003624]">{off.name}</p>
                <p className="text-[10px] font-manrope font-semibold text-gray-400">{off.email}</p>
              </div>
              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Staff
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
