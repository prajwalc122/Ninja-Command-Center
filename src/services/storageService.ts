import { DEFAULT_WEBSITES, WebsiteEntry, getAllWebsites } from './websiteRegistry';

export interface CommandHistoryItem {
  id: string;
  command: string;
  targetName: string;
  url?: string;
  type: string;
  timestamp: number;
}

export interface NinjaSettings {
  theme: 'dark' | 'light' | 'system';
  openInNewTab: boolean;
  searchProvider: 'google' | 'duckduckgo' | 'bing';
}

const STORAGE_KEYS = {
  HISTORY: 'ninja_recent_commands',
  FAVORITES: 'ninja_favorite_ids',
  SETTINGS: 'ninja_user_settings',
};

const DEFAULT_SETTINGS: NinjaSettings = {
  theme: 'dark',
  openInNewTab: true,
  searchProvider: 'google',
};

// ====================== HISTORY ======================

export function getCommandHistory(): CommandHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading command history:', err);
    return [];
  }
}

export function addCommandHistory(
  command: string,
  targetName: string,
  url?: string,
  type = 'website'
): CommandHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getCommandHistory();
    const newItem: CommandHistoryItem = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      command: command.trim(),
      targetName,
      url,
      type,
      timestamp: Date.now(),
    };

    // Filter out immediate duplicate of same command
    const filtered = current.filter(
      (item) => item.command.toLowerCase() !== command.toLowerCase().trim()
    );

    // Keep top 15
    const updated = [newItem, ...filtered].slice(0, 15);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Error saving command history:', err);
    return [];
  }
}

export function clearCommandHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (err) {
    console.warn('Error clearing command history:', err);
  }
}

export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

// ====================== FAVORITES ======================

export function getFavoriteIds(): string[] {
  if (typeof window === 'undefined') {
    return DEFAULT_WEBSITES.filter((w) => w.isDefaultFavorite).map((w) => w.id);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (!raw) {
      // Seed default favorites
      const defaults = DEFAULT_WEBSITES.filter((w) => w.isDefaultFavorite).map((w) => w.id);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading favorites:', err);
    return DEFAULT_WEBSITES.filter((w) => w.isDefaultFavorite).map((w) => w.id);
  }
}

export function getFavoriteWebsites(): WebsiteEntry[] {
  const ids = getFavoriteIds();
  const all = getAllWebsites();
  const map = new Map(all.map((w) => [w.id, w]));

  const list: WebsiteEntry[] = [];
  for (const id of ids) {
    const site = map.get(id);
    if (site) {
      list.push(site);
    }
  }
  return list;
}

export function toggleFavorite(websiteId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = getFavoriteIds();
    let updated: string[];
    let isNowFavorite = false;

    if (current.includes(websiteId)) {
      updated = current.filter((id) => id !== websiteId);
      isNowFavorite = false;
    } else {
      updated = [...current, websiteId];
      isNowFavorite = true;
    }

    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    return isNowFavorite;
  } catch (err) {
    console.warn('Error toggling favorite:', err);
    return false;
  }
}

export function removeFavorite(websiteId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getFavoriteIds();
    const updated = current.filter((id) => id !== websiteId);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error removing favorite:', err);
  }
}

export function saveFavoriteOrder(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(ids));
  } catch (err) {
    console.warn('Error saving favorite order:', err);
  }
}

// ====================== SETTINGS ======================

export function getSettings(): NinjaSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('Error reading settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<NinjaSettings>): NinjaSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Error saving settings:', err);
    return DEFAULT_SETTINGS;
  }
}
