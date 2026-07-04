import {
  Bell,
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  ReceiptText,
  Settings,
  Tags,
  Target,
  Bot,
  BarChart3,
  Users,
  WalletCards,
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
import { markLoggedOut } from '../../lib/auth-session';
import { getRecurringDueOccurrences } from '../../features/recurring/services/recurringApi';
import { QoriMark } from '../brand/QoriMark';

const navItems = [
  {
    label: es.navigation.dashboard,
    to: '/app/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Coach',
    to: '/app/coach',
    icon: Bot,
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
    label: es.navigation.analytics,
    to: '/app/analytics',
    icon: BarChart3,
  },
  {
    label: es.navigation.calendar,
    to: '/app/calendar',
    icon: CalendarDays,
  },
  {
    label: es.navigation.recurring,
    to: '/app/recurring',
    icon: CalendarClock,
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { availableScopes, canChooseScope, scope, setScope } =
    useFinanceScope();
  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
    enabled: !isLoggingOut,
    refetchInterval: isLoggingOut ? false : 30_000,
  });

  const recurringDueQuery = useQuery({
    queryKey: ['recurring-due'],
    queryFn: getRecurringDueOccurrences,
    enabled: !isLoggingOut,
  });
  const pendingInvitations =
    groupsQuery.data?.filter(
      (group) => group.currentMemberStatus === 'INVITED',
    ).length ?? 0;
  const pendingRecurringDue = recurringDueQuery.data?.length ?? 0;
  const logoutMutation = useMutation({
    mutationFn: async () => {
      setIsLoggingOut(true);
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
    <div className="qori-app-surface min-h-screen text-[#191c1e]">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#073f38]/96 px-4 shadow-[0_10px_30px_rgba(3,32,29,0.18)] backdrop-blur md:hidden">
        <BrandMark tone="light" />
        <div className="flex items-center gap-2">
          <NotificationBell
            pendingInvitations={pendingInvitations}
            pendingRecurringDue={pendingRecurringDue}
          />
          <button
            aria-label={
              isMenuOpen ? es.navigation.menuClose : es.navigation.menuOpen
            }
            className="grid size-10 place-items-center rounded-lg text-[#d4e6df] transition hover:bg-white/10 hover:text-white"
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

     <aside
  className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col overflow-y-auto overscroll-contain border-r border-white/10 bg-[#073f38] p-4 shadow-[10px_0_30px_rgba(3,32,29,0.22)] transition-transform md:translate-x-0 md:shadow-none ${
    isMenuOpen ? 'translate-x-0 pt-20 md:pt-4' : '-translate-x-full'
  }`}
>
  <div className="hidden shrink-0 px-2 pb-8 pt-2 md:block">
    <BrandMark tone="light" />
  </div>

  <nav className="space-y-1 pb-4">
    {navItems.map(({ icon: Icon, label, to }) => (
      <NavLink
        className={({ isActive }) =>
          [
            'flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all',
            isActive
              ? 'bg-[#e5f5ef] text-[#063c36] shadow-[0_12px_28px_rgba(0,0,0,0.16)]'
              : 'text-[#d4e6df] hover:bg-white/10 hover:text-white',
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
    className="mt-2 flex min-h-11 w-full shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/15 hover:text-white disabled:opacity-60"
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
          className="fixed inset-0 z-20 bg-slate-950/25 backdrop-blur-sm md:hidden"
          onClick={() => setIsMenuOpen(false)}
          type="button"
        />
      ) : null}

      <main className="min-h-screen min-w-0 md:pl-64">
        <div className="sticky top-0 z-20 hidden h-16 items-center justify-end gap-4 border-b border-[#e0e3e5] bg-white/90 px-6 shadow-[0_10px_30px_rgba(13,148,136,0.04)] backdrop-blur md:flex lg:px-10">
          <NotificationBell
            pendingInvitations={pendingInvitations}
            pendingRecurringDue={pendingRecurringDue}
          />
          {canChooseScope ? (
            <FinanceScopeSelector
              availableScopes={availableScopes}
              scope={scope}
              setScope={setScope}
            />
          ) : null}
        </div>
        <div className="mx-auto w-full max-w-7xl min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 md:py-8 lg:px-10">
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
  pendingRecurringDue,
}: {
  pendingInvitations: number;
  pendingRecurringDue: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const totalNotifications = pendingInvitations + pendingRecurringDue;
  return (
    <div className="relative">
      <button
        aria-label={es.navigation.notifications}
        className="relative grid size-10 place-items-center rounded-lg border border-[#e0e3e5] bg-white text-[#3c4a46] shadow-[0_10px_30px_rgba(13,148,136,0.06)] transition hover:border-[#bacac5] hover:text-[#006b5f]"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Bell size={19} />
        {totalNotifications > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-700 px-1 text-xs font-bold text-white ring-2 ring-white">
            {totalNotifications}
          </span>
        ) : null}
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-[#e0e3e5] bg-white p-4 shadow-[0_18px_45px_rgba(13,148,136,0.14)]">
          <p className="font-bold">{es.navigation.notifications}</p>
          {totalNotifications > 0 ? (
            <div className="mt-3 space-y-2">
              {pendingRecurringDue > 0 ? (
                <NavLink
                  className="block rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900"
                  onClick={() => setIsOpen(false)}
                  to="/app/recurring"
                >
                  {pendingRecurringDue === 1
                    ? 'Tienes 1 recurrencia pendiente por confirmar'
                    : `Tienes ${pendingRecurringDue} recurrencias pendientes por confirmar`}
                </NavLink>
              ) : null}

              {pendingInvitations > 0 ? (
                <NavLink
                  className="block rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900"
                  onClick={() => setIsOpen(false)}
                  to="/app/groups"
                >
                  {es.navigation.pendingInvitations(pendingInvitations)}
                </NavLink>
              ) : null}
            </div>
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
      className={`${className} items-center justify-between gap-3 rounded-lg border border-[#e0e3e5] bg-white px-4 py-3 text-sm font-semibold text-[#3c4a46] shadow-[0_10px_30px_rgba(13,148,136,0.06)] md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none`}
    >
      {es.navigation.financeView}
      <select
        className="rounded-lg border border-[#bacac5] bg-white px-3 py-2 text-[#191c1e] outline-none transition focus:border-[#006b5f] focus:ring-2 focus:ring-[#2dd4bf]/40"
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

function BrandMark({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <div className="flex items-center gap-3">
      <QoriMark size="sm" />
      <span
        className={[
          'text-xl font-black',
          tone === 'light' ? 'text-white' : 'text-[#005f55]',
        ].join(' ')}
      >
        {es.brand}
      </span>
    </div>
  );
}
