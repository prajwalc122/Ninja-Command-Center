import React, { useState } from 'react';
import {
  X,
  Sliders,
  Moon,
  Sun,
  Laptop,
  ExternalLink,
  History,
  Trash2,
  Plus,
  Check,
  Search,
  Globe,
  Sparkles,
} from 'lucide-react';
import { ThemeMode } from '../hooks/useTheme';
import { NinjaSettings, getSettings, saveSettings, clearCommandHistory } from '../services/storageService';
import { getCustomWebsites, addWebsite, removeWebsite, WebsiteEntry } from '../services/websiteRegistry';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onThemeChange: (t: ThemeMode) => void;
  onHistoryCleared?: () => void;
  onFavoritesUpdated?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  onHistoryCleared,
  onFavoritesUpdated,
}) => {
  const [settings, setSettings] = useState<NinjaSettings>(getSettings());
  const [customWebsites, setCustomWebsites] = useState<WebsiteEntry[]>(getCustomWebsites());
  const [historyClearedAlert, setHistoryClearedAlert] = useState(false);

  // New website form state
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newAliases, setNewAliases] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleToggleNewTab = (val: boolean) => {
    const updated = saveSettings({ openInNewTab: val });
    setSettings(updated);
  };

  const handleSearchProviderChange = (provider: 'google' | 'duckduckgo' | 'bing') => {
    const updated = saveSettings({ searchProvider: provider });
    setSettings(updated);
  };

  const handleClearHistory = () => {
    clearCommandHistory();
    setHistoryClearedAlert(true);
    if (onHistoryCleared) onHistoryCleared();
    setTimeout(() => setHistoryClearedAlert(false), 2500);
  };

  const handleAddCustomSite = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newName.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!newUrl.trim()) {
      setFormError('URL is required');
      return;
    }

    let urlToSave = newUrl.trim();
    if (!/^https?:\/\//i.test(urlToSave)) {
      urlToSave = `https://${urlToSave}`;
    }

    try {
      new URL(urlToSave);
    } catch {
      setFormError('Please enter a valid URL');
      return;
    }

    const aliases = newAliases
      .split(',')
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    addWebsite({
      name: newName.trim(),
      url: urlToSave,
      aliases: aliases.length > 0 ? aliases : [newName.trim().toLowerCase()],
      category: 'productivity',
      description: `User-defined launcher for ${newName.trim()}`,
      color: '#10B981',
      iconName: 'globe',
      isDefaultFavorite: true,
    });

    setCustomWebsites(getCustomWebsites());
    setNewName('');
    setNewUrl('');
    setNewAliases('');
    setShowAddForm(false);
    if (onFavoritesUpdated) onFavoritesUpdated();
  };

  const handleDeleteCustomSite = (id: string) => {
    removeWebsite(id);
    setCustomWebsites(getCustomWebsites());
    if (onFavoritesUpdated) onFavoritesUpdated();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0d1322] shadow-2xl p-6 space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Ninja Settings</h3>
              <p className="text-xs text-slate-400">Launcher preferences and custom destinations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Appearance */}
        <div className="space-y-3">
          <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
            Appearance
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'system', label: 'System', icon: Laptop },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onThemeChange(opt.id as ThemeMode)}
                  className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl border text-xs font-semibold transition cursor-pointer gap-1.5 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Behavior */}
        <div className="space-y-3">
          <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
            Navigation Behavior
          </label>
          <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Open in New Tab</div>
                <div className="text-[11px] text-slate-400">Launch website in a fresh browser tab</div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNewTab(!settings.openInNewTab)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  settings.openInNewTab ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.openInNewTab ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Default Search Engine</div>
                <div className="text-[11px] text-slate-400">Used for search & google queries</div>
              </div>
              <select
                value={settings.searchProvider}
                onChange={(e) =>
                  handleSearchProviderChange(e.target.value as 'google' | 'duckduckgo' | 'bing')
                }
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="google">Google</option>
                <option value="duckduckgo">DuckDuckGo</option>
                <option value="bing">Bing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Custom Websites */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
              Custom Destinations ({customWebsites.length})
            </label>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Cancel' : 'Add Website'}</span>
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddCustomSite}
              className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 space-y-3 animate-in fade-in"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Website Name</label>
                  <input
                    type="text"
                    placeholder="e.g. My Portfolio"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://myportfolio.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Aliases (comma separated keywords)
                </label>
                <input
                  type="text"
                  placeholder="e.g. me, portfolio, site"
                  value={newAliases}
                  onChange={(e) => setNewAliases(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {formError && <p className="text-[11px] text-rose-400 font-mono">{formError}</p>}

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Save Custom Destination
              </button>
            </form>
          )}

          {customWebsites.length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {customWebsites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">{site.name}</span>
                    <span className="text-[10px] text-slate-500 truncate max-w-xs">{site.url}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCustomSite(site.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                    title="Delete custom website"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: History Management */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Command History</div>
              <div className="text-[11px] text-slate-400">Erase all logged launcher commands</div>
            </div>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>

          {historyClearedAlert && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Recent command history cleared!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
