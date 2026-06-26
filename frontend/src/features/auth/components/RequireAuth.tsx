import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { es } from '../../../i18n/es';
import { getCurrentUser } from '../services/authApi';

type RequireAuthProps = {
  onboarding?: 'complete' | 'incomplete';
};

export function RequireAuth({ onboarding }: RequireAuthProps) {
  const location = useLocation();
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    retry: false,
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
