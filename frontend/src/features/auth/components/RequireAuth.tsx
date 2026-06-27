import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { es } from '../../../i18n/es';
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  wasLoggedOut,
} from '../../../lib/auth-session';
import { getCurrentUser, refreshSession } from '../services/authApi';

type RequireAuthProps = {
  onboarding?: 'complete' | 'incomplete';
};

export function RequireAuth({ onboarding }: RequireAuthProps) {
  const location = useLocation();

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: resolveCurrentUser,
    retry: false,
    staleTime: 30_000,
  });

  if (query.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f8f7] px-4 text-center">
        <p className="font-semibold text-emerald-800">
          {es.auth.verifyingSession}
        </p>
      </div>
    );
  }

  if (query.isError) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  const user = query.data;

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (onboarding === 'complete' && !user.onboardingCompleted) {
    return <Navigate replace to="/onboarding/welcome" />;
  }

  if (onboarding === 'incomplete' && user.onboardingCompleted) {
    return <Navigate replace to="/app/dashboard" />;
  }

  return <Outlet />;
}

async function resolveCurrentUser() {
  try {
    const currentSession = getAuthSession();

    if (!currentSession?.accessToken) {
      if (wasLoggedOut()) {
        throw new Error('User logged out intentionally.');
      }

      const refreshedSession = await refreshSession();
      setAuthSession(refreshedSession);
    }

    return await getCurrentUser();
  } catch (error) {
    clearAuthSession();
    throw error;
  }
}