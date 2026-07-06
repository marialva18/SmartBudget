import { MonitorCog, Moon, Sun } from 'lucide-react';
import type { ThemePreference } from '../../features/theme/themeContext';
import { es } from '../../i18n/es';

type ThemeToggleButtonProps = {
  effectiveTheme: 'LIGHT' | 'DARK';
  isPending?: boolean;
  onToggle: () => void;
  preference: ThemePreference;
};

export function ThemeToggleButton({
  effectiveTheme,
  isPending = false,
  onToggle,
  preference,
}: ThemeToggleButtonProps) {
  const Icon =
    preference === 'SYSTEM' ? MonitorCog : effectiveTheme === 'DARK' ? Moon : Sun;
  const label = `${es.navigation.themeToggle}: ${formatThemePreference(
    preference,
  )}`;

  return (
    <button
      aria-label={label}
      className="grid size-10 place-items-center rounded-lg border border-[#e0e3e5] bg-white text-[#3c4a46] shadow-[0_10px_30px_rgba(13,148,136,0.06)] transition hover:border-[#bacac5] hover:text-[#006b5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:opacity-60"
      disabled={isPending}
      onClick={onToggle}
      title={label}
      type="button"
    >
      <Icon size={19} />
    </button>
  );
}

function formatThemePreference(preference: ThemePreference) {
  return es.settings.themes[preference];
}
