import { apiRequest } from '../../../lib/api';
import type { AccountFormValues } from '../schemas/accountSchemas';

export type Account = {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'DIGITAL_WALLET';
  currency: 'PEN' | 'USD';
  status: 'ACTIVE' | 'ARCHIVED';
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  realBalance: string;
  reservedAmount: string;
  availableBalance: string;
};

export function getAccounts() {
  return apiRequest<Account[]>('/accounts');
}

export function createAccount(values: AccountFormValues) {
  return apiRequest<Account>('/accounts', {
    method: 'POST',
    body: values,
  });
}

export function archiveAccount(accountId: string) {
  return apiRequest<Account>(`/accounts/${accountId}/archive`, {
    method: 'PATCH',
  });
}

