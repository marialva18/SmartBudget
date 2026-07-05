import { useQueries, useQuery } from '@tanstack/react-query';
import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  downloadAnalyticsExport,
  downloadAnalyticsPdf,
  getAnalyticsByAccount,
  getAnalyticsByCategory,
  getAnalyticsSummary,
  getAnalyticsTimeline,
  getAnalyticsTopExpenses,
  type AnalyticsFilters,
  type AnalyticsSummary,
} from '../../features/analytics/analyticsApi';
import { getAccounts } from '../../features/accounts/services/accountsApi';
import { getCategories } from '../../features/categories/categoriesApi';
import { useFinanceScope } from '../../features/finance-scope/financeScope';
import { getGroups } from '../../features/groups/groupsApi';
import { es } from '../../i18n/es';
import { formatMoney } from '../../lib/money';

type RangePreset =
  | 'TODAY'
  | 'WEEK'
  | 'MONTH'
  | 'PREVIOUS_MONTH'
  | 'THREE_MONTHS'
  | 'CUSTOM';

type CompareWith = 'PREVIOUS_PERIOD' | 'PREVIOUS_MONTH' | 'PREVIOUS_YEAR' | 'NONE';

const filterFieldClass =
  'min-h-12 rounded-md bg-slate-100 px-3 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-emerald-700';

