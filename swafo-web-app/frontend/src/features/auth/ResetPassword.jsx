import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../../api/config';
import swafoLogo from '../../assets/swafo_logo.jpg';
import signinBg from '../../assets/signin_image.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Password reset token is missing. Please request a new link.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.DIRECTOR_RESET_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'An error occurred while resetting your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 font-sans text-gray-900 selection:bg-[#a5d6a7] selection:text-[#0b2918]">
      {/* Background & Overlays */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${signinBg})` }}
      />
      <div className="fixed inset-0 bg-[#0c2f1f]/85 mix-blend-multiply pointer-events-none" />
      <div className="fixed inset-0 bg-[#061d12]/60 pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-[460px] rounded-3xl bg-white/95 backdrop-blur-xl p-6 sm:p-10 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] border border-white/60">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full blur-xl bg-[#14422c]/15" />
            <img src={swafoLogo} alt="SWAFO" className="relative w-14 h-14 rounded-full shadow-sm border border-gray-100 object-cover" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight font-pjs">Set New Password</h2>
          <p className="text-xs text-gray-500 font-medium font-manrope mt-1">
            Director Credential Recovery • SWAFO Security
          </p>
          {email && (
            <span className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-100 font-manrope">
              {email}
            </span>
          )}
        </div>

        {!token ? (
          <div className="space-y-5 text-center">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2.5 text-left">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Invalid or missing reset token. Please request a new reset link from the sign-in page.</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-[#0f3422] text-white text-xs sm:text-[13px] font-bold rounded-xl hover:bg-[#15462e] transition-colors cursor-pointer"
            >
              Go to Sign In
            </button>
          </div>
        ) : success ? (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-[13px] text-emerald-900 font-semibold leading-relaxed">
                Password reset successful! Your Director credentials have been updated in the security registry.
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="group flex w-full items-center justify-center gap-2 py-3 bg-[#0f3422] text-white text-xs sm:text-[13px] font-bold rounded-xl hover:bg-[#15462e] transition-colors cursor-pointer shadow-lg shadow-[#0f3422]/20"
            >
              <span>Sign In with New Password</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
                New Master Password
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-[#113a26]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-2.5 sm:py-3 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-[#113a26] text-xs sm:text-[14px] font-medium outline-none"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-700" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-700" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
                Confirm New Password
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-[#113a26]" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="block w-full rounded-xl border-0 bg-[#f4f5f7] py-2.5 sm:py-3 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-[#113a26] text-xs sm:text-[14px] font-medium outline-none"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-700" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-700" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Validation Hints */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                <div className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <span>Minimum 8 characters</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                <div className={`w-2 h-2 rounded-full ${newPassword && confirmPassword && newPassword === confirmPassword ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <span>Passwords match</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center rounded-xl bg-[#0f3422] px-4 py-3 text-xs sm:text-[14px] font-bold text-white shadow-lg shadow-[#0f3422]/20 hover:bg-[#15462e] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Password...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#a1dbba]" />
                  Save New Password
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors text-center cursor-pointer"
            >
              Cancel and Return to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
