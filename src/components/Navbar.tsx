import React from 'react';
import {
  Terminal,
  Grid,
  Sparkles,
  FolderLock,
  History,
  Shield,
  Sun,
  Moon,
  Laptop,
  User,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { UserProfile } from '@/shared/types/ninja';
import { ThemeMode, EffectiveTheme } from '../hooks/useTheme';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  theme: ThemeMode;
  effectiveTheme: EffectiveTheme;
  onToggleTheme: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAuth,
  onLogout,
  theme,
  effectiveTheme,
  onToggleTheme,
  onOpenSettings,
  onOpenHelp,
}) => {
  const navItems = [
    { id: 'home', label: 'Launcher', icon: Terminal },
    { id: 'tools', label: 'Tools', icon: Grid },
    { id: 'assistant', label: 'Gemini AI', icon: Sparkles },
    { id: 'workspace', label: 'Workspace', icon: FolderLock },
    { id: 'history', label: 'History', icon: History },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  const renderThemeIcon = () => {
    if (theme === 'system') {
      return <Laptop className="w-3.5 h-3.5 text-emerald-400 transition-colors group-hover:scale-110" />;
    }
    return effectiveTheme === 'dark' ? (
      <Sun className="w-3.5 h-3.5 text-amber-400 transition-colors group-hover:scale-110 group-hover:text-amber-300" />
    ) : (
      <Moon className="w-3.5 h-3.5 text-emerald-400 transition-colors group-hover:scale-110" />
    );
  };

  const isDark = effectiveTheme === 'dark';

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-colors duration-200 backdrop-blur-md ${
        isDark
          ? 'border-slate-800/80 bg-[#090d16]/90 text-white'
          : 'border-slate-200 bg-white/90 text-slate-900 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md shadow-emerald-500/10">
            <div
              className={`h-full w-full rounded-[10px] flex items-center justify-center ${
                isDark ? 'bg-[#090d16]' : 'bg-white'
              }`}
            >
              <span className="font-mono font-black text-emerald-500 text-sm tracking-tighter">N</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`font-black text-base tracking-wider font-mono ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                NINJA
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  isDark
                    ? 'bg-slate-800 text-emerald-400 border-slate-700'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                v2.0
              </span>
            </div>
            <div
              className={`text-[10px] font-mono hidden sm:block ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Command Center
            </div>
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
                    ? isDark
                      ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                      : 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200 font-bold'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <PWAInstallButton />

          {/* Quick Help Guide Button */}
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Command syntax & help"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs ${
              isDark
                ? 'border-slate-800 bg-slate-900/90 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-slate-800'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:text-emerald-700 hover:border-emerald-500/40 hover:bg-emerald-50/70'
            }`}
            title={`Active: ${effectiveTheme.toUpperCase()} theme (Click to toggle)`}
          >
            {renderThemeIcon()}
            <span
              className={`text-[11px] font-mono font-medium hidden sm:inline capitalize ${
                isDark ? 'text-slate-400 group-hover:text-emerald-400' : 'text-slate-600 group-hover:text-emerald-700'
              }`}
            >
              {effectiveTheme}
            </span>
          </button>

          {user ? (
            <div
              className={`flex items-center gap-2 pl-1 border-l ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <div
                onClick={() => onSelectTab('history')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border cursor-pointer ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
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
                <span
                  className={`text-xs font-semibold max-w-[90px] truncate hidden sm:inline ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {user.name}
                </span>
              </div>
              <button
                onClick={onLogout}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400'
                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-rose-600'
                }`}
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
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
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
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
