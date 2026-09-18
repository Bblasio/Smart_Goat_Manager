import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { ArrowRight, Eye, EyeOff, Home, Loader2, Lock, Mail, MapPin, Maximize2, User } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, signup, resetPassword, enterDemoMode } = useFarm();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [farmName, setFarmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [primaryBreed, setPrimaryBreed] = useState('Boer & Dairy (Saanen)');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearMessages = () => { setErrorMsg(''); setInfoMsg(''); };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();
    if (!email.trim() || !password) { setErrorMsg('Please enter your email and password.'); return; }
    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.success) setErrorMsg(result.error || 'Unable to sign in.');
    } finally { setIsLoading(false); }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();
    if (!farmName.trim()) { setErrorMsg('Please enter your farm name.'); return; }
    if (!email.trim() || !email.includes('@')) { setErrorMsg('Please enter a valid email address.'); return; }
    if (password.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    if (!location.trim() || !farmSize.trim()) { setErrorMsg('Please provide your farm location and size.'); return; }
    setIsLoading(true);
    try {
      const result = await signup(email.trim(), password, farmName.trim(), {
        owner_name: ownerName.trim() || undefined,
        location: location.trim(),
        farm_size: farmSize.trim(),
        primary_breed: primaryBreed.trim() || undefined,
        phone: phone.trim() || undefined,
        founded_year: new Date().getFullYear().toString(),
      });
      if (!result.success) setErrorMsg(result.error || 'Unable to create your account.');
    } catch (error: any) { setErrorMsg(error?.message || 'Unable to create your account.'); }
    finally { setIsLoading(false); }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();
    if (!email.trim()) { setErrorMsg('Please enter your email address.'); return; }
    setIsLoading(true);
    try {
      const result = await resetPassword(email.trim());
      if (result.success) { setInfoMsg('Password reset link sent to your email.'); setMode('login'); }
      else setErrorMsg(result.error || 'Unable to send the reset email.');
    } finally { setIsLoading(false); }
  };

  const inputClass = 'w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-500';
  const iconInput = (icon: React.ReactNode, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="relative"><span className="absolute left-3.5 top-3.5 text-stone-500">{icon}</span><input {...props} className={`${inputClass} pl-10`} /></div>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 p-4 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-stone-800 bg-stone-900 shadow-2xl lg:grid-cols-5">
        <section className="hidden flex-col justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-950 p-10 lg:col-span-2 lg:flex">
          <div className="mb-6 text-4xl">🐐</div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Farm Management System</p>
          <h1 className="mt-2 text-3xl font-extrabold">Smart Goat Management</h1>
          <p className="mt-4 text-sm leading-relaxed text-emerald-100/80">Track your herd, health, breeding, milk, sales, and expenses in one reliable cloud workspace.</p>
        </section>
        <section className="p-6 sm:p-10 lg:col-span-3">
          <div className="mx-auto max-w-md space-y-6">
            {mode !== 'reset' && <div className="flex rounded-2xl border border-stone-700 bg-stone-800 p-1 text-sm font-semibold">
              <button type="button" onClick={() => { setMode('login'); clearMessages(); }} className={`flex-1 rounded-xl py-2.5 ${mode === 'login' ? 'bg-emerald-600 text-white' : 'text-stone-400'}`}>Sign In</button>
              <button type="button" onClick={() => { setMode('signup'); clearMessages(); }} className={`flex-1 rounded-xl py-2.5 ${mode === 'signup' ? 'bg-emerald-600 text-white' : 'text-stone-400'}`}>Create Account</button>
            </div>}
            {errorMsg && <div className="rounded-xl border border-rose-800 bg-rose-950/60 p-3 text-sm text-rose-300">{errorMsg}</div>}
            {infoMsg && <div className="rounded-xl border border-emerald-800 bg-emerald-950/60 p-3 text-sm text-emerald-300">{infoMsg}</div>}

            {mode === 'login' && <form onSubmit={handleLogin} className="space-y-4">
              <div><h2 className="text-2xl font-bold">Welcome back</h2><p className="mt-1 text-sm text-stone-400">Sign in to access your cloud farm records.</p></div>
              {iconInput(<Mail className="h-4 w-4" />, { id: 'input-login-email', type: 'email', value: email, onChange: e => setEmail(e.target.value), placeholder: 'Email address', required: true })}
              <div className="relative">{iconInput(<Lock className="h-4 w-4" />, { id: 'input-login-password', type: showPassword ? 'text' : 'password', value: password, onChange: e => setPassword(e.target.value), placeholder: 'Password', required: true })}<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-stone-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold hover:bg-emerald-500 disabled:opacity-60">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Sign In</button>
              <button type="button" onClick={() => { setMode('reset'); clearMessages(); }} className="w-full text-sm text-emerald-400 hover:underline">Forgot password?</button>
              <button type="button" onClick={enterDemoMode} className="w-full text-sm text-stone-400 hover:text-white">Try demo mode</button>
            </form>}

            {mode === 'signup' && <form onSubmit={handleSignup} className="space-y-3">
              <div><h2 className="text-2xl font-bold">Create your farm account</h2><p className="mt-1 text-sm text-stone-400">No email OTP is required. Your account is created securely with Firebase Authentication.</p></div>
              {iconInput(<Home className="h-4 w-4" />, { id: 'input-signup-farm-name', type: 'text', value: farmName, onChange: e => setFarmName(e.target.value), placeholder: 'Farm name', required: true })}
              <div className="grid gap-3 sm:grid-cols-2">{iconInput(<MapPin className="h-4 w-4" />, { id: 'input-signup-location', type: 'text', value: location, onChange: e => setLocation(e.target.value), placeholder: 'Farm location', required: true })}{iconInput(<Maximize2 className="h-4 w-4" />, { id: 'input-signup-size', type: 'text', value: farmSize, onChange: e => setFarmSize(e.target.value), placeholder: 'Farm size', required: true })}</div>
              <div className="grid gap-3 sm:grid-cols-2">{iconInput(<User className="h-4 w-4" />, { id: 'input-signup-owner', type: 'text', value: ownerName, onChange: e => setOwnerName(e.target.value), placeholder: 'Owner or manager name' })}{iconInput(<User className="h-4 w-4" />, { id: 'input-signup-breed', type: 'text', value: primaryBreed, onChange: e => setPrimaryBreed(e.target.value), placeholder: 'Primary goat breed' })}</div>
              <div className="grid gap-3 sm:grid-cols-2">{iconInput(<Mail className="h-4 w-4" />, { id: 'input-signup-email', type: 'email', value: email, onChange: e => setEmail(e.target.value), placeholder: 'Email address', required: true })}{iconInput(<User className="h-4 w-4" />, { id: 'input-signup-phone', type: 'tel', value: phone, onChange: e => setPhone(e.target.value), placeholder: 'Phone number' })}</div>
              <div className="relative">{iconInput(<Lock className="h-4 w-4" />, { id: 'input-signup-password', type: showPassword ? 'text' : 'password', value: password, onChange: e => setPassword(e.target.value), placeholder: 'Password (minimum 6 characters)', required: true })}<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-stone-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold hover:bg-emerald-500 disabled:opacity-60">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Create Account</button>
            </form>}

            {mode === 'reset' && <form onSubmit={handleReset} className="space-y-4"><h2 className="text-2xl font-bold">Reset your password</h2>{iconInput(<Mail className="h-4 w-4" />, { id: 'input-reset-email', type: 'email', value: email, onChange: e => setEmail(e.target.value), placeholder: 'Email address', required: true })}<button type="submit" disabled={isLoading} className="w-full rounded-xl bg-emerald-600 py-3 font-bold">{isLoading ? 'Sending...' : 'Send reset link'}</button><button type="button" onClick={() => setMode('login')} className="w-full text-sm text-emerald-400">Return to sign in</button></form>}
          </div>
        </section>
      </div>
    </main>
  );
};
