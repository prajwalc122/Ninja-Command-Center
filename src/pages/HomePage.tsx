import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Star,
  Clock,
  ExternalLink,
  ArrowRight,
  Sliders,
  HelpCircle,
  Trash2,
  Plus,
  ShieldCheck,
  Grid,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { CommandBox } from '../components/CommandBox';
import { WebsiteIcon } from '../components/WebsiteIcon';
import { SettingsModal } from '../components/SettingsModal';
import { HelpModal } from '../components/HelpModal';
import { ThemeMode, EffectiveTheme } from '../hooks/useTheme';
import {
  DEFAULT_WEBSITES,
  getAllWebsites,
  WebsiteEntry,
} from '../services/websiteRegistry';
import {
  getFavoriteWebsites,
  toggleFavorite,
  getCommandHistory,
  clearCommandHistory,
  CommandHistoryItem,
  formatRelativeTime,
  getSettings,
  addCommandHistory,
} from '../services/storageService';
import { safeOpenUrl } from '../utils/navigation';
import { CommandResolution } from '../services/commandEngine';

interface HomePageProps {
  initialCommand?: string | null;
  onNavigateTab: (tab: string) => void;
  onRecordHistory: (record: any) => void;
  theme: ThemeMode;
  effectiveTheme?: EffectiveTheme;
  onThemeChange: (t: ThemeMode) => void;
}

const QUICK_TRY_SUGGESTIONS = [
  'open YouTube',
  'open GitHub',
  'open WhatsApp',
  'open Instagram',
  'open LinkedIn',
  'open Gmail',
  'search Next.js 15',
];

