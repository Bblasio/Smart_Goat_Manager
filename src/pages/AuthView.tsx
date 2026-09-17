import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { Lock, Mail, Home, ArrowRight, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, signup, resetPassword, enterDemoMode } = useFarm();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');

  const [farmName, setFarmName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (!farmName.trim() || !email.trim() || !password) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signup(email.trim(), password, farmName.trim());
      if (!res.success) {
        setErrorMsg(res.error || 'Could not register account. Please try again.');
      }
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

  const handleQuickDemo = () => {
    enterDemoMode();
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-emerald-600 text-white items-center justify-center text-3xl shadow-sm mb-4">
          🐐
        </div>
        <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          Smart Goat Management
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Intelligent Cloud Herd & Breeding Management
        </p>
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Cloud Synchronized</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-6 px-6 sm:px-10 shadow-sm border border-stone-200 rounded-2xl space-y-6">
          {/* Top Mode Tabs: Sign In / Create Account */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              type="button"
              id="tab-auth-login"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                mode === 'login'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="tab-auth-signup"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                mode === 'signup'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl leading-relaxed space-y-2">
              <div className="font-medium">{errorMsg}</div>
              {mode === 'login' && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg('');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg text-rose-900 font-semibold transition-colors"
                  >
                    Create account with this email →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setErrorMsg('');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg text-rose-800 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {infoMsg && (
            <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl leading-relaxed">
              {infoMsg}
            </div>
          )}

          {/* Quick Demo Access Button */}
          <button
            id="btn-quick-demo-login"
            type="button"
            disabled={isLoading}
            onClick={handleQuickDemo}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Launch Demo Farm Account</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-white px-3 text-xs text-stone-400 font-medium uppercase tracking-wider shrink-0">
              Or sign in with your account
            </span>
          </div>

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-email"
                    type="email"
                    placeholder="you@farm.com"
                    value={email}
                    disabled={isLoading}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    disabled={isLoading}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Sign In to Farm</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  id="btn-goto-signup"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                  }}
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  Create New Farm Account
                </button>
                <button
                  type="button"
                  id="btn-goto-reset"
                  onClick={() => {
                    setMode('reset');
                    setErrorMsg('');
                  }}
                  className="text-stone-500 hover:text-stone-800"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Farm Name *
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-signup-farm-name"
                    type="text"
                    placeholder="e.g. Sunny Ridge Goat Farm"
                    value={farmName}
                    disabled={isLoading}
                    onChange={e => setFarmName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-signup-email"
                    type="email"
                    placeholder="you@farm.com"
                    value={email}
                    disabled={isLoading}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password * (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    disabled={isLoading}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                id="btn-submit-signup"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Create Farm Account</span>
              </button>

              <div className="text-center text-xs pt-2">
                <button
                  type="button"
                  id="btn-back-to-login"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="text-stone-500 hover:text-stone-800"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Enter your registered farm email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reset-email"
                    type="email"
                    placeholder="you@farm.com"
                    value={email}
                    disabled={isLoading}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                id="btn-submit-reset"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Send Password Reset Link</span>
              </button>

              <div className="text-center text-xs pt-2">
                <button
                  type="button"
                  id="btn-reset-back-to-login"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="text-stone-500 hover:text-stone-800"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
