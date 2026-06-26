import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  ReceiptText,
  Settings,
  Tags,
  Target,
  Users,
  WalletCards,
  CalendarDays,
  X,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/services/authApi';
import { FinanceScopeProvider } from '../../features/finance-scope/FinanceScopeContext';
import { useFinanceScope } from '../../features/finance-scope/financeScope';
import { getGroups } from '../../features/groups/groupsApi';
import { es } from '../../i18n/es';
import { clearAuthSession } from '../../lib/auth-session';

const navItems = [
  {
    label: es.navigation.dashboard,
    to: '/app/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: es.navigation.accounts,
    to: '/app/accounts',
    icon: WalletCards,
  },
  {
    label: es.navigation.transactions,
    to: '/app/transactions',
    icon: ReceiptText,
  },
  {
  label: es.navigation.calendar,
  to: '/app/calendar',
  icon: CalendarDays,
},
  {
    label: es.navigation.categories,
    to: '/app/categories',
    icon: Tags,
  },
  {
    label: es.navigation.budgets,
    to: '/app/budgets',
    icon: PiggyBank,
  },
  {
    label: es.navigation.goals,
    to: '/app/goals',
    icon: Target,
  },
  {
    label: es.navigation.groups,
    to: '/app/groups',
    icon: Users,
  },
  {
    label: es.navigation.settings,
    to: '/app/settings',
    icon: Settings,
  },
];

export function AppLayout() {
  return (
    <FinanceScopeProvider>
      <AppShell />
    </FinanceScopeProvider>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { availableScopes, canChooseScope, scope, setScope } =
    useFinanceScope();
  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });
  const pendingInvitations =
    groupsQuery.data?.filter(
      (group) => group.currentMemberStatus === 'INVITED',
    ).length ?? 0;
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAuthSession();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-950">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <span className="text-lg font-extrabold text-emerald-800">
          {es.brand}
        </span>
        <div className="flex items-center gap-2">
          <NotificationBell pendingInvitations={pendingInvitations} />
          <button
            aria-label={
              isMenuOpen ? es.navigation.menuClose : es.navigation.menuOpen
            }
            className="grid size-10 place-items-center rounded-md hover:bg-slate-100"
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200 bg-white p-4 transition-transform md:translate-x-0 ${
          isMenuOpen ? 'translate-x-0 pt-20' : '-translate-x-full'
        }`}
      >
        <div className="hidden px-2 pb-8 pt-2 text-xl font-extrabold text-emerald-800 md:block">
          {es.brand}
        </div>
        <nav className="space-y-1">
          {navItems.map(({ icon: Icon, label, to }) => (
            <NavLink
              className={({ isActive }) =>
                [
                  'flex min-h-11 items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-teal-300 text-emerald-950 shadow-[0_0_15px_rgba(0,107,95,0.16)]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                ].join(' ')
              }
              key={to}
              onClick={() => setIsMenuOpen(false)}
              to={to}
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          className="mt-4 flex min-h-11 w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
          type="button"
        >
          <LogOut size={19} />
          {es.navigation.logout}
        </button>
      </aside>

      {isMenuOpen ? (
        <button
          aria-label={es.navigation.navigationClose}
          className="fixed inset-0 z-20 bg-slate-950/20 md:hidden"
          onClick={() => setIsMenuOpen(false)}
          type="button"
        />
      ) : null}

      <main className="min-h-screen md:pl-64">
        <div className="sticky top-0 z-20 hidden h-16 items-center justify-end gap-4 border-b border-slate-200 bg-white px-6 md:flex lg:px-10">
          <NotificationBell pendingInvitations={pendingInvitations} />
          {canChooseScope ? (
            <FinanceScopeSelector
              availableScopes={availableScopes}
              scope={scope}
              setScope={setScope}
            />
          ) : null}
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-8 lg:px-10">
          {canChooseScope ? (
            <FinanceScopeSelector
              availableScopes={availableScopes}
              className="mb-5 flex md:hidden"
              scope={scope}
              setScope={setScope}
            />
          ) : null}
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NotificationBell({
  pendingInvitations,
}: {
  pendingInvitations: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        aria-label={es.navigation.notifications}
        className="relative grid size-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Bell size={19} />
        {pendingInvitations > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-700 px-1 text-xs font-bold text-white">
            {pendingInvitations}
          </span>
        ) : null}
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
          <p className="font-bold">{es.navigation.notifications}</p>
          {pendingInvitations > 0 ? (
            <NavLink
              className="mt-3 block rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900"
              onClick={() => setIsOpen(false)}
              to="/app/groups"
            >
              {es.navigation.pendingInvitations(pendingInvitations)}
            </NavLink>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              {es.navigation.noNotifications}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function FinanceScopeSelector({
  availableScopes,
  className = 'flex',
  scope,
  setScope,
}: {
  availableScopes: Array<'ALL' | 'PEN' | 'USD'>;
  className?: string;
  scope: 'ALL' | 'PEN' | 'USD';
  setScope: (scope: 'ALL' | 'PEN' | 'USD') => void;
}) {
  return (
    <label
      className={`${className} items-center justify-between gap-3 rounded-md bg-white px-4 py-3 text-sm font-semibold text-slate-600 md:rounded-none md:px-0 md:py-0`}
    >
      {es.navigation.financeView}
      <select
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-emerald-700"
        onChange={(event) =>
          setScope(event.target.value as 'ALL' | 'PEN' | 'USD')
        }
        value={scope}
      >
        {availableScopes.map((value) => (
          <option key={value} value={value}>
            {value === 'ALL' ? es.navigation.allCurrencies : value}
          </option>
        ))}
      </select>
    </label>
  );
}
