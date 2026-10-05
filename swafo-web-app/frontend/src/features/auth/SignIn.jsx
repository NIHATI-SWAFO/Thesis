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
    // This navigates the ENTIRE browser to Microsoft — no popups, no problems
    instance.loginRedirect(loginRequest);
  };
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center px-4 sm:px-8 lg:px-24 py-6 sm:py-10 font-sans text-gray-900 selection:bg-[#a5d6a7] selection:text-[#0b2918] overflow-y-auto">
      {/* Background & Overlays */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${signinBg})` }}
      />
      <div className="fixed inset-0 bg-[#0c2f1f]/85 mix-blend-multiply" />
      <div className="fixed inset-0 bg-[#061d12]/60" /> 
      
      {/* Top Logo - Desktop only to prevent overlapping on mobile screens */}
      <div className="hidden lg:flex absolute top-12 left-8 lg:left-24 items-center space-x-4 z-20">
        <div className="bg-white/10 p-1.5 rounded-full backdrop-blur-md border border-white/20">
          <img src={swafoLogo} alt="SWAFO" className="h-10 w-10 rounded-full" />
        </div>
        <span className="font-semibold text-lg tracking-wide text-white/95 drop-shadow-md">Student Welfare and Formation Office</span>
      </div>

      {/* Main Content Area: Left Hero + Right Card */}
      <div className="w-full max-w-[1400px] flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 my-auto relative z-10 pt-2 pb-2">
        {/* Left Text Content (Desktop) */}
        <div className="hidden lg:flex flex-col max-w-[600px] mt-8">
          <h1 className="text-[5.5rem] font-bold tracking-tighter mb-8 leading-[0.95] text-white drop-shadow-xl">
            Curing Campus<br />
            <span className="text-[#a1dbba]">Integrity.</span>
          </h1>
          
          <p className="text-[1.15rem] text-white/85 mb-10 leading-[1.8] max-w-[520px] font-medium drop-shadow-md">
            The Student Welfare and Formation Office is a unit under the Office of Student Services (OSS) tasked with maintaining student discipline and facilitating holistic formation.
          </p>
          
          <div className="inline-flex items-center rounded-md bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/20 shadow-2xl self-start">
            <ShieldCheck className="mr-3 h-[18px] w-[18px] text-[#a1dbba]" />
            <span className="text-[11px] font-bold tracking-[0.1em] text-white/90 uppercase">Secure Academic Environment</span>
          </div>
        </div>

        {/* Right Interaction Pane (Glass Card) */}
        <div className="w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[520px] flex flex-col rounded-3xl sm:rounded-[2rem] bg-white/95 p-5 sm:p-8 lg:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/60 mx-auto">
          <div className="flex-1 flex flex-col justify-center w-full">
              
              {/* Form Header */}
              <div className="flex flex-col items-center mb-5 sm:mb-6 text-center">
                <div className="relative mb-3 sm:mb-4">
                  <div className="absolute inset-0 rounded-full blur-[20px] bg-[#14422c]/10" />
                  <img src={swafoLogo} alt="SWAFO Logo" className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-sm border border-gray-100" />
                </div>
                <h2 className="text-2xl sm:text-[2rem] font-extrabold text-[#111827] mb-1 tracking-tight">Sign In</h2>
                <p className="text-xs sm:text-[13px] text-gray-500 font-medium">
                  Access your {activeTab === 'admin' ? 'Director command center' : activeTab === 'officer' ? 'administrative workstation' : 'student portal'}
                </p>
              </div>

              {/* Premium Apple-Style Segmented Control */}
              <div className="relative flex rounded-xl p-1 bg-[#f2f4f6] mb-5 sm:mb-6 border border-[#e5e7eb] shadow-inner">
                {/* Highlight Slider */}
                <div 
                  className={`absolute inset-y-1 w-[calc(33.33%-4px)] bg-white rounded-lg shadow-sm border border-gray-200/80 transition-transform duration-300 ease-out ${
                    activeTab === 'officer' ? 'translate-x-[100%]' : activeTab === 'student' ? 'translate-x-[200%]' : 'translate-x-0'
                  }`}
                />
                <button
                  className={`relative z-10 flex-1 py-1.5 sm:py-2 text-xs sm:text-[14px] font-bold transition-colors duration-200 cursor-pointer ${
                    activeTab === 'admin' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('admin')}
                >
                  Admin
                </button>
                <button
                  className={`relative z-10 flex-1 py-1.5 sm:py-2 text-xs sm:text-[14px] font-bold transition-colors duration-200 cursor-pointer ${
                    activeTab === 'officer' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('officer')}
                >
                  Officer
                </button>
                <button
                  className={`relative z-10 flex-1 py-1.5 sm:py-2 text-xs sm:text-[14px] font-bold transition-colors duration-200 cursor-pointer ${
                    activeTab === 'student' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('student')}
                >
                  Student
                </button>
              </div>

              {/* Forms Container */}
              <div className="min-h-[260px] sm:min-h-[280px]">
                {activeTab === 'admin' ? (
                  <form className="flex flex-col space-y-3.5 sm:space-y-4 animate-in fade-in duration-300" onSubmit={(e) => {
                    e.preventDefault();
                    navigate('/admin/dashboard');
                  }}>
                    <div className="space-y-1">
                      <label className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Director Email</label>
                      <div className="relative group">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 sm:pl-4">
                          <ShieldCheck className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px] text-gray-400 group-focus-within:text-[#113a26] transition-colors" />
                        </div>
                        <input type="text" className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-3 sm:py-3.5 pl-11 sm:pl-[3.25rem] pr-4 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#113a26] hover:bg-[#eef0f2] focus:hover:bg-white transition-all text-xs sm:text-[15px] font-medium" placeholder="Director Account" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Master Password</label>
                      <div className="relative group">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 sm:pl-4">
                          <Lock className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px] text-gray-400 group-focus-within:text-[#113a26] transition-colors" />
                        </div>
                        <input type="password" placeholder="••••••••" className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-3 sm:py-3.5 pl-11 sm:pl-[3.25rem] pr-4 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#113a26] hover:bg-[#eef0f2] focus:hover:bg-white transition-all text-xs sm:text-[15px] font-medium" />
                      </div>
                    </div>
                    <button type="submit" className="group relative flex w-full items-center justify-center rounded-xl bg-[#0f3422] px-4 py-3 sm:py-3.5 text-xs sm:text-[15px] font-bold text-white shadow-lg shadow-[#0f3422]/20 hover:bg-[#15462e] transition-all duration-200 cursor-pointer">
                      <span>Access Director Portal</span>
                      <ArrowRight className="absolute right-5 h-4 w-4 sm:h-5 sm:w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                    <div className="relative pt-2">
                      <div className="absolute inset-0 flex items-center h-px bg-gray-100" />
                      <span className="relative z-10 bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">DIRECTOR ACCESS (DEMO)</span>
                    </div>
                    <DirectorQuickLogin />
                  </form>
                ) : activeTab === 'officer' ? (
                  <form className="flex flex-col space-y-3.5 sm:space-y-4 animate-in fade-in duration-300" onSubmit={handleOfficerSubmit}>
                    {officerError && (
                      <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                        {officerError}
                      </div>
                    )}

                    {/* ID Input */}
                    <div className="space-y-1">
                      <label className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
                        ID / School Email Address
                      </label>
                      <div className="relative group">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 sm:pl-4">
                          <User className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px] text-gray-400 group-focus-within:text-[#113a26] transition-colors" />
                        </div>
                        <input
                          type="text"
                          value={officerEmail || ""}
                          onChange={(e) => setOfficerEmail(e.target.value)}
                          className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-3 sm:py-3.5 pl-11 sm:pl-[3.25rem] pr-4 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#113a26] hover:bg-[#eef0f2] focus:hover:bg-white transition-all text-xs sm:text-[15px] font-medium"
                          placeholder="EG: officer1@dlsud.edu.ph"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                          Password
                        </label>
                        <span className="text-[9px] sm:text-[10px] font-semibold text-gray-400">Default: SwafoOfficer2026</span>
                      </div>
                      <div className="relative group">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 sm:pl-4">
                          <Lock className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px] text-gray-400 group-focus-within:text-[#113a26] transition-colors" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={officerPassword || ""}
                          onChange={(e) => setOfficerPassword(e.target.value)}
                          className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-3 sm:py-3.5 pl-11 sm:pl-[3.25rem] pr-11 sm:pr-12 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#113a26] hover:bg-[#eef0f2] focus:hover:bg-white transition-all text-xs sm:text-[15px] font-medium placeholder:font-sans placeholder:font-normal placeholder:text-gray-400"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 sm:pr-4 outline-none cursor-pointer"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px] text-gray-400 hover:text-gray-700 transition-colors" />
                          ) : (
                            <Eye className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px] text-gray-400 hover:text-gray-700 transition-colors" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={officerLoggingIn}
                      className="group relative flex w-full items-center justify-center rounded-xl bg-[#0f3422] px-4 py-3 sm:py-3.5 text-xs sm:text-[15px] font-bold text-white shadow-lg shadow-[#0f3422]/20 hover:bg-[#15462e] hover:shadow-xl hover:shadow-[#0f3422]/30 active:scale-[0.99] transition-all duration-200 outline-none focus:ring-4 focus:ring-[#0f3422]/20 disabled:opacity-60 cursor-pointer"
                    >
                      {officerLoggingIn ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          Authenticating...
                        </span>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="absolute right-5 h-4 w-4 sm:h-5 sm:w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </>
                      )}
                    </button>

                    <div className="relative pt-2">
                      <div className="absolute inset-0 flex items-center h-px bg-gray-100" />
                      <span className="relative z-10 bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        QUICK ACCESS (SELECT OFFICER)
                      </span>
                    </div>

                    <OfficerQuickLogin />
                  </form>
                ) : (
                  <div className="flex flex-col space-y-4 sm:space-y-6 text-center animate-in fade-in duration-500 pt-1">
                    <button
                      type="button"
                      onClick={handleMicrosoftLogin}
                      className="group flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-xs sm:text-[15px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <div className="grid grid-cols-2 gap-[2px] w-[18px] h-[18px]">
                        <div className="bg-[#f25022]" />
                        <div className="bg-[#7fba00]" />
                        <div className="bg-[#00a4ef]" />
                        <div className="bg-[#ffb900]" />
                      </div>
                      Continue with Microsoft
                    </button>

                    <div className="relative pt-2 sm:pt-4">
                      <div className="absolute inset-0 flex items-center h-px bg-gray-100" />
                      <span className="relative z-10 bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        OR DEVELOPER ACCESS
                      </span>
                    </div>

                    <MockLoginSection />

                    <div className="rounded-xl bg-blue-50/60 p-3.5 sm:p-5 border border-blue-100/80">
                      <p className="text-xs sm:text-[13px] font-semibold text-blue-800 leading-relaxed">
                        Students are required to use their official DLSU-D Microsoft 365 organization account to access the SWAFO portal.
                      </p>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Footer in natural flow */}
      <div className="relative z-10 mt-6 sm:mt-8 pb-2 flex items-center justify-center space-x-6 sm:space-x-8 text-center shrink-0">
        <a href="#" className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-white/70 hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-white/70 hover:text-white transition-colors">Terms of Service</a>
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
      className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-[#0f3422] border border-emerald-900 rounded-xl text-xs sm:text-[14px] font-pjs font-bold text-white flex items-center justify-between hover:bg-[#15462e] transition-all"
    >
      <span>Login as Director (Admin)</span>
      <ShieldCheck size={17} className="text-[#a1dbba] shrink-0" />
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
        className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-emerald-50 border border-emerald-100/50 rounded-xl text-xs sm:text-[14px] font-pjs font-bold text-[#0f3422] flex items-center justify-between hover:bg-emerald-100 transition-all"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 truncate">
          <span className="material-symbols-outlined text-[17px] sm:text-[18px] shrink-0">person_add</span>
          <span className="truncate">Select Mock Student (Demo Mode)...</span>
        </div>
        <ChevronDown size={17} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-[240px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {students.length > 0 ? students.map((s) => (
            <button
              key={s.id}
              onClick={async () => {
                await loginAsMock(s);
                navigate('/student/dashboard');
              }}
              className="w-full text-left px-5 py-4 border-b border-gray-50 hover:bg-emerald-50 transition-colors group"
            >
              <p className="text-[14px] font-pjs font-bold text-gray-900 leading-none mb-1">{s.user_details.full_name}</p>
              <p className="text-[11px] font-manrope font-semibold text-gray-400">
                {s.course} • <span className="text-[#0f3422]/60">{s.student_number}</span>
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
        className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-emerald-50 border border-emerald-100/50 rounded-xl text-xs sm:text-[14px] font-pjs font-bold text-[#0f3422] flex items-center justify-between hover:bg-emerald-100 transition-all"
      >
        <span className="truncate">Select Officer Account...</span>
        <ChevronDown size={17} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 divide-y divide-gray-50">
          <div className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
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
              className="w-full text-left px-5 py-3 hover:bg-emerald-50 transition-colors flex items-center justify-between group"
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

          <div className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
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
              className="w-full text-left px-5 py-3 hover:bg-emerald-50 transition-colors flex items-center justify-between group"
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
