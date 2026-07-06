import { Outlet, NavLink } from 'react-router-dom';
import { CalendarClock, CalendarDays } from 'lucide-react';
import { es } from '../../i18n/es';

const agendaTabs = [
  {
    icon: CalendarDays,
    label: es.navigation.calendar,
    to: '/app/agenda/calendar',
  },
  {
    icon: CalendarClock,
    label: es.navigation.recurring,
    to: '/app/agenda/recurring',
  },
];

export function AgendaPage() {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-emerald-700">
          {es.agenda.section}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          {es.agenda.title}
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          {es.agenda.subtitle}
        </p>
      </header>

      <nav
        aria-label={es.agenda.tabsLabel}
        className="flex flex-wrap gap-2 rounded-lg border border-slate-100 bg-white p-2 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
      >
        {agendaTabs.map(({ icon: Icon, label, to }) => (
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
