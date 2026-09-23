import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Lock,
  Mail,
  Home,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogIn,
} from 'lucide-react';
import { evaluatePasswordPolicy } from '../utils/passwordPolicy';

export const AuthView: React.FC = () => {
  const { login, signup, resetPassword, enterDemoMode } = useFarm();
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
          setTimeout(() => resolve({ success: false, error: 'Sign-in request timed out. Please check your internet connection and retry.' }), 12000)
        )
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

  // Create account: immediate creation and instant sign-in without email verification
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

    // Strict Password Policy Enforcement:
    // 6 minimum, capital letter, special character, number, small letter
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
      setErrorMsg(err.message || 'An unexpected error occurred during account creation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Two-Column Farm Layout */}
      <div className="w-full max-w-5xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT COLUMN: Clean Brand Identity */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-950 p-8 sm:p-10 text-white flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-emerald-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-0 -ml-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/20 shadow-inner shrink-0">
                <img src="/app.png" alt="Smart Goat Management" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Farm Management System
                </span>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Smart Goat Management
                </h1>
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Simple & Efficient Goat Farm Records
              </h2>
              <p className="mt-3 text-sm text-emerald-200/80 leading-relaxed">
                A simple and reliable digital management tool for your farm. Track your goat herd records, health checkups, breeding dates, milk yields, and farm expenses and sales.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Authentication Form */}
        <div className="lg:col-span-7 bg-stone-900 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">

            {/* Mode Switcher Tabs */}
            {mode !== 'reset' && (
              <div className="flex bg-stone-800 p-1 rounded-2xl border border-stone-700 text-xs font-semibold">
                <button
                  type="button"
                  id="tab-auth-login"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-center transition-all ${
                    mode === 'login'
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Sign In to Farm
                </button>
                <button
                  type="button"
                  id="tab-auth-signup"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-center transition-all ${
                    mode === 'signup'
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Create Farm Account
                </button>
              </div>
            )}

            {/* Notification & Alerts */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-2xl flex items-start gap-2.5 leading-relaxed animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{errorMsg}</span>
                  {mode === 'login' && (
                    <div className="mt-2.5 pt-2 border-t border-rose-900/60 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('reset');
                          setErrorMsg('');
                        }}
                        className="text-amber-300 font-semibold hover:underline"
                      >
                        Forgot password? Reset it here →
                      </button>
                      <span className="text-stone-500">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setErrorMsg('');
                        }}
                        className="text-emerald-400 font-semibold hover:underline"
                      >
                        Create a new farm account →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {infoMsg && (
              <div className="p-3.5 bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs rounded-2xl flex items-center gap-2.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW A: SIGN IN FORM */}
            {/* ========================================================= */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Sign In
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                    <input
                      id="input-login-email"
                      type="email"
                      placeholder="farmer@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-stone-300">
                      Password
                    </label>
                    <button
                      type="button"
                      id="btn-to-reset-mode"
                      onClick={() => {
                        setMode('reset');
                        setErrorMsg('');
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                    <input
                      id="input-login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button with enhanced loading animation */}
                <div className="space-y-2">
                  {isLoading && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center justify-center gap-2.5 animate-pulse shadow-inner">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span className="font-semibold tracking-wide">Authenticating farm credentials, please wait...</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="btn-submit-login"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait relative overflow-hidden"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span className="tracking-wide">Signing In...</span>
                      </div>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Demo Mode Action */}
                <div className="pt-3 border-t border-stone-800 flex items-center justify-center">
                  <button
                    type="button"
                    id="btn-explore-demo-farm"
                    onClick={enterDemoMode}
                    className="text-xs text-stone-400 hover:text-stone-200 underline flex items-center gap-1"
                  >
                    <span>Or explore with local demo farm records</span>
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* VIEW B: SIGNUP FORM WITH PASSWORD POLICIES */}
            {/* ========================================================= */}
            {mode === 'signup' && (
              <form onSubmit={handleCreateAccount} className="space-y-3.5">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Create Farm Account
                  </h3>
                </div>

                {/* Farm Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Farm Name *
                  </label>
                  <div className="relative">
                    <Home className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                    <input
                      id="input-signup-farm-name"
                      type="text"
                      placeholder="e.g. Greenwood Goat Farm"
                      value={farmName}
                      onChange={e => setFarmName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                    <input
                      id="input-signup-email"
                      type="email"
                      placeholder="farmer@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                    <input
                      id="input-signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create secure password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-9 py-2 bg-stone-800 border text-white rounded-xl text-sm focus:outline-none focus:ring-2 placeholder:text-stone-500 transition-all ${
                        password.length === 0
                          ? 'border-stone-700 focus:ring-emerald-500'
                          : passwordPolicy.isValid
                          ? 'border-emerald-500/80 focus:ring-emerald-500'
                          : 'border-amber-500/60 focus:ring-amber-500'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-stone-400 hover:text-stone-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Password Policy as Just a Clean List */}
                <div className="text-xs text-stone-400 px-1">
                  <ul className="list-disc list-inside space-y-1 text-xs text-stone-400">
                    <li className={passwordPolicy.minLength ? 'text-emerald-400' : ''}>
                      Minimum 6 characters
                    </li>
                    <li className={passwordPolicy.hasCapital ? 'text-emerald-400' : ''}>
                      At least one uppercase letter (A-Z)
                    </li>
                    <li className={passwordPolicy.hasSmall ? 'text-emerald-400' : ''}>
                      At least one lowercase letter (a-z)
                    </li>
                    <li className={passwordPolicy.hasNumber ? 'text-emerald-400' : ''}>
                      At least one number (0-9)
                    </li>
                    <li className={passwordPolicy.hasSpecial ? 'text-emerald-400' : ''}>
                      At least one special character (!@#$%^&*...)
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  id="btn-create-farm-account"
                  disabled={isLoading || (password.length > 0 && !passwordPolicy.isValid)}
                  className="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-700 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="text-xs text-stone-400 hover:text-stone-200"
                  >
                    Already have an account? <span className="text-emerald-400 font-semibold underline">Sign In</span>
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* VIEW D: FORGOT PASSWORD */}
            {/* ========================================================= */}
            {mode === 'reset' && (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Reset Farm Password
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Enter your registered email address and we'll dispatch a secure password reset link.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                    <input
                      id="input-reset-email"
                      type="email"
                      placeholder="farmer@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-send-reset-link"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <span>Send Password Reset Link</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    ← Return to Sign In
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
