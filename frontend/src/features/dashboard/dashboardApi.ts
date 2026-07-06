import { apiRequest } from '../../lib/api';

export type DashboardCurrencySummary = {
  currency: 'PEN' | 'USD';
  realBalance: string;
  reservedAmount: string;
  availableBalance: string;
  monthlyIncome: string;
  monthlyExpense: string;
  monthlyBalance: string;
  budgetAmount: string;
  budgetUsedAmount: string;
  budgetRemainingAmount: string;
  goals: Array<{
    id: string;
    name: string;
    targetAmount: string;
    reservedAmount: string;
    progressPercent: string;
  }>;
};

export type DashboardTransaction = {
  id: string;
  type:
    | 'INCOME'
    | 'EXPENSE'
    | 'OPENING_BALANCE'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT';
  amount: string;
  currency: 'PEN' | 'USD';
  description: string;
  occurredAt: string;
  balanceImpactStatus: 'AFFECTS_BALANCE' | 'ANALYSIS_ONLY' | 'PENDING_FUTURE';
  account: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
};

export type DashboardSummary = {
  monthStart: string;
  currencies: DashboardCurrencySummary[];
  recentTransactions: DashboardTransaction[];
};

export function getDashboardSummary(filters: {
  currency?: 'PEN' | 'USD';
  monthStart?: string;
}) {
  const params = new URLSearchParams();
  if (filters.currency) params.set('currency', filters.currency);
  if (filters.monthStart) params.set('monthStart', filters.monthStart);
  const query = params.toString();
  return apiRequest<DashboardSummary>(
    `/dashboard/summary${query ? `?${query}` : ''}`,
  );
}
