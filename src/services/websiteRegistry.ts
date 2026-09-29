export interface WebsiteEntry {
  id: string;
  name: string;
  aliases: string[];
  url: string;
  category: 'social' | 'dev' | 'media' | 'productivity' | 'shopping' | 'ai' | 'search';
  description: string;
  color: string;
  iconName: string;
  isDefaultFavorite?: boolean;
  isCustom?: boolean;
}

export const DEFAULT_WEBSITES: WebsiteEntry[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    aliases: ['wa', 'whatsapp', 'whatsapp web', 'web whatsapp', 'wapp'],
    url: 'https://web.whatsapp.com/',
    category: 'social',
    description: 'Instant messaging and voice/video calling on the web.',
    color: '#25D366',
    iconName: 'whatsapp',
    isDefaultFavorite: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    aliases: ['yt', 'youtube', 'tube', 'videos', 'yt music'],
    url: 'https://www.youtube.com/',
    category: 'media',
    description: 'Video sharing, streaming, tutorials, and music.',
    color: '#FF0000',
    iconName: 'youtube',
    isDefaultFavorite: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    aliases: ['gh', 'github', 'git', 'repos', 'code'],
    url: 'https://github.com/',
    category: 'dev',
    description: 'Developer platform for version control, repos, and PRs.',
    color: '#24292e',
    iconName: 'github',
    isDefaultFavorite: true,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    aliases: ['mail', 'gmail', 'google mail', 'inbox', 'email'],
    url: 'https://mail.google.com/',
    category: 'productivity',
    description: 'Google secure webmail service and email inbox.',
    color: '#EA4335',
    iconName: 'gmail',
    isDefaultFavorite: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    aliases: ['ig', 'insta', 'instagram'],
    url: 'https://www.instagram.com/',
    category: 'social',
    description: 'Photo and video sharing social network.',
    color: '#E4405F',
    iconName: 'instagram',
    isDefaultFavorite: true,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    aliases: ['li', 'in', 'linkedin', 'linkdin', 'jobs'],
    url: 'https://www.linkedin.com/',
    category: 'social',
    description: 'Professional networking, career opportunities, and jobs.',
    color: '#0A66C2',
    iconName: 'linkedin',
    isDefaultFavorite: true,
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    aliases: ['gpt', 'chatgpt', 'openai', 'ai chat'],
    url: 'https://chatgpt.com/',
    category: 'ai',
    description: 'OpenAI conversational generative assistant.',
    color: '#10A37F',
    iconName: 'chatgpt',
    isDefaultFavorite: true,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    aliases: ['gemini', 'bard', 'google gemini', 'google ai'],
    url: 'https://gemini.google.com/',
    category: 'ai',
    description: 'Google advanced multimodal AI assistant.',
    color: '#4285F4',
    iconName: 'gemini',
    isDefaultFavorite: true,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    aliases: ['spot', 'spotify', 'music', 'songs', 'playlist'],
    url: 'https://open.spotify.com/',
    category: 'media',
    description: 'Digital music, podcast, and playlist streaming service.',
    color: '#1DB954',
    iconName: 'spotify',
    isDefaultFavorite: true,
  },
  {
    id: 'google',
    name: 'Google',
    aliases: ['google', 'ggl', 'search', 'goog'],
    url: 'https://www.google.com/',
    category: 'search',
    description: 'The worlds most used web search engine.',
    color: '#4285F4',
    iconName: 'google',
    isDefaultFavorite: false,
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    aliases: ['x', 'twitter', 'tweet', 'tweets', 'tw'],
    url: 'https://x.com/',
    category: 'social',
    description: 'Real-time microblogging, news, and community discussions.',
    color: '#000000',
    iconName: 'twitter',
    isDefaultFavorite: false,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    aliases: ['reddit', 'r', 'subreddits', 'r/'],
    url: 'https://www.reddit.com/',
    category: 'social',
    description: 'The front page of the internet, forums, and communities.',
    color: '#FF4500',
    iconName: 'reddit',
    isDefaultFavorite: false,
  },
  {
    id: 'netflix',
    name: 'Netflix',
    aliases: ['netflix', 'movies', 'nflx', 'shows'],
    url: 'https://www.netflix.com/',
    category: 'media',
    description: 'Stream movies, TV shows, and original series.',
    color: '#E50914',
    iconName: 'netflix',
    isDefaultFavorite: false,
  },
  {
    id: 'amazon',
    name: 'Amazon',
    aliases: ['amz', 'amazon', 'shop', 'shopping', 'prime'],
    url: 'https://www.amazon.com/',
    category: 'shopping',
    description: 'Online shopping for electronics, books, apparel, and more.',
    color: '#FF9900',
    iconName: 'amazon',
    isDefaultFavorite: false,
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    aliases: ['fk', 'flipkart'],
    url: 'https://www.flipkart.com/',
    category: 'shopping',
    description: 'Leading online shopping destination in India.',
    color: '#2874F0',
    iconName: 'flipkart',
    isDefaultFavorite: false,
  },
  {
    id: 'discord',
    name: 'Discord',
    aliases: ['dc', 'discord', 'chat server'],
    url: 'https://discord.com/app',
    category: 'social',
    description: 'Voice, video, and text communication service.',
    color: '#5865F2',
    iconName: 'discord',
    isDefaultFavorite: false,
  },
  {
    id: 'notion',
    name: 'Notion',
    aliases: ['notion', 'notes', 'docs', 'wiki'],
    url: 'https://www.notion.so/',
    category: 'productivity',
    description: 'Connected workspace for notes, tasks, and wikis.',
    color: '#000000',
    iconName: 'notion',
    isDefaultFavorite: false,
  },
  {
    id: 'drive',
    name: 'Google Drive',
    aliases: ['drive', 'gdrive', 'google drive', 'cloud drive'],
    url: 'https://drive.google.com/',
    category: 'productivity',
    description: 'Cloud storage, file backup, and document collaboration.',
    color: '#0F9D58',
    iconName: 'drive',
    isDefaultFavorite: false,
  },
  {
    id: 'maps',
    name: 'Google Maps',
    aliases: ['maps', 'gmaps', 'google maps', 'navigation', 'directions'],
    url: 'https://maps.google.com/',
    category: 'productivity',
    description: 'Web mapping, real-time traffic, and route directions.',
    color: '#34A853',
    iconName: 'maps',
    isDefaultFavorite: false,
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    aliases: ['so', 'stackoverflow', 'stack', 'debug code'],
    url: 'https://stackoverflow.com/',
    category: 'dev',
    description: 'Knowledge sharing community for programmers and developers.',
    color: '#F48024',
    iconName: 'stackoverflow',
    isDefaultFavorite: false,
  },
  {
    id: 'figma',
    name: 'Figma',
    aliases: ['figma', 'design', 'ui', 'wireframes'],
    url: 'https://www.figma.com/',
    category: 'dev',
    description: 'Collaborative web-based interface design tool.',
    color: '#F24E1E',
    iconName: 'figma',
    isDefaultFavorite: false,
  },
  {
    id: 'claude',
    name: 'Claude AI',
    aliases: ['claude', 'anthropic', 'claude ai'],
    url: 'https://claude.ai/',
    category: 'ai',
    description: 'Anthropic helpful and honest AI conversational model.',
    color: '#D97706',
    iconName: 'claude',
    isDefaultFavorite: false,
  },
  {
    id: 'leetcode',
    name: 'LeetCode',
    aliases: ['lc', 'leetcode', 'algorithms', 'dsa'],
    url: 'https://leetcode.com/',
    category: 'dev',
    description: 'Coding challenges, interview prep, and DSA practice.',
    color: '#FFA116',
    iconName: 'leetcode',
    isDefaultFavorite: false,
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    aliases: ['wiki', 'wikipedia', 'encyclopedia'],
    url: 'https://www.wikipedia.org/',
    category: 'productivity',
    description: 'Free online encyclopedia written by global volunteers.',
    color: '#636466',
    iconName: 'wikipedia',
    isDefaultFavorite: false,
  },
  {
    id: 'twitch',
    name: 'Twitch',
    aliases: ['twitch', 'stream', 'live gaming'],
    url: 'https://www.twitch.tv/',
    category: 'media',
    description: 'Live streaming platform for gaming, music, and creators.',
    color: '#9146FF',
    iconName: 'twitch',
    isDefaultFavorite: false,
  },
  {
    id: 'canva',
    name: 'Canva',
    aliases: ['canva', 'graphics', 'posters'],
    url: 'https://www.canva.com/',
    category: 'productivity',
    description: 'Graphic design platform for social posts, cards, and flyers.',
    color: '#00C4CC',
    iconName: 'canva',
    isDefaultFavorite: false,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    aliases: ['tg', 'telegram', 'web telegram'],
    url: 'https://web.telegram.org/',
    category: 'social',
    description: 'Cloud-based mobile and desktop messaging app.',
    color: '#229ED9',
    iconName: 'telegram',
    isDefaultFavorite: false,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    aliases: ['pin', 'pinterest', 'moodboard'],
    url: 'https://www.pinterest.com/',
    category: 'social',
    description: 'Visual discovery engine for finding ideas like recipes and style.',
    color: '#BD081C',
    iconName: 'pinterest',
    isDefaultFavorite: false,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    aliases: ['fb', 'facebook'],
    url: 'https://www.facebook.com/',
    category: 'social',
    description: 'Connect with friends, family, and communities.',
    color: '#1877F2',
    iconName: 'facebook',
    isDefaultFavorite: false,
  },
  {
    id: 'docs',
    name: 'Google Docs',
    aliases: ['docs', 'google docs', 'gdocs', 'document'],
    url: 'https://docs.google.com/',
    category: 'productivity',
    description: 'Online documents and real-time word processing.',
    color: '#4285F4',
    iconName: 'docs',
    isDefaultFavorite: false,
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    aliases: ['sheets', 'google sheets', 'spreadsheet', 'gsheets', 'excel'],
    url: 'https://sheets.google.com/',
    category: 'productivity',
    description: 'Online spreadsheets and data analysis tool.',
    color: '#0F9D58',
    iconName: 'sheets',
    isDefaultFavorite: false,
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    aliases: ['cal', 'calendar', 'google calendar', 'gcal', 'schedule'],
    url: 'https://calendar.google.com/',
    category: 'productivity',
    description: 'Time management and scheduling calendar tool.',
    color: '#4285F4',
    iconName: 'calendar',
    isDefaultFavorite: false,
  },
];

