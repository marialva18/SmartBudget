import { Outlet } from 'react-router-dom';
import { es } from '../../i18n/es';

export function OnboardingLayout() {
  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-950">
      <header className="flex h-16 items-center border-b border-slate-200 bg-white px-5 md:px-10">
        <span className="text-lg font-extrabold text-emerald-800">
          {es.brand}
        </span>
      </header>
      <Outlet />
    </div>
  );
}
