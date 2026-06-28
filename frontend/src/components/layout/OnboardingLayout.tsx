import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/services/authApi';
import { es } from '../../i18n/es';
import { markLoggedOut } from '../../lib/auth-session';

export function OnboardingLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-950">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-10">
        <span className="text-lg font-extrabold text-emerald-800">
          {es.brand}
        </span>
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-emerald-800 disabled:opacity-60"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
          type="button"
        >
          <LogOut size={17} />
          {es.navigation.logout}
        </button>
      </header>
      <Outlet />
    </div>
  );
}
