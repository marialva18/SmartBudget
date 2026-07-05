import { apiBlobRequest, apiRequest } from '../../lib/api';

export type AnalyticsFilters = {
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
  groupId?: string;
  type?: 'INCOME' | 'EXPENSE';
  currency?: 'PEN' | 'USD';
  balanceImpactStatus?: 'AFFECTS_BALANCE' | 'ANALYSIS_ONLY' | 'PENDING_FUTURE';
  compareWith?: 'PREVIOUS_PERIOD' | 'PREVIOUS_MONTH' | 'PREVIOUS_YEAR' | 'NONE';
};

export type AnalyticsSummary = {
  totals: { income: string; expense: string };
  balance: string;
  movementCount: number;
  topExpenseCategory: { name: string; amount: string } | null;
  mostUsedAccount: { name: string; amount: string } | null;
  highestExpense: AnalyticsTransaction | null;
  highestExpenseDay: { name: string; amount: string } | null;
  averageDailyExpense: string;
  comparison: {
    previousIncome: string;
    previousExpense: string;
    previousBalance: string;
    compareWith: 'PREVIOUS_PERIOD' | 'PREVIOUS_MONTH' | 'PREVIOUS_YEAR';
    previousFrom: string;
    previousTo: string;
    incomeChangePercent: string;
    expenseChangePercent: string;
  } | null;
  budgetUsage: {
    plannedAmount: string;
    usedAmount: string;
    usedPercent: string;
    currency: 'PEN' | 'USD';
  } | null;
};

export type AnalyticsCategoryRow = {
  categoryId: string | null;
  category: { id: string; name: string; icon: string | null } | null;
  currency: 'PEN' | 'USD';
  amount: string;
  count: number;
};

export type AnalyticsAccountRow = {
  account: { id: string; name: string; currency: 'PEN' | 'USD' } | null;
  currency: 'PEN' | 'USD';
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  count: number;
};

export type AnalyticsTimelineRow = {
  date: string;
  income: string;
  expense: string;
  balance: string;
  currencies: string[];
};

export type AnalyticsTransaction = {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  currency: 'PEN' | 'USD';
  description: string | null;
  occurredAt: string;
  balanceImpactStatus: 'AFFECTS_BALANCE' | 'ANALYSIS_ONLY' | 'PENDING_FUTURE';
  account: { id: string; name: string };
  category: { id: string; name: string; icon: string | null } | null;
};

export function getAnalyticsSummary(filters: AnalyticsFilters) {
  return apiRequest<AnalyticsSummary>(`/analytics/summary?${params(filters)}`);
}

export function getAnalyticsByCategory(filters: AnalyticsFilters) {
  return apiRequest<AnalyticsCategoryRow[]>(
    `/analytics/by-category?${params(filters)}`,
  );
}

export function getAnalyticsByAccount(filters: AnalyticsFilters) {
  return apiRequest<AnalyticsAccountRow[]>(
    `/analytics/by-account?${params(filters)}`,
  );
}

export function getAnalyticsTimeline(filters: AnalyticsFilters) {
  return apiRequest<AnalyticsTimelineRow[]>(
    `/analytics/timeline?${params(filters)}`,
  );
}

export function getAnalyticsTopExpenses(filters: AnalyticsFilters) {
  return apiRequest<AnalyticsTransaction[]>(
    `/analytics/top-expenses?${params(filters)}`,
  );
}

export function downloadAnalyticsExport(filters: AnalyticsFilters) {
  return apiBlobRequest(`/analytics/export?${params(filters)}`);
}

export function downloadAnalyticsPdf(filters: AnalyticsFilters) {
  return apiBlobRequest(`/analytics/export/pdf?${params(filters)}`);
}

function params(filters: AnalyticsFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  return params.toString();
}
