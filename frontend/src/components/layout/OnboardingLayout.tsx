import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/services/authApi';
import { getProfile, updateProfile } from '../../features/profile/profileApi';
import { getNextThemePreference } from '../../features/theme/themePreference';
import type { ThemePreference } from '../../features/theme/themeContext';
import { useTheme } from '../../features/theme/useTheme';
import { es } from '../../i18n/es';
import { markLoggedOut } from '../../lib/auth-session';
import { ThemeToggleButton } from '../ui/ThemeToggleButton';

export function OnboardingLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { effectiveTheme, preference, setPreference } = useTheme();
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
  const themeMutation = useMutation({
    mutationFn: (theme: ThemePreference) => {
      if (!profileQuery.data) {
        return Promise.resolve(null);
      }

      return updateProfile({
        aiEnabled: profileQuery.data.aiEnabled,
        displayName: profileQuery.data.displayName,
        highExpenseWarningPercent: profileQuery.data.highExpenseWarningPercent,
        maxExpenseAmountPen: profileQuery.data.maxExpenseAmountPen,
        maxExpenseAmountUsd: profileQuery.data.maxExpenseAmountUsd,
        preferredCurrency: profileQuery.data.preferredCurrency,
        theme,
        timezone: profileQuery.data.timezone,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await queryClient.cancelQueries();
      return logout();
    },
    onSettled: () => {
      markLoggedOut();
      queryClient.clear();
      navigate('/', { replace: true });
    },
  });

  useEffect(() => {
    if (profileQuery.data?.theme) {
      setPreference(profileQuery.data.theme);
    }
  }, [profileQuery.data?.theme, setPreference]);

  function handleThemeToggle() {
    const nextTheme = getNextThemePreference(preference);
    setPreference(nextTheme);
    themeMutation.mutate(nextTheme);
  }

  return (
    <div className="qori-auth-surface min-h-screen text-slate-950">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-10">
        <span className="text-lg font-extrabold text-emerald-800">
          {es.brand}
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggleButton
            effectiveTheme={effectiveTheme}
            isPending={themeMutation.isPending}
            onToggle={handleThemeToggle}
            preference={preference}
          />
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-emerald-800 disabled:opacity-60"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            type="button"
          >
            <LogOut size={17} />
            {es.navigation.logout}
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
