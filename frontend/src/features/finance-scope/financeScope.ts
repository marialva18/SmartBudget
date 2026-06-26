import { createContext, useContext } from 'react';

export type FinanceScope = 'ALL' | 'PEN' | 'USD';

export type FinanceScopeContextValue = {
  scope: FinanceScope;
  availableScopes: FinanceScope[];
  canChooseScope: boolean;
  setScope: (scope: FinanceScope) => void;
};

export const FinanceScopeContext =
  createContext<FinanceScopeContextValue | null>(null);

export function useFinanceScope() {
  const context = useContext(FinanceScopeContext);
  if (!context) {
    throw new Error('useFinanceScope must be used inside FinanceScopeProvider');
  }
  return context;
}
