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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('officer');
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="flex min-h-screen bg-white font-sans text-gray-900 selection:bg-[#a5d6a7] selection:text-[#0b2918]">
      {/* =====================================================================
          LEFT EXPERIential PANE
          ===================================================================== */}
      <div className="relative hidden w-[55%] lg:flex flex-col">
        {/* Absolute Background Image with Cover */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${signinBg})` }}
        />
        {/* Precision overlay to match the exact dark academic green of the target */}
        <div className="absolute inset-0 bg-[#0c2f1f]/85 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[#061d12]/40" /> 
        
        {/* Top Absolute Logo Area */}
        <div className="absolute top-12 left-16 flex items-center space-x-4 z-10">
          <div className="bg-white/10 p-1.5 rounded-full backdrop-blur-md border border-white/20">
            <img src={swafoLogo} alt="SWAFO" className="h-10 w-10 rounded-full" />
          </div>
          <span className="font-semibold text-lg tracking-wide text-white/95">Student Welfare and Formation Office</span>
        </div>

        {/* Centered Content Block */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-16 xl:px-24">
          <div className="max-w-[600px] -mt-12">
            <h1 className="text-[5.5rem] font-bold tracking-tighter mb-8 leading-[0.95] text-white">
              Curing Campus<br />
              <span className="text-[#a1dbba]">Integrity.</span>
            </h1>
            
            <p className="text-[1.15rem] text-white/75 mb-10 leading-[1.8] max-w-[520px] font-medium">
              The Student Welfare and Formation Office is a unit under the Office of Student Services (OSS) tasked with maintaining student discipline and facilitating holistic formation.
            </p>
            
            <div className="inline-flex items-center rounded-md bg-white/5 px-4 py-2.5 backdrop-blur-md border border-white/10 shadow-2xl">
              <ShieldCheck className="mr-3 h-[18px] w-[18px] text-[#a1dbba]" />
              <span className="text-[11px] font-bold tracking-[0.1em] text-white/90 uppercase">Secure Academic Environment</span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          RIGHT INTERACTION PANE
          ===================================================================== */}
      <div className="flex w-full flex-col justify-between px-8 py-10 lg:w-[45%] lg:px-12 xl:px-0 relative">
        <div className="flex-1 flex flex-col justify-center max-w-[440px] mx-auto w-full pt-4">
            
            {/* Form Header */}
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full blur-[20px] bg-[#14422c]/10" />
                <img src={swafoLogo} alt="SWAFO Logo" className="relative w-[90px] h-[90px] rounded-full shadow-sm border border-gray-100" />
              </div>
              <h2 className="text-[2.25rem] font-extrabold text-[#111827] mb-2 tracking-tight">Sign In</h2>
              <p className="text-base text-gray-500 font-medium">
                Access your {activeTab === 'admin' ? 'Director command center' : activeTab === 'officer' ? 'administrative workstation' : 'student portal'}
              </p>
            </div>

            {/* Premium Apple-Style Segmented Control */}
            <div className="relative flex rounded-xl p-[5px] bg-[#f2f4f6] mb-10 border border-[#e5e7eb] shadow-inner">
              {/* Highlight Slider */}
              <div 
                className={`absolute inset-y-[5px] w-[calc(33.33%-5px)] bg-white rounded-lg shadow-sm border border-gray-200/80 transition-transform duration-300 ease-out ${
                  activeTab === 'officer' ? 'translate-x-[100%]' : activeTab === 'student' ? 'translate-x-[200%]' : 'translate-x-0'
                }`}
              />
              <button
                className={`relative z-10 flex-1 py-2.5 text-[14px] font-bold transition-colors duration-200 ${
                  activeTab === 'admin' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('admin')}
              >
                Admin
              </button>
              <button
                className={`relative z-10 flex-1 py-2.5 text-[14px] font-bold transition-colors duration-200 ${
                  activeTab === 'officer' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('officer')}
              >
                Officer
              </button>
              <button
                className={`relative z-10 flex-1 py-2.5 text-[14px] font-bold transition-colors duration-200 ${
                  activeTab === 'student' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('student')}
              >
                Student
              </button>
            </div>

            {/* Forms Container */}
            <div className="min-h-[320px]">
              {activeTab === 'admin' ? (
                <form className="flex flex-col space-y-6 animate-in fade-in duration-300" onSubmit={(e) => {
                  e.preventDefault();
                  navigate('/admin/dashboard');
                }}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Director Email</label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <ShieldCheck className="h-[20px] w-[20px] text-gray-400 group-focus-within:text-[#113a26] transition-colors" />
                      </div>
                      <input type="text" className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-4 pl-[3.25rem] pr-4 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#113a26] hover:bg-[#eef0f2] focus:hover:bg-white transition-all text-[15px] font-medium" placeholder="Director Account" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Master Password</label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Lock className="h-[20px] w-[20px] text-gray-400 group-focus-within:text-[#113a26] transition-colors" />
                      </div>
                      <input type="password" placeholder="••••••••" className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-4 pl-[3.25rem] pr-4 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#113a26] hover:bg-[#eef0f2] focus:hover:bg-white transition-all text-[15px] font-medium" />
                    </div>
                  </div>
                  <button type="submit" className="group relative flex w-full items-center justify-center rounded-xl bg-[#0f3422] px-4 py-4 text-[15px] font-bold text-white shadow-lg shadow-[#0f3422]/20 hover:bg-[#15462e] transition-all duration-200">
                    <span>Access Director Portal</span>
                    <ArrowRight className="absolute right-6 h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                  <div className="relative pt-2">
                    <div className="absolute inset-0 flex items-center h-px bg-gray-100" />
                    <span className="relative z-10 bg-white px-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">DIRECTOR ACCESS (DEMO)</span>
                  </div>
                  <DirectorQuickLogin />
                </form>
              ) : activeTab === 'officer' ? (
                <form className="flex flex-col space-y-6 animate-in fade-in duration-300" onSubmit={(e) => {
                  e.preventDefault();
                  navigate('/officer/dashboard');
                }}>
                  {/* ID Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
                      ID / School Email Address
                    </label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <User className="h-[20px] w-[20px] text-gray-400 group-focus-within:text-[#113a26] transition-colors" />
                      </div>
                      <input
                        type="text"
                        className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-4 pl-[3.25rem] pr-4 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#113a26] hover:bg-[#eef0f2] focus:hover:bg-white transition-all text-[15px] font-medium"
                        placeholder="EG: dnr0291@dlsud.edu.ph"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Lock className="h-[20px] w-[20px] text-gray-400 group-focus-within:text-[#113a26] transition-colors" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-4 pl-[3.25rem] pr-12 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#113a26] hover:bg-[#eef0f2] focus:hover:bg-white transition-all text-[15px] font-medium placeholder:font-sans placeholder:font-normal placeholder:text-gray-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-4 outline-none"
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
                    className="group relative flex w-full items-center justify-center rounded-xl bg-[#0f3422] px-4 py-4 text-[15px] font-bold text-white shadow-lg shadow-[#0f3422]/20 hover:bg-[#15462e] hover:shadow-xl hover:shadow-[#0f3422]/30 active:scale-[0.99] transition-all duration-200 outline-none focus:ring-4 focus:ring-[#0f3422]/20"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="absolute right-6 h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>

                  <div className="relative pt-2">
                    <div className="absolute inset-0 flex items-center h-px bg-gray-100" />
                    <span className="relative z-10 bg-white px-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      QUICK ACCESS (DEMO)
                    </span>
                  </div>

                  <OfficerQuickLogin />
                </form>
              ) : (
                <div className="flex flex-col space-y-6 text-center animate-in fade-in duration-500 pt-2">
                  <button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    className="group flex w-full items-center justify-center gap-3.5 rounded-xl border border-gray-200 bg-white px-4 py-4 text-[15px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                  >
                    <div className="grid grid-cols-2 gap-[2px] w-[20px] h-[20px]">
                      <div className="bg-[#f25022]" />
                      <div className="bg-[#7fba00]" />
                      <div className="bg-[#00a4ef]" />
                      <div className="bg-[#ffb900]" />
                    </div>
                    Continue with Microsoft
                  </button>

                  <div className="relative pt-6">
                    <div className="absolute inset-0 flex items-center h-px bg-gray-100" />
                    <span className="relative z-10 bg-white px-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      OR DEVELOPER ACCESS
                    </span>
                  </div>

                  <MockLoginSection />

                  <div className="rounded-xl bg-blue-50/60 p-5 border border-blue-100/80">
                    <p className="text-[13px] font-semibold text-blue-800 leading-relaxed">
                      Students are required to use their official DLSU-D Microsoft 365 organization account to access the SWAFO portal.
                    </p>
                  </div>
                </div>
              )}
            </div>
        </div>
        
        {/* Footer */}
        <div className="w-full flex justify-between absolute bottom-8 left-0 px-8 lg:px-12 xl:px-24">
          <a href="#" className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 hover:text-gray-800 transition-colors">Privacy Policy</a>
          <a href="#" className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 hover:text-gray-800 transition-colors">Terms of Service</a>
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
      onClick={() => {
        loginAsAdmin("Director Ruel Elias", "admin@dlsud.edu.ph");
        navigate('/admin/dashboard');
      }}
      className="w-full px-5 py-4 bg-[#0f3422] border border-emerald-900 rounded-xl text-[14px] font-pjs font-bold text-white flex items-center justify-between hover:bg-[#15462e] transition-all"
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
        className="w-full px-5 py-4 bg-emerald-50 border border-emerald-100/50 rounded-xl text-[14px] font-pjs font-bold text-[#0f3422] flex items-center justify-between hover:bg-emerald-100 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Select Mock Student (Demo Mode)...</span>
        </div>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-[240px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {students.length > 0 ? students.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                loginAsMock(s);
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

  const officers = [
    { name: "Officer Timothy De Guzman", email: "officer1@dlsud.edu.ph" },
    { name: "Officer Maria Santos", email: "officer2@dlsud.edu.ph" },
    { name: "Officer Ricardo Reyes", email: "officer3@dlsud.edu.ph" },
    { name: "Officer Elena Garcia", email: "officer4@dlsud.edu.ph" },
    { name: "Officer Julian Cruz", email: "officer5@dlsud.edu.ph" },
    { name: "Officer Sofia Villanueva", email: "officer6@dlsud.edu.ph" },
    { name: "Officer Mateo Ramos", email: "officer7@dlsud.edu.ph" },
    { name: "Officer Isabella Luna", email: "officer8@dlsud.edu.ph" },
    { name: "Officer Gabriel Castro", email: "officer9@dlsud.edu.ph" },
    { name: "Officer Beatrice Mendoza", email: "officer10@dlsud.edu.ph" }
  ];

  return (
    <div className="relative text-left">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 bg-emerald-50 border border-emerald-100/50 rounded-xl text-[14px] font-pjs font-bold text-[#0f3422] flex items-center justify-between hover:bg-emerald-100 transition-all"
      >
        <span>Select Officer Account...</span>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-[240px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {officers.map((off, i) => (
            <button
              key={i}
              onClick={() => {
                loginAsOfficer(off.name, off.email);
                navigate('/officer/dashboard');
              }}
              className="w-full text-left px-5 py-4 border-b border-gray-50 hover:bg-emerald-50 transition-colors"
            >
              <p className="text-[14px] font-pjs font-bold text-gray-900 leading-none mb-1">{off.name}</p>
              <p className="text-[11px] font-manrope font-semibold text-gray-400">{off.email}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