export function AnalyticsPage() {
  const { scope } = useFinanceScope();
  const [range, setRange] = useState<RangePreset>('MONTH');
  const [customFrom, setCustomFrom] = useState(getCurrentMonthStartKey());
  const [customTo, setCustomTo] = useState(getTodayDateKey());
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [type, setType] = useState<'' | 'INCOME' | 'EXPENSE'>('');
  const [compareWith, setCompareWith] =
    useState<CompareWith>('PREVIOUS_PERIOD');
  const [impact, setImpact] = useState<
    '' | 'AFFECTS_BALANCE' | 'ANALYSIS_ONLY' | 'PENDING_FUTURE'
  >('');
  const [exportError, setExportError] = useState('');
  const [exportingFormat, setExportingFormat] = useState<
    'xlsx' | 'pdf' | null
  >(null);

  const filters = useMemo<AnalyticsFilters>(() => {
    const dateRange =
      range === 'CUSTOM'
        ? { from: toStartIso(customFrom), to: toEndIso(customTo) }
        : getRangeIso(range);

    return {
      ...dateRange,
      accountId: accountId || undefined,
      categoryId: categoryId || undefined,
      groupId: groupId || undefined,
      type: type || undefined,
      currency: scope === 'ALL' ? undefined : scope,
      balanceImpactStatus: impact || undefined,
      compareWith,
    };
  }, [
    accountId,
    categoryId,
    compareWith,
    customFrom,
    customTo,
    groupId,
    impact,
    range,
    scope,
    type,
  ]);

  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const categoriesQuery = useQuery({
    queryKey: ['categories', type || 'ALL', 'ACTIVE'],
    queryFn: () => getCategories(type || undefined),
  });
  const [
    summaryQuery,
    categoriesAnalyticsQuery,
    accountsAnalyticsQuery,
    timelineQuery,
    topExpensesQuery,
  ] =
    useQueries({
      queries: [
        {
          queryKey: ['analytics-summary', filters],
          queryFn: () => getAnalyticsSummary(filters),
        },
        {
          queryKey: ['analytics-by-category', filters],
          queryFn: () => getAnalyticsByCategory(filters),
        },
        {
          queryKey: ['analytics-by-account', filters],
          queryFn: () => getAnalyticsByAccount(filters),
        },
        {
          queryKey: ['analytics-timeline', filters],
          queryFn: () => getAnalyticsTimeline(filters),
        },
        {
          queryKey: ['analytics-top-expenses', filters],
          queryFn: () => getAnalyticsTopExpenses(filters),
        },
      ],
    });

  const currency = scope === 'USD' ? 'USD' : 'PEN';
  const topCategoryAmount = Math.max(
    ...((categoriesAnalyticsQuery.data ?? []).map((row) => Number(row.amount))),
    1,
  );
  const categoryChartRows = (categoriesAnalyticsQuery.data ?? [])
    .slice(0, 8)
    .map((row) => ({
      name: row.category?.name ?? es.budgets.uncategorized,
      amount: Number(row.amount),
      currency: row.currency,
    }));
  const hasCategoryData = (categoriesAnalyticsQuery.data ?? []).length > 0;
  const accountExpenseRows = (accountsAnalyticsQuery.data ?? []).filter(
    (row) => row.type === 'EXPENSE',
  );
  const topAccountAmount = Math.max(
    ...accountExpenseRows.map((row) => Number(row.amount)),
    1,
  );
  const accountChartRows = accountExpenseRows.slice(0, 8).map((row) => ({
    name: row.account?.name ?? es.transactions.account,
    amount: Number(row.amount),
    currency: row.currency,
  }));
  const hasAccountData = accountExpenseRows.length > 0;
  const hasTopExpenses = (topExpensesQuery.data ?? []).length > 0;
  const hasTimelineData = (timelineQuery.data ?? []).length > 0;
  const budgetUsage = summaryQuery.data?.budgetUsage;
  const comparisonRows = summaryQuery.data?.comparison
    ? buildComparisonRows(summaryQuery.data)
    : [];
  const insightRows = summaryQuery.data
    ? buildInsightRows(summaryQuery.data, currency)
    : [];

  async function handleExport(format: 'xlsx' | 'pdf') {
    setExportError('');
    setExportingFormat(format);

    try {
      const file =
        format === 'xlsx'
          ? await downloadAnalyticsExport(filters)
          : await downloadAnalyticsPdf(filters);
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename ?? `qori-analytics.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(es.analytics.exportError);
    } finally {
      setExportingFormat(null);
    }
  }

  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {es.analytics.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {es.analytics.title}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            {es.analytics.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={Boolean(exportingFormat)}
            onClick={() => void handleExport('xlsx')}
            type="button"
          >
            <Download size={18} />
            {exportingFormat === 'xlsx'
              ? es.analytics.exporting
              : es.analytics.export}
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-4 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            disabled={Boolean(exportingFormat)}
            onClick={() => void handleExport('pdf')}
            type="button"
          >
            <FileText size={18} />
            {exportingFormat === 'pdf'
              ? es.analytics.exporting
              : es.analytics.exportPdf}
          </button>
        </div>
      </header>

      <section
        aria-label={es.analytics.filters.panel}
        className="grid gap-3 rounded-lg bg-white p-4 shadow-[0_10px_30px_rgba(13,148,136,0.08)] md:grid-cols-3 xl:grid-cols-8"
      >
        <label className="sr-only" htmlFor="analytics-range">
          {es.analytics.filters.range}
        </label>
        <select
          className={filterFieldClass}
          id="analytics-range"
          onChange={(event) => setRange(event.target.value as RangePreset)}
          value={range}
        >
          <option value="TODAY">{es.analytics.filters.today}</option>
          <option value="WEEK">{es.analytics.filters.week}</option>
          <option value="MONTH">{es.analytics.filters.month}</option>
          <option value="PREVIOUS_MONTH">{es.analytics.filters.previousMonth}</option>
          <option value="THREE_MONTHS">{es.analytics.filters.threeMonths}</option>
          <option value="CUSTOM">{es.analytics.filters.custom}</option>
        </select>
        {range === 'CUSTOM' ? (
          <>
            <label className="sr-only" htmlFor="analytics-from">
              {es.analytics.filters.from}
            </label>
            <input
              className={filterFieldClass}
              id="analytics-from"
              onChange={(event) => setCustomFrom(event.target.value)}
              type="date"
              value={customFrom}
            />
            <label className="sr-only" htmlFor="analytics-to">
              {es.analytics.filters.to}
            </label>
            <input
              className={filterFieldClass}
              id="analytics-to"
              onChange={(event) => setCustomTo(event.target.value)}
              type="date"
              value={customTo}
            />
          </>
        ) : null}
        <label className="sr-only" htmlFor="analytics-account">
          {es.analytics.filters.account}
        </label>
        <select
          className={filterFieldClass}
          id="analytics-account"
          onChange={(event) => setAccountId(event.target.value)}
          value={accountId}
        >
          <option value="">{es.analytics.filters.allAccounts}</option>
          {(accountsQuery.data ?? []).map((account) => (
            <option key={account.id} value={account.id}>{account.name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="analytics-category">
          {es.analytics.filters.category}
        </label>
        <select
          className={filterFieldClass}
          id="analytics-category"
          onChange={(event) => setCategoryId(event.target.value)}
          value={categoryId}
        >
          <option value="">{es.analytics.filters.allCategories}</option>
          {(categoriesQuery.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="analytics-group">
          {es.analytics.filters.group}
        </label>
        <select
          className={filterFieldClass}
          id="analytics-group"
          onChange={(event) => setGroupId(event.target.value)}
          value={groupId}
        >
          <option value="">{es.analytics.filters.allGroups}</option>
          {(groupsQuery.data ?? []).map((group) => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="analytics-type">
          {es.analytics.filters.type}
        </label>
        <select
          className={filterFieldClass}
          id="analytics-type"
          onChange={(event) => setType(event.target.value as typeof type)}
          value={type}
        >
          <option value="">{es.analytics.filters.allTypes}</option>
          <option value="INCOME">{es.transactions.income}</option>
          <option value="EXPENSE">{es.transactions.expense}</option>
        </select>
        <label className="sr-only" htmlFor="analytics-compare-with">
          {es.analytics.filters.compareWith}
        </label>
        <select
          className={filterFieldClass}
          id="analytics-compare-with"
          onChange={(event) => setCompareWith(event.target.value as CompareWith)}
          value={compareWith}
        >
          <option value="PREVIOUS_PERIOD">
            {es.analytics.filters.previousPeriod}
          </option>
          <option value="PREVIOUS_MONTH">
            {es.analytics.filters.comparePreviousMonth}
          </option>
          <option value="PREVIOUS_YEAR">
            {es.analytics.filters.comparePreviousYear}
          </option>
          <option value="NONE">{es.analytics.filters.noComparison}</option>
        </select>
        <label className="sr-only" htmlFor="analytics-impact">
          {es.analytics.filters.impact}
        </label>
        <select
          className={filterFieldClass}
          id="analytics-impact"
          onChange={(event) => setImpact(event.target.value as typeof impact)}
          value={impact}
        >
          <option value="">{es.analytics.filters.allImpact}</option>
          <option value="AFFECTS_BALANCE">{es.transactions.balanceImpactStatus.AFFECTS_BALANCE}</option>
          <option value="ANALYSIS_ONLY">{es.transactions.balanceImpactStatus.ANALYSIS_ONLY}</option>
          <option value="PENDING_FUTURE">{es.transactions.balanceImpactStatus.PENDING_FUTURE}</option>
        </select>
      </section>

      <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        {es.analytics.impactNotice}
      </p>

      {summaryQuery.isError ? (
        <p className="border-y border-red-200 bg-red-50 p-4 text-red-800">
          {es.analytics.loadError}
        </p>
      ) : null}

      {exportError ? (
        <p className="border-y border-red-200 bg-red-50 p-4 text-red-800">
          {exportError}
        </p>
      ) : null}

      {summaryQuery.isLoading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard icon={TrendingUp} label={es.analytics.totalIncome} value={formatMoney(Number(summaryQuery.data?.totals.income ?? 0), currency)} />
            <MetricCard icon={BarChart3} label={es.analytics.totalExpense} value={formatMoney(Number(summaryQuery.data?.totals.expense ?? 0), currency)} tone="danger" />
            <MetricCard icon={TrendingUp} label={es.analytics.balance} value={formatMoney(Number(summaryQuery.data?.balance ?? 0), currency)} />
            <MetricCard icon={BarChart3} label={es.analytics.averageDailyExpense} value={formatMoney(Number(summaryQuery.data?.averageDailyExpense ?? 0), currency)} />
            <MetricCard icon={TrendingUp} label={es.analytics.expenseComparison} value={formatPercent(summaryQuery.data?.comparison?.expenseChangePercent)} tone={Number(summaryQuery.data?.comparison?.expenseChangePercent ?? 0) > 0 ? 'danger' : 'normal'} />
            <MetricCard icon={BarChart3} label={es.analytics.budgetUsage} value={summaryQuery.data?.budgetUsage ? `${summaryQuery.data.budgetUsage.usedPercent}%` : es.analytics.noBudget} />
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
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {comparisonRows.length > 0 ? (
          <section
            aria-label={es.analytics.comparisonChart}
            className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{es.analytics.comparison}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {es.analytics.comparisonHelp}
                </p>
              </div>
            </div>
            <ComparisonChart
              currency={currency}
              rows={comparisonRows}
            />
          </section>
        ) : null}

        {budgetUsage ? (
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
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <section
          aria-label={es.analytics.categoryChart}
          className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
        >
          <h2 className="text-lg font-bold">{es.analytics.byCategory}</h2>
          {hasCategoryData ? (
            <BarChartPanel
              ariaLabel={es.analytics.categoryChart}
              color="#006b5f"
              currency={currency}
              rows={categoryChartRows}
            />
          ) : null}
          <div className="mt-5 space-y-3">
            {hasCategoryData ? (categoriesAnalyticsQuery.data ?? []).slice(0, 8).map((row) => (
              <div key={`${row.categoryId ?? 'none'}-${row.currency}`}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="font-semibold">{row.category?.name ?? es.budgets.uncategorized}</span>
                  <span>{formatMoney(Number(row.amount), row.currency)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-700" style={{ width: `${Math.max(4, (Number(row.amount) / topCategoryAmount) * 100)}%` }} />
                </div>
              </div>
            )) : (
              <EmptyAnalyticsState />
            )}
          </div>
        </section>

        <section
          aria-label={es.analytics.accountChart}
          className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
        >
          <h2 className="text-lg font-bold">{es.analytics.byAccount}</h2>
          {hasAccountData ? (
            <BarChartPanel
              ariaLabel={es.analytics.accountChart}
              color="#d6a23a"
              currency={currency}
              rows={accountChartRows}
            />
          ) : null}
          <div className="mt-5 space-y-3">
            {hasAccountData ? accountExpenseRows.slice(0, 8).map((row) => (
              <div key={`${row.account?.id ?? 'none'}-${row.currency}-${row.type}`}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="font-semibold">{row.account?.name ?? es.transactions.account}</span>
                  <span>{formatMoney(Number(row.amount), row.currency)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#d6a23a]" style={{ width: `${Math.max(4, (Number(row.amount) / topAccountAmount) * 100)}%` }} />
                </div>
              </div>
            )) : (
              <EmptyAnalyticsState />
            )}
          </div>
        </section>

        <section
          aria-label={es.analytics.topExpenses}
          className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
        >
          <h2 className="text-lg font-bold">{es.analytics.topExpenses}</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {hasTopExpenses ? (topExpensesQuery.data ?? []).map((transaction) => (
              <article className="flex items-center justify-between gap-4 py-3" key={transaction.id}>
                <div>
                  <p className="font-semibold">{transaction.description ?? transaction.category?.name ?? es.budgets.uncategorized}</p>
                  <p className="mt-1 text-sm text-slate-500">{transaction.account.name}</p>
                </div>
                <p className="font-bold text-red-700">{formatMoney(Number(transaction.amount), transaction.currency)}</p>
              </article>
            )) : (
              <EmptyAnalyticsState />
            )}
          </div>
        </section>
      </div>

      <section
        aria-label={es.analytics.timelineChart}
        className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
      >
        <h2 className="text-lg font-bold">{es.analytics.timeline}</h2>
        {hasTimelineData ? (
          <TimelineChart
            currency={currency}
            rows={timelineQuery.data ?? []}
          />
        ) : null}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">{es.transactions.date}</th>
                <th className="py-2">{es.transactions.income}</th>
                <th className="py-2">{es.transactions.expense}</th>
                <th className="py-2">{es.transactions.balance}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hasTimelineData ? (timelineQuery.data ?? []).map((row) => (
                <tr key={row.date}>
                  <td className="py-3 font-semibold">{row.date}</td>
                  <td className="py-3 text-emerald-700">{formatMoney(Number(row.income), currency)}</td>
                  <td className="py-3 text-red-700">{formatMoney(Number(row.expense), currency)}</td>
                  <td className="py-3 font-bold">{formatMoney(Number(row.balance), currency)}</td>
                </tr>
              )) : (
                <tr>
                  <td className="py-8 text-center text-sm text-slate-500" colSpan={4}>
                    {es.analytics.emptyState}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function ComparisonChart({
  currency,
  rows,
}: {
  currency: 'PEN' | 'USD';
  rows: Array<{ current: number; metric: string; previous: number }>;
}) {
  return (
    <div
      aria-label={es.analytics.comparisonChart}
      className="mt-4 h-72 min-w-0 rounded-lg border border-slate-100 bg-slate-50 p-3"
      role="img"
    >
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={rows} margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => compactMoney(Number(value), currency)}
            width={72}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value), currency)}
            labelClassName="font-semibold"
          />
          <Legend />
          <Bar
            dataKey="previous"
            fill="#94a3b8"
            name={es.analytics.previousPeriod}
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="current"
            fill="#006b5f"
            name={es.analytics.currentPeriod}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TimelineChart({
  currency,
  rows,
}: {
  currency: 'PEN' | 'USD';
  rows: Array<{ date: string; balance: string; expense: string; income: string }>;
}) {
  const chartRows = rows.map((row) => ({
    date: row.date.slice(5),
    balance: Number(row.balance),
    expense: Number(row.expense),
    income: Number(row.income),
  }));
  const last = rows[rows.length - 1];

  return (
    <div
      aria-label={es.analytics.timelineChart}
      className="mt-4 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-4"
      role="img"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">
          {es.analytics.timelineChart}
        </p>
        <p className="text-sm font-bold text-slate-950">
          {last ? formatMoney(Number(last.balance), currency) : '-'}
        </p>
      </div>
      <div className="h-72 min-w-0">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={chartRows} margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => compactMoney(Number(value), currency)}
              width={72}
            />
            <Tooltip
              formatter={(value) => formatMoney(Number(value), currency)}
              labelClassName="font-semibold"
            />
            <Legend />
            <Line
              dataKey="income"
              dot={false}
              name={es.transactions.income}
              stroke="#006b5f"
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="expense"
              dot={false}
              name={es.transactions.expense}
              stroke="#dc2626"
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="balance"
              dot={{ fill: '#d6a23a', r: 4 }}
              name={es.transactions.balance}
              stroke="#006b5f"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BarChartPanel({
  ariaLabel,
  color,
  currency,
  rows,
}: {
  ariaLabel: string;
  color: string;
  currency: 'PEN' | 'USD';
  rows: Array<{ amount: number; name: string }>;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="mt-4 h-56 min-w-0 rounded-lg border border-slate-100 bg-slate-50 p-3"
      role="img"
    >
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={rows} layout="vertical" margin={{ bottom: 0, left: 8, right: 8, top: 0 }}>
          <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis
            hide
            tickFormatter={(value) => compactMoney(Number(value), currency)}
            type="number"
          />
          <YAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 12 }}
            type="category"
            width={96}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value), currency)}
            labelClassName="font-semibold"
          />
          <Bar dataKey="amount" fill={color} name={es.transactions.amount} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AnalyticsSkeleton() {
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

function EmptyAnalyticsState() {
  return (
    <p className="rounded-md bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
      {es.analytics.emptyState}
    </p>
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

function buildComparisonRows(summary: AnalyticsSummary) {
  return [
    {
      current: Number(summary.totals.income),
      metric: es.transactions.income,
      previous: Number(summary.comparison?.previousIncome ?? 0),
    },
    {
      current: Number(summary.totals.expense),
      metric: es.transactions.expense,
      previous: Number(summary.comparison?.previousExpense ?? 0),
    },
    {
      current: Number(summary.balance),
      metric: es.transactions.balance,
      previous: Number(summary.comparison?.previousBalance ?? 0),
    },
  ];
}

function buildInsightRows(summary: AnalyticsSummary, currency: 'PEN' | 'USD') {
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

function getRangeIso(range: Exclude<RangePreset, 'CUSTOM'>) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === 'TODAY') {
    return { from: toStartIso(toDateKey(today)), to: toEndIso(toDateKey(today)) };
  }

  if (range === 'WEEK') {
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return { from: toStartIso(toDateKey(start)), to: toEndIso(toDateKey(today)) };
  }

  if (range === 'PREVIOUS_MONTH') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: toStartIso(toDateKey(start)), to: toEndIso(toDateKey(end)) };
  }

  if (range === 'THREE_MONTHS') {
    const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    return { from: toStartIso(toDateKey(start)), to: toEndIso(toDateKey(today)) };
  }

  return {
    from: toStartIso(getCurrentMonthStartKey()),
    to: toEndIso(toDateKey(today)),
  };
}

function getCurrentMonthStartKey() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
}

function getTodayDateKey() {
  return toDateKey(new Date());
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toStartIso(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toISOString();
}

function toEndIso(dateKey: string) {
  return new Date(`${dateKey}T23:59:59.999`).toISOString();
}

function formatPercent(value?: string) {
  if (!value) {
    return '0.00%';
  }

  const sign = Number(value) > 0 ? '+' : '';
  return `${sign}${value}%`;
}

function compactMoney(value: number, currency: 'PEN' | 'USD') {
  return new Intl.NumberFormat('es-PE', {
    currency,
    maximumFractionDigits: 0,
    notation: 'compact',
    style: 'currency',
  }).format(value);
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
