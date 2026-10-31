import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, CheckCircle2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { ZENDO_COPY } from '../data/zendoCopy';
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

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (userName: string, email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'email' | 'google'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      const cred = await googleSignIn();
      const resolvedName =
        cred.user.displayName?.trim() ||
        cred.user.email?.split('@')[0] ||
        'Findify Ai';
      const resolvedEmail = cred.user.email || 'findifyai@gmail.com';

      setIsSubmitting(false);
      onSuccess(resolvedName, resolvedEmail);

      void ensureUserProfileInFirestore(cred.user, resolvedName).then((profile) =>
        syncUserToBackend(profile.displayName, profile.workspaceName)
      );
    } catch (err: unknown) {
      setIsSubmitting(false);
      setError(formatAuthError(err));
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setIsSubmitting(true);
      try {
        await sendPasswordReset(cleanEmail);
        setSuccessMsg(`Password reset email sent to ${cleanEmail}. Check your inbox.`);
        setIsSubmitting(false);
      } catch (err: unknown) {
        setIsSubmitting(false);
        setError(formatAuthError(err));
      }
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        const cred = await emailPasswordSignUp(cleanEmail, password, name.trim());
        const resolvedName = cred.user.displayName || cleanEmail.split('@')[0] || 'Zendo User';
        setIsSubmitting(false);
        onSuccess(resolvedName, cleanEmail);
        void ensureUserProfileInFirestore(cred.user, resolvedName).then((profile) =>
          syncUserToBackend(profile.displayName, profile.workspaceName)
        );
      } else {
        const cred = await emailPasswordSignIn(cleanEmail, password);
        const resolvedName = cred.user.displayName || cleanEmail.split('@')[0] || 'Zendo User';
        setIsSubmitting(false);
        onSuccess(resolvedName, cleanEmail);
        void ensureUserProfileInFirestore(cred.user, resolvedName).then((profile) =>
          syncUserToBackend(profile.displayName, profile.workspaceName)
        );
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setError(formatAuthError(err));
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1713]/50 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-[#f7f8f5] border border-[#dce2dd] rounded-[24px] p-6 sm:p-8 my-8 shadow-xl"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full text-[#596960] hover:text-[#101c19] hover:bg-[#e5eee8] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mb-5">
            <div className="inline-flex items-center gap-2 text-xs text-[#596960] mb-2">
              <ZendoLogo className="w-5 h-5 shrink-0" color="#3b664e" />
              <span className="font-semibold text-[#18221d]">zendo.ai</span>
              <span aria-hidden="true">·</span>
              <span>Client Workspace</span>
            </div>
            <h2
              id="auth-modal-title"
              className="text-2xl font-bold tracking-tight text-[#18221d]"
            >
              {mode === 'signup'
                ? 'Create your account'
                : mode === 'forgot'
                ? 'Reset your password'
                : 'Sign in to Zendo'}
            </h2>
            <p className="mt-1 text-sm text-[#5c6862]">
              {mode === 'signup'
                ? 'Set up your workspace to create proposals and manage clients.'
                : mode === 'forgot'
                ? 'Enter your email to receive a password reset link.'
                : 'Welcome back. Access your proposals, meetings, and payments.'}
            </p>
          </div>

          {/* Method Selector Tabs: Email & Password vs Google SSO */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 p-1 bg-[#edf2ee] rounded-[13px] text-xs font-semibold mb-3 select-none">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setError('');
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-[9px] transition-all cursor-pointer ${
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
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-[9px] transition-all cursor-pointer ${
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

          {/* TAB 1: EMAIL & PASSWORD FORM */}
          {(authMethod === 'email' || mode === 'forgot') && (
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-[#232e28] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8a968f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Morgan"
                      required
                      className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-[#dce2dd] rounded-xl text-[#18221d] placeholder:text-[#8a968f] focus:border-[#3b664e] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#232e28] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8a968f] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@northstar.studio"
                    required
                    className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-[#dce2dd] rounded-xl text-[#18221d] placeholder:text-[#8a968f] focus:border-[#3b664e] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#232e28]">
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
                    <Lock className="w-4 h-4 text-[#8a968f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full h-10 pl-9 pr-10 text-sm bg-white border border-[#dce2dd] rounded-xl text-[#18221d] placeholder:text-[#8a968f] focus:border-[#3b664e] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                    <label className="text-xs font-semibold text-[#232e28]">
                      Confirm Password
                    </label>
                    {confirmPassword && password === confirmPassword && (
                      <span className="text-[11px] font-semibold text-[#2d573f]">
                        ✓ Passwords match
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8a968f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className={`w-full h-10 pl-9 pr-3 text-sm bg-white border rounded-xl text-[#18221d] placeholder:text-[#8a968f] focus:outline-none transition-colors ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-[#e07a68] focus:border-[#c54c37]'
                          : 'border-[#dce2dd] focus:border-[#3b664e]'
                      }`}
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-[#9a342d] font-medium bg-[#fff1e3] border border-[#ef7952]/40 rounded-xl px-3 py-2" role="alert">
                  {error}
                </p>
              )}

              {successMsg && (
                <p className="text-xs text-[#2b543e] font-medium bg-[#e9f2ec] border border-[#cfddd0] rounded-xl px-3 py-2">
                  {successMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-[#3b664e] hover:bg-[#315641] text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>
                  {isSubmitting
                    ? 'Processing...'
                    : mode === 'signup'
                    ? 'Create Account with Email'
                    : mode === 'forgot'
                    ? 'Send Reset Link'
                    : 'Sign in with Email & Password'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Secondary Google Button in Email tab */}
              {mode !== 'forgot' && (
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
                    disabled={isSubmitting}
                    className="group w-full h-10 px-4 bg-white hover:bg-slate-50 border border-[#dce2dd] text-[#18221d] rounded-xl flex items-center justify-center gap-2.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
                    <span>Google One-Click Sign In</span>
                  </button>
                </>
              )}
            </form>
          )}

          {/* TAB 2: GOOGLE ONLY */}
          {authMethod === 'google' && mode !== 'forgot' && (
            <div className="space-y-3.5 pt-1">
              <div className="p-3 bg-[#f4f7f4] border border-[#dce5df] rounded-[12px] text-xs text-[#4b5a51] space-y-1">
                <p className="font-semibold text-[#18221d]">Google Sign In</p>
                <p className="text-[#5c6b61]">
                  Instantly access your proposals, contracts, and scheduled Google Calendar meetings without creating a password.
                </p>
              </div>

              {error && (
                <p className="text-xs text-[#9a342d] font-medium bg-[#fff1e3] border border-[#ef7952]/40 rounded-xl px-3 py-2" role="alert">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="group w-full h-11 px-4 bg-white hover:bg-slate-50 border border-[#dce2dd] text-[#18221d] rounded-xl flex items-center justify-center gap-3 text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <span className="w-5 h-5 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-[#e1e9e4] flex items-center justify-between gap-3 text-xs text-[#596960]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3b664e] shrink-0" />
              <span>{ZENDO_COPY.authCopy.signupText}</span>
            </div>
            {mode === 'forgot' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className="font-semibold text-[#3b664e] hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError('');
                  setSuccessMsg('');
                }}
                className="font-semibold text-[#3b664e] hover:underline cursor-pointer"
              >
                {mode === 'login' ? 'Create an account' : 'Sign in instead'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
