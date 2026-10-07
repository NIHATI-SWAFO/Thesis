import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_ENDPOINTS } from '../api/config';

export default function StudentNumberPromptModal({ isOpen, onClose, user, profile, onSuccess }) {
  const [studentNumber, setStudentNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // If current profile already has a temporary or detected ID, pre-fill it for easy confirmation
      if (profile?.student_number && profile.student_number.length === 9) {
        setStudentNumber(profile.student_number);
      } else {
        setStudentNumber('');
      }
      setError('');
      setSuccess(false);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    // Only allow numbers and limit to 9 digits
    const clean = e.target.value.replace(/\D/g, '').slice(0, 9);
    setStudentNumber(clean);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (studentNumber.length !== 9) {
      setError('Student number must be exactly 9 digits (e.g., 202330395).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const email = user?.email || profile?.user_details?.email;
      const res = await fetch(API_ENDPOINTS.UPDATE_STUDENT_NUMBER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          student_number: studentNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update student number.');
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(data.profile);
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const studentName = user?.name || profile?.user_details?.full_name || 'DLSU-D Student';
  const studentEmail = user?.email || profile?.user_details?.email || '';

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[460px] rounded-3xl overflow-hidden shadow-2xl bg-white border border-emerald-100/80 animate-in zoom-in-95 duration-200 flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-[#003624] text-white p-6 sm:p-7 relative overflow-hidden text-left">
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute right-6 bottom-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-8xl">school</span>
          </div>

          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
              <span className="material-symbols-outlined text-[22px]">badge</span>
            </div>
            <div>
              <p className="text-[10px] font-pjs font-black uppercase tracking-[0.2em] text-emerald-300/90 leading-tight">
                Institutional Onboarding
              </p>
              <h3 className="text-lg font-pjs font-bold text-white tracking-tight leading-tight">
                Confirm Student Number
              </h3>
            </div>
          </div>

          <p className="text-xs text-white/80 font-manrope leading-relaxed relative z-10">
            Welcome to the SWAFO Portal! Your Microsoft account is verified. Please confirm your official 9-digit Student ID to link your academic clearance record.
          </p>
        </div>

        {/* Live ID Preview Badge Card */}
        <div className="px-6 sm:px-7 pt-5 pb-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-pjs font-black uppercase tracking-wider text-slate-400">
                Official Digital Identity
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-[#006b5d] text-[10px] font-pjs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Microsoft 365 Verified
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <div className="w-10 h-10 rounded-xl bg-[#003624] text-white flex items-center justify-center font-pjs font-black text-sm shrink-0">
                {studentName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-pjs font-bold text-slate-900 truncate leading-tight">
                  {studentName}
                </h4>
                <p className="text-[11px] text-slate-500 font-manrope truncate mt-0.5">
                  {studentEmail}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[11px] font-manrope text-slate-400 font-medium">Student ID Number:</span>
              <span className="text-xs font-mono font-bold text-[#003624] tracking-widest bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                {studentNumber ? studentNumber.padEnd(9, '•') : '•••••••••'}
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Input Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 pt-3 space-y-5 text-left">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="student-id-input" className="text-xs font-pjs font-bold text-slate-800 uppercase tracking-wider">
                9-Digit Student Number <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                studentNumber.length === 9 
                  ? 'bg-emerald-100 text-[#006b5d]' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {studentNumber.length === 9 ? '✓ 9 Digits' : `${studentNumber.length}/9 digits`}
              </span>
            </div>

            <div className="relative">
              <input
                id="student-id-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={9}
                value={studentNumber}
                onChange={handleInputChange}
                placeholder="202330395"
                autoFocus
                disabled={loading || success}
                className="w-full text-center text-xl sm:text-2xl font-mono font-extrabold tracking-[0.25em] text-[#003624] bg-emerald-50/40 border-2 border-emerald-200/80 rounded-2xl py-3.5 px-4 placeholder:text-slate-300 placeholder:tracking-widest focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all shadow-inner"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-manrope mt-1.5 text-center">
              Found on your physical student ID card (e.g., 202330395).
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-manrope flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-rose-600">error</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#003624] text-xs font-manrope flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-emerald-600">check_circle</span>
              <span className="font-bold">Student number verified and officially registered!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || success}
              className="w-full sm:w-1/3 py-3 px-4 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-pjs font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
            >
              Confirm Later
            </button>
            <button
              type="submit"
              disabled={loading || studentNumber.length !== 9 || success}
              className={`w-full sm:w-2/3 py-3.5 px-6 rounded-xl font-pjs font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                studentNumber.length === 9 && !loading && !success
                  ? 'bg-[#003624] hover:bg-[#004d33] text-white shadow-emerald-950/20 active:scale-95 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : success ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">done</span>
                  <span>Confirmed!</span>
                </>
              ) : (
                <>
                  <span>Confirm Student Number</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
