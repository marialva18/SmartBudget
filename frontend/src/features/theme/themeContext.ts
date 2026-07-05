import { createContext } from 'react';

export type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM';

export type ThemeContextValue = {
  effectiveTheme: 'LIGHT' | 'DARK';
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
