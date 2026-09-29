import { getAllWebsites, WebsiteEntry } from './websiteRegistry';
import { sanitizeUrl } from '../utils/navigation';

export interface CommandResolution {
  type: 'website' | 'search' | 'direct_url' | 'internal' | 'unknown' | 'empty';
  success: boolean;
  targetName?: string;
  url?: string;
  message: string;
  website?: WebsiteEntry;
  internalTab?: string;
  searchQuery?: string;
  suggestions?: string[];
}

export interface SuggestionItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  category: string;
  color: string;
  iconName: string;
  commandText: string;
  website?: WebsiteEntry;
}

const FILLER_PREFIXES = [
  'please open',
  'can you open',
  'take me over to',
  'take me to',
  'navigate to',
  'browse to',
  'head to',
  'go to',
  'goto',
  'launch',
  'open my',
  'open up',
  'open',
  'visit',
  'start',
  'show',
  'access',
  'jump to',
  'load',
  'browse',
];

const SEARCH_PREFIXES = [
  'search for',
  'search google for',
  'search google',
  'search',
  'google for',
  'google',
  'find',
  'query',
  'lookup',
  'look up',
];

const INTERNAL_SHORTCUTS: Record<string, { tab: string; name: string }> = {
  tools: { tab: 'tools', name: 'NINJA Tools' },
  utilities: { tab: 'tools', name: 'NINJA Tools' },
  tool: { tab: 'tools', name: 'NINJA Tools' },
  workflows: { tab: 'workflows', name: 'NINJA Workflows' },
  workflow: { tab: 'workflows', name: 'NINJA Workflows' },
  workspace: { tab: 'workspace', name: 'Offline Workspace' },
  assistant: { tab: 'assistant', name: 'Gemini Assistant' },
  gemini: { tab: 'assistant', name: 'Gemini Assistant' },
  ai: { tab: 'assistant', name: 'Gemini Assistant' },
  chat: { tab: 'assistant', name: 'Gemini Assistant' },
  chatbot: { tab: 'assistant', name: 'Gemini Chatbot' },
  history: { tab: 'history', name: 'Command History' },
  recent: { tab: 'history', name: 'Command History' },
  about: { tab: 'about', name: 'About Ninja' },
};

/**
 * Normalizes user command by stripping extra whitespace, punctuation, and common filler words.
 */
export function normalizeCommand(input: string): string {
  if (!input) return '';
  let str = input.toLowerCase().trim();

  // Strip trailing punctuation
  str = str.replace(/[?!.]+$/g, '').trim();

  // Check for search prefix first (we want to preserve the search query!)
  for (const prefix of SEARCH_PREFIXES) {
    if (str.startsWith(prefix + ' ')) {
      return str; // Preserve for search intent extraction
    }
  }

  // Strip leading filler words (e.g. "open my whatsapp" -> "whatsapp")
  for (const prefix of FILLER_PREFIXES) {
    if (str === prefix) {
      return '';
    }
    if (str.startsWith(prefix + ' ')) {
      str = str.slice(prefix.length).trim();
      break;
    }
  }

  return str;
}

/**
 * Resolves a user command to a destination URL, internal tab, search query, or unknown feedback.
 */
