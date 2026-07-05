import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ThemeContext,
  type ThemePreference,
  type ThemeContextValue,
} from './themeContext';

const storageKey = 'qori-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredTheme(),
  );
  const [systemTheme, setSystemTheme] = useState<'LIGHT' | 'DARK'>(() =>
    getSystemTheme(),
  );
  const effectiveTheme = preference === 'SYSTEM' ? systemTheme : preference;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemTheme(media.matches ? 'DARK' : 'LIGHT');

    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', effectiveTheme === 'DARK');
    document.documentElement.style.colorScheme =
      effectiveTheme === 'DARK' ? 'dark' : 'light';
  }, [effectiveTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      effectiveTheme,
      preference,
      setPreference: (nextPreference) => {
        localStorage.setItem(storageKey, nextPreference);
        setPreferenceState(nextPreference);
      },
    }),
    [effectiveTheme, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function readStoredTheme(): ThemePreference {
  const stored = localStorage.getItem(storageKey);

  if (stored === 'LIGHT' || stored === 'DARK' || stored === 'SYSTEM') {
    return stored;
  }

  return 'SYSTEM';
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'DARK'
    : 'LIGHT';
}