const CUSTOM_WEBSITES_KEY = 'ninja_custom_websites';

export function getCustomWebsites(): WebsiteEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_WEBSITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to parse custom websites from storage', err);
    return [];
  }
}

export function saveCustomWebsites(list: WebsiteEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_WEBSITES_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to save custom websites to storage', err);
  }
}

export function getAllWebsites(): WebsiteEntry[] {
  const custom = getCustomWebsites();
  return [...DEFAULT_WEBSITES, ...custom];
}

export function getWebsiteById(id: string): WebsiteEntry | undefined {
  return getAllWebsites().find((site) => site.id.toLowerCase() === id.toLowerCase());
}

export function addWebsite(entry: Omit<WebsiteEntry, 'id' | 'isCustom'>): WebsiteEntry {
  const custom = getCustomWebsites();
  const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cleanAliases = Array.from(
    new Set([
      entry.name.toLowerCase().trim(),
      ...(entry.aliases || []).map((a) => a.toLowerCase().trim()),
    ])
  ).filter(Boolean);

  const newEntry: WebsiteEntry = {
    ...entry,
    id,
    aliases: cleanAliases,
    isCustom: true,
  };

  custom.push(newEntry);
  saveCustomWebsites(custom);
  return newEntry;
}

export function removeWebsite(id: string): boolean {
  const custom = getCustomWebsites();
  const filtered = custom.filter((w) => w.id !== id);
  if (filtered.length !== custom.length) {
    saveCustomWebsites(filtered);
    return true;
  }
  return false;
}
