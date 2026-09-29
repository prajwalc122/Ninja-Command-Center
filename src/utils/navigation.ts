/**
 * Safe navigation utility for NINJA Web Command Center.
 * Strictly prevents script execution, javascript: protocol, or malformed URLs.
 */

export function isValidHttpUrl(stringUrl: string): boolean {
  try {
    const url = new URL(stringUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Reject dangerous protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return null;
  }

  // Prepend https:// if standard domain pattern (e.g. "github.com" or "news.ycombinator.com")
  let target = trimmed;
  if (!/^https?:\/\//i.test(target)) {
    if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(target)) {
      target = `https://${target}`;
    }
  }

  if (isValidHttpUrl(target)) {
    return target;
  }

  return null;
}

export function safeOpenUrl(url: string, newTab = true): boolean {
  const safe = sanitizeUrl(url);
  if (!safe) return false;

  try {
    if (newTab) {
      const opened = window.open(safe, '_blank', 'noopener,noreferrer');
      if (!opened) {
        // If popup blocker intervened, assign directly
        window.location.assign(safe);
      }
    } else {
      window.location.assign(safe);
    }
    return true;
  } catch (err) {
    console.warn('Navigation error:', err);
    try {
      window.location.href = safe;
      return true;
    } catch {
      return false;
    }
  }
}
