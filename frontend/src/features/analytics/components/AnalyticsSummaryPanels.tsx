import { BarChart3, TrendingUp } from 'lucide-react';
import type { AnalyticsSummary } from '../analyticsApi';
import { es } from '../../../i18n/es';
import { formatMoney } from '../../../lib/money';

type Currency = 'PEN' | 'USD';

export function AnalyticsSummaryPanels({
  currency,
  summary,
}: {
  currency: Currency;
  summary: AnalyticsSummary | undefined;
}) {
  const insightRows = summary ? buildInsightRows(summary, currency) : [];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          icon={TrendingUp}
          label={es.analytics.totalIncome}
          value={formatMoney(Number(summary?.totals.income ?? 0), currency)}
        />
        <MetricCard
          icon={BarChart3}
          label={es.analytics.totalExpense}
          tone="danger"
          value={formatMoney(Number(summary?.totals.expense ?? 0), currency)}
        />
        <MetricCard
          icon={TrendingUp}
          label={es.analytics.balance}
          value={formatMoney(Number(summary?.balance ?? 0), currency)}
        />
        <MetricCard
          icon={BarChart3}
          label={es.analytics.averageDailyExpense}
          value={formatMoney(Number(summary?.averageDailyExpense ?? 0), currency)}
        />
        <MetricCard
          icon={TrendingUp}
          label={es.analytics.expenseComparison}
          tone={
            Number(summary?.comparison?.expenseChangePercent ?? 0) > 0
              ? 'danger'
              : 'normal'
          }
          value={formatPercent(summary?.comparison?.expenseChangePercent)}
        />
        <MetricCard
          icon={BarChart3}
          label={es.analytics.budgetUsage}
          value={
            summary?.budgetUsage
              ? `${summary.budgetUsage.usedPercent}%`
              : es.analytics.noBudget
          }
        />
      </div>

      {insightRows.length > 0 ? (
        <section
          aria-label={es.analytics.insights}
          className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
        >
          <h2 className="text-lg font-bold">{es.analytics.insights}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {insightRows.map((insight) => (
              <article
                className="rounded-md border border-slate-100 bg-slate-50 p-4"
                key={insight.title}
              >
                <p className="text-sm font-semibold text-slate-500">
                  {insight.title}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
                  {insight.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

export function BudgetUsagePanel({
  budgetUsage,
}: {
  budgetUsage: AnalyticsSummary['budgetUsage'] | undefined;
}) {
  if (!budgetUsage) {
    return null;
  }

  return (
    <section
      aria-label={es.analytics.budgetUsage}
      className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{es.analytics.budgetUsage}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {formatMoney(Number(budgetUsage.usedAmount), budgetUsage.currency)} /{' '}
            {formatMoney(Number(budgetUsage.plannedAmount), budgetUsage.currency)}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
          {Number(budgetUsage.usedPercent).toFixed(0)}%
        </span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${
            Number(budgetUsage.usedPercent) > 100
              ? 'bg-red-600'
              : 'bg-emerald-700'
          }`}
          style={{
            width: `${Math.min(Number(budgetUsage.usedPercent), 100)}%`,
          }}
        />
      </div>
    </section>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div aria-label={es.analytics.loading} className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          className="h-28 animate-pulse rounded-lg bg-slate-200"
          key={item}
        />
      ))}
    </div>
  );
}

export function EmptyAnalyticsState() {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-4 py-6 text-center">
      <BarChart3 className="mx-auto text-emerald-700" size={26} />
      <p className="mt-3 font-semibold text-slate-900">
        {es.analytics.emptyTitle}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {es.analytics.emptyState}
      </p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  tone = 'normal',
  value,
}: {
  icon: typeof TrendingUp;
  label: string;
  tone?: 'normal' | 'danger';
  value: string;
}) {
  return (
    <article
      aria-label={`${label}: ${value}`}
      className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
    >
      <div className="flex items-center gap-3">
        <span className={tone === 'danger' ? 'text-red-700' : 'text-emerald-700'}>
          <Icon size={21} />
        </span>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
    </article>
  );
}

function buildInsightRows(summary: AnalyticsSummary, currency: Currency) {
  const balance = Number(summary.balance);
  const expenseChange = Number(summary.comparison?.expenseChangePercent ?? 0);
  const budgetUsage = Number(summary.budgetUsage?.usedPercent ?? 0);
  const rows: Array<{ description: string; title: string }> = [
    {
      title: es.analytics.insightCashflow,
      description:
        balance >= 0
          ? `Cerraste este rango con ${formatMoney(balance, currency)} a favor.`
          : `Este rango quedó en ${formatMoney(Math.abs(balance), currency)} por debajo de tus ingresos.`,
    },
  ];

  if (summary.comparison) {
    rows.push({
      title: es.analytics.insightComparison,
      description:
        expenseChange > 0
          ? `Tus gastos subieron ${formatPercent(summary.comparison.expenseChangePercent)} frente a la referencia elegida.`
          : `Tus gastos bajaron ${formatPercent(summary.comparison.expenseChangePercent)} frente a la referencia elegida.`,
    });
  }

  rows.push({
    title: es.analytics.insightFocus,
    description: summary.topExpenseCategory
      ? `La categoría con más gasto fue ${summary.topExpenseCategory.name}.`
      : 'Aún no hay una categoría dominante con estos filtros.',
  });

  if (summary.budgetUsage) {
    rows.push({
      title: es.analytics.insightBudget,
      description:
        budgetUsage > 100
          ? `El presupuesto ya pasó el límite: ${summary.budgetUsage.usedPercent}% usado.`
          : `El presupuesto va en ${summary.budgetUsage.usedPercent}% usado.`,
    });
  }

  return rows.slice(0, 4);
}

function formatPercent(value?: string) {
  if (!value) {
    return '0.00%';
  }

  const sign = Number(value) > 0 ? '+' : '';
  return `${sign}${value}%`;
}
