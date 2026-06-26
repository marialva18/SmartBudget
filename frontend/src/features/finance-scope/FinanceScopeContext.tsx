import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { getAccounts } from '../accounts/services/accountsApi';
import { getProfile } from '../onboarding/services/profileApi';
import {
  FinanceScopeContext,
  type FinanceScope,
} from './financeScope';

type CurrencyScope = Exclude<FinanceScope, 'ALL'>;

export function FinanceScopeProvider({ children }: { children: ReactNode }) {
  const [selectedScope, setSelectedScope] = useState<FinanceScope | null>(null);
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });
  const activeCurrencies = useMemo(() => {
    const currencies = new Set<CurrencyScope>();
    for (const account of accountsQuery.data ?? []) {
      if (account.status === 'ACTIVE') {
        currencies.add(account.currency);
      }
    }
    return Array.from(currencies).sort() as CurrencyScope[];
  }, [accountsQuery.data]);
  const preferredCurrency = profileQuery.data?.preferredCurrency ?? 'PEN';
  const canChooseScope = activeCurrencies.length > 1;
  const availableScopes = useMemo<FinanceScope[]>(
    () => (canChooseScope ? ['ALL', ...activeCurrencies] : []),
    [activeCurrencies, canChooseScope],
  );
  const fallbackScope =
    activeCurrencies[0] ?? preferredCurrency;
  const scope =
    canChooseScope &&
    selectedScope &&
    (selectedScope === 'ALL' || activeCurrencies.includes(selectedScope))
      ? selectedScope
      : canChooseScope && activeCurrencies.includes(preferredCurrency)
        ? preferredCurrency
        : fallbackScope;
  const value = useMemo(
    () => ({
      availableScopes,
      canChooseScope,
      scope,
      setScope: setSelectedScope,
    }),
    [availableScopes, canChooseScope, scope],
  );

  return (
    <FinanceScopeContext.Provider value={value}>
      {children}
    </FinanceScopeContext.Provider>
  );
}
