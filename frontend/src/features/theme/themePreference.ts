import type { ThemePreference } from './themeContext';

export function getNextThemePreference(
  preference: ThemePreference,
): ThemePreference {
  if (preference === 'LIGHT') {
    return 'DARK';
  }

  if (preference === 'DARK') {
    return 'SYSTEM';
  }

  return 'LIGHT';
}
