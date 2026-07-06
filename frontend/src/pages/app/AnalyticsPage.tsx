import { useQueries, useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
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
import {
  BarChartPanel,
  ComparisonChart,
  TimelineChart,
} from '../../features/analytics/components/AnalyticsCharts';
import {
  AnalyticsSkeleton,
  AnalyticsSummaryPanels,
  BudgetUsagePanel,
  EmptyAnalyticsState,
} from '../../features/analytics/components/AnalyticsSummaryPanels';
import { HelpDisclosure } from '../../components/ui/HelpDisclosure';
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
  'min-h-12 min-w-0 truncate rounded-md bg-slate-100 px-3 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-emerald-700';

export function AnalyticsPage() {
  const { scope } = useFinanceScope();
  const customDateErrorId = useId();
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
  const hasInvalidCustomRange = range === 'CUSTOM' && customFrom > customTo;
  const analyticsEnabled = !hasInvalidCustomRange;

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
          enabled: analyticsEnabled,
          queryFn: () => getAnalyticsSummary(filters),
        },
        {
          queryKey: ['analytics-by-category', filters],
          enabled: analyticsEnabled,
          queryFn: () => getAnalyticsByCategory(filters),
        },
        {
          queryKey: ['analytics-by-account', filters],
          enabled: analyticsEnabled,
          queryFn: () => getAnalyticsByAccount(filters),
        },
        {
          queryKey: ['analytics-timeline', filters],
          enabled: analyticsEnabled,
          queryFn: () => getAnalyticsTimeline(filters),
        },
        {
          queryKey: ['analytics-top-expenses', filters],
          enabled: analyticsEnabled,
          queryFn: () => getAnalyticsTopExpenses(filters),
        },
      ],
    });

  const currency = scope === 'USD' ? 'USD' : 'PEN';
  const summary = analyticsEnabled ? summaryQuery.data : undefined;
  const categoryRows = analyticsEnabled
    ? (categoriesAnalyticsQuery.data ?? [])
    : [];
  const accountRows = analyticsEnabled ? (accountsAnalyticsQuery.data ?? []) : [];
  const timelineRows = analyticsEnabled ? (timelineQuery.data ?? []) : [];
  const topExpenseRows = analyticsEnabled ? (topExpensesQuery.data ?? []) : [];
  const topCategoryAmount = Math.max(
    ...categoryRows.map((row) => Number(row.amount)),
    1,
  );
  const categoryChartRows = categoryRows
    .slice(0, 8)
    .map((row) => ({
      name: row.category?.name ?? es.budgets.uncategorized,
      amount: Number(row.amount),
      currency: row.currency,
    }));
  const hasCategoryData = categoryRows.length > 0;
  const accountExpenseRows = accountRows.filter(
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
  const hasTopExpenses = topExpenseRows.length > 0;
  const hasTimelineData = timelineRows.length > 0;
  const budgetUsage = summary?.budgetUsage;
  const comparisonRows = summary?.comparison
    ? buildComparisonRows(summary)
    : [];
  const activeFilterLabels = buildActiveFilterLabels({
    accountName:
      (accountsQuery.data ?? []).find((account) => account.id === accountId)
        ?.name ?? '',
    categoryName:
      (categoriesQuery.data ?? []).find(
        (category) => category.id === categoryId,
      )?.name ?? '',
    compareWith,
    customFrom,
    customTo,
    groupName:
      (groupsQuery.data ?? []).find((group) => group.id === groupId)?.name ??
      '',
    impact,
    range,
    scope,
    type,
  });

  async function handleExport(format: 'xlsx' | 'pdf') {
    setExportError('');

    if (hasInvalidCustomRange) {
      setExportError(es.analytics.invalidDateRange);
      return;
    }

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

  const isExportDisabled = Boolean(exportingFormat) || hasInvalidCustomRange;

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
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isExportDisabled}
            onClick={() => void handleExport('xlsx')}
            type="button"
          >
            <Download size={18} />
            {exportingFormat === 'xlsx'
              ? es.analytics.exporting
              : es.analytics.export}
          </button>
          <button
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-4 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            disabled={isExportDisabled}
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
        className="grid gap-3 rounded-lg bg-white p-4 shadow-[0_10px_30px_rgba(13,148,136,0.08)] sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7"
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
              aria-describedby={
                hasInvalidCustomRange ? customDateErrorId : undefined
              }
              aria-invalid={hasInvalidCustomRange}
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
              aria-describedby={
                hasInvalidCustomRange ? customDateErrorId : undefined
              }
              aria-invalid={hasInvalidCustomRange}
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

      <section className="rounded-lg border border-emerald-100 bg-white p-4 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">
              {es.analytics.activeFilters}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {es.analytics.activeFiltersExportNote}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilterLabels.map((label) => (
              <span
                className="max-w-full break-words rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700"
                key={label}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div>
        <HelpDisclosure
          label="Cómo leer el análisis"
          title={es.analytics.guideTitle}
        >
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>{es.analytics.impactNotice}</p>
            {Object.values(es.analytics.guideItems).map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </HelpDisclosure>
      </div>

      {hasInvalidCustomRange ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
          id={customDateErrorId}
          role="alert"
        >
          {es.analytics.invalidDateRange}
        </div>
      ) : null}

      {analyticsEnabled && summaryQuery.isError ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          role="alert"
        >
          {es.analytics.loadError}
        </div>
      ) : null}

      {exportError ? (
        <p
          className="border-y border-red-200 bg-red-50 p-4 text-red-800"
          role="alert"
        >
          {exportError}
        </p>
      ) : null}

      {analyticsEnabled && summaryQuery.isLoading ? (
        <AnalyticsSkeleton />
      ) : !analyticsEnabled || summaryQuery.isError ? null : (
        <AnalyticsSummaryPanels
          currency={currency}
          summary={summary}
        />
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

        <BudgetUsagePanel budgetUsage={budgetUsage} />
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
            {hasCategoryData ? categoryRows.slice(0, 8).map((row) => (
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
            {hasTopExpenses ? topExpenseRows.map((transaction) => (
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
            rows={timelineRows}
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
              {hasTimelineData ? timelineRows.map((row) => (
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

function buildActiveFilterLabels({
  accountName,
  categoryName,
  compareWith,
  customFrom,
  customTo,
  groupName,
  impact,
  range,
  scope,
  type,
}: {
  accountName: string;
  categoryName: string;
  compareWith: CompareWith;
  customFrom: string;
  customTo: string;
  groupName: string;
  impact: '' | 'AFFECTS_BALANCE' | 'ANALYSIS_ONLY' | 'PENDING_FUTURE';
  range: RangePreset;
  scope: 'ALL' | 'PEN' | 'USD';
  type: '' | 'INCOME' | 'EXPENSE';
}) {
  const labels = [
    getRangeLabel(range, customFrom, customTo),
    scope === 'ALL' ? 'Todas las monedas' : `Moneda ${scope}`,
  ];

  if (accountName) {
    labels.push(`Cuenta: ${accountName}`);
  }

  if (categoryName) {
    labels.push(`Categoría: ${categoryName}`);
  }

  if (groupName) {
    labels.push(`Grupo: ${groupName}`);
  }

  if (type) {
    labels.push(
      type === 'INCOME' ? es.transactions.income : es.transactions.expense,
    );
  }

  if (impact) {
    labels.push(es.transactions.balanceImpactStatus[impact]);
  }

  if (compareWith !== 'NONE') {
    labels.push(getCompareLabel(compareWith));
  }

  return labels;
}

function getRangeLabel(
  range: RangePreset,
  customFrom: string,
  customTo: string,
) {
  if (range === 'CUSTOM') {
    return `${formatDateLabel(customFrom)} - ${formatDateLabel(customTo)}`;
  }

  const labels: Record<Exclude<RangePreset, 'CUSTOM'>, string> = {
    MONTH: es.analytics.filters.month,
    PREVIOUS_MONTH: es.analytics.filters.previousMonth,
    THREE_MONTHS: es.analytics.filters.threeMonths,
    TODAY: es.analytics.filters.today,
    WEEK: es.analytics.filters.week,
  };

  return labels[range];
}

function getCompareLabel(compareWith: CompareWith) {
  const labels: Record<CompareWith, string> = {
    NONE: es.analytics.filters.noComparison,
    PREVIOUS_MONTH: es.analytics.filters.comparePreviousMonth,
    PREVIOUS_PERIOD: es.analytics.filters.previousPeriod,
    PREVIOUS_YEAR: es.analytics.filters.comparePreviousYear,
  };

  return labels[compareWith];
}

function formatDateLabel(dateKey: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00`));
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

function pad(value: number) {
  return String(value).padStart(2, '0');
}
