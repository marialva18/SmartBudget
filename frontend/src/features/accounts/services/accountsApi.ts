import { apiRequest } from '../../../lib/api';
import type {
  AccountFormValues,
  BalanceAdjustmentFormValues,
  OpeningBalanceFormValues,
} from '../schemas/accountSchemas';

type CreateAccountValues = Omit<
  AccountFormValues,
  'balanceStartOption' | 'balanceStartedAt'
> & {
  balanceStartOption?: AccountFormValues['balanceStartOption'];
  balanceStartedAt?: string;
};

export type Account = {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'DIGITAL_WALLET';
  currency: 'PEN' | 'USD';
  openingBalance: string;
  balanceStartedAt: string;
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

export function createAccount(values: CreateAccountValues) {
  return apiRequest<Account>('/accounts', {
    method: 'POST',
    body: {
      name: values.name,
      type: values.type,
      currency: values.currency,
      openingBalance: values.openingBalance,
      balanceStartedAt: values.balanceStartedAt ?? getTodayDateKey(),
    },
  });
}

export function archiveAccount(accountId: string) {
  return apiRequest<Account>(`/accounts/${accountId}/archive`, {
    method: 'PATCH',
  });
}

export function updateOpeningBalance(
  accountId: string,
  values: OpeningBalanceFormValues,
) {
  return apiRequest<Account>(`/accounts/${accountId}/opening-balance`, {
    method: 'PATCH',
    body: values,
  });
}

export function adjustAccountBalance(
  accountId: string,
  values: BalanceAdjustmentFormValues,
) {
  return apiRequest<Account>(`/accounts/${accountId}/balance-adjustment`, {
    method: 'PATCH',
    body: values,
  });
}

function getTodayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(now.getDate()).padStart(2, '0')}`;
}
