import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  PiggyBank,
  ReceiptText,
  Target,
  WalletCards,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getDashboardSummary,
  type DashboardCurrencySummary,
  type DashboardTransaction,
} from '../../features/dashboard/dashboardApi';
import { useFinanceScope } from '../../features/finance-scope/financeScope';
import { es } from '../../i18n/es';

export function DashboardPage() {
  const { scope } = useFinanceScope();
  const monthStart = getCurrentMonthStart();
  const dashboardQuery = useQuery({
    queryKey: ['dashboard-summary', scope, monthStart],
    queryFn: () =>
      getDashboardSummary({
        currency: scope === 'ALL' ? undefined : scope,
        monthStart,
      }),
  });
  const summary = dashboardQuery.data;

  return (
    <section className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {es.dashboard.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {es.dashboard.title}
          </h1>
          <p className="mt-2 text-slate-600">
            {es.dashboard.subtitle(getMonthLabel(monthStart))}
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white"
          to="/app/transactions"
        >
          {es.dashboard.addMovement}
          <ArrowRight size={18} />
        </Link>
      </header>

      {dashboardQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              className="h-36 animate-pulse rounded-lg bg-slate-200"
              key={item}
            />
          ))}
        </div>
      ) : null}

      {dashboardQuery.isError ? (
        <div className="border-y border-red-100 py-10 text-center">
          <p className="font-semibold text-red-700">
            {es.dashboard.loadError}
          </p>
        </div>
      ) : null}

      {summary && summary.currencies.length === 0 ? (
        <div className="border-y border-slate-200 py-12 text-center">
          <WalletCards className="mx-auto text-emerald-700" size={40} />
          <h2 className="mt-4 text-xl font-bold">
            {es.dashboard.emptyTitle}
          </h2>
          <p className="mt-2 text-slate-600">
            {es.dashboard.emptyDescription}
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white"
            to="/app/accounts"
          >
            {es.dashboard.manageAccounts}
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : null}

      {summary?.currencies.map((currencySummary) => (
        <CurrencySection
          key={currencySummary.currency}
          summary={currencySummary}
        />
      ))}

      {summary && summary.recentTransactions.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {es.dashboard.recentMovements}
            </h2>
            <Link
              className="text-sm font-semibold text-emerald-800"
              to="/app/transactions"
            >
              {es.dashboard.viewAll}
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {summary.recentTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function CurrencySection({ summary }: { summary: DashboardCurrencySummary }) {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">
          {es.accounts.currencies[summary.currency].plural}
        </p>
        <h2 className="mt-1 text-xl font-bold">{summary.currency}</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard
          currency={summary.currency}
          icon={Banknote}
          label={es.dashboard.realBalance}
          value={Number(summary.realBalance)}
        />
        <MetricCard
          currency={summary.currency}
          icon={PiggyBank}
          label={es.dashboard.reserved}
          value={Number(summary.reservedAmount)}
        />
        <MetricCard
          accent
          currency={summary.currency}
          icon={WalletCards}
          label={es.dashboard.available}
          value={Number(summary.availableBalance)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
          <h3 className="text-lg font-bold">{es.dashboard.monthActivity}</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <CompactMetric
              currency={summary.currency}
              icon={ArrowUpRight}
              label={es.dashboard.monthlyIncome}
              value={Number(summary.monthlyIncome)}
            />
            <CompactMetric
              currency={summary.currency}
              icon={ArrowDownRight}
              label={es.dashboard.monthlyExpense}
              tone="danger"
              value={Number(summary.monthlyExpense)}
            />
            <CompactMetric
              currency={summary.currency}
              icon={ReceiptText}
              label={es.dashboard.monthlyBalance}
              tone={Number(summary.monthlyBalance) < 0 ? 'danger' : 'normal'}
              value={Number(summary.monthlyBalance)}
            />
          </div>
          <BudgetProgress summary={summary} />
        </section>

        <section className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold">{es.dashboard.activeGoals}</h3>
            <Link
              className="text-sm font-semibold text-emerald-800"
              to="/app/goals"
            >
              {es.dashboard.viewAll}
            </Link>
          </div>
          {summary.goals.length > 0 ? (
            <div className="mt-4 space-y-4">
              {summary.goals.map((goal) => (
                <div key={goal.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">{goal.name}</span>
                    <span className="text-slate-500">
                      {Number(goal.progressPercent).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-700"
                      style={{
                        width: `${Math.min(Number(goal.progressPercent), 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatMoney(
                      Number(goal.reservedAmount),
                      summary.currency,
                    )}{' '}
                    / {formatMoney(Number(goal.targetAmount), summary.currency)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center text-slate-500">
              <Target className="mx-auto text-emerald-800" size={28} />
              <p className="mt-2 text-sm">{es.dashboard.noGoals}</p>
            </div>
          )}
        </section>
      </div>
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
  icon: LucideIcon;
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
        className={`mt-1 break-words text-2xl font-bold ${
          accent ? 'text-emerald-800' : 'text-slate-950'
        }`}
      >
        {formatMoney(value, currency)}
      </p>
    </article>
  );
}

function CompactMetric({
  currency,
  icon: Icon,
  label,
  tone = 'normal',
  value,
}: {
  currency: 'PEN' | 'USD';
  icon: LucideIcon;
  label: string;
  tone?: 'normal' | 'danger';
  value: number;
}) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <span
        className={`inline-grid size-9 place-items-center rounded-md ${
          tone === 'danger'
            ? 'bg-red-50 text-red-700'
            : 'bg-emerald-50 text-emerald-800'
        }`}
      >
        <Icon size={18} />
      </span>
      <p className="mt-3 text-xs font-semibold uppercase text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-lg font-bold">
        {formatMoney(value, currency)}
      </p>
    </div>
  );
}

function BudgetProgress({ summary }: { summary: DashboardCurrencySummary }) {
  const planned = Number(summary.budgetAmount);
  const used = Number(summary.budgetUsedAmount);
  const percent = planned > 0 ? Math.min((used / planned) * 100, 100) : 0;

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold">{es.dashboard.budgetProgress}</p>
          <p className="mt-1 text-sm text-slate-500">
            {planned > 0
              ? es.dashboard.budgetUsed(
                  formatMoney(used, summary.currency),
                  formatMoney(planned, summary.currency),
                )
              : es.dashboard.noBudget}
          </p>
        </div>
        <Link
          className="text-sm font-semibold text-emerald-800"
          to="/app/budgets"
        >
          {es.dashboard.manageBudgets}
        </Link>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-700"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function TransactionRow({
  transaction,
}: {
  transaction: DashboardTransaction;
}) {
  const isExpense = transaction.type === 'EXPENSE';
  return (
    <div className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <p className="font-semibold">{transaction.description}</p>
        <p className="mt-1 text-sm text-slate-500">
          {transaction.account.name}
          {transaction.category ? ` - ${transaction.category.name}` : ''}
        </p>
      </div>
      <div className="sm:text-right">
        <p
          className={`font-bold ${
            isExpense ? 'text-red-700' : 'text-emerald-800'
          }`}
        >
          {isExpense ? '-' : '+'}{' '}
          {formatMoney(Number(transaction.amount), transaction.currency)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {new Intl.DateTimeFormat('es-PE', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(transaction.occurredAt))}
        </p>
      </div>
    </div>
  );
}

function getCurrentMonthStart() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0',
  )}-01`;
}

function getMonthLabel(monthStart: string) {
  return new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${monthStart}T00:00:00`));
}

function formatMoney(value: number, currency: 'PEN' | 'USD') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
  }).format(value);
}
