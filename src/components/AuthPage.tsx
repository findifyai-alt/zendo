import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  Lock,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Mail,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ZendoLogo } from './ZendoLogo';
import {
  googleSignIn,
  emailPasswordSignIn,
  emailPasswordSignUp,
  sendPasswordReset,
  ensureUserProfileInFirestore,
  formatAuthError,
} from '../firebase';
import { syncUserToBackend } from '../lib/api';
import founderAvatar from '../assets/images/avatar_team_lead_1791380135632.jpg';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onSuccess: (userName: string, email: string, workspaceName?: string) => void;
  onBackToHome: () => void;
  onOpenDashboard: () => void;
  onOpenCopyKit: () => void;
}

interface PreviewTask {
  id: string;
  title: string;
  tag: string;
  tagStyle: string;
  completed: boolean;
  highlighted?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onSuccess,
  onBackToHome,
  onOpenDashboard,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'email' | 'google'>('email');
  const [workspaceName, setWorkspaceName] = useState('Northstar Studio');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [founderImgError, setFounderImgError] = useState(false);

  const [previewTasks, setPreviewTasks] = useState<PreviewTask[]>([
    {
      id: 'pt-1',
      title: 'Generate AI proposal for Acme Studio ($4,800)',
      tag: 'Proposal',
      tagStyle: 'bg-[#eff3f0] text-[#526058]',
      completed: true,
    },
    {
      id: 'pt-2',
      title: 'Reply to Hannah Lin’s CMS scope question',
      tag: 'Client Chat',
      tagStyle: 'bg-[#e5f0e8] text-[#38634a]',
      completed: true,
    },
    {
      id: 'pt-3',
      title: 'Schedule Orbit Co. retainer review meeting',
      tag: 'Today',
      tagStyle: 'bg-[#faecd8] text-[#986429]',
      completed: false,
      highlighted: true,
    },
  ]);

