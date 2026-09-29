import { useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type EffectiveTheme = 'dark' | 'light';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ninja_theme') as ThemeMode;
      if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
        return saved;
      }
    }
    return 'dark';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('dark');

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      const currentEffective: EffectiveTheme = isDark ? 'dark' : 'light';
      setEffectiveTheme(currentEffective);

      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
        document.body.style.backgroundColor = '#090d16';
        document.body.style.color = '#f1f5f9';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
        document.body.style.backgroundColor = '#f8fafc';
        document.body.style.color = '#0f172a';
      }

      // Update theme-color meta tag
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#090d16' : '#ffffff');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme === 'dark');
    }

    localStorage.setItem('ninja_theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('ninja_theme', newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      // Toggle directly and reliably between dark and light
      const nextTheme: ThemeMode = effectiveTheme === 'dark' ? 'light' : 'dark';
      return nextTheme;
    });
  };

  return { theme, effectiveTheme, toggleTheme, setTheme };
}
