import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Banknote,
  Landmark,
  Plus,
  RefreshCw,
  WalletCards,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AccountFormPanel } from '../../features/accounts/components/AccountFormPanel';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { AccountFormValues } from '../../features/accounts/schemas/accountSchemas';
import {
  archiveAccount,
  createAccount,
  getAccounts,
  type Account,
} from '../../features/accounts/services/accountsApi';
import { ApiError } from '../../lib/api';
import { es } from '../../i18n/es';
import { useFinanceScope } from '../../features/finance-scope/financeScope';

const accountTypeLabels: Record<Account['type'], string> = {
  BANK: es.accounts.types.BANK,
  CASH: es.accounts.types.CASH,
  DIGITAL_WALLET: es.accounts.types.DIGITAL_WALLET,
};

const accountIcons = {
  BANK: Landmark,
  CASH: Banknote,
  DIGITAL_WALLET: WalletCards,
};

export function AccountsPage() {
  const { scope } = useFinanceScope();
  const queryClient = useQueryClient();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [archiveCandidate, setArchiveCandidate] = useState<Account | null>(
    null,
  );
  const [formError, setFormError] = useState('');
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });
  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: async () => {
      setFormError('');
      setIsPanelOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError
          ? error.message
          : es.accounts.saveError,
      );
    },
  });
  const archiveMutation = useMutation({
    mutationFn: archiveAccount,
    onSuccess: async () => {
      setArchiveCandidate(null);
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const groupedAccounts = useMemo(() => {
    const active = accountsQuery.data?.filter(
      (account) => account.status === 'ACTIVE',
    );
    return {
      PEN: active?.filter((account) => account.currency === 'PEN') ?? [],
      USD: active?.filter((account) => account.currency === 'USD') ?? [],
      archived:
        accountsQuery.data?.filter(
          (account) => account.status === 'ARCHIVED',
        ) ?? [],
    };
  }, [accountsQuery.data]);

  const handleCreate = (values: AccountFormValues) => {
    setFormError('');
    createMutation.mutate(values);
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {es.accounts.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {es.accounts.title}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            {es.accounts.subtitle}
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-900"
          onClick={() => setIsPanelOpen(true)}
          type="button"
        >
          <Plus size={19} />
          {es.accounts.newAccount}
        </button>
      </header>

      {accountsQuery.isLoading ? <AccountsLoading /> : null}

      {accountsQuery.isError ? (
        <div className="flex flex-col items-start gap-3 border-y border-red-200 bg-red-50 px-4 py-5 text-red-900">
          <p>{es.accounts.loadError}</p>
          <button
            className="inline-flex items-center gap-2 font-semibold"
            onClick={() => accountsQuery.refetch()}
            type="button"
          >
            <RefreshCw size={17} />
            {es.common.retry}
          </button>
        </div>
      ) : null}

      {accountsQuery.data && accountsQuery.data.length === 0 ? (
        <div className="border-y border-slate-200 py-14 text-center">
          <WalletCards className="mx-auto text-emerald-700" size={38} />
          <h2 className="mt-4 text-xl font-bold text-slate-950">
            {es.accounts.createFirstTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-slate-600">
            {es.accounts.createFirstDescription}
          </p>
        </div>
      ) : null}

      {(['PEN', 'USD'] as const).map((currency) =>
        groupedAccounts[currency].length > 0 &&
        (scope === 'ALL' || scope === currency) ? (
          <CurrencySection
            accounts={groupedAccounts[currency]}
            currency={currency}
            isArchiving={archiveMutation.isPending}
            key={currency}
            onArchive={setArchiveCandidate}
          />
        ) : null,
      )}

      {groupedAccounts.archived.length > 0 ? (
        <section className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-bold text-slate-950">
            {es.accounts.archivedTitle}
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {groupedAccounts.archived.map((account) => (
              <div
                className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-100 px-4 py-4 text-slate-600"
                key={account.id}
              >
                <div>
                  <p className="font-semibold">{account.name}</p>
                  <p className="text-sm">
                    {accountTypeLabels[account.type]} · {account.currency}
                  </p>
                </div>
                <Archive size={19} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {formError ? (
        <p className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-red-800 px-4 py-3 text-sm font-semibold text-white shadow-xl">
          {formError}
        </p>
      ) : null}

      {isPanelOpen ? (
        <AccountFormPanel
          isSaving={createMutation.isPending}
          onClose={() => {
            setFormError('');
            setIsPanelOpen(false);
          }}
          onSubmit={handleCreate}
        />
      ) : null}

      {archiveCandidate ? (
        <ConfirmDialog
          actionLabel={es.accounts.archiveAction}
          description={es.accounts.archiveConfirmation(archiveCandidate.name)}
          isSaving={archiveMutation.isPending}
          onCancel={() => setArchiveCandidate(null)}
          onConfirm={() => archiveMutation.mutate(archiveCandidate.id)}
          title={es.accounts.archiveTitle}
        />
      ) : null}
    </section>
  );
}

type CurrencySectionProps = {
  accounts: Account[];
  currency: 'PEN' | 'USD';
  isArchiving: boolean;
  onArchive: (account: Account) => void;
};

function CurrencySection({
  accounts,
  currency,
  isArchiving,
  onArchive,
}: CurrencySectionProps) {
  const totals = accounts.reduce(
    (current, account) => ({
      real: current.real + Number(account.realBalance),
      reserved: current.reserved + Number(account.reservedAmount),
      available: current.available + Number(account.availableBalance),
    }),
    { real: 0, reserved: 0, available: 0 },
  );

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">
            {es.accounts.currencies[currency].plural}
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            {formatMoney(totals.real, currency)}{' '}
            {es.accounts.realBalanceSuffix}
          </h2>
        </div>
        <p className="text-sm font-semibold text-emerald-800">
          {formatMoney(totals.available, currency)}{' '}
          {es.accounts.availableSuffix}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {accounts.map((account) => {
          const Icon = accountIcons[account.type];
          return (
            <article
              className="rounded-lg border border-white bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
              key={account.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-md bg-emerald-50 text-emerald-800">
                    <Icon size={22} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-950">{account.name}</h3>
                    <p className="text-sm text-slate-500">
                      {accountTypeLabels[account.type]}
                    </p>
                  </div>
                </div>
                <button
                  aria-label={`Archivar ${account.name}`}
                  className="grid size-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                  disabled={isArchiving}
                  onClick={() => onArchive(account)}
                  title="Archivar cuenta"
                  type="button"
                >
                  <Archive size={18} />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
                <BalanceValue
                  currency={currency}
                  label={es.accounts.realBalance}
                  value={account.realBalance}
                />
                <BalanceValue
                  currency={currency}
                  label={es.accounts.reserved}
                  value={account.reservedAmount}
                />
                <BalanceValue
                  accent
                  currency={currency}
                  label={es.accounts.available}
                  value={account.availableBalance}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BalanceValue({
  accent = false,
  currency,
  label,
  value,
}: {
  accent?: boolean;
  currency: 'PEN' | 'USD';
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p
        className={`mt-1 break-words text-sm font-bold sm:text-base ${
          accent ? 'text-emerald-800' : 'text-slate-950'
        }`}
      >
        {formatMoney(Number(value), currency)}
      </p>
    </div>
  );
}

function AccountsLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[1, 2].map((item) => (
        <div
          className="h-48 animate-pulse rounded-lg bg-slate-200"
          key={item}
        />
      ))}
    </div>
  );
}

function formatMoney(value: number, currency: 'PEN' | 'USD') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}
