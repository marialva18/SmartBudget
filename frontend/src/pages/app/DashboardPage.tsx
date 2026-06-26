import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Banknote, PiggyBank, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAccounts } from '../../features/accounts/services/accountsApi';
import { useFinanceScope } from '../../features/finance-scope/financeScope';
import { es } from '../../i18n/es';

export function DashboardPage() {
  const { scope } = useFinanceScope();
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });
  const activeAccounts =
    accountsQuery.data?.filter((account) => account.status === 'ACTIVE') ?? [];
  const currencies = (['PEN', 'USD'] as const)
    .map((currency) => ({
      currency,
      accounts: activeAccounts.filter(
        (account) => account.currency === currency,
      ),
    }))
    .filter(
      (group) =>
        group.accounts.length > 0 &&
        (scope === 'ALL' || group.currency === scope),
    );

  return (
    <section className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {es.dashboard.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {es.dashboard.greeting}
          </h1>
          <p className="mt-2 text-slate-600">
            {es.dashboard.subtitle}
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white"
          to="/app/accounts"
        >
          {es.dashboard.manageAccounts}
          <ArrowRight size={18} />
        </Link>
      </header>

      {accountsQuery.isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-slate-200" />
      ) : null}

      {currencies.length === 0 && !accountsQuery.isLoading ? (
        <div className="border-y border-slate-200 py-12 text-center">
          <WalletCards className="mx-auto text-emerald-700" size={40} />
          <h2 className="mt-4 text-xl font-bold">
            {es.dashboard.emptyTitle}
          </h2>
          <p className="mt-2 text-slate-600">
            {es.dashboard.emptyDescription}
          </p>
        </div>
      ) : null}

      {currencies.map(({ accounts, currency }) => {
        const totals = accounts.reduce(
          (sum, account) => ({
            real: sum.real + Number(account.realBalance),
            reserved: sum.reserved + Number(account.reservedAmount),
            available: sum.available + Number(account.availableBalance),
          }),
          { real: 0, reserved: 0, available: 0 },
        );

        return (
          <section key={currency}>
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500">
              {currency}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                currency={currency}
                icon={Banknote}
                label={es.dashboard.realBalance}
                value={totals.real}
              />
              <MetricCard
                currency={currency}
                icon={PiggyBank}
                label={es.dashboard.reserved}
                value={totals.reserved}
              />
              <MetricCard
                accent
                currency={currency}
                icon={WalletCards}
                label={es.dashboard.available}
                value={totals.available}
              />
            </div>
          </section>
        );
      })}
    </section>
  );
}

function MetricCard({
  accent = false,
  currency,
  icon: Icon,
  label,
  value,
}: {
  accent?: boolean;
  currency: 'PEN' | 'USD';
  icon: typeof Banknote;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-lg border border-white bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
      <span className="grid size-10 place-items-center rounded-md bg-emerald-50 text-emerald-800">
        <Icon size={20} />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold ${
          accent ? 'text-emerald-800' : 'text-slate-950'
        }`}
      >
        {new Intl.NumberFormat('es-PE', {
          style: 'currency',
          currency,
        }).format(value)}
      </p>
    </article>
  );
}