export function resolveCommand(
  rawInput: string,
  searchProvider: 'google' | 'duckduckgo' | 'bing' = 'google'
): CommandResolution {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      type: 'empty',
      success: false,
      message: 'Please enter a command (e.g. "open YouTube", "open GitHub")',
    };
  }

  const lower = trimmed.toLowerCase();

  // Security Guard: Prevent shell command injection, system tampering, or arbitrary script execution
  const DANGEROUS_SYSTEM_PATTERNS = [
    /^(rm|rmdir|del|erase|unlink)\b/i,
    /^(sh|bash|zsh|powershell|cmd|exec|spawn|fork)\b/i,
    /^(sudo|su|chmod|chown|kill|pkill|killall)\b/i,
    /^(curl|wget|nc|netcat|ncat|ssh|ftp|telnet|nmap)\b/i,
    /^(cat|grep|awk|sed|find|ls|dir|whoami|id|uname)\b/i,
    /^(eval|function|alert|document\.|window\.|location\.)/i,
    /(\||;|&&|`|\$\(|\$\{)/, // Command chaining or shell substitution characters
  ];

  for (const pattern of DANGEROUS_SYSTEM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        type: 'unknown',
        success: false,
        message: 'System and shell commands are disabled for security.',
        suggestions: ['open YouTube', 'open GitHub', 'open WhatsApp'],
      };
    }
  }

  // 1. Check for search intent: "search python pandas" or "google best laptop"
  for (const prefix of SEARCH_PREFIXES) {
    if (lower.startsWith(prefix + ' ')) {
      const query = trimmed.slice(prefix.length).trim().replace(/^["']|["']$/g, '');
      if (query) {
        let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        if (searchProvider === 'duckduckgo') {
          searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        } else if (searchProvider === 'bing') {
          searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        }

        return {
          type: 'search',
          success: true,
          targetName: `Search "${query}"`,
          url: searchUrl,
          searchQuery: query,
          message: `Searching for "${query}" on ${searchProvider === 'google' ? 'Google' : searchProvider}...`,
        };
      }
    }
  }

  const normalized = normalizeCommand(trimmed);

  if (!normalized) {
    return {
      type: 'empty',
      success: false,
      message: 'Please type what you want to open (e.g. "open WhatsApp", "open YouTube")',
    };
  }

  // 2. Check for internal app tabs ("open tools", "open workflows", etc.)
  if (INTERNAL_SHORTCUTS[normalized]) {
    const item = INTERNAL_SHORTCUTS[normalized];
    return {
      type: 'internal',
      success: true,
      targetName: item.name,
      internalTab: item.tab,
      message: `Opening ${item.name}...`,
    };
  }

  // 3. Match against Website Registry
  const websites = getAllWebsites();

  // 3a. Exact alias match (highest priority, e.g. "yt", "wa", "gh")
  const exactAliasMatch = websites.find((site) =>
    site.aliases.some((alias) => alias.toLowerCase() === normalized)
  );
  if (exactAliasMatch) {
    return {
      type: 'website',
      success: true,
      targetName: exactAliasMatch.name,
      url: exactAliasMatch.url,
      website: exactAliasMatch,
      message: `Opening ${exactAliasMatch.name}...`,
    };
  }

  // 3b. Exact name match (case-insensitive)
  const exactNameMatch = websites.find(
    (site) => site.name.toLowerCase() === normalized
  );
  if (exactNameMatch) {
    return {
      type: 'website',
      success: true,
      targetName: exactNameMatch.name,
      url: exactNameMatch.url,
      website: exactNameMatch,
      message: `Opening ${exactNameMatch.name}...`,
    };
  }

  // 3c. Starts with or Substring alias match
  const startsWithAlias = websites.find((site) =>
    site.aliases.some(
      (alias) => alias.startsWith(normalized) || normalized.startsWith(alias)
    )
  );
  if (startsWithAlias) {
    return {
      type: 'website',
      success: true,
      targetName: startsWithAlias.name,
      url: startsWithAlias.url,
      website: startsWithAlias,
      message: `Opening ${startsWithAlias.name}...`,
    };
  }

  // 3d. Starts with or Substring name match
  const startsWithName = websites.find(
    (site) =>
      site.name.toLowerCase().startsWith(normalized) ||
      site.name.toLowerCase().includes(normalized)
  );
  if (startsWithName) {
    return {
      type: 'website',
      success: true,
      targetName: startsWithName.name,
      url: startsWithName.url,
      website: startsWithName,
      message: `Opening ${startsWithName.name}...`,
    };
  }

  // 4. Direct URL or Domain pattern (e.g. "news.ycombinator.com" or "https://openai.com")
  const safeDirect = sanitizeUrl(normalized);
  if (safeDirect) {
    try {
      const hostname = new URL(safeDirect).hostname.replace(/^www\./, '');
      return {
        type: 'direct_url',
        success: true,
        targetName: hostname,
        url: safeDirect,
        message: `Navigating to ${hostname}...`,
      };
    } catch {
      // Fallback
    }
  }

  // 5. Unknown command with helpful suggestions
  const fallbackSuggestions = [
    'open YouTube',
    'open GitHub',
    'open WhatsApp',
    'open LinkedIn',
    'open Gmail',
  ];

  return {
    type: 'unknown',
    success: false,
    message: "I couldn't find that website.",
    suggestions: fallbackSuggestions,
  };
}

/**
 * Generates dynamic suggestions based on what the user is typing.
 */
export function getSuggestions(input: string, limit = 6): SuggestionItem[] {
  const websites = getAllWebsites();
  const trimmed = input.trim();

  // If empty input or just focused, suggest high-priority favorites
  if (!trimmed) {
    const topFavorites = websites
      .filter((w) => w.isDefaultFavorite)
      .slice(0, limit);

    return topFavorites.map((site) => ({
      id: site.id,
      title: `Open ${site.name}`,
      subtitle: site.description,
      url: site.url,
      category: site.category,
      color: site.color,
      iconName: site.iconName,
      commandText: `open ${site.name.toLowerCase()}`,
      website: site,
    }));
  }

  const normalized = normalizeCommand(trimmed);
  const lowerTrimmed = trimmed.toLowerCase();

  // If user is typing "search ...", suggest web search
  if (SEARCH_PREFIXES.some((p) => lowerTrimmed.startsWith(p))) {
    const query = trimmed.replace(/^(search\s+for|search\s+google|search|google|find)\s*/i, '');
    return [
      {
        id: 'search-query',
        title: `Search Google for "${query || '...'}"`,
        subtitle: 'Search the web with Google',
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        category: 'search',
        color: '#4285F4',
        iconName: 'google',
        commandText: `search ${query}`,
      },
    ];
  }

  // Rank matching websites
  const scored = websites.map((site) => {
    let score = 0;
    const nameLower = site.name.toLowerCase();

    // Exact matches
    if (nameLower === normalized) score += 100;
    if (site.aliases.includes(normalized)) score += 90;

    // Starts with
    if (nameLower.startsWith(normalized)) score += 60;
    for (const alias of site.aliases) {
      if (alias.startsWith(normalized)) score += 50;
    }

    // Includes substring
    if (nameLower.includes(normalized)) score += 30;
    for (const alias of site.aliases) {
      if (alias.includes(normalized)) score += 20;
    }

    // Default favorites get slight boost
    if (site.isDefaultFavorite) score += 5;

    return { site, score };
  });

  const filtered = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ site }) => ({
      id: site.id,
      title: `Open ${site.name}`,
      subtitle: site.description,
      url: site.url,
      category: site.category,
      color: site.color,
      iconName: site.iconName,
      commandText: `open ${site.name.toLowerCase()}`,
      website: site,
    }));

  // If no direct website matches but has characters, also offer Google search fallback
  if (filtered.length === 0 && normalized.length > 0) {
    return [
      {
        id: 'search-fallback',
        title: `Search Google for "${trimmed}"`,
        subtitle: 'No exact site found — search the web',
        url: `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`,
        category: 'search',
        color: '#4285F4',
        iconName: 'google',
        commandText: `search ${trimmed}`,
      },
    ];
  }

  return filtered;
}
