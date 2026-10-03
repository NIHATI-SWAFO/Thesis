import React, { useState, useEffect } from 'react';
import { X, EyeOff, Database, LogIn, AlertTriangle, ChevronLeft, ChevronRight, Copy, BookOpen, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SwafoDevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState('bottom-left');
  const [isHidden, setIsHidden] = useState(false);
  
  // Error Tracking State
  const [errors, setErrors] = useState([]);
  const [isErrorOverlayOpen, setIsErrorOverlayOpen] = useState(false);
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0);
  
  const auth = useAuth();
  const navigate = useNavigate();

  // Intercept Errors
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const handleWindowError = (event) => {
      const errObj = {
        type: 'Runtime Error',
        message: event.message,
        time: new Date().toLocaleTimeString(),
        stack: event.error?.stack || ''
      };
      setErrors(prev => [errObj, ...prev]);
      setIsErrorOverlayOpen(true);
      setCurrentErrorIndex(0);
    };

    const handlePromiseRejection = (event) => {
      const errObj = {
        type: 'Unhandled Rejection',
        message: event.reason?.toString() || 'Promise Rejection',
        time: new Date().toLocaleTimeString(),
        stack: event.reason?.stack || ''
      };
      setErrors(prev => [errObj, ...prev]);
      setIsErrorOverlayOpen(true);
      setCurrentErrorIndex(0);
    };

    // Override console.error safely
    const originalConsoleError = console.error;
    console.error = (...args) => {
      let stack = '';
      const msg = args.map(a => {
        if (a instanceof Error) {
          if (a.stack) stack = a.stack;
          return a.toString();
        }
        if (typeof a === 'object') {
          try { return JSON.stringify(a); } catch(e) { return String(a); }
        }
        return a;
      }).join(' ');
      
      if (!stack) {
        try { throw new Error(); } catch(e) { stack = e.stack.split('\n').slice(2).join('\n'); }
      }

      setErrors(prev => [{ type: 'Console Error', message: msg, time: new Date().toLocaleTimeString(), stack }, ...prev]);
      setIsErrorOverlayOpen(true);
      setCurrentErrorIndex(0);
      
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
      console.error = originalConsoleError;
    };
  }, []);

  if (isHidden) return null;
  if (process.env.NODE_ENV === 'production') return null;

  const positionClasses = {
    'bottom-left': 'bottom-4 left-4 flex-col-reverse',
    'bottom-right': 'bottom-4 right-4 flex-col-reverse items-end',
    'top-left': 'top-4 left-4 flex-col',
    'top-right': 'top-4 right-4 flex-col items-end',
  };

  const handleMockLogin = (role) => {
    if (role === 'admin') {
      auth.loginAsAdmin("Director Ruel Elias", "admin@dlsud.edu.ph");
      navigate('/admin/dashboard');
    }
    if (role === 'officer') {
      auth.loginAsOfficer("Officer Timothy De Guzman", "officer1@dlsud.edu.ph");
      navigate('/officer/dashboard');
    }
    if (role === 'student') {
      auth.loginAsMock({ 
        user_details: { full_name: "Timothy De Castro", email: "dtl0396@dlsud.edu.ph" }, 
        course: "College of Information and Computer Studies", 
        student_number: "202330395" 
      });
      navigate('/student/dashboard');
    }
  };

  const hasErrors = errors.length > 0;
  const currentError = errors[currentErrorIndex];

  return (
    <>
      {/* ═════════════════════ NEXT.JS STYLE ERROR OVERLAY ═════════════════════ */}
      {hasErrors && isErrorOverlayOpen && currentError && (
        <div className="fixed bottom-0 left-0 right-0 z-[10000] flex justify-center p-6 animate-in slide-in-from-bottom-8 duration-300 pointer-events-none">
          <div className="w-full max-w-[900px] bg-white rounded-t-xl rounded-b-xl shadow-[0_0_40px_rgba(0,0,0,0.15)] border border-[#e5e7eb] pointer-events-auto flex flex-col overflow-hidden font-sans">
            
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-[#f3f4f6]">
              {/* Pagination */}
              <div className="flex items-center gap-2 bg-[#f3f4f6] rounded-full px-2 py-1">
                <button 
                  onClick={() => setCurrentErrorIndex(Math.max(0, currentErrorIndex - 1))}
                  disabled={currentErrorIndex === 0}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                >
                  <ChevronLeft size={14} strokeWidth={3} />
                </button>
                <span className="text-[12px] font-bold text-gray-700 font-mono tracking-widest">
                  {currentErrorIndex + 1} / {errors.length}
                </span>
                <button 
                  onClick={() => setCurrentErrorIndex(Math.min(errors.length - 1, currentErrorIndex + 1))}
                  disabled={currentErrorIndex === errors.length - 1}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                >
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#f3f4f6] text-[11px] font-medium text-gray-500 bg-white shadow-sm">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                SWAFO Dev (stale) <span className="text-[#f81ce5] font-semibold">Vite</span>
              </div>
            </div>

            {/* Error Content */}
            <div className="p-6 bg-white overflow-y-auto max-h-[60vh] custom-scrollbar">
              
              {/* Header Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-3 w-4/5">
                  <span className="inline-block px-2 py-1 rounded-md bg-[#fee2e2] text-[#b91c1c] text-[12px] font-bold font-mono tracking-tight self-start">
                    {currentError.type}
                  </span>
                  <h1 className="text-[20px] font-bold text-[#b91c1c] leading-tight font-sans break-words">
                    {currentError.message}
                  </h1>
                </div>

                {/* Top Right Actions */}
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full border border-[#f3f4f6] text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors" title="Copy Error">
                    <Copy size={14} />
                  </button>
                  <button className="p-2 rounded-full border border-[#f3f4f6] text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors" title="Documentation">
                    <BookOpen size={14} />
                  </button>
                  <button onClick={() => setIsErrorOverlayOpen(false)} className="p-2 rounded-full border border-[#f3f4f6] text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors" title="Dismiss">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Call Stack */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[15px] font-semibold text-gray-800">Call Stack</h2>
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#f3f4f6] text-[11px] font-bold text-gray-500">
                    {currentError.stack ? currentError.stack.split('\n').filter(l => l.trim().startsWith('at ')).length : 0}
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {currentError.stack ? currentError.stack.split('\n').filter(l => l.trim().startsWith('at ')).map((line, idx) => {
                    // Try to parse standard Chrome/V8 stack format
                    const match = line.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) || line.match(/at\s+(.*):(\d+):(\d+)/);
                    if (match) {
                      const funcName = match.length === 5 ? match[1] : '<anonymous>';
                      const filePath = match.length === 5 ? match[2] : match[1];
                      const row = match.length === 5 ? match[3] : match[2];
                      const col = match.length === 5 ? match[4] : match[3];
                      return (
                        <div key={idx} className="flex flex-col gap-1">
                          <span className="text-[14px] font-semibold text-gray-800 font-mono flex items-center gap-2">
                            {funcName} <AlertTriangle size={12} className="text-gray-400" />
                          </span>
                          <span className="text-[13px] text-gray-500 font-mono truncate">
                            {filePath}:{row}:{col}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="flex flex-col gap-1">
                        <span className="text-[13px] text-gray-500 font-mono">{line.trim()}</span>
                      </div>
                    );
                  }) : (
                    <span className="text-sm text-gray-400 italic">No stack trace available.</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════ FLOATING PREFERENCES WIDGET ═════════════════════ */}
      <div className={`fixed z-[9998] flex ${positionClasses[position]}`}>
        {/* Floating Action Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
          }}
          className={`relative flex h-10 w-10 items-center justify-center rounded-full text-white shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-all border group focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
            hasErrors 
              ? 'bg-red-600 hover:bg-red-700 border-red-500 animate-pulse shadow-red-500/40' 
              : 'bg-[#111] hover:bg-black border-[#333]'
          }`}
        >
          {hasErrors && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 border border-white text-[9px] font-bold">
              {errors.length > 9 ? '9+' : errors.length}
            </span>
          )}
          <span className="font-sans font-bold text-lg group-hover:scale-110 transition-transform">
            {hasErrors ? '!' : 'S'}
          </span>
        </button>

        {/* Popover Menu */}
        {isOpen && (
          <div className={`w-[360px] rounded-xl bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 mb-3`}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
              <span className="text-[13px] font-semibold text-gray-700">Dev Tools</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto max-h-[440px] p-2 space-y-1 custom-scrollbar">
              
              {/* Quick Account Switcher (Thesis Feature) */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/80 transition-colors">
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-gray-900 flex items-center gap-1.5">
                    <LogIn size={14} className="text-emerald-600"/> Quick Switch
                  </span>
                  <span className="text-[12px] text-gray-500">Instantly swap roles for your demo.</span>
                </div>
                <select 
                  onChange={(e) => { if(e.target.value) handleMockLogin(e.target.value); e.target.value = ''; setIsOpen(false); }}
                  className="text-[13px] border border-emerald-200 bg-emerald-50 text-emerald-800 font-medium rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 shadow-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Switch to...</option>
                  <option value="admin">Admin</option>
                  <option value="officer">Officer</option>
                  <option value="student">Student</option>
                </select>
              </div>

              <div className="h-px bg-gray-100 mx-2" />

              {/* Mock Data Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/80 transition-colors">
                <div className="flex flex-col pr-4">
                  <span className="text-[13px] font-medium text-gray-900 flex items-center gap-1.5">
                    <Database size={14} className="text-amber-500"/> Mock Data
                  </span>
                  <span className="text-[12px] text-gray-500">Inject dummy data into tables for presentation.</span>
                </div>
                <button 
                  onClick={() => {
                    alert("Mock data toggled! You can wire this up to your context.");
                  }}
                  className="flex-shrink-0 px-3 py-1.5 text-[12px] font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                >
                  Toggle
                </button>
              </div>

              <div className="h-px bg-gray-100 mx-2" />

              {/* View / Clear Errors */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/80 transition-colors">
                <div className="flex flex-col pr-4">
                  <span className="text-[13px] font-medium text-gray-900 flex items-center gap-1.5">
                    <Trash2 size={14} className="text-red-500"/> Error Logs
                  </span>
                  <span className="text-[12px] text-gray-500">View or reset error logs.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (hasErrors) setIsErrorOverlayOpen(true);
                      setIsOpen(false);
                    }}
                    disabled={!hasErrors}
                    className="flex-shrink-0 px-3 py-1.5 text-[12px] font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => {
                      setErrors([]);
                      setIsErrorOverlayOpen(false);
                      setCurrentErrorIndex(0);
                      setIsOpen(false);
                    }}
                    className="flex-shrink-0 px-3 py-1.5 text-[12px] font-medium text-red-700 bg-white border border-red-200 rounded-md shadow-sm hover:bg-red-50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="h-px bg-gray-100 mx-2" />

              {/* Hide Dev Tools */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/80 transition-colors">
                <div className="flex flex-col pr-4">
                  <span className="text-[13px] font-medium text-gray-900">Hide Dev Tools</span>
                  <span className="text-[12px] text-gray-500">Hide until you restart server.</span>
                </div>
                <button 
                  onClick={() => setIsHidden(true)}
                  className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 text-[12px] font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <EyeOff size={14} /> Hide
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SwafoDevTools;