  const togglePreviewTask = (id: string) => {
    setPreviewTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedPreviewCount =
    previewTasks.filter((t) => t.completed).length + 1;

  const handleGoogleSignIn = async () => {
    setError('');
    setOauthLoading(true);

    try {
      const resolvedWorkspace = workspaceName?.trim() || 'Northstar Studio';
      const cred = await googleSignIn({
        preferredWorkspace: resolvedWorkspace,
      });
      const resolvedName =
        cred.user.displayName?.trim() ||
        cred.user.email?.split('@')[0] ||
        'Findify Ai';
      const resolvedEmail = cred.user.email || 'findifyai@gmail.com';

      setOauthLoading(false);
      onSuccess(resolvedName, resolvedEmail, resolvedWorkspace);

      void ensureUserProfileInFirestore(
        cred.user,
        resolvedName,
        resolvedWorkspace
      ).then((profile) =>
        syncUserToBackend(profile.displayName, profile.workspaceName)
      );
    } catch (err: unknown) {
      setOauthLoading(false);
      setError(formatAuthError(err));
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setEmailLoading(true);
      try {
        await sendPasswordReset(cleanEmail);
        setSuccessMsg(`Password reset instructions have been sent to ${cleanEmail}. Check your inbox.`);
        setEmailLoading(false);
      } catch (err: unknown) {
        setEmailLoading(false);
        setError(formatAuthError(err));
      }
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    setEmailLoading(true);
    const resolvedWorkspace = workspaceName?.trim() || 'Northstar Studio';

    try {
      if (mode === 'signup') {
        const cleanName = fullName?.trim() || cleanEmail.split('@')[0] || 'Zendo User';
        const cred = await emailPasswordSignUp(cleanEmail, password, cleanName, resolvedWorkspace);
        const resolvedName = cred.user.displayName || cleanName;
        setEmailLoading(false);
        onSuccess(resolvedName, cleanEmail, resolvedWorkspace);
        void ensureUserProfileInFirestore(cred.user, resolvedName, resolvedWorkspace).then((profile) =>
          syncUserToBackend(profile.displayName, profile.workspaceName)
        );
      } else {
        const cred = await emailPasswordSignIn(cleanEmail, password, { preferredWorkspace: resolvedWorkspace });
        const resolvedName = cred.user.displayName || cleanEmail.split('@')[0] || 'Zendo User';
        setEmailLoading(false);
        onSuccess(resolvedName, cleanEmail, resolvedWorkspace);
        void ensureUserProfileInFirestore(cred.user, resolvedName, resolvedWorkspace).then((profile) =>
          syncUserToBackend(profile.displayName, profile.workspaceName)
        );
      }
    } catch (err: unknown) {
      setEmailLoading(false);
      setError(formatAuthError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#e9f0eb] text-[#18221d] flex flex-col justify-between p-0 sm:p-3 lg:p-4 selection:bg-[#3b664e]/15 selection:text-[#2b4f3b]">
      {/* =====================================================================
          MAIN ROUNDED APPLICATION WINDOW
      ===================================================================== */}
      <div className="w-full max-w-[1440px] mx-auto flex-1 flex flex-col bg-[#f7f8f5] sm:rounded-[24px] border border-[#d8e2da] shadow-[0_24px_70px_rgba(22,36,28,0.08)] overflow-hidden">
        {/* ===================================================================
            TOP NAVIGATION BAR (3-Zone Contract: Brand — Links — Action Pill)
        =================================================================== */}
        <header className="w-full h-[68px] sm:h-[74px] px-6 sm:px-10 lg:px-12 flex items-center justify-between border-b border-[#e3eae4] bg-[#f7f8f5]/90 backdrop-blur-md z-30 shrink-0">
          {/* Zone 1: Brand Wordmark & Logo */}
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2.5 text-[21px] font-bold tracking-[-0.03em] text-[#18221d] whitespace-nowrap cursor-pointer group"
            title="Return to zendo.ai home"
          >
            <ZendoLogo
              className="w-7 h-7 sm:w-[30px] sm:h-[30px] shrink-0 transition-transform group-hover:scale-105"
              color="#3b664e"
            />
            <span>zendo.ai</span>
          </button>

          {/* Zone 2 & 3: Navigation Links + Switch Mode Pill */}
          <div className="flex items-center gap-6 sm:gap-8">
            <nav
              aria-label="Authentication page navigation"
              className="hidden md:flex items-center gap-7 text-[13.5px] font-medium text-[#4a5650]"
            >
              <button
                type="button"
                onClick={onBackToHome}
                className="hover:text-[#18221d] transition-colors whitespace-nowrap cursor-pointer"
              >
                Website
              </button>
              <button
                type="button"
                onClick={onOpenDashboard}
                className="hover:text-[#18221d] transition-colors whitespace-nowrap cursor-pointer"
              >
                Dashboard
              </button>
            </nav>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : 'signup');
                setError('');
              }}
              className="px-4 py-2 text-[13px] font-semibold text-[#23352b] bg-[#e2ece4] hover:bg-[#d4e3d7] border border-[#cedbd0] rounded-full transition-colors whitespace-nowrap cursor-pointer"
            >
              {mode === 'signup' ? 'Sign In' : 'Get Started Free'}
            </button>
          </div>
        </header>

        {/* ===================================================================
            SPLIT SCREEN CONTENT (LEFT: GOOGLE AUTH ONLY | RIGHT: PRODUCT SHOWCASE)
        =================================================================== */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
          {/* =================================================================
              LEFT COLUMN (6 COLS): GOOGLE AUTHENTICATION FOR ZENDO.AI
          ================================================================= */}
          <div className="lg:col-span-6 bg-[#f7f8f5] px-6 sm:px-12 lg:px-16 py-10 sm:py-14 flex flex-col justify-between">
            <div className="w-full max-w-[400px] mx-auto my-auto">
              {/* Heading & Subheading */}
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e6f0e9] border border-[#c8ddd0] text-[12px] font-semibold text-[#2d573f] mb-4">
                  <ZendoLogo className="w-4 h-4 shrink-0" color="#2d573f" />
                  <span>zendo.ai</span>
                  <span aria-hidden="true">·</span>
                  <span>{mode === 'forgot' ? 'Account Recovery' : 'Secure Sign In'}</span>
                </div>
                <h1 className="text-[28px] sm:text-[32px] font-bold tracking-[-0.03em] text-[#18221d] leading-[1.15]">
                  {mode === 'signup'
                    ? 'Create your Zendo workspace'
                    : mode === 'forgot'
                    ? 'Reset your password'
                    : 'Sign in to Zendo'}
                </h1>
                <p className="text-[14.5px] text-[#5c6862] mt-2.5 leading-relaxed">
                  {mode === 'signup'
                    ? 'Sign up with Google or your email to create your Zendo workspace for AI proposals, client messaging, and payments.'
                    : mode === 'forgot'
                    ? 'Enter your account email address to receive a secure password reset link.'
                    : 'Welcome back. Access your client proposals, scheduled meetings, and project tasks.'}
                </p>
              </motion.div>

              {/* Auth Card */}
              <div className="mt-7 p-6 rounded-[20px] bg-white border border-[#dce2dd] shadow-[0_6px_28px_rgba(16,28,25,0.05)] space-y-4">
                {/* Method Selector Tabs: Email & Password vs Google SSO */}
                {mode !== 'forgot' && (
                  <div className="grid grid-cols-2 p-1 bg-[#edf2ee] rounded-[13px] text-[13px] font-semibold mb-2 select-none">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('email');
                        setError('');
                      }}
                      className={`flex items-center justify-center gap-2 py-2 rounded-[9px] transition-all cursor-pointer ${
                        authMethod === 'email'
                          ? 'bg-white text-[#18221d] shadow-2xs font-bold'
                          : 'text-[#5c6862] hover:text-[#18221d]'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5 text-[#3b664e]" />
                      <span>Email &amp; Password</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('google');
                        setError('');
                      }}
                      className={`flex items-center justify-center gap-2 py-2 rounded-[9px] transition-all cursor-pointer ${
                        authMethod === 'google'
                          ? 'bg-white text-[#18221d] shadow-2xs font-bold'
                          : 'text-[#5c6862] hover:text-[#18221d]'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09Z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"
                        />
                      </svg>
                      <span>Google</span>
                    </button>
                  </div>
                )}

                {/* TAB CONTENT: EMAIL & PASSWORD (OR FORGOT PASSWORD) */}
                {(authMethod === 'email' || mode === 'forgot') && (
                  <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                    {mode === 'signup' && (
                      <>
                        <div>
                          <label className="block text-[13px] font-semibold text-[#232e28] mb-1">
                            Full Name
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-[#8a968f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Alex Morgan"
                              required
                              className="w-full h-[44px] pl-10 pr-3.5 text-[14px] bg-[#f7f8f5] border border-[#dce2dd] rounded-[11px] text-[#18221d] placeholder:text-[#8a968f] focus:bg-white focus:border-[#3b664e] focus:outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="auth-workspace"
                            className="block text-[13px] font-semibold text-[#232e28] mb-1"
                          >
                            Workspace / Studio Name
                          </label>
                          <div className="relative">
                            <Briefcase className="w-4 h-4 text-[#8a968f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              id="auth-workspace"
                              type="text"
                              value={workspaceName}
                              onChange={(e) => setWorkspaceName(e.target.value)}
                              placeholder="Northstar Studio"
                              className="w-full h-[44px] pl-10 pr-3.5 text-[14px] bg-[#f7f8f5] border border-[#dce2dd] rounded-[11px] text-[#18221d] placeholder:text-[#8a968f] focus:bg-white focus:border-[#3b664e] focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-[13px] font-semibold text-[#232e28] mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#8a968f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alex@northstar.studio"
                          required
                          className="w-full h-[44px] pl-10 pr-3.5 text-[14px] bg-[#f7f8f5] border border-[#dce2dd] rounded-[11px] text-[#18221d] placeholder:text-[#8a968f] focus:bg-white focus:border-[#3b664e] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {mode !== 'forgot' && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[13px] font-semibold text-[#232e28]">
                            Password
                          </label>
                          {mode === 'login' && (
                            <button
                              type="button"
                              onClick={() => {
                                setMode('forgot');
                                setError('');
                                setSuccessMsg('');
                              }}
                              className="text-xs text-[#3b664e] hover:underline cursor-pointer"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#8a968f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="w-full h-[44px] pl-10 pr-10 text-[14px] bg-[#f7f8f5] border border-[#dce2dd] rounded-[11px] text-[#18221d] placeholder:text-[#8a968f] focus:bg-white focus:border-[#3b664e] focus:outline-none transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {mode === 'signup' && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[13px] font-semibold text-[#232e28]">
                            Confirm Password
                          </label>
                          {confirmPassword && password === confirmPassword && (
                            <span className="text-[11px] font-semibold text-[#2d573f] flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3]" /> Passwords match
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#8a968f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className={`w-full h-[44px] pl-10 pr-3.5 text-[14px] bg-[#f7f8f5] border rounded-[11px] text-[#18221d] placeholder:text-[#8a968f] focus:bg-white focus:outline-none transition-colors ${
                              confirmPassword && password !== confirmPassword
                                ? 'border-[#e07a68] focus:border-[#c54c37]'
                                : 'border-[#dce2dd] focus:border-[#3b664e]'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Keep me signed in for 30 days */}
                    {mode !== 'forgot' && (
                      <div className="pt-0.5 flex items-center justify-between">
                        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={keepSignedIn}
                            onClick={() => setKeepSignedIn(!keepSignedIn)}
                            className={`w-[17px] h-[17px] rounded-[4px] flex items-center justify-center transition-colors cursor-pointer ${
                              keepSignedIn
                                ? 'bg-[#3b664e] text-white border border-[#3b664e]'
                                : 'bg-white border border-[#c6d1c9]'
                            }`}
                          >
                            {keepSignedIn && (
                              <Check className="w-3 h-3 stroke-[2.8]" />
                            )}
                          </button>
                          <span
                            onClick={() => setKeepSignedIn(!keepSignedIn)}
                            className="text-[12.5px] text-[#4a5650]"
                          >
                            Keep me signed in for 30 days
                          </span>
                        </label>
                      </div>
                    )}

                    {error && (
                      <p
                        className="text-xs text-[#9a342d] font-medium bg-[#fff1e3] border border-[#ef7952]/40 rounded-xl px-3.5 py-2.5"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}

                    {successMsg && (
                      <p
                        className="text-xs text-[#2b543e] font-medium bg-[#e9f2ec] border border-[#cfddd0] rounded-xl px-3.5 py-2.5"
                      >
                        {successMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={emailLoading || oauthLoading}
                      className="w-full h-[48px] bg-[#3b664e] hover:bg-[#315641] active:scale-[0.995] text-white rounded-[12px] flex items-center justify-center gap-2 text-[14.5px] font-semibold shadow-[0_4px_14px_rgba(59,102,78,0.25)] transition-all cursor-pointer"
                    >
                      <span>
                        {emailLoading
                          ? 'Verifying...'
                          : mode === 'signup'
                          ? 'Create Account with Email'
                          : mode === 'forgot'
                          ? 'Send Password Reset Link'
                          : 'Sign In with Email & Password'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* TAB CONTENT: GOOGLE */}
                {authMethod === 'google' && mode !== 'forgot' && (
                  <div className="space-y-4 pt-1">
                    <div className="p-3.5 bg-[#f4f7f4] border border-[#dce5df] rounded-[12px] text-[13px] text-[#4b5a51] space-y-1.5">
                      <p className="font-semibold text-[#18221d]">Google Sign In</p>
                      <ul className="text-[12px] space-y-1 text-[#5c6b61]">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#3b664e] shrink-0" />
                          <span>Direct synchronization with Google Calendar &amp; Meet</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#3b664e] shrink-0" />
                          <span>No password to remember or manage</span>
                        </li>
                      </ul>
                    </div>

                    {error && (
                      <p
                        className="text-xs text-[#9a342d] font-medium bg-[#fff1e3] border border-[#ef7952]/40 rounded-xl px-3.5 py-2.5"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={oauthLoading || emailLoading}
                      className="group w-full h-[50px] px-5 bg-white hover:bg-[#f9fbf9] active:scale-[0.995] text-[#18221d] border border-[#dce2dd] rounded-[12px] flex items-center justify-center gap-3 text-[14.5px] font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
                        <svg
                          className="w-4 h-4 shrink-0"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            fill="#4285F4"
                            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09Z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"
                          />
                        </svg>
                      </span>
                      <span>
                        {oauthLoading
                          ? 'Connecting to Google...'
                          : mode === 'signup'
                          ? 'Sign up with Google'
                          : 'Continue with Google'}
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                )}

                {/* Secondary Option: In Email tab, provide Google quick button below */}
                {authMethod === 'email' && mode !== 'forgot' && (
                  <>
                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-[#e2e7e3]"></div>
                      <span className="flex-shrink mx-3 text-[11px] font-medium text-[#7a8880]">
                        or continue with
                      </span>
                      <div className="flex-grow border-t border-[#e2e7e3]"></div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={oauthLoading || emailLoading}
                      className="group w-full h-[42px] px-4 bg-white hover:bg-[#f9fbf9] text-[#18221d] border border-[#dce2dd] rounded-[11px] flex items-center justify-center gap-2.5 text-[13px] font-medium shadow-2xs transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z" />
                        <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09Z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z" />
                      </svg>
                      <span>Sign in with Google One-Click</span>
                    </button>
                  </>
                )}
              </div>

              {/* Switch between Sign in and Sign up */}
              <div className="mt-6 text-center text-[13px] text-[#5c6862]">
                {mode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="font-semibold text-[#2d573f] hover:text-[#1e3d2b] hover:underline underline-offset-4 cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                ) : (
                  <>
                    <span>
                      {mode === 'signup'
                        ? 'Already have an account?'
                        : 'New to Zendo?'}
                    </span>{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'signup' ? 'login' : 'signup');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="font-semibold text-[#2d573f] hover:text-[#1e3d2b] hover:underline underline-offset-4 cursor-pointer"
                    >
                      {mode === 'signup'
                        ? 'Sign In to existing workspace'
                        : 'Create a free workspace'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Security Trust Bar (SOC2 Type II Certified • 256-bit Encryption) */}
            <div className="w-full max-w-[400px] mx-auto pt-8 mt-8 flex items-center justify-center gap-4 text-[11.5px] text-[#6d7972]">
              <div className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4a745b]" />
                <span>SOC2 Type II Certified</span>
              </div>
              <span aria-hidden="true" className="text-[#b5c2b9]">
                •
              </span>
              <div className="inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#4a745b]" />
                <span>256-bit Encryption</span>
              </div>
            </div>
          </div>

          {/* =================================================================
              RIGHT COLUMN (6 COLS): SAGE BOTANICAL BACKDROP, FLOATING GLASS
              SHOWCASE ("Today's Focus" + "Sprint Velocity") & TESTIMONIAL
          ================================================================= */}
          <div className="lg:col-span-6 relative overflow-hidden bg-gradient-to-b from-[#ddebe1] via-[#cde1d3] to-[#b8d4c1] border-t lg:border-t-0 lg:border-l border-[#dce5de] px-6 sm:px-10 lg:px-12 py-10 sm:py-14 flex flex-col justify-center">
            {/* Soft Sunlit Clouds & Rolling Botanical Hills Backdrop SVG */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              {/* Warm sunlit radial glow in upper center-right */}
              <div className="absolute -top-20 right-8 w-[420px] h-[420px] rounded-full bg-[#f6f9f2]/65 blur-3xl" />
              <div className="absolute top-1/3 -left-20 w-[340px] h-[340px] rounded-full bg-[#eef6f0]/50 blur-2xl" />

              {/* Soft Rolling Sage Hills at Bottom */}
              <svg
                className="absolute bottom-0 inset-x-0 w-full h-[260px] text-[#bed8c6]"
                viewBox="0 0 800 260"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 140C180 90 360 170 560 120C670 92 750 110 800 125V260H0V140Z"
                  fill="#c2dcc9"
                  fillOpacity="0.7"
                />
                <path
                  d="M0 185C220 145 410 210 640 165C710 150 765 158 800 170V260H0V185Z"
                  fill="#aecbb7"
                  fillOpacity="0.75"
                />
                <path
                  d="M0 220C190 198 450 235 800 195V260H0V220Z"
                  fill="#9ec0a9"
                  fillOpacity="0.65"
                />
              </svg>

              {/* Subtle Botanical Leaf Sprig Silhouette in Bottom Right */}
              <svg
                className="absolute bottom-3 right-3 w-28 h-28 text-[#698f77]/25"
                viewBox="0 0 120 120"
                fill="currentColor"
              >
                <path d="M95 110C92 82 78 58 55 42C68 65 76 86 78 110H95Z" />
                <path d="M106 110C108 76 98 48 78 26C86 54 92 82 91 110H106Z" />
                <path d="M76 110C70 88 54 72 34 62C48 78 58 93 62 110H76Z" />
              </svg>
            </div>

            {/* ===============================================================
                SHOWCASE STACK:
                1. Floating Glass Workspace Window + "Workflow automated" Pill
                2. Frosted Testimonial Card (Alex Morgan)
            =============================================================== */}
            <div className="relative z-10 w-full max-w-[490px] mx-auto space-y-5">
              {/* 1. UPPER FLOATING GLASS WORKSPACE WINDOW */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="relative pt-3"
              >
                {/* Floating Top-Right Pill: "Workflow automated · Saved 2.4 hrs this week" */}
                <div className="absolute -top-1 right-2 sm:-right-3 z-20 bg-white/95 backdrop-blur-md rounded-[16px] px-3.5 py-2.5 shadow-[0_12px_30px_rgba(24,38,31,0.10)] border border-white flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#e3efe7] text-[#3b664e] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="pr-1">
                    <p className="text-[12.5px] font-semibold text-[#18221d] leading-tight">
                      Workflow automated
                    </p>
                    <p className="text-[11px] text-[#637069] leading-tight mt-0.5 tabular-nums">
                      Saved 2.4 hrs this week
                    </p>
                  </div>
                </div>

                {/* Translucent Glass Frame */}
                <div className="bg-white/55 backdrop-blur-md rounded-[22px] border border-white/85 p-4 sm:p-5 shadow-[0_20px_50px_rgba(24,38,31,0.08)]">
                  {/* macOS Window Controls Header */}
                  <div className="flex items-center justify-between mb-3.5 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f28b82]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fbbc04]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#81c995]" />
                    </div>
                    <div className="w-24 h-2 rounded-full bg-white/60" />
                  </div>

                  {/* CARD A: TODAY'S FOCUS */}
                  <div className="bg-white rounded-[16px] p-4 shadow-[0_2px_10px_rgba(24,38,31,0.03)] border border-[#edf2ee]">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-[14px] font-semibold text-[#18221d]">
                        Today&apos;s Focus
                      </h2>
                      <span className="bg-[#e6f0e9] text-[#3b664e] text-[11px] font-semibold px-2.5 py-0.5 rounded-full tabular-nums">
                        {completedPreviewCount} of 4 completed
                      </span>
                    </div>

                    <div className="space-y-2">
                      {previewTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => togglePreviewTask(task.id)}
                          className={`flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-[10px] transition-colors cursor-pointer ${
                            task.highlighted
                              ? 'bg-[#f4f7f4] border border-[#e5ede8]'
                              : 'hover:bg-[#f8faf8]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-4 h-4 rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
                                task.completed
                                  ? 'bg-[#436e55] text-white'
                                  : 'bg-white border-2 border-[#436e55]'
                              }`}
                            >
                              {task.completed && (
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              )}
                            </span>
                            <span
                              className={`text-[12.5px] truncate ${
                                task.completed
                                  ? 'text-[#59655f]'
                                  : 'font-medium text-[#18221d]'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          <span
                            className={`text-[10.5px] font-medium px-2.5 py-0.5 rounded-md shrink-0 ${task.tagStyle}`}
                          >
                            {task.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CARD B: SPRINT VELOCITY */}
                  <div className="bg-white rounded-[16px] p-4 shadow-[0_2px_10px_rgba(24,38,31,0.03)] border border-[#edf2ee] mt-3.5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[11.5px] text-[#6e7a73] font-medium">
                        Sprint Velocity
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[22px] font-bold text-[#18221d] tracking-tight tabular-nums">
                          +24%
                        </span>
                        <span className="text-[11.5px] text-[#3b664e] font-medium">
                          vs last week
                        </span>
                      </div>

                      {/* Mini 6-Column Bar Chart */}
                      <div className="flex items-end gap-1.5 h-8 pt-1.5">
                        <span className="w-2.5 h-3.5 rounded-t-xs bg-[#dce7e0]" />
                        <span className="w-2.5 h-4.5 rounded-t-xs bg-[#dce7e0]" />
                        <span className="w-2.5 h-4 rounded-t-xs bg-[#dce7e0]" />
                        <span className="w-2.5 h-5.5 rounded-t-xs bg-[#dce7e0]" />
                        <span className="w-2.5 h-6 rounded-t-xs bg-[#6c967d]" />
                        <span className="w-2.5 h-7 rounded-t-xs bg-[#3b664e]" />
                      </div>
                    </div>

                    {/* Right Sparkline Line + Area Graph with Data Nodes */}
                    <div className="w-36 sm:w-44 h-16 shrink-0">
                      <svg
                        viewBox="0 0 180 64"
                        className="w-full h-full overflow-visible"
                      >
                        <defs>
                          <linearGradient
                            id="velocityAreaGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#3b664e"
                              stopOpacity="0.22"
                            />
                            <stop
                              offset="100%"
                              stopColor="#3b664e"
                              stopOpacity="0.0"
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d="M8 50 C 36 48, 52 38, 78 36 C 102 34, 118 22, 140 20 C 154 18, 164 12, 172 8 L 172 60 L 8 60 Z"
                          fill="url(#velocityAreaGrad)"
                        />
                        <path
                          d="M8 50 C 36 48, 52 38, 78 36 C 102 34, 118 22, 140 20 C 154 18, 164 12, 172 8"
                          fill="none"
                          stroke="#3b664e"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="78"
                          cy="36"
                          r="3.2"
                          fill="#ffffff"
                          stroke="#3b664e"
                          strokeWidth="2"
                        />
                        <circle
                          cx="140"
                          cy="20"
                          r="3.2"
                          fill="#ffffff"
                          stroke="#3b664e"
                          strokeWidth="2"
                        />
                        <circle
                          cx="172"
                          cy="8"
                          r="3.8"
                          fill="#3b664e"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 2. LOWER FROSTED TESTIMONIAL CARD (ALEX MORGAN) */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="bg-white/75 backdrop-blur-md rounded-[20px] p-5 sm:p-6 border border-white/85 shadow-[0_12px_36px_rgba(24,38,31,0.06)] relative"
              >
                {/* 5 Golden Stars */}
                <div
                  className="flex items-center gap-1 text-[#e5a93c]"
                  aria-label="5 out of 5 stars"
                >
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Quote Text */}
                <p className="mt-3 text-[14px] sm:text-[14.5px] text-[#1e2823] leading-[1.6] font-normal">
                  &ldquo;Zendo replaced four scattered tools for our team.
                  It&apos;s the first workspace that actually makes our workday
                  feel calmer and more focused.&rdquo;
                </p>

                {/* Author Info + Subtle Quote Mark */}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#dce9e0] ring-2 ring-white shrink-0 flex items-center justify-center text-xs font-bold text-[#2f5941]">
                      {!founderImgError ? (
                        <img
                          src={founderAvatar}
                          alt="Alex Morgan"
                          referrerPolicy="no-referrer"
                          onError={() => setFounderImgError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>AM</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-[#18221d] leading-tight">
                        Alex Morgan
                      </p>
                      <p className="text-[12px] text-[#5c6862] leading-tight mt-0.5">
                        Founder at Northstar Studio
                      </p>
                    </div>
                  </div>

                  {/* Subtle Decorative Closing Quote Icon */}
                  <svg
                    className="w-7 h-7 text-[#c7d6cc] shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
