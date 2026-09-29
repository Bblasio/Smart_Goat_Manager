import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { useTheme } from '../context/ThemeContext';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { evaluatePasswordPolicy } from '../utils/passwordPolicy';

export const AuthView: React.FC = () => {
  const { login, signup, resetPassword, enterDemoMode } = useFarm();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');

  // Form Fields
  const [farmName, setFarmName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Evaluate password policy dynamically
  const passwordPolicy = evaluatePasswordPolicy(password);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your registered email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await Promise.race([
        login(email.trim(), password),
        new Promise<{ success: boolean; error?: string }>(resolve =>
          setTimeout(
            () =>
              resolve({
                success: false,
                error: 'Sign-in request timed out. Please check your internet connection and retry.',
              }),
            12000
          )
        ),
      ]);

      if (!res.success) {
        setErrorMsg(res.error || 'Incorrect email or password. Please verify your sign-in details.');
        setIsLoading(false);
      } else {
        setInfoMsg('Authentication verified! Loading your farm dashboard...');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Incorrect sign-in details. Please check your credentials.');
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!farmName.trim()) {
      setErrorMsg('Please enter your farm name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please provide a valid official email address.');
      return;
    }

    const policyCheck = evaluatePasswordPolicy(password);
    if (!policyCheck.isValid) {
      setErrorMsg(
        `Password does not meet required policies: please include ${policyCheck.missingPolicies.join(', ')}.`
      );
      return;
    }

    setIsLoading(true);
    try {
      const profileDetails = {
        owner_name: '',
        location: '',
        farm_size: '',
        primary_breed: '',
        phone: '',
        bio: '',
        production_focus: '',
        grazing_system: '',
        founded_year: '',
      };

      const res = await signup(email.trim(), password, farmName.trim(), profileDetails);
      if (!res.success) {
        setErrorMsg(res.error || 'Could not complete registration. Please try again.');
        setIsLoading(false);
        return;
      }

      setInfoMsg('Account created successfully! Entering your farm ledger...');
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred during account creation.');
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPassword(email.trim());
      if (res.success) {
        setInfoMsg('Password reset link sent to your email address!');
        setTimeout(() => {
          setMode('login');
          setInfoMsg('');
        }, 2500);
      } else {
        setErrorMsg(res.error || 'Unable to send password reset email.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send password reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top right theme switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white shadow-sm transition-all cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-[400px] sm:max-w-[420px] rounded-2xl shadow-xl border border-stone-200/90 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900 transition-all z-10">
        {/* Card Header Bar with Official Logo and Brand */}
        <div className="bg-[#0b5736] px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1 shadow-sm shrink-0 border border-white/40">
            <img
              src="/app.png"
              alt="Smart Goat Official Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-white font-bold text-base tracking-tight">
            Smart Goat
          </span>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* ========================================================= */}
          {/* VIEW A: SIGN IN FORM */}
          {/* ========================================================= */}
          {mode === 'login' && (
            <>
              {/* Header Title */}
              <div>
                <h1 className="text-2xl sm:text-[26px] font-bold text-stone-900 dark:text-white tracking-tight leading-tight">
                  Welcome back
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Sign in to your farm records.
                </p>
              </div>

              {/* Feedback Notifications */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {infoMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="input-login-email"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="input-login-email"
                    type="email"
                    placeholder="name@farm.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5736] focus:border-transparent transition-all placeholder:text-stone-400"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="input-login-password"
                      className="text-xs font-semibold text-stone-700 dark:text-stone-300"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      id="btn-to-reset-mode"
                      onClick={() => {
                        setMode('reset');
                        setErrorMsg('');
                        setInfoMsg('');
                      }}
                      className="text-xs font-medium text-[#0b5736] dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="input-login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5736] focus:border-transparent transition-all placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Button: Sign in */}
                <div className="pt-1 space-y-2.5">
                  <button
                    type="submit"
                    id="btn-submit-login"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#0b5736] hover:bg-[#08482d] active:bg-[#063923] text-white font-semibold text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                    <span>Sign in</span>
                  </button>

                  {/* Secondary Button: Try with demo farm records */}
                  <button
                    type="button"
                    id="btn-explore-demo-farm"
                    onClick={enterDemoMode}
                    className="w-full py-2.5 px-4 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:border-stone-400"
                  >
                    <span>Try with demo farm records</span>
                  </button>
                </div>
              </form>

              {/* Footer Switcher */}
              <div className="pt-2 text-center">
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  New to Smart Goat?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                    className="text-[#0b5736] dark:text-emerald-400 font-semibold underline hover:text-[#08482d] dark:hover:text-emerald-300 cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* VIEW B: SIGNUP FORM */}
          {/* ========================================================= */}
          {mode === 'signup' && (
            <>
              <div>
                <h1 className="text-2xl sm:text-[26px] font-bold text-stone-900 dark:text-white tracking-tight leading-tight">
                  Create account
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Start tracking your goat herd and farm records.
                </p>
              </div>

              {/* Feedback Notifications */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {infoMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateAccount} className="space-y-3.5">
                {/* Farm Name Field */}
                <div>
                  <label
                    htmlFor="input-signup-farm-name"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Farm Name
                  </label>
                  <input
                    id="input-signup-farm-name"
                    type="text"
                    placeholder="e.g. Greenwood Goat Ranch"
                    value={farmName}
                    onChange={e => setFarmName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5736] focus:border-transparent transition-all placeholder:text-stone-400"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="input-signup-email"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="input-signup-email"
                    type="email"
                    placeholder="name@farm.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5736] focus:border-transparent transition-all placeholder:text-stone-400"
                  />
                </div>

                {/* Password Field with Policy Feedback */}
                <div>
                  <label
                    htmlFor="input-signup-password"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="input-signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create secure password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5736] focus:border-transparent transition-all placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password requirements indicators if user has started typing */}
                  {password.length > 0 && (
                    <div className="mt-2 p-2.5 rounded-lg bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 text-[11px] space-y-1 text-stone-600 dark:text-stone-400">
                      <div className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300 pb-1 border-b border-stone-200 dark:border-stone-750">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0b5736] dark:text-emerald-400" />
                        <span>Password Requirements:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-0.5">
                        <div className={`flex items-center gap-1 ${passwordPolicy.minLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                          {passwordPolicy.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-stone-400" />}
                          <span>6+ characters</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordPolicy.hasCapital ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                          {passwordPolicy.hasCapital ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-stone-400" />}
                          <span>Uppercase (A-Z)</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordPolicy.hasSmall ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                          {passwordPolicy.hasSmall ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-stone-400" />}
                          <span>Lowercase (a-z)</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordPolicy.hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                          {passwordPolicy.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-stone-400" />}
                          <span>Number (0-9)</span>
                        </div>
                        <div className={`flex items-center gap-1 col-span-2 ${passwordPolicy.hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                          {passwordPolicy.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-stone-400" />}
                          <span>Special character (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Button: Create account */}
                <div className="pt-1 space-y-2.5">
                  <button
                    type="submit"
                    id="btn-submit-signup"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#0b5736] hover:bg-[#08482d] active:bg-[#063923] text-white font-semibold text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                    <span>Create account</span>
                  </button>

                  <button
                    type="button"
                    onClick={enterDemoMode}
                    className="w-full py-2.5 px-4 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:border-stone-400"
                  >
                    <span>Try with demo farm records</span>
                  </button>
                </div>
              </form>

              {/* Footer Switcher */}
              <div className="pt-2 text-center">
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                    className="text-[#0b5736] dark:text-emerald-400 font-semibold underline hover:text-[#08482d] dark:hover:text-emerald-300 cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* VIEW C: FORGOT PASSWORD */}
          {/* ========================================================= */}
          {mode === 'reset' && (
            <>
              <div>
                <h1 className="text-2xl sm:text-[26px] font-bold text-stone-900 dark:text-white tracking-tight leading-tight">
                  Reset password
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Enter your registered email to receive a password reset link.
                </p>
              </div>

              {/* Feedback Notifications */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {infoMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label
                    htmlFor="input-reset-email"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="input-reset-email"
                    type="email"
                    placeholder="name@farm.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5736] focus:border-transparent transition-all placeholder:text-stone-400"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    id="btn-send-reset-link"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#0b5736] hover:bg-[#08482d] active:bg-[#063923] text-white font-semibold text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                    <span>Send password reset link</span>
                  </button>
                </div>
              </form>

              {/* Footer Switcher */}
              <div className="pt-2 text-center">
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  Remembered your password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                    className="text-[#0b5736] dark:text-emerald-400 font-semibold underline hover:text-[#08482d] dark:hover:text-emerald-300 cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
