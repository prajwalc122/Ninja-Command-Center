import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Lock,
  Mail,
  User,
  KeyRound,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => Promise<any>;
  onEmailLogin?: (email: string, password: string) => Promise<any>;
  onEmailRegister?: (email: string, password: string, name?: string) => Promise<any>;
  onForgotPassword?: (email: string) => Promise<any>;
  onResetPassword?: (token: string, newPassword: string) => Promise<any>;
}

type AuthTab = 'google' | 'login' | 'register' | 'forgot' | 'reset';

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onGoogleLogin,
  onEmailLogin,
  onEmailRegister,
  onForgotPassword,
  onResetPassword,
}) => {
  const [tab, setTab] = useState<AuthTab>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [demoTokenHint, setDemoTokenHint] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFormState = () => {
    setError(null);
    setSuccessNotice(null);
  };

  const handleGoogleSignIn = async () => {
    resetFormState();
    setLoading(true);
    try {
      await onGoogleLogin();
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else {
        setError(err.message || 'Google authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !onEmailLogin) return;
    resetFormState();
    setLoading(true);

    try {
      await onEmailLogin(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !onEmailRegister) return;
    resetFormState();
    setLoading(true);

    try {
      await onEmailRegister(email, password, name);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !onForgotPassword) return;
    resetFormState();
    setLoading(true);

    try {
      const res = await onForgotPassword(email);
      setSuccessNotice('Password reset request processed. Check your email or use the reset token below.');
      if (res.demoResetToken) {
        setDemoTokenHint(res.demoResetToken);
        setResetToken(res.demoResetToken);
        setTab('reset');
      }
    } catch (err: any) {
      setError(err.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !password || !onResetPassword) return;
    resetFormState();
    setLoading(true);

    try {
      await onResetPassword(resetToken, password);
      setSuccessNotice('Password reset successfully! Please sign in with your new password.');
      setTab('login');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // Live password strength checks
  const isLengthValid = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordStrong = isLengthValid && hasLetter && hasNumberOrSymbol;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1322] p-7 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            NINJA Secure Authentication
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hashed with Bcrypt • Signed with JWT • Protected against Brute-Force
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-900/90 p-1 mb-5 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setTab('google'); resetFormState(); }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'google' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => { setTab('login'); resetFormState(); }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'login' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); resetFormState(); }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'register' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Tab 1: Google OAuth */}
        {tab === 'google' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed text-center">
              Connect via Google OAuth 2.0 to sync your command center, history, and workspace files across devices.
            </p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs tracking-normal transition duration-150 cursor-pointer shadow-lg flex items-center justify-center gap-3 border border-slate-200 disabled:opacity-75"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              )}
              <span className="font-bold">
                {loading ? 'Connecting to Google...' : 'Continue with Google'}
              </span>
            </button>
          </div>
        )}

        {/* Tab 2: Email Sign In */}
        {tab === 'login' && (
          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono text-slate-400">Password</label>
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); resetFormState(); }}
                  className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50 mt-2"
            >
              {loading ? 'Verifying...' : 'Sign In with Password'}
            </button>
          </form>
        )}

        {/* Tab 3: Sign Up / Register */}
        {tab === 'register' && (
          <form onSubmit={handleEmailRegister} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Your Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ninja Engineer"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Password strength checklist */}
              <div className="mt-2 space-y-1 text-[10px] font-mono">
                <div className={`flex items-center gap-1.5 ${isLengthValid ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span>•</span>
                  <span>Minimum 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span>•</span>
                  <span>Contains at least 1 letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span>•</span>
                  <span>Contains a number or symbol</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordStrong}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Secure Account'}
            </button>
          </form>
        )}

        {/* Tab 4: Forgot Password */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-3.5">
            <p className="text-xs text-slate-400">
              Enter your registered email address to receive a secure, 15-minute expiring password reset token.
            </p>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab('login')}
                className="flex-1 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs hover:text-white"
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-50"
              >
                {loading ? 'Requesting...' : 'Send Reset Token'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 5: Reset Password */}
        {tab === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <p className="text-xs text-slate-400">
              Enter your secure reset token and choose a strong new password.
            </p>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Reset Token</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste reset token"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New strong password"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordStrong}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        {/* Security Assurance Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>Secured by Bcrypt 12-Rounds, JWT, and HSTS</span>
        </div>
      </div>
    </div>
  );
};