export const HomePage: React.FC<HomePageProps> = ({
  initialCommand,
  onNavigateTab,
  onRecordHistory,
  theme,
  effectiveTheme = 'dark',
  onThemeChange,
}) => {
  const isDark = effectiveTheme === 'dark';
  const [favorites, setFavorites] = useState<WebsiteEntry[]>([]);
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [allSites, setAllSites] = useState<WebsiteEntry[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedTryCommand, setSelectedTryCommand] = useState<string | null>(initialCommand || null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Load favorites, history, and site registry on mount
  const refreshData = () => {
    setFavorites(getFavoriteWebsites());
    setHistory(getCommandHistory());
    setAllSites(getAllWebsites());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLaunchWebsite = (site: WebsiteEntry) => {
    const settings = getSettings();
    setActionNotice(`Opening ${site.name}...`);

    // Add to history
    addCommandHistory(`open ${site.name.toLowerCase()}`, site.name, site.url, 'website');
    refreshData();

    // Safe open
    safeOpenUrl(site.url, settings.openInNewTab);

    // Call global app history recorder
    onRecordHistory({
      command: `open ${site.name.toLowerCase()}`,
      toolId: 'web-launcher',
      toolName: site.name,
      status: 'success',
      resultPreview: `Launched ${site.name} (${site.url})`,
    });

    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleReRunHistory = (item: CommandHistoryItem) => {
    if (item.url) {
      const settings = getSettings();
      setActionNotice(`Re-opening ${item.targetName}...`);
      safeOpenUrl(item.url, settings.openInNewTab);
      addCommandHistory(item.command, item.targetName, item.url, item.type);
      refreshData();
      setTimeout(() => setActionNotice(null), 2500);
    } else {
      setSelectedTryCommand(item.command);
    }
  };

  const handleToggleFav = (e: React.MouseEvent, siteId: string) => {
    e.stopPropagation();
    toggleFavorite(siteId);
    refreshData();
  };

  const handleClearHistory = () => {
    clearCommandHistory();
    setHistory([]);
  };

  const handleCommandSuccess = (res: CommandResolution) => {
    refreshData();
    if (res.targetName) {
      onRecordHistory({
        command: res.targetName,
        toolId: 'web-command',
        toolName: res.targetName,
        status: 'success',
        resultPreview: res.message,
      });
    }
  };

  // Quick Access Primary Sites (Top 8 high-frequency platforms)
  const quickAccessSites = allSites.filter((s) =>
    ['whatsapp', 'youtube', 'github', 'instagram', 'linkedin', 'gmail', 'chatgpt', 'spotify'].includes(s.id)
  );

  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col justify-between py-8 sm:py-14 space-y-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="text-center space-y-5 max-w-3xl mx-auto pt-2 sm:pt-6">
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono shadow-sm transition-colors ${
            isDark
              ? 'border-slate-800 bg-[#0d1322]/80 text-slate-300'
              : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className={`font-semibold tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>NINJA</span>
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>•</span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Personal Web Command Center</span>
        </div>

        <h1
          className={`text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight transition-colors ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          Where do you want to{' '}
          <span className="text-emerald-500 underline decoration-emerald-500/40 decoration-4 underline-offset-8">
            go
          </span>
          ?
        </h1>

        <p
          className={`text-sm sm:text-base max-w-lg mx-auto font-sans leading-relaxed transition-colors ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          Type what you want to open. Ninja understands your command and launches the right destination instantly.
        </p>

        {/* Central Command Box: The Primary Interaction */}
        <div className="pt-2">
          <CommandBox
            initialValue={selectedTryCommand}
            onExecuteSuccess={handleCommandSuccess}
            onNavigateTab={onNavigateTab}
            onOpenSettings={() => setShowSettings(true)}
            onOpenHelp={() => setShowHelp(true)}
            effectiveTheme={effectiveTheme}
          />
        </div>

        {/* Quick Suggestions Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-xs">
          <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Try:</span>
          {QUICK_TRY_SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedTryCommand(item)}
              className={`px-2.5 py-1 rounded-xl border text-xs font-mono transition cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-slate-900/60 hover:bg-slate-800 border-slate-800/80 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300'
                  : 'bg-white hover:bg-slate-100 border-slate-200 hover:border-emerald-500/40 text-slate-700 hover:text-emerald-700 shadow-xs'
              }`}
            >
              "{item}"
            </button>
          ))}
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" />
            <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Quick Access
            </h2>
            <span className={`text-[11px] font-mono hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              • High frequency destinations
            </span>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className={`flex items-center gap-1 text-xs font-mono transition cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Command syntax</span>
          </button>
        </div>

        {/* Compact Quick Access Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {quickAccessSites.map((site) => {
            const isFav = favorites.some((f) => f.id === site.id);
            return (
              <div
                key={site.id}
                onClick={() => handleLaunchWebsite(site)}
                className={`group relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center space-y-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                  isDark
                    ? 'border-slate-800/90 bg-[#0d1322]/80 hover:bg-[#11192e] hover:border-emerald-500/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-500/50 shadow-xs'
                }`}
              >
                {/* Favorite Star Button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleFav(e, site.id)}
                  className={`absolute top-2 right-2 p-1 rounded-lg transition opacity-0 group-hover:opacity-100 ${
                    isFav ? 'text-amber-400 opacity-100' : 'text-slate-400 hover:text-amber-400'
                  }`}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400' : ''}`} />
                </button>

                {/* Brand Icon */}
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs"
                  style={{ backgroundColor: `${site.color}20`, color: site.color }}
                >
                  <WebsiteIcon name={site.iconName} size={20} />
                </div>

                {/* Name */}
                <div className="w-full">
                  <div
                    className={`text-xs font-bold transition truncate ${
                      isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
                    }`}
                  >
                    {site.name}
                  </div>
                  <div className={`text-[10px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {site.aliases[0] ? `"${site.aliases[0]}"` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-Column Section: Favorites & Recent Commands */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left Column: Favorites */}
        <div
          className={`rounded-3xl border backdrop-blur-sm p-5 sm:p-6 space-y-4 ${
            isDark ? 'border-slate-800/90 bg-[#0d1322]/70' : 'border-slate-200 bg-white shadow-sm'
          }`}
        >
          <div
            className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-slate-800/80' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Favorites
              </h3>
              <span
                className={`text-[11px] font-mono px-2 py-0.2 rounded-full ${
                  isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {favorites.length}
              </span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-600 font-semibold cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Site</span>
            </button>
          </div>

          {favorites.length === 0 ? (
            <div className={`py-8 text-center text-xs space-y-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <p>No favorites saved yet.</p>
              <p className="text-[11px]">Hover any website above and click the star to save it here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {favorites.map((site) => (
                <div
                  key={site.id}
                  onClick={() => handleLaunchWebsite(site)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                    isDark
                      ? 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/80 hover:border-emerald-500/30'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${site.color}20`, color: site.color }}
                    >
                      <WebsiteIcon name={site.iconName} size={15} />
                    </div>
                    <div className="truncate">
                      <div
                        className={`text-xs font-semibold transition truncate ${
                          isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
                        }`}
                      >
                        {site.name}
                      </div>
                      <div className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {site.description}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleFav(e, site.id)}
                    className="p-1 rounded text-amber-400 hover:text-slate-400 transition ml-2 shrink-0 cursor-pointer"
                    title="Remove from favorites"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Command History */}
        <div
          className={`rounded-3xl border backdrop-blur-sm p-5 sm:p-6 space-y-4 ${
            isDark ? 'border-slate-800/90 bg-[#0d1322]/70' : 'border-slate-200 bg-white shadow-sm'
          }`}
        >
          <div
            className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-slate-800/80' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Recent
              </h3>
              <span
                className={`text-[11px] font-mono px-2 py-0.2 rounded-full ${
                  isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {history.length}
              </span>
            </div>

            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Clear launcher history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className={`py-8 text-center text-xs space-y-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <p>No recent commands yet.</p>
              <p className="text-[11px]">Commands you type or click will appear here for fast one-click re-runs.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleReRunHistory(item)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                    isDark
                      ? 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/80 hover:border-emerald-500/30'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="font-mono text-emerald-500 font-medium group-hover:text-emerald-600">
                      {item.command}
                    </span>
                    <span className={`truncate hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      → {item.targetName}
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-2 shrink-0 font-mono text-[11px] ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <span>{formatRelativeTime(item.timestamp)}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-500 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        onThemeChange={onThemeChange}
        onHistoryCleared={refreshData}
        onFavoritesUpdated={refreshData}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        onTryCommand={(cmd) => setSelectedTryCommand(cmd)}
      />
    </div>
  );
};
