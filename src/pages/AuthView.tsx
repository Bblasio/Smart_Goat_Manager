import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Lock,
  Mail,
  Home,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
  MapPin,
  Maximize2,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Milk,
  TrendingUp,
  Award
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, signup, resetPassword, enterDemoMode } = useFarm();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');

  // Form Fields
  const [farmName, setFarmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [primaryBreed, setPrimaryBreed] = useState('Boer & Dairy (Saanen)');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification States
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(60);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOtpStep && otpCooldown > 0) {
      timer = setInterval(() => {
        setOtpCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpStep, otpCooldown]);

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
      const res = await login(email.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Initiate signup & dispatch OTP
  const handleInitiateSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!farmName.trim()) {
      setErrorMsg('Please enter your farm name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (!location.trim()) {
      setErrorMsg('Please enter your farm location (e.g. Nakuru, Kenya).');
      return;
    }
    if (!farmSize.trim()) {
      setErrorMsg('Please specify your farm size (e.g. 20 Acres).');
      return;
    }

    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setOtpCooldown(60);
    setIsOtpStep(true);
  };

  // Step 2: Resend OTP
  const handleResendOtp = () => {
    if (otpCooldown > 0) return;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newCode);
    setEnteredOtp('');
    setOtpCooldown(60);
    setInfoMsg('A new verification code has been dispatched to your email.');
    setTimeout(() => setInfoMsg(''), 4000);
  };

  // Step 3: Confirm OTP & Finalize Account Creation
  const handleVerifyOtpAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setErrorMsg('Invalid verification code. Please check the code dispatched to your email.');
      return;
    }

    setIsLoading(true);
    try {
      const profileDetails = {
        owner_name: ownerName.trim() || undefined,
        location: location.trim(),
        farm_size: farmSize.trim(),
        primary_breed: primaryBreed.trim() || undefined,
        phone: phone.trim() || undefined,
        founded_year: new Date().getFullYear().toString(),
      };

      const res = await signup(email.trim(), password, farmName.trim(), profileDetails);
      if (!res.success) {
        setErrorMsg(res.error || 'Could not complete registration. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during account creation.');
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

  const handleQuickDemo = () => {
    enterDemoMode();
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container with High-Value Two-Column Farm Layout */}
      <div className="w-full max-w-5xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT COLUMN: Clean Brand Identity */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-950 p-8 sm:p-10 text-white flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-emerald-800/40 relative overflow-hidden">
          {/* Ambient subtle light glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 left-0 -ml-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6 max-w-sm">
            {/* Logo & Platform Tag */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-inner">
                🐐
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

            {/* Headline & Description */}
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

        {/* RIGHT COLUMN: Interactive Authentication & OTP Form */}
        <div className="lg:col-span-7 bg-stone-900 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">

            {/* Mode Switcher Tabs */}
            {!isOtpStep && mode !== 'reset' && (
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
                  {mode === 'login' && errorMsg.includes('Invalid') && (
                    <div className="mt-2 pt-2 border-t border-rose-900/60 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setErrorMsg('');
                        }}
                        className="text-emerald-400 font-bold hover:underline"
                      >
                        Create a new farm account with this email →
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
            {mode === 'login' && !isOtpStep && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Welcome Back, Farmer
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Access your real-time herd ledger, gestation calendar, and sales records.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                    <input
                      id="input-login-email"
                      type="email"
                      placeholder="e.g. ochiengblasio@gmail.com"
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
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-login"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <span className="text-xs text-stone-400">Need to evaluate first? </span>
                  <button
                    type="button"
                    id="btn-quick-demo"
                    onClick={handleQuickDemo}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline inline-flex items-center gap-1"
                  >
                    <span>Launch Sample Demo Farm</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* VIEW B: SIGNUP STEP 1 — COLLECT FARM INFORMATION */}
            {/* ========================================================= */}
            {mode === 'signup' && !isOtpStep && (
              <form onSubmit={handleInitiateSignup} className="space-y-3.5">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Create Your Farm Profile
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Provide your farm location & size to initialize your dedicated farm ledger.
                  </p>
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
                      placeholder="e.g. Green Pastures Boer & Dairy Farm"
                      value={farmName}
                      onChange={e => setFarmName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                      required
                    />
                  </div>
                </div>

                {/* Location & Size (2 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Farm Location (County/Region) *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                      <input
                        id="input-signup-location"
                        type="text"
                        placeholder="e.g. Nakuru, Kenya"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Farm Size / Acreage *
                    </label>
                    <div className="relative">
                      <Maximize2 className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                      <input
                        id="input-signup-size"
                        type="text"
                        placeholder="e.g. 25 Acres or 10 Ha"
                        value={farmSize}
                        onChange={e => setFarmSize(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Owner Name & Primary Breed */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Owner / Manager Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                      <input
                        id="input-signup-owner"
                        type="text"
                        placeholder="e.g. Blasio Ochieng"
                        value={ownerName}
                        onChange={e => setOwnerName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Primary Goat Breeds
                    </label>
                    <div className="relative">
                      <Award className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                      <input
                        id="input-signup-breed"
                        type="text"
                        placeholder="e.g. Boer, Galla, Saanen"
                        value={primaryBreed}
                        onChange={e => setPrimaryBreed(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Email & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Official Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                      <input
                        id="input-signup-email"
                        type="email"
                        placeholder="e.g. farmer@farm.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Password (min 6 chars) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                      <input
                        id="input-signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-9 py-2 bg-stone-800 border border-stone-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500"
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
                </div>

                <button
                  type="submit"
                  id="btn-proceed-to-otp"
                  className="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Verify Email & Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* ========================================================= */}
            {/* VIEW C: SIGNUP STEP 2 — EMAIL OTP CONFIRMATION */}
            {/* ========================================================= */}
            {mode === 'signup' && isOtpStep && (
              <form onSubmit={handleVerifyOtpAndCreate} className="space-y-5 animate-fade-in">
                <div className="text-center">
                  <div className="inline-flex w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 items-center justify-center text-xl mb-3 border border-emerald-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Verify Your Farm Email
                  </h3>
                  <p className="text-xs text-stone-300 mt-1">
                    We sent a 6-digit confirmation OTP code to <strong className="text-emerald-400">{email}</strong>
                  </p>
                </div>

                {/* Email Dispatch Notice */}
                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 text-stone-200 text-xs space-y-2 shadow-inner">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Verification Code Dispatched</span>
                  </div>
                  <p className="text-stone-300 text-xs leading-relaxed">
                    A 6-digit verification code has been sent to <strong className="text-white font-semibold">{email}</strong>. Please check your email inbox (and spam or junk folder) and enter the code below to confirm and activate your farm account.
                  </p>
                </div>

                {/* OTP Input Field */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 text-center mb-2">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    id="input-otp-code"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={enteredOtp}
                    onChange={e => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full text-center tracking-[0.4em] font-mono text-2xl py-3 bg-stone-800 border border-stone-700 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                    autoFocus
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    type="submit"
                    id="btn-confirm-otp"
                    disabled={isLoading || enteredOtp.length !== 6}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Activating Farm Account...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Activate Farm</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
                    <button
                      type="button"
                      id="btn-back-to-details"
                      onClick={() => setIsOtpStep(false)}
                      className="hover:text-stone-200"
                    >
                      ← Back to edit farm details
                    </button>

                    <button
                      type="button"
                      id="btn-resend-otp"
                      onClick={handleResendOtp}
                      disabled={otpCooldown > 0}
                      className={`font-semibold ${
                        otpCooldown > 0
                          ? 'text-stone-500 cursor-not-allowed'
                          : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
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
                      placeholder="e.g. ochiengblasio@gmail.com"
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
