import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../lib/authConfig";
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from "../../api/config";
import { ShieldCheck, User, Lock, Eye, EyeOff, ArrowRight, Loader2, ChevronDown } from 'lucide-react';
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
    // Navigates the browser to Microsoft Azure SSO
    instance.loginRedirect(loginRequest);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center lg:justify-between px-6 sm:px-12 lg:px-20 xl:px-28 py-12 lg:py-0 font-sans text-gray-900 selection:bg-[#a5d6a7] selection:text-[#0b2918] overflow-y-auto">
      {/* Background & Overlays */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${signinBg})` }}
      />
      <div className="fixed inset-0 bg-[#0c2f1f]/85 mix-blend-multiply pointer-events-none" />
      <div className="fixed inset-0 bg-[#061d12]/60 pointer-events-none" /> 
      
      {/* Top Logo - Fixed at top-left across the screen */}
      <div className="absolute top-8 sm:top-12 left-6 sm:left-12 lg:left-20 xl:left-28 flex items-center space-x-3 sm:space-x-4 z-20">
        <div className="bg-white/10 p-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg">
          <img src={swafoLogo} alt="SWAFO" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover" />
        </div>
        <span className="font-semibold text-sm sm:text-lg tracking-wide text-white/95 drop-shadow-md">
          Student Welfare and Formation Office
        </span>
      </div>

      {/* Left Text Content - Pushed to the far left side */}
      <div className="relative z-10 hidden lg:flex flex-col max-w-[580px] xl:max-w-[640px] mt-16 pr-8">
        <h1 className="text-[4.5rem] xl:text-[5.5rem] font-bold tracking-tighter mb-8 leading-[0.95] text-white drop-shadow-xl font-pjs">
          Curing Campus<br />
          <span className="text-[#a1dbba]">Integrity.</span>
        </h1>
        
        <p className="text-[1.1rem] xl:text-[1.15rem] text-white/85 mb-10 leading-[1.8] max-w-[520px] font-medium drop-shadow-md font-manrope">
          The Student Welfare and Formation Office is a unit under the Office of Student Services (OSS) tasked with maintaining student discipline and facilitating holistic formation.
        </p>
        
        <div className="inline-flex items-center rounded-md bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/20 shadow-2xl self-start">
          <ShieldCheck className="mr-3 h-[18px] w-[18px] text-[#a1dbba]" />
          <span className="text-[11px] font-bold tracking-[0.1em] text-white/90 uppercase">Secure Academic Environment</span>
        </div>
      </div>

      {/* Right Interaction Pane (Glass Card) - Pushed to the far right side */}
      <div className="relative z-10 flex w-full max-w-[480px] lg:max-w-[540px] xl:max-w-[580px] flex-col rounded-[2rem] bg-white/95 px-6 sm:px-10 lg:px-12 py-8 lg:py-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/60 my-auto mt-24 lg:mt-auto">
        <div className="flex-1 flex flex-col justify-center mx-auto w-full">
            
            {/* Form Header */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full blur-[20px] bg-[#14422c]/10" />
                <img src={swafoLogo} alt="SWAFO Logo" className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-sm border border-gray-100 object-cover" />
              </div>
              <h2 className="text-2xl sm:text-[2rem] font-extrabold text-[#111827] mb-1 tracking-tight font-pjs">Sign In</h2>
              <p className="text-xs sm:text-[13px] text-gray-500 font-medium font-manrope">
                Access your {activeTab === 'admin' ? 'Director command center' : activeTab === 'officer' ? 'administrative workstation' : 'student portal'}
              </p>
            </div>

            {/* Apple-Style Segmented Control */}
            <div className="relative flex rounded-xl p-[5px] bg-[#f2f4f6] mb-6 border border-[#e5e7eb] shadow-inner">
              {/* Highlight Slider */}
              <div 
                className={`absolute inset-y-[5px] w-[calc(33.33%-5px)] bg-white rounded-lg shadow-sm border border-gray-200/80 transition-transform duration-300 ease-out ${
                  activeTab === 'officer' ? 'translate-x-[100%]' : activeTab === 'student' ? 'translate-x-[200%]' : 'translate-x-0'
                }`}
              />
              <button
                type="button"
                className={`relative z-10 flex-1 py-2 text-xs sm:text-[14px] font-bold transition-colors duration-200 cursor-pointer ${
                  activeTab === 'admin' ? 'text-gray-900 font-extrabold' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('admin')}
              >
                Admin
              </button>
              <button
                type="button"
                className={`relative z-10 flex-1 py-2 text-xs sm:text-[14px] font-bold transition-colors duration-200 cursor-pointer ${
                  activeTab === 'officer' ? 'text-gray-900 font-extrabold' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('officer')}
              >
                Officer
              </button>
              <button
                type="button"
                className={`relative z-10 flex-1 py-2 text-xs sm:text-[14px] font-bold transition-colors duration-200 cursor-pointer ${
                  activeTab === 'student' ? 'text-gray-900 font-extrabold' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('student')}
              >
                Student
              </button>
            </div>

            {/* Forms Container */}
            <div className="min-h-[280px]">
              {/* 1. ADMIN TAB */}
              {activeTab === 'admin' ? (
                <form className="flex flex-col space-y-4 animate-in fade-in duration-300" onSubmit={(e) => {
                  e.preventDefault();
                  navigate('/admin/dashboard');
                }}>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
                      Director Email
                    </label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <ShieldCheck className="h-[20px] w-[20px] text-gray-400 group-focus-within:text-[#113a26] transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-3.5 pl-[3.25rem] pr-4 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#113a26] hover:bg-[#eef0f2] focus:hover:bg-white transition-all text-xs sm:text-[15px] font-medium outline-none" 
                        placeholder="Director Account" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
                      Master Password
                    </label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Lock className="h-[20px] w-[20px] text-gray-400 group-focus-within:text-[#113a26] transition-colors" />
                      </div>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-3.5 pl-[3.25rem] pr-4 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#113a26] hover:bg-[#eef0f2] focus:hover:bg-white transition-all text-xs sm:text-[15px] font-medium outline-none" 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="group relative flex w-full items-center justify-center rounded-xl bg-[#0f3422] px-4 py-3.5 text-xs sm:text-[15px] font-bold text-white shadow-lg shadow-[#0f3422]/20 hover:bg-[#15462e] transition-all duration-200 cursor-pointer active:scale-[0.99]"
                  >
                    <span>Access Director Portal</span>
                    <ArrowRight className="absolute right-6 h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>

                  <div className="relative pt-2">
                    <div className="absolute inset-0 flex items-center h-px bg-gray-100" />
                    <span className="relative z-10 bg-white px-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-400 mx-auto block text-center">
                      DIRECTOR ACCESS (DEMO)
                    </span>
                  </div>

                  <DirectorQuickLogin />
                </form>
              ) : activeTab === 'officer' ? (
                /* 2. OFFICER TAB */
                <form className="flex flex-col space-y-4 animate-in fade-in duration-300" onSubmit={handleOfficerSubmit}>
                  {officerError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                      {officerError}
                    </div>
                  )}

                  {/* ID Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
                      ID / School Email Address
                    </label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <User className="h-[20px] w-[20px] text-gray-400 group-focus-within:text-[#113a26] transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={officerEmail || ""}
                        onChange={(e) => setOfficerEmail(e.target.value)}
                        className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-3.5 pl-[3.25rem] pr-4 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#113a26] hover:bg-[#eef0f2] focus:hover:bg-white transition-all text-xs sm:text-[15px] font-medium outline-none"
                        placeholder="EG: officer1@dlsud.edu.ph"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                        Password
                      </label>
                      <span className="text-[10px] font-semibold text-gray-400">Default: SwafoOfficer2026</span>
                    </div>
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Lock className="h-[20px] w-[20px] text-gray-400 group-focus-within:text-[#113a26] transition-colors" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={officerPassword || ""}
                        onChange={(e) => setOfficerPassword(e.target.value)}
                        className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-3.5 pl-[3.25rem] pr-12 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#113a26] hover:bg-[#eef0f2] focus:hover:bg-white transition-all text-xs sm:text-[15px] font-medium placeholder:font-sans placeholder:font-normal placeholder:text-gray-400 outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-4 outline-none cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-[20px] w-[20px] text-gray-400 hover:text-gray-700 transition-colors" />
                        ) : (
                          <Eye className="h-[20px] w-[20px] text-gray-400 hover:text-gray-700 transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={officerLoggingIn}
                    className="group relative flex w-full items-center justify-center rounded-xl bg-[#0f3422] px-4 py-3.5 text-xs sm:text-[15px] font-bold text-white shadow-lg shadow-[#0f3422]/20 hover:bg-[#15462e] hover:shadow-xl hover:shadow-[#0f3422]/30 active:scale-[0.99] transition-all duration-200 outline-none focus:ring-4 focus:ring-[#0f3422]/20 disabled:opacity-60 cursor-pointer"
                  >
                    {officerLoggingIn ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Authenticating...
                      </span>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="absolute right-6 h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </>
                    )}
                  </button>

                  <div className="relative pt-2">
                    <div className="absolute inset-0 flex items-center h-px bg-gray-100" />
                    <span className="relative z-10 bg-white px-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-400 mx-auto block text-center">
                      QUICK ACCESS (SELECT OFFICER)
                    </span>
                  </div>

                  <OfficerQuickLogin />
                </form>
              ) : (
                /* 3. STUDENT TAB */
                <div className="flex flex-col space-y-5 text-center animate-in fade-in duration-500 pt-2">
                  <button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    className="group flex w-full items-center justify-center gap-3.5 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-xs sm:text-[15px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <div className="grid grid-cols-2 gap-[2px] w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]">
                      <div className="bg-[#f25022]" />
                      <div className="bg-[#7fba00]" />
                      <div className="bg-[#00a4ef]" />
                      <div className="bg-[#ffb900]" />
                    </div>
                    <span>Continue with Microsoft</span>
                  </button>

                  <div className="relative pt-3 sm:pt-4">
                    <div className="absolute inset-0 flex items-center h-px bg-gray-100" />
                    <span className="relative z-10 bg-white px-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      OR DEVELOPER ACCESS
                    </span>
                  </div>

                  <MockLoginSection />

                  <div className="rounded-xl bg-blue-50/60 p-4 sm:p-5 border border-blue-100/80 text-left">
                    <p className="text-xs sm:text-[13px] font-semibold text-blue-800 leading-relaxed">
                      Students are required to use their official DLSU-D Microsoft 365 organization account to access the SWAFO portal.
                    </p>
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Footer - Positioned at bottom center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-8 z-10 text-center">
        <a href="#" className="text-[11px] font-extrabold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" className="text-[11px] font-extrabold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Terms of Service</a>
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
      className="w-full px-5 py-3.5 sm:py-4 bg-[#0f3422] border border-emerald-900 rounded-xl text-xs sm:text-[14px] font-pjs font-bold text-white flex items-center justify-between hover:bg-[#15462e] transition-all cursor-pointer shadow-sm"
    >
      <span>Login as Director (Admin)</span>
      <ShieldCheck size={18} className="text-[#a1dbba]" />
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
        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-emerald-50 border border-emerald-100/50 rounded-xl text-xs sm:text-[14px] font-pjs font-bold text-[#0f3422] flex items-center justify-between hover:bg-emerald-100 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3 truncate">
          <span className="material-symbols-outlined text-[18px] shrink-0">person_add</span>
          <span className="truncate">Select Mock Student (Demo Mode)...</span>
        </div>
        <ChevronDown size={18} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-[240px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {students.length > 0 ? students.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={async () => {
                await loginAsMock(s);
                navigate('/student/dashboard');
              }}
              className="w-full text-left px-5 py-3.5 border-b border-gray-50 hover:bg-emerald-50 transition-colors group cursor-pointer"
            >
              <p className="text-[14px] font-pjs font-bold text-gray-900 leading-none mb-1 group-hover:text-[#0f3422]">{s.user_details.full_name}</p>
              <p className="text-[11px] font-manrope font-semibold text-gray-400">
                {s.course} • <span className="text-[#0f3422]/70">{s.student_number}</span>
              </p>
            </button>
          )) : (
            <div className="p-4 text-center text-[12px] font-manrope text-gray-400 italic">Fetching student identities...</div>
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
        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-emerald-50 border border-emerald-100/50 rounded-xl text-xs sm:text-[14px] font-pjs font-bold text-[#0f3422] flex items-center justify-between hover:bg-emerald-100 transition-all cursor-pointer"
      >
        <span className="truncate">Select Officer Account...</span>
        <ChevronDown size={18} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 divide-y divide-gray-50">
          <div className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 sticky top-0 border-b border-gray-100">
            Designated Patrol Officers (Active Roster)
          </div>
          {patrolOfficers.map((off, i) => (
            <button
              key={'patrol-' + i}
              type="button"
              onClick={async () => {
                try {
                  await loginAsOfficer(off.name, off.email);
                  navigate('/officer/dashboard');
                } catch (err) {
                  console.warn("Officer login fallback navigation:", err);
                  navigate('/officer/dashboard');
                }
              }}
              className="w-full text-left px-5 py-3 hover:bg-emerald-50 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-[13px] font-pjs font-bold text-gray-900 leading-none mb-1 group-hover:text-[#003624]">{off.name}</p>
                <p className="text-[10px] font-manrope font-semibold text-gray-400">{off.email}</p>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                Patrol
              </span>
            </button>
          ))}

          <div className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 sticky top-0 border-b border-gray-100">
            Station & Security Staff Officers
          </div>
          {staffOfficers.map((off, i) => (
            <button
              key={'staff-' + i}
              type="button"
              onClick={async () => {
                try {
                  await loginAsOfficer(off.name, off.email);
                  navigate('/officer/dashboard');
                } catch (err) {
                  console.warn("Officer login fallback navigation:", err);
                  navigate('/officer/dashboard');
                }
              }}
              className="w-full text-left px-5 py-3 hover:bg-emerald-50 transition-colors flex items-center justify-between group cursor-pointer"
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
