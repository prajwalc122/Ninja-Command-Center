import React from 'react';
import {
  Terminal,
  Grid,
  Sparkles,
  GitFork,
  FolderLock,
  History,
  Info,
  Shield,
  Sun,
  Moon,
  User,
  LogOut,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { UserProfile } from '@/shared/types/ninja';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAuth,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Terminal },
    { id: 'assistant', label: 'Gemini AI', icon: Sparkles },
    { id: 'tools', label: 'Tools', icon: Grid },
    { id: 'workflows', label: 'Workflows', icon: GitFork },
    { id: 'workspace', label: 'Workspace', icon: FolderLock },
    { id: 'history', label: 'History', icon: History },
    { id: 'about', label: 'About', icon: Info },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md shadow-emerald-500/10">
            <div className="h-full w-full rounded-[10px] bg-[#090d16] flex items-center justify-center">
              <span className="font-mono font-black text-emerald-400 text-sm tracking-tighter">N</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base text-white tracking-wider font-mono">NINJA</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                v1.0
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono hidden sm:block">Command Center</div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <PWAInstallButton />

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
            title="Toggle Dark / Light Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              <div
                onClick={() => onSelectTab('history')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer"
                title={user.email}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="h-5 w-5 rounded-full object-cover border border-emerald-500/50"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-slate-200 font-medium hidden sm:inline max-w-[90px] truncate">
                  {user.name}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/60 bg-[#090d16] px-2 py-2 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-medium transition shrink-0 ${
                isActive ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
