import { apiRequest } from '../../../lib/api';
import type { TransactionFormValues } from '../schemas/transactionSchemas';

export type Transaction = {
  id: string;
  type: 'OPENING_BALANCE' | 'INCOME' | 'EXPENSE';
  amount: string;
  currency: 'PEN' | 'USD';
  description: string | null;
  occurredAt: string;
  source: string;
  account: { id: string; name: string };
  category: { id: string; name: string; icon: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionList = {
  items: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: Array<{
    currency: 'PEN' | 'USD';
    type: 'OPENING_BALANCE' | 'INCOME' | 'EXPENSE';
    amount: string;
  }>;
};

export type TransactionFilters = {
  page: number;
  type?: 'INCOME' | 'EXPENSE';
  search?: string;
  currency?: 'PEN' | 'USD';
  accountId?: string;
};

export function getTransactions(filters: TransactionFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: '20',
  });
  if (filters.type) params.set('type', filters.type);
  if (filters.search) params.set('search', filters.search);
  if (filters.currency) params.set('currency', filters.currency);
  if (filters.accountId) params.set('accountId', filters.accountId);
  return apiRequest<TransactionList>(`/transactions?${params.toString()}`);
}

export function createTransaction(values: TransactionFormValues) {
  return apiRequest<Transaction>('/transactions', {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: {
      ...values,
      occurredAt: new Date(values.occurredAt).toISOString(),
    },
  });
}

export function updateTransaction(
  id: string,
  values: TransactionFormValues,
) {
  return apiRequest<Transaction>(`/transactions/${id}`, {
    method: 'PATCH',
    body: {
      ...values,
      occurredAt: new Date(values.occurredAt).toISOString(),
    },
  });
}

export function deleteTransaction(id: string) {
  return apiRequest<{ message: string }>(`/transactions/${id}`, {
    method: 'DELETE',
  });
}
