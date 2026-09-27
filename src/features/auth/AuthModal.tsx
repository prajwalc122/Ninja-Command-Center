import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, ShieldCheck, Cloud, History } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => Promise<any>;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onGoogleLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
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
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1322] p-8 shadow-2xl text-slate-100 relative overflow-hidden">
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/5">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Sign in to NINJA
          </h3>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            Connect your official Google Account to access your personal command center, cloud sync, and the Gemini AI Assistant.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-2xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Benefits List */}
        <div className="space-y-2.5 mb-7 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/60">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span>Unlimited access to <strong>Google Gemini Assistant</strong></span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Cloud className="w-3.5 h-3.5" />
            </div>
            <span>Cross-device file workspace & custom workflows</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <History className="w-3.5 h-3.5" />
            </div>
            <span>Persistent command history with 1-click re-runs</span>
          </div>
        </div>

        {/* Sole Primary Action: Official Google Sign-In */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm tracking-normal transition duration-150 cursor-pointer shadow-xl shadow-white/5 flex items-center justify-center gap-3.5 border border-slate-200 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </span>
          </button>
        </div>

        {/* Security Assurance */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>Secured by Google OAuth 2.0 & Firebase</span>
        </div>
      </div>
    </div>
  );
};
