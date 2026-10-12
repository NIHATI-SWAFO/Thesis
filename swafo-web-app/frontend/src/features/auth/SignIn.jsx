import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../lib/authConfig";
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Lock, Eye, EyeOff, ArrowRight, Loader2, KeyRound, Mail, CheckCircle2, AlertCircle, X, ShieldAlert, Shield, BadgeCheck, GraduationCap } from 'lucide-react';
import { API_ENDPOINTS } from '../../api/config';
import swafoLogo from '../../assets/swafo_logo.jpg';
import signinBg from '../../assets/signin_image.png';

export default function SignIn() {
  const { instance, accounts } = useMsal();
  const { loginAsOfficer, loginAsAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('officer');
  
  // Officer form state
  const [showPassword, setShowPassword] = useState(false);
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerError, setOfficerError] = useState('');
  const [officerLoggingIn, setOfficerLoggingIn] = useState(false);

  // Admin form state
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);

  // Director Forgot Password Modal State
  const [showForgotDirectorModal, setShowForgotDirectorModal] = useState(false);
  const [forgotDirectorEmail, setForgotDirectorEmail] = useState('');
  const [forgotDirectorLoading, setForgotDirectorLoading] = useState(false);
  const [forgotDirectorMessage, setForgotDirectorMessage] = useState('');
  const [forgotDirectorError, setForgotDirectorError] = useState('');

  // Officer Request Reset Modal State
  const [showRequestOfficerModal, setShowRequestOfficerModal] = useState(false);
  const [requestOfficerIdentifier, setRequestOfficerIdentifier] = useState('');
  const [requestOfficerLoading, setRequestOfficerLoading] = useState(false);
  const [requestOfficerMessage, setRequestOfficerMessage] = useState('');
  const [requestOfficerError, setRequestOfficerError] = useState('');

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
      setOfficerError(err.message || 'Invalid credentials.');
    } finally {
      setOfficerLoggingIn(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');
    if (!adminEmail.trim()) {
      setAdminError('Please enter your director email.');
      return;
    }
    setAdminLoggingIn(true);
    try {
      await loginAsAdmin('', adminEmail.trim(), adminPassword);
      navigate('/admin/dashboard');
    } catch (err) {
      setAdminError(err.message || 'Invalid credentials.');
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const handleForgotDirectorSubmit = async (e) => {
    e.preventDefault();
    setForgotDirectorError('');
    if (!forgotDirectorEmail.trim()) {
      setForgotDirectorError('Please enter your director email address.');
      return;
    }
    setForgotDirectorLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.DIRECTOR_FORGOT_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotDirectorEmail.trim() })
      });
      const data = await res.json();
      setForgotDirectorMessage(data.message || 'If this account exists, we sent a password reset link to your email.');
    } catch (err) {
      setForgotDirectorError('Unable to connect to security server. Please try again.');
    } finally {
      setForgotDirectorLoading(false);
    }
  };

  const handleRequestOfficerSubmit = async (e) => {
    e.preventDefault();
    setRequestOfficerError('');
    if (!requestOfficerIdentifier.trim()) {
      setRequestOfficerError('Please enter your officer ID or school email.');
      return;
    }
    setRequestOfficerLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.OFFICER_REQUEST_RESET, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: requestOfficerIdentifier.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit reset request.');
      }
      setRequestOfficerMessage(data.message || 'Reset request submitted to the Director. Please check with the Director for your temporary credentials.');
    } catch (err) {
      setRequestOfficerError(err.message || 'Unable to submit request. Please try again.');
    } finally {
      setRequestOfficerLoading(false);
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
    <div className="relative min-h-[100dvh] w-full flex flex-col lg:flex-row items-center justify-center lg:justify-between px-4 sm:px-12 lg:px-20 xl:px-28 py-3 sm:py-6 lg:py-0 font-sans text-gray-900 selection:bg-[#a5d6a7] selection:text-[#0b2918] overflow-y-auto overflow-x-hidden">
      {/* Background & Overlays */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${signinBg})` }}
      />
      <div className="fixed inset-0 bg-[#0c2f1f]/85 mix-blend-multiply pointer-events-none" />
      <div className="fixed inset-0 bg-[#061d12]/60 pointer-events-none" /> 
      
      {/* Desktop Top Logo - Fixed at top-left across the screen */}
      <div className="hidden lg:flex absolute top-8 sm:top-12 left-6 sm:left-12 lg:left-20 xl:left-28 items-center space-x-3 sm:space-x-4 z-20">
        <div className="bg-white/10 p-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg">
          <img src={swafoLogo} alt="SWAFO" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover" />
        </div>
        <span className="font-semibold text-sm sm:text-lg tracking-wide text-white/95 drop-shadow-md">
          Student Welfare and Formation Office
        </span>
      </div>

      {/* Mobile Top Header Bar - Executive & sleek for mobile viewports */}
      <div className="flex lg:hidden items-center justify-between w-full max-w-[420px] pt-1 pb-2 px-1 z-20 shrink-0">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-md">
          <img src={swafoLogo} alt="SWAFO" className="h-5 w-5 rounded-full object-cover shadow-sm" />
          <span className="font-bold text-[11px] tracking-wide text-white font-pjs">
            SWAFO Portal
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
          <span className="text-[9px] font-extrabold tracking-widest text-[#a1dbba] uppercase">
            DLSU-D OSS
          </span>
        </div>
      </div>

      {/* Mobile welcome headline (only on tall phones, hidden on desktop) */}
      <div className="hidden [@media(min-height:760px)_and_(max-width:1023px)]:block w-full max-w-[420px] text-center mt-auto pt-4 pb-1 z-10 shrink-0">
        <h1 className="text-[1.7rem] font-bold tracking-tight leading-[1.1] text-white drop-shadow-lg font-pjs">
          Curing Campus <span className="text-[#a1dbba]">Integrity.</span>
        </h1>
        <p className="mt-1.5 text-[12px] text-white/70 font-medium font-manrope">Student Welfare and Formation Office</p>
      </div>

      {/* Left Text Content - Pushed to the far left side (Desktop only) */}
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

      {/* Right Interaction Pane (Glass Card) - Comfortably proportioned & balanced */}
      <div className="relative z-10 flex w-full max-w-[460px] sm:max-w-[490px] lg:max-w-[510px] xl:max-w-[530px] flex-col rounded-3xl lg:rounded-[2rem] bg-white lg:bg-white/95 px-7 py-7 sm:px-9 sm:py-8 lg:px-10 lg:py-9 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] lg:shadow-[0_28px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/60 my-auto overflow-hidden">
        <div className="lg:hidden absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0f3422] via-[#34d399] to-[#a1dbba]" />
        
        <div className="w-full">
            {/* Form Header */}
            <div className="flex flex-col items-center mb-5 sm:mb-6 text-center">
              <div className="relative mb-3 sm:mb-3.5">
                <div className="absolute inset-0 rounded-full blur-[16px] bg-[#0f3422]/15" />
                <img 
                  src={swafoLogo} 
                  alt="SWAFO Logo" 
                  className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-[68px] lg:h-[68px] rounded-full shadow-md border-2 border-emerald-900/10 ring-2 ring-emerald-500/20 object-cover" 
                />
              </div>
              <h2 className="text-2xl sm:text-[1.75rem] lg:text-3xl font-extrabold text-[#111827] mb-1.5 tracking-tight font-pjs">
                Sign In
              </h2>
              <div className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] text-gray-500 font-medium font-manrope">
                <span>
                  {activeTab === 'admin' 
                    ? 'Directorate Command Center' 
                    : activeTab === 'officer' 
                    ? 'Administrative Workstation' 
                    : 'Student Welfare Portal'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="font-semibold text-emerald-800">DLSU-D</span>
              </div>
            </div>

            {/* Apple-Style Segmented Control with Role Icons */}
            <div className="relative flex rounded-xl p-1 sm:p-1.5 bg-[#eef1f3] mb-5 sm:mb-6 border border-gray-200/80 shadow-inner">
              {/* Highlight Slider */}
              <div 
                className={`absolute inset-y-1 sm:inset-y-1.5 w-[calc(33.333%-4px)] sm:w-[calc(33.333%-5px)] bg-white rounded-lg shadow-sm border border-gray-200/90 transition-transform duration-300 ease-out ${
                  activeTab === 'officer' ? 'translate-x-[100%]' : activeTab === 'student' ? 'translate-x-[200%]' : 'translate-x-0'
                }`}
              />
              <button
                type="button"
                className={`relative z-10 flex-1 py-2 sm:py-2.5 text-xs sm:text-[14px] font-bold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer ${
                  activeTab === 'admin' ? 'text-[#0f3422]' : 'text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('admin')}
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                className={`relative z-10 flex-1 py-2 sm:py-2.5 text-xs sm:text-[14px] font-bold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer ${
                  activeTab === 'officer' ? 'text-[#0f3422]' : 'text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('officer')}
              >
                <BadgeCheck className="w-4 h-4 shrink-0" />
                <span>Officer</span>
              </button>
              <button
                type="button"
                className={`relative z-10 flex-1 py-2 sm:py-2.5 text-xs sm:text-[14px] font-bold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer ${
                  activeTab === 'student' ? 'text-[#0f3422]' : 'text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('student')}
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Student</span>
              </button>
            </div>

            {/* Forms Section */}
            <div className="w-full">
              {/* 1. ADMIN TAB */}
              {activeTab === 'admin' ? (
                <form className="flex flex-col space-y-4 animate-in fade-in duration-300" onSubmit={handleAdminSubmit}>
                  {adminError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-[13px] font-semibold rounded-xl text-center">
                      {adminError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 ml-1">
                      Director Email
                    </label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 sm:pl-4">
                        <ShieldCheck className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-gray-400 group-focus-within:text-[#0f3422] transition-colors" />
                      </div>
                      <input 
                        type="email" 
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200/90 bg-[#f8fafc] py-2.5 sm:py-3.5 pl-10 sm:pl-12 pr-4 text-gray-900 ring-0 focus:bg-white focus:border-[#0f3422] focus:ring-2 focus:ring-[#0f3422]/15 hover:bg-[#f1f5f9] transition-all text-xs sm:text-[14px] lg:text-[15px] font-medium outline-none placeholder:text-gray-400" 
                        placeholder="EG: director@dlsud.edu.ph" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                        Master Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotDirectorModal(true);
                          setForgotDirectorMessage('');
                          setForgotDirectorError('');
                        }}
                        className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 sm:pl-4">
                        <Lock className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-gray-400 group-focus-within:text-[#0f3422] transition-colors" />
                      </div>
                      <input 
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="block w-full rounded-xl border border-gray-200/90 bg-[#f8fafc] py-2.5 sm:py-3.5 pl-10 sm:pl-12 pr-11 sm:pr-12 text-gray-900 ring-0 focus:bg-white focus:border-[#0f3422] focus:ring-2 focus:ring-[#0f3422]/15 hover:bg-[#f1f5f9] transition-all text-xs sm:text-[14px] lg:text-[15px] font-medium placeholder:text-gray-400 outline-none" 
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 sm:pr-4 outline-none cursor-pointer"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                      >
                        {showAdminPassword ? (
                          <EyeOff className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-gray-400 hover:text-gray-700 transition-colors" />
                        ) : (
                          <Eye className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-gray-400 hover:text-gray-700 transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={adminLoggingIn}
                    className="group relative flex w-full items-center justify-center rounded-xl bg-[#0f3422] px-4 py-3 sm:py-3.5 text-xs sm:text-[15px] font-bold text-white shadow-lg shadow-[#0f3422]/20 hover:bg-[#15462e] hover:shadow-xl hover:shadow-[#0f3422]/30 active:scale-[0.99] transition-all duration-200 outline-none focus:ring-4 focus:ring-[#0f3422]/20 disabled:opacity-60 cursor-pointer"
                  >
                    {adminLoggingIn ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        Authenticating...
                      </span>
                    ) : (
                      <>
                        <span>Access Director Portal</span>
                        <ArrowRight className="absolute right-4 sm:right-5 h-4 w-4 sm:h-5 sm:w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </>
                    )}
                  </button>

                  {/* Context Guidance Card */}
                  <div className="rounded-xl bg-emerald-50/70 p-3.5 sm:p-4 border border-emerald-100 flex items-start gap-3 text-left">
                    <Shield className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-emerald-800 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-[13px] text-emerald-900/85 leading-relaxed font-manrope">
                      <strong className="font-semibold text-emerald-950">Director Access:</strong> High-privilege workstation. All actions, clearance approvals, and reset audits are cryptographically signed.
                    </p>
                  </div>
                </form>
              ) : activeTab === 'officer' ? (
                /* 2. OFFICER TAB */
                <form className="flex flex-col space-y-4 animate-in fade-in duration-300" onSubmit={handleOfficerSubmit}>
                  {officerError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-[13px] font-semibold rounded-xl text-center">
                      {officerError}
                    </div>
                  )}

                  {/* ID Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 ml-1">
                      ID / School Email Address
                    </label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 sm:pl-4">
                        <User className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-gray-400 group-focus-within:text-[#0f3422] transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={officerEmail || ""}
                        onChange={(e) => setOfficerEmail(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200/90 bg-[#f8fafc] py-2.5 sm:py-3.5 pl-10 sm:pl-12 pr-4 text-gray-900 ring-0 focus:bg-white focus:border-[#0f3422] focus:ring-2 focus:ring-[#0f3422]/15 hover:bg-[#f1f5f9] transition-all text-xs sm:text-[14px] lg:text-[15px] font-medium outline-none placeholder:text-gray-400"
                        placeholder="EG: erica.aclag@dlsud.edu.ph"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRequestOfficerModal(true);
                          setRequestOfficerMessage('');
                          setRequestOfficerError('');
                        }}
                        className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer transition-colors"
                      >
                        Forgot password? Request reset
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 sm:pl-4">
                        <Lock className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-gray-400 group-focus-within:text-[#0f3422] transition-colors" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={officerPassword || ""}
                        onChange={(e) => setOfficerPassword(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200/90 bg-[#f8fafc] py-2.5 sm:py-3.5 pl-10 sm:pl-12 pr-11 sm:pr-12 text-gray-900 ring-0 focus:bg-white focus:border-[#0f3422] focus:ring-2 focus:ring-[#0f3422]/15 hover:bg-[#f1f5f9] transition-all text-xs sm:text-[14px] lg:text-[15px] font-medium placeholder:text-gray-400 outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 sm:pr-4 outline-none cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-gray-400 hover:text-gray-700 transition-colors" />
                        ) : (
                          <Eye className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-gray-400 hover:text-gray-700 transition-colors" />
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
                        <span>Sign In to Workstation</span>
                        <ArrowRight className="absolute right-4 sm:right-5 h-4 w-4 sm:h-5 sm:w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </>
                    )}
                  </button>

                  {/* Context Guidance Card */}
                  <div className="rounded-xl bg-emerald-50/70 p-3.5 sm:p-4 border border-emerald-100 flex items-start gap-3 text-left">
                    <BadgeCheck className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-emerald-800 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-[13px] text-emerald-900/85 leading-relaxed font-manrope">
                      <strong className="font-semibold text-emerald-950">Officer Portal:</strong> Active shift assignment required for violation ticketing, campus patrol entries, and student records.
                    </p>
                  </div>
                </form>
              ) : (
                /* 3. STUDENT TAB */
                <div className="flex flex-col space-y-4 text-center animate-in fade-in duration-300">
                  <button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    className="group flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-5 py-3.5 sm:py-4 text-xs sm:text-[15px] font-bold text-gray-800 shadow-sm hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/15 cursor-pointer"
                  >
                    <div className="grid grid-cols-2 gap-[2px] w-[19px] h-[19px]">
                      <div className="bg-[#f25022]" />
                      <div className="bg-[#7fba00]" />
                      <div className="bg-[#00a4ef]" />
                      <div className="bg-[#ffb900]" />
                    </div>
                    <span>Sign in with Microsoft 365</span>
                  </button>

                  <div className="rounded-xl bg-blue-50/70 p-4 sm:p-4.5 border border-blue-100/90 text-left space-y-1.5">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs sm:text-[13px]">
                      <GraduationCap className="w-4 h-4 text-blue-700" />
                      <span>Student Portal Access</span>
                    </div>
                    <p className="text-xs sm:text-[12.5px] text-blue-800/90 leading-relaxed font-manrope">
                      Use your official <strong className="font-semibold text-blue-950">@dlsud.edu.ph</strong> organizational credentials to check violation records, handbook policies, and clearance status.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Institutional Security Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs sm:text-[12.5px] text-gray-400 font-manrope">
              <div className="flex items-center gap-2 text-gray-500">
                <Lock className="w-3.5 h-3.5 text-emerald-800" />
                <span>256-Bit SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>DLSU-D SWAFO</span>
              </div>
            </div>
        </div>
      </div>

      {/* Footer - Floating on mobile, absolute center on desktop */}
      <div className="mt-auto pt-5 pb-1 lg:pt-0 lg:pb-0 lg:mt-0 lg:absolute lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 flex space-x-6 sm:space-x-8 z-10 text-center justify-center shrink-0">
        <a href="#" className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Terms of Service</a>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. DIRECTOR FORGOT PASSWORD MODAL (Self-Service)                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showForgotDirectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <button
              type="button"
              onClick={() => setShowForgotDirectorModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#0f3422] flex items-center justify-center text-[#a1dbba] shadow-md">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 font-pjs">Director Password Reset</h3>
                <p className="text-xs text-gray-500 font-manrope">Self-service credential recovery</p>
              </div>
            </div>

            {forgotDirectorMessage ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-[13px] text-emerald-900 font-medium leading-relaxed font-manrope">
                    {forgotDirectorMessage}
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 font-manrope leading-relaxed">
                  The link expires in <span className="font-bold text-gray-700">15 minutes</span> and can be used once. Please check your inbox and spam folder.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotDirectorModal(false)}
                  className="w-full py-3 bg-[#0f3422] text-white text-xs sm:text-[13px] font-bold rounded-xl hover:bg-[#15462e] transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotDirectorSubmit} className="space-y-4">
                <p className="text-xs text-gray-600 font-manrope leading-relaxed">
                  Enter your registered Director email address. If an account is registered under this email, you will receive a single-use 15-minute reset link.
                </p>

                {forgotDirectorError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{forgotDirectorError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                    Director Email Address
                  </label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-[#113a26]" />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotDirectorEmail}
                      onChange={(e) => setForgotDirectorEmail(e.target.value)}
                      placeholder="director@dlsud.edu.ph"
                      className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-2.5 sm:py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-[#113a26] text-xs sm:text-[13px] outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotDirectorModal(false)}
                    className="flex-1 py-2.5 sm:py-3 text-xs sm:text-[13px] font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotDirectorLoading}
                    className="flex-1 py-2.5 sm:py-3 text-xs sm:text-[13px] font-bold text-white bg-[#0f3422] rounded-xl hover:bg-[#15462e] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {forgotDirectorLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 2. OFFICER REQUEST RESET MODAL (Submits request to Director)          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showRequestOfficerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <button
              type="button"
              onClick={() => setShowRequestOfficerModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#0f3422] flex items-center justify-center text-[#a1dbba] shadow-md">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 font-pjs">Officer Reset Request</h3>
                <p className="text-xs text-gray-500 font-manrope">Forwarded to Director for authorization</p>
              </div>
            </div>

            {requestOfficerMessage ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-[13px] text-emerald-900 font-medium leading-relaxed font-manrope">
                    {requestOfficerMessage}
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 font-manrope leading-relaxed">
                  For campus security protocols, officers cannot self-reset credentials. The Director will approve your request and issue a one-time temporary password.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRequestOfficerModal(false)}
                  className="w-full py-3 bg-[#0f3422] text-white text-xs sm:text-[13px] font-bold rounded-xl hover:bg-[#15462e] transition-colors cursor-pointer"
                >
                  Understood
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestOfficerSubmit} className="space-y-4">
                <p className="text-xs text-gray-600 font-manrope leading-relaxed">
                  Please enter your Officer ID or official school email. A pending reset request will be dispatched to the Director's command center.
                </p>

                {requestOfficerError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{requestOfficerError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                    Officer ID / DLSU-D Email
                  </label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <User className="h-4 w-4 text-gray-400 group-focus-within:text-[#113a26]" />
                    </div>
                    <input
                      type="text"
                      required
                      value={requestOfficerIdentifier}
                      onChange={(e) => setRequestOfficerIdentifier(e.target.value)}
                      placeholder="EG: erica.aclag@dlsud.edu.ph"
                      className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-2.5 sm:py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-[#113a26] text-xs sm:text-[13px] outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestOfficerModal(false)}
                    className="flex-1 py-2.5 sm:py-3 text-xs sm:text-[13px] font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requestOfficerLoading}
                    className="flex-1 py-2.5 sm:py-3 text-xs sm:text-[13px] font-bold text-white bg-[#0f3422] rounded-xl hover:bg-[#15462e] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {requestOfficerLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Request Reset</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


