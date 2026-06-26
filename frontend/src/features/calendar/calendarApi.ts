import { apiRequest } from '../../lib/api';

export type CalendarTransaction = {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  currency: 'PEN' | 'USD';
  description: string | null;
  occurredAt: string;
  source: string;
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

export type CalendarDay = {
  date: string;
  incomeTotal: string;
  expenseTotal: string;
  netTotal: string;
  transactions: CalendarTransaction[];
};

export type CalendarMonth = {
  monthStart: string;
  days: CalendarDay[];
};

export function getCalendarMonth(filters: {
  monthStart?: string;
  currency?: 'PEN' | 'USD';
  accountId?: string;
}) {
  const params = new URLSearchParams();

  if (filters.monthStart) params.set('monthStart', filters.monthStart);
  if (filters.currency) params.set('currency', filters.currency);
  if (filters.accountId) params.set('accountId', filters.accountId);

  const query = params.toString();

  return apiRequest<CalendarMonth>(
    `/calendar/month${query ? `?${query}` : ''}`,
  );
}