import { apiRequest } from '../../lib/api';
import type { Category } from '../categories/categoriesApi';
import type { BudgetFormValues } from './budgetSchema';

export type Budget = {
  id: string;
  categoryId: string | null;
  category: Pick<Category, 'id' | 'name' | 'icon' | 'type'> | null;
  amount: string;
  spentAmount: string;
  remainingAmount: string;
  usagePercent: string;
  exceeded: boolean;
  currency: 'PEN' | 'USD';
  monthStart: string;
  createdAt: string;
  updatedAt: string;
};

export type BudgetsResponse = {
  monthStart: string;
  items: Budget[];
};

export function getBudgets(filters: {
  currency?: 'PEN' | 'USD';
  monthStart: string;
}) {
  const params = new URLSearchParams({ monthStart: filters.monthStart });
  if (filters.currency) params.set('currency', filters.currency);
  return apiRequest<BudgetsResponse>(`/budgets?${params.toString()}`);
}

export function createBudget(values: BudgetFormValues) {
  return apiRequest<Budget>('/budgets', {
    method: 'POST',
    body: {
      ...values,
      categoryId: values.categoryId || undefined,
    },
  });
}

export function updateBudget(
  budgetId: string,
  values: Pick<BudgetFormValues, 'amount'>,
) {
  return apiRequest<Budget>(`/budgets/${budgetId}`, {
    method: 'PATCH',
    body: values,
  });
}
