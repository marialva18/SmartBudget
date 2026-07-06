import { NavLink, Outlet } from 'react-router-dom';
import { ReceiptText, Tags } from 'lucide-react';
import { es } from '../../i18n/es';

const transactionTabs = [
  {
    icon: ReceiptText,
    label: es.navigation.transactions,
    to: '/app/transactions/movements',
  },
  {
    icon: Tags,
    label: es.navigation.categories,
    to: '/app/transactions/categories',
  },
];

export function TransactionsHubPage() {
  return (
    <section className="space-y-6">
      <nav
        aria-label={es.transactions.tabsLabel}
        className="flex flex-wrap gap-2 rounded-lg border border-slate-100 bg-white p-2 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
      >
        {transactionTabs.map(({ icon: Icon, label, to }) => (
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
