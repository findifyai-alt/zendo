import React, { useState } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { ZendoLogo } from './ZendoLogo';
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

interface SupabaseAuthGateProps {
  children: React.ReactNode;
}

export const SupabaseAuthGate: React.FC<SupabaseAuthGateProps> = ({ children }) => {
  const {
    user,
    isLoading,
    isConfigured,
    supabaseUrl,
    supabaseAnonKey,
    updateSupabaseCredentials,
    signIn,
    signUp,
    signInGoogle,
  } = useSupabaseAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Credentials config drawer
  const [showConfig, setShowConfig] = useState(false);
  const [inputUrl, setInputUrl] = useState(supabaseUrl);
  const [inputKey, setInputKey] = useState(supabaseAnonKey);

  // If loading session state, show calm spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0c9256]/10 flex items-center justify-center animate-spin">
            <ZendoLogo className="w-6 h-6 text-[#0c9256]" />
          </div>
          <p className="text-xs font-medium text-slate-500">Checking Supabase session...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render protected content
  if (user) {
    return <>{children}</>;
  }

  // Otherwise, render Supabase Auth Gate (protects all pages)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const { error, user: newUser } = await signUp(email.trim(), password, fullName.trim());
        if (error) {
          setErrorMsg(error.message);
        } else if (newUser && !newUser.confirmed_at) {
          setSuccessMsg('Account created! Please check your email inbox to confirm your account, or sign in.');
        } else {
          setSuccessMsg('Account created successfully! Welcome to Zendo.');
        }
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMsg(error.message);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const { error } = await signInGoogle();
      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      setErrorMsg('Please provide both Project URL and Anon Key.');
      return;
    }
    updateSupabaseCredentials(inputUrl.trim(), inputKey.trim());
    setShowConfig(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col justify-between selection:bg-[#0c9256]/20">
      {/* Top Banner / Navigation */}
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <ZendoLogo className="w-8 h-8 text-[#101c19]" />
          <span className="font-semibold text-lg tracking-tight text-[#101c19]">Zendo</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium ml-2">
            Supabase Protected
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
        >
          <Database className="w-3.5 h-3.5 text-[#0c9256]" />
          <span>{isConfigured ? 'Supabase Connected' : 'Supabase Keys'}</span>
        </button>
      </header>

      {/* Main Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_12px_40px_rgba(16,28,25,0.06)] max-w-md w-full p-7 sm:p-9 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#0c9256]/10 text-[#0c9256] flex items-center justify-center mx-auto mb-2">
              <Lock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#101c19] tracking-tight">
              {mode === 'login' ? 'Sign in to Zendo' : 'Create your Zendo account'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {mode === 'login'
                ? 'Protected by Supabase Auth & Row Level Security (RLS).'
                : 'Sign up to manage clients, proposals, and deliverables.'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#101c19] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#101c19] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              or with email
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jordan Taylor"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0c9256] focus:ring-1 focus:ring-[#0c9256] text-xs text-slate-900 outline-hidden transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0c9256] focus:ring-1 focus:ring-[#0c9256] text-xs text-slate-900 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#0c9256] focus:ring-1 focus:ring-[#0c9256] text-xs text-slate-900 outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-[#0c9256] hover:bg-[#087443] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create Supabase Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Supabase status indicator */}
          <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span>
              {isConfigured ? 'Connected to Supabase Project' : 'Using Demo Supabase Instance'}
            </span>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="text-[#0c9256] hover:underline cursor-pointer ml-1 font-medium"
            >
              Configure keys
            </button>
          </div>
        </div>
      </main>

      {/* Supabase Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#0c9256]" />
                <h3 className="font-display text-base font-bold text-slate-900">
                  Supabase Project Credentials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-medium"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Provide your Supabase URL &amp; Anon Key below or define them in your{' '}
              <code className="text-[#0c9256] font-mono">.env</code> file.
            </p>
            <form onSubmit={handleSaveCredentials} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  required
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Anon (Publishable) Key
                </label>
                <input
                  type="text"
                  required
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0c9256] hover:bg-[#087443] text-white text-xs font-semibold cursor-pointer"
                >
                  Save &amp; Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Zendo Client &amp; Proposal Platform · Secured with Supabase RLS
      </footer>
    </div>
  );
};
