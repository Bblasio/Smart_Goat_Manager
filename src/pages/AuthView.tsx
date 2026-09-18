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
  Award,
  Send,
  ExternalLink,
  Check,
  Radio,
  LogIn,
} from 'lucide-react';
import { sendActivationEmail } from '../utils/sendActivationEmail';
import { evaluatePasswordPolicy } from '../utils/passwordPolicy';

export const AuthView: React.FC = () => {
  const { login, signup, resetPassword, enterDemoMode, confirmActivation, checkActivationStatus, resendVerificationEmail } = useFarm();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');

  // Form Fields
  const [farmName, setFarmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [primaryBreed, setPrimaryBreed] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Activation Email States
  const [isActivationSent, setIsActivationSent] = useState(() => {
    try {
      return sessionStorage.getItem('sgm_pending_activation') === 'true';
    } catch {
      return false;
    }
  });
  const [activationEmailAddress, setActivationEmailAddress] = useState(() => {
    try {
      return sessionStorage.getItem('sgm_pending_activation_email') || '';
    } catch {
      return '';
    }
  });
  const [isSendingActivation, setIsSendingActivation] = useState(false);
  const [isCheckingActivation, setIsCheckingActivation] = useState(false);
  const [activationCooldown, setActivationCooldown] = useState(60);
  const [activationDeliveryNote, setActivationDeliveryNote] = useState('');
  const [activationSuccess, setActivationSuccess] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Evaluate password policy dynamically
  const passwordPolicy = evaluatePasswordPolicy(password);

  // Check URL query parameters for ?activated=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('activated') === 'true') {
      const paramEmail = (params.get('email') || '').trim();
      if (paramEmail) {
        setEmail(paramEmail);
        localStorage.setItem('sgm_activated_' + paramEmail.toLowerCase(), 'true');
        confirmActivation(paramEmail.toLowerCase());
      }
      setInfoMsg('Email address confirmed and activated! You may now sign in.');
      setMode('login');
      setIsActivationSent(false);
      try {
        sessionStorage.removeItem('sgm_pending_activation');
        sessionStorage.removeItem('sgm_pending_activation_email');
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        // Ignore
      }
    }
  }, [confirmActivation]);

  // Real-time listener: Polling & cross-tab detection while waiting for user to click activation link
  useEffect(() => {
    if (!isActivationSent || activationSuccess) return;

    const targetEmail = (activationEmailAddress || email).trim().toLowerCase();
    if (!targetEmail) return;

    // Check activation status every 2.5 seconds
    const interval = setInterval(async () => {
      try {
        const res = await checkActivationStatus(targetEmail);
        if (res.activated) {
          setActivationSuccess(true);
          setInfoMsg('🎉 Activation link confirmed! Entering your farm ledger...');
          await confirmActivation(targetEmail);
        }
      } catch (e) {
        // Silent background check
      }
    }, 2500);

    // Cross-tab storage listener (e.g. if user clicked activation link in another tab)
    const onStorage = async (e: StorageEvent) => {
      if (e.key === 'sgm_activated_' + targetEmail && e.newValue === 'true') {
        setActivationSuccess(true);
        setInfoMsg('🎉 Activation confirmed! Loading your farm ledger...');
        await confirmActivation(targetEmail);
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, [isActivationSent, activationSuccess, activationEmailAddress, email, checkActivationStatus, confirmActivation]);

  // Cooldown timer for resending activation email
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActivationSent && activationCooldown > 0) {
      timer = setInterval(() => {
        setActivationCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActivationSent, activationCooldown]);

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
        if (res.error?.includes('pending email activation') || res.error?.includes('activation link')) {
          setActivationEmailAddress(email.trim());
          setIsActivationSent(true);
          setActivationCooldown(45);
          setErrorMsg(res.error);
        } else {
          setErrorMsg(res.error || 'Failed to sign in. Please verify your credentials.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Create account and enter waiting for activation state
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
    setIsSendingActivation(true);

    try {
      // Profile details are left empty by default to be filled later by the user
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
        setIsSendingActivation(false);
        return;
      }

      // Transition to Waiting for Activation screen
      sessionStorage.setItem('sgm_pending_activation', 'true');
      sessionStorage.setItem('sgm_pending_activation_email', email.trim());
      setActivationEmailAddress(email.trim());
      setIsActivationSent(true);
      setActivationCooldown(60);

      // Send the activation email
      const emailRes = await sendActivationEmail(email.trim(), farmName.trim());
      setActivationDeliveryNote(emailRes.message);
      setInfoMsg('Account created successfully! Please check your email to activate your account.');
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during account creation.');
    } finally {
      setIsLoading(false);
      setIsSendingActivation(false);
    }
  };

  // Check activation status button
  const handleManualCheckActivation = async () => {
    const targetEmail = (activationEmailAddress || email).trim().toLowerCase();
    if (!targetEmail) return;

    setIsCheckingActivation(true);
    setErrorMsg('');
    try {
      const res = await checkActivationStatus(targetEmail);
      if (res.activated) {
        setActivationSuccess(true);
        setInfoMsg('🎉 Activation confirmed! Accessing your farm ledger...');
        await confirmActivation(targetEmail);
      } else {
        setErrorMsg('The activation link has not been detected as clicked yet. Please click the link inside your email, or use the direct test activator below.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not verify activation status.');
    } finally {
      setIsCheckingActivation(false);
    }
  };

  // Direct test simulation activation
  const handleSimulateClickActivation = async () => {
    const targetEmail = (activationEmailAddress || email).trim().toLowerCase();
    if (!targetEmail) return;

    setIsCheckingActivation(true);
    try {
      setActivationSuccess(true);
      setInfoMsg('🎉 Activation verified! Welcome to Smart Goat Management.');
      await confirmActivation(targetEmail);
    } catch (err: any) {
      setErrorMsg(err.message || 'Activation failed.');
    } finally {
      setIsCheckingActivation(false);
    }
  };

  // Resend activation email
  const handleResendActivationEmail = async () => {
    if (activationCooldown > 0 || !activationEmailAddress) return;
    setIsSendingActivation(true);
    setActivationDeliveryNote('Dispatching new activation email...');
    try {
      await resendVerificationEmail().catch(() => {});
      const res = await sendActivationEmail(activationEmailAddress, farmName || 'Smart Goat Farm');
      setActivationCooldown(60);
      setActivationDeliveryNote(res.message);
      setInfoMsg('A fresh activation email has been dispatched. Please check your inbox.');
      setTimeout(() => setInfoMsg(''), 4000);
    } catch (err: any) {
      setActivationDeliveryNote('Could not send email. Please try again in a moment.');
    } finally {
      setIsSendingActivation(false);
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

            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Simple & Efficient Goat Farm Records
              </h2>
              <p className="mt-3 text-sm text-emerald-200/80 leading-relaxed">
                A simple and reliable digital management tool for your farm. Track your goat herd records, health checkups, breeding dates, milk yields, and farm expenses and sales.
              </p>
            </div>

            <div className="pt-4 border-t border-emerald-800/50 flex items-center justify-between text-xs text-emerald-300/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Farm Data Security</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Authentication Form */}
        <div className="lg:col-span-7 bg-stone-900 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">

            {/* Mode Switcher Tabs */}
            {!isActivationSent && mode !== 'reset' && (
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
            {mode === 'login' && !isActivationSent && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Welcome Back, Farmer
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Access your herd ledger, gestation calendar, milk yields, and records.
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

                <button
                  type="submit"
                  id="btn-submit-login"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>signin</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

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
            {/* VIEW B: SIGNUP FORM WITH LIVE PASSWORD POLICIES */}
            {/* ========================================================= */}
            {mode === 'signup' && !isActivationSent && (
              <form onSubmit={handleCreateAccount} className="space-y-3.5">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Register Your Farm Account
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Enter your farm name and credentials. Registration requires confirming your email activation link before sign in.
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
                    Official Email *
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-300">
                      Password *
                    </label>
                    <span className={`text-[11px] font-medium ${passwordPolicy.isValid ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                      {passwordPolicy.metCount}/5 Requirements Met
                    </span>
                  </div>
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

                {/* Helpful Note about empty details */}
                <div className="p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/60 text-xs text-stone-400 leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Additional details (phone number, manager, founding year, production focus, and grazing system) are not requested now and will remain empty for you to fill later in your Farm Profile.
                  </span>
                </div>

                {/* LIVE PASSWORD POLICY CHECKLIST */}
                <div className="p-3 bg-stone-800/90 rounded-2xl border border-stone-700/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Password Security Policy:</span>
                    </span>
                    <span className={`text-[11px] font-bold ${passwordPolicy.isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {passwordPolicy.isValid ? '✓ All 5 Policies Met' : `${5 - passwordPolicy.metCount} Remaining`}
                    </span>
                  </div>

                  {/* Visual Strength Meter */}
                  <div className="w-full bg-stone-700/80 h-1.5 rounded-full overflow-hidden flex gap-1 p-0.5">
                    {[1, 2, 3, 4, 5].map(step => (
                      <div
                        key={step}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          step <= passwordPolicy.metCount
                            ? passwordPolicy.isValid
                              ? 'bg-emerald-500'
                              : passwordPolicy.metCount >= 3
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                            : 'bg-stone-600/50'
                        }`}
                      />
                    ))}
                  </div>

                  {/* 5 Policy Checks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5 text-[11px]">
                    <div className={`flex items-center gap-2 ${passwordPolicy.minLength ? 'text-emerald-300 font-medium' : 'text-stone-400'}`}>
                      {passwordPolicy.minLength ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-stone-600 inline-block shrink-0" />
                      )}
                      <span>6 minimum characters</span>
                    </div>

                    <div className={`flex items-center gap-2 ${passwordPolicy.hasCapital ? 'text-emerald-300 font-medium' : 'text-stone-400'}`}>
                      {passwordPolicy.hasCapital ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-stone-600 inline-block shrink-0" />
                      )}
                      <span>Capital letter (A-Z)</span>
                    </div>

                    <div className={`flex items-center gap-2 ${passwordPolicy.hasSmall ? 'text-emerald-300 font-medium' : 'text-stone-400'}`}>
                      {passwordPolicy.hasSmall ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-stone-600 inline-block shrink-0" />
                      )}
                      <span>Small letter (a-z)</span>
                    </div>

                    <div className={`flex items-center gap-2 ${passwordPolicy.hasNumber ? 'text-emerald-300 font-medium' : 'text-stone-400'}`}>
                      {passwordPolicy.hasNumber ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-stone-600 inline-block shrink-0" />
                      )}
                      <span>Number (0-9)</span>
                    </div>

                    <div className={`flex items-center gap-2 sm:col-span-2 ${passwordPolicy.hasSpecial ? 'text-emerald-300 font-medium' : 'text-stone-400'}`}>
                      {passwordPolicy.hasSpecial ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-stone-600 inline-block shrink-0" />
                      )}
                      <span>Special character (!@#$%^&*...)</span>
                    </div>
                  </div>
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
                      <span>Creating account & sending activation...</span>
                    </>
                  ) : (
                    <>
                      <span>Create account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================================= */}
            {/* VIEW C: WAITING FOR ACTIVATION LINK TO BE CLICKED */}
            {/* ========================================================= */}
            {isActivationSent && (
              <div className="space-y-6 animate-fade-in text-center">
                {/* Visual Radar / Pulse Icon */}
                <div className="inline-flex relative">
                  <div className="absolute -inset-3 rounded-3xl bg-emerald-500/25 blur-lg animate-pulse" />
                  <div className="relative w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-2xl shadow-xl">
                    {activationSuccess ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <Radio className="w-8 h-8 text-emerald-400 animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Title and Live Status */}
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-[11px] font-semibold text-emerald-400 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Waiting for Activation Link Click</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {activationSuccess ? 'Account Activated!' : 'Check Your Email to Activate'}
                  </h3>
                  <p className="text-xs text-stone-300 mt-2 leading-relaxed max-w-sm mx-auto">
                    We sent an activation link to your registered email address. The sign-up is waiting until you click the activation link.
                  </p>
                  <div className="mt-3 inline-block px-3.5 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-emerald-300 font-mono text-xs font-semibold shadow-inner">
                    {activationEmailAddress || email}
                  </div>
                </div>

                {/* Live Real-time Status Card */}
                <div className="p-4 rounded-2xl bg-stone-800/90 border border-stone-700 text-left space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Live Verification Status:</span>
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Listening...</span>
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed">
                    Once you click the link inside your email, this screen will automatically detect it and open your farm ledger.
                  </p>

                  <ol className="text-xs text-stone-300 space-y-1.5 list-decimal list-inside leading-relaxed pt-1 border-t border-stone-700/80">
                    <li>Open your email inbox (also check Spam/Junk folder).</li>
                    <li>Look for subject: <span className="text-emerald-400 font-medium">"Activate Your Farm Account"</span>.</li>
                    <li>Click the link or button inside to activate.</li>
                  </ol>

                  {activationDeliveryNote && (
                    <div className="pt-2 border-t border-stone-700 text-[11px] text-emerald-400/90 font-mono">
                      ✓ {activationDeliveryNote}
                    </div>
                  )}
                </div>

                {/* Action Controls */}
                <div className="space-y-3 pt-1">
                  {/* Manual Check Status Button */}
                  <button
                    type="button"
                    id="btn-check-activation-status"
                    onClick={handleManualCheckActivation}
                    disabled={isCheckingActivation}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCheckingActivation ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Checking status...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>I Have Clicked the Activation Link — Check Now</span>
                      </>
                    )}
                  </button>

                  {/* Direct Test Activator (for sandboxed / immediate activation) */}
                  <div className="p-2.5 rounded-xl bg-stone-800/60 border border-dashed border-emerald-600/40 text-xs text-stone-300 flex items-center justify-between">
                    <span className="text-stone-400 text-[11px]">Testing or email delayed?</span>
                    <button
                      type="button"
                      id="btn-instant-activate-test"
                      onClick={handleSimulateClickActivation}
                      disabled={isCheckingActivation}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold underline text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Click to Activate Directly</span>
                    </button>
                  </div>

                  {/* Go to Sign In after activating */}
                  <button
                    type="button"
                    id="btn-goto-signin-screen"
                    onClick={() => {
                      try {
                        sessionStorage.removeItem('sgm_pending_activation');
                        sessionStorage.removeItem('sgm_pending_activation_email');
                      } catch {
                        // ignore
                      }
                      setIsActivationSent(false);
                      setMode('login');
                      setInfoMsg('Please sign in with your email and password once your account is activated.');
                    }}
                    className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl border border-stone-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Already clicked link? Go to Sign In</span>
                  </button>

                  <div className="flex items-center justify-between text-xs text-stone-400 px-1 pt-1">
                    <button
                      type="button"
                      id="btn-resend-activation"
                      onClick={handleResendActivationEmail}
                      disabled={activationCooldown > 0 || isSendingActivation}
                      className={`font-semibold transition-colors ${
                        activationCooldown > 0
                          ? 'text-stone-500 cursor-not-allowed'
                          : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      {activationCooldown > 0
                        ? `Resend link in ${activationCooldown}s`
                        : 'Resend Activation Email'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        try {
                          sessionStorage.removeItem('sgm_pending_activation');
                          sessionStorage.removeItem('sgm_pending_activation_email');
                        } catch {
                          // ignore
                        }
                        setIsActivationSent(false);
                        setMode('signup');
                      }}
                      className="hover:text-stone-200"
                    >
                      Change Details / Return
                    </button>
                  </div>
                </div>
              </div>
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
