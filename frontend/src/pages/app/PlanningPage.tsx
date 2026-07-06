import { Outlet, NavLink } from 'react-router-dom';
import { PiggyBank, Target } from 'lucide-react';
import { es } from '../../i18n/es';

const planningTabs = [
  {
    icon: PiggyBank,
    label: es.navigation.budgets,
    to: '/app/planning/budgets',
  },
  {
    icon: Target,
    label: es.navigation.goals,
    to: '/app/planning/goals',
  },
];

export function PlanningPage() {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-emerald-700">
          {es.planning.section}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          {es.planning.title}
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          {es.planning.subtitle}
        </p>
      </header>

      <nav
        aria-label={es.planning.tabsLabel}
        className="flex flex-wrap gap-2 rounded-lg border border-slate-100 bg-white p-2 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
      >
        {planningTabs.map(({ icon: Icon, label, to }) => (
          <NavLink
            className={({ isActive }) =>
              [
                'inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition',
                isActive
                  ? 'bg-emerald-700 text-white shadow-[0_10px_24px_rgba(13,148,136,0.18)]'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800',
              ].join(' ')
            }
            key={to}
            to={to}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </section>
  );
}
