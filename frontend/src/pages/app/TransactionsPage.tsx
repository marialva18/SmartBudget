import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  getAccounts,
  type Account,
} from '../../features/accounts/services/accountsApi';
import { useFinanceScope } from '../../features/finance-scope/financeScope';
import { TransactionFormPanel } from '../../features/transactions/components/TransactionFormPanel';
import type { TransactionFormValues } from '../../features/transactions/schemas/transactionSchemas';
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
  type Transaction,
} from '../../features/transactions/services/transactionsApi';
import { es } from '../../i18n/es';
import { ApiError } from '../../lib/api';
import { formatMoney, formatSignedMoney } from '../../lib/money';
import { getProfile } from '../../features/profile/profileApi';

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<'' | 'INCOME' | 'EXPENSE'>('');
  const [search, setSearch] = useState('');
  const [accountId, setAccountId] = useState('');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [deleteCandidate, setDeleteCandidate] =
    useState<Transaction | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [error, setError] = useState('');
  const [highExpenseWarning, setHighExpenseWarning] =
  useState<HighExpenseWarning | null>(null);
  const { scope } = useFinanceScope();
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });
  const profileQuery = useQuery({
  queryKey: ['profile'],
  queryFn: getProfile,
});

const highExpenseWarningPercent =
  profileQuery.data?.highExpenseWarningPercent ??
  DEFAULT_HIGH_EXPENSE_WARNING_PERCENT;

const highExpenseWarningRatio = highExpenseWarningPercent / 100;

  const query = useQuery({
    queryKey: ['transactions', page, type, search, scope, accountId],
    queryFn: () =>
      getTransactions({
        page,
        type: type || undefined,
        search: search || undefined,
        currency: scope === 'ALL' ? undefined : scope,
        accountId: accountId || undefined,
      }),
  });

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    ]);
  };
  const saveMutation = useMutation({
    mutationFn: (values: TransactionFormValues) =>
      selected
        ? updateTransaction(selected.id, values)
        : createTransaction(values),
    onSuccess: async () => {
      setPanelOpen(false);
      setSelected(null);
      setError('');
      await refreshData();
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError
          ? reason.message
          : es.transactions.saveError,
      ),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      setDeleteCandidate(null);
      await refreshData();
    },
    onError: () => setError(es.transactions.deleteError),
  });

  const summary = getSummary(query.data?.summary ?? []);

  const handleSubmitTransaction = (values: TransactionFormValues) => {
 const warning = getHighExpenseWarning({
  accounts: accountsQuery.data ?? [],
  selected,
  values,
  warningRatio: highExpenseWarningRatio,
  warningPercent: highExpenseWarningPercent,
});

  if (warning) {
    setHighExpenseWarning(warning);
    return;
  }

  saveMutation.mutate(values);
};

  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {es.transactions.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{es.transactions.title}</h1>
          <p className="mt-2 text-slate-600">{es.transactions.subtitle}</p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white"
          onClick={() => {
            setSelected(null);
            setPanelOpen(true);
          }}
          type="button"
        >
          <Plus size={19} />
          {es.transactions.newTransaction}
        </button>
      </header>

      <div className="space-y-4">
        {(scope === 'ALL'
          ? (['PEN', 'USD'] as const).filter(
              (currency) =>
                summary[currency].openingBalance !== 0 ||
                summary[currency].income !== 0 ||
                summary[currency].expense !== 0,
            )
          : [scope]
        ).map((currency) => (
          <SummaryGroup
            currency={currency}
            key={currency}
            values={summary[currency]}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg bg-slate-200/60 p-3 lg:flex-row">
        <label className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={18}
          />
          <input
            className="w-full rounded-md bg-white py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-emerald-700"
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder={es.transactions.searchPlaceholder}
            value={search}
          />
        </label>
        <select
          className="rounded-md bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
          onChange={(event) => {
            setPage(1);
            setType(event.target.value as typeof type);
          }}
          value={type}
        >
          <option value="">{es.transactions.allTypes}</option>
          <option value="INCOME">{es.transactions.income}</option>
          <option value="EXPENSE">{es.transactions.expense}</option>
        </select>
        <select
          className="rounded-md bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
          onChange={(event) => {
            setPage(1);
            setAccountId(event.target.value);
          }}
          value={accountId}
        >
          <option value="">{es.transactions.allAccounts}</option>
          {(accountsQuery.data ?? [])
            .filter(
              (account) =>
                account.status === 'ACTIVE' &&
                (scope === 'ALL' || account.currency === scope),
            )
            .map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </option>
            ))}
        </select>
      </div>

      {query.isError ? (
        <p className="border-y border-red-200 bg-red-50 p-4 text-red-800">
          {es.transactions.loadError}
        </p>
      ) : null}

      {query.data?.items.length === 0 ? (
        <div className="border-y border-slate-200 py-12 text-center">
          <h2 className="text-xl font-bold">{es.transactions.emptyTitle}</h2>
          <p className="mt-2 text-slate-600">
            {es.transactions.emptyDescription}
          </p>
        </div>
      ) : null}

      {query.data && query.data.items.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  {[
                    es.transactions.movement,
                    es.transactions.category,
                    es.transactions.account,
                    es.transactions.date,
                    es.transactions.type,
                    es.transactions.amount,
                    es.transactions.actions,
                  ].map((label) => (
                    <th className="px-4 py-3" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {query.data.items.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    onDelete={() => setDeleteCandidate(transaction)}
                    onEdit={() => {
                      setSelected(transaction);
                      setPanelOpen(true);
                    }}
                    transaction={transaction}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <button
              className="inline-flex items-center gap-1 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              type="button"
            >
              <ChevronLeft size={18} />
              {es.transactions.previous}
            </button>
            <span className="text-sm text-slate-600">
              {query.data.pagination.page} / {query.data.pagination.pages}
            </span>
            <button
              className="inline-flex items-center gap-1 disabled:opacity-40"
              disabled={page >= query.data.pagination.pages}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              {es.transactions.next}
              <ChevronRight size={18} />
            </button>
          </footer>
        </div>
      ) : null}

      {error ? (
        <p className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-red-800 px-4 py-3 text-white">
          {error}
        </p>
      ) : null}

      {panelOpen ? (
        <TransactionFormPanel
          isSaving={saveMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setSelected(null);
            setError('');
          }}
          onSubmit={handleSubmitTransaction}
          transaction={selected}
        />
      ) : null}

      {deleteCandidate ? (
        <ConfirmDialog
          actionLabel={es.transactions.deleteConfirmationAction}
          description={es.transactions.deleteConfirmation}
          isSaving={deleteMutation.isPending}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => deleteMutation.mutate(deleteCandidate.id)}
          title={es.transactions.deleteConfirmationTitle}
        />
      ) : null}

      {highExpenseWarning ? (
  <ConfirmDialog
    actionLabel={es.transactions.highExpenseWarning.action}
    description={buildHighExpenseWarningDescription(highExpenseWarning)}
    isSaving={saveMutation.isPending}
    onCancel={() => setHighExpenseWarning(null)}
    onConfirm={() => {
      const values = highExpenseWarning.values;
      setHighExpenseWarning(null);
      saveMutation.mutate(values);
    }}
    title={es.transactions.highExpenseWarning.title}
  />
) : null}
    </section>
  );
}

const DEFAULT_HIGH_EXPENSE_WARNING_PERCENT = 50;

type HighExpenseWarning = {
  values: TransactionFormValues;
  account: Account;
  availableBalance: number;
  comparisonBalance: number;
  threshold: number;
  percent: number;
};

function TransactionRow({
  onDelete,
  onEdit,
  transaction,
}: {
  onDelete: () => void;
  onEdit: () => void;
  transaction: Transaction;
}) {
  const editable = transaction.type !== 'OPENING_BALANCE';
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-4 font-semibold">
        {transaction.description ?? transaction.category?.name ?? '—'}
      </td>
      <td className="px-4 py-4 text-slate-600">
        {transaction.category?.name ?? '—'}
      </td>
      <td className="px-4 py-4 text-slate-600">
        {transaction.account.name}
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">
        {new Intl.DateTimeFormat('es-PE', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(transaction.occurredAt))}
      </td>
      <td className="px-4 py-4">
        <span>
          {transaction.type === 'INCOME'
            ? es.transactions.income
            : transaction.type === 'EXPENSE'
              ? es.transactions.expense
              : es.accounts.form.openingBalance}
        </span>
        <span className="mt-1 block text-xs font-semibold text-slate-500">
          {es.transactions.balanceImpactStatus[transaction.balanceImpactStatus]}
        </span>
      </td>
      <td
        className={`px-4 py-4 font-bold ${
          transaction.type === 'EXPENSE' ? 'text-red-700' : 'text-emerald-700'
        }`}
      >
        {formatSignedMoney(
          Number(transaction.amount),
          transaction.currency,
          transaction.type === 'EXPENSE' ? '-' : '+',
        )}
      </td>
      <td className="px-4 py-4">
        {editable ? (
          <div className="flex gap-1">
            <button
              aria-label={es.transactions.edit}
              className="grid size-9 place-items-center rounded-md hover:bg-slate-100"
              onClick={onEdit}
              title={es.transactions.edit}
              type="button"
            >
              <Pencil size={17} />
            </button>
            <button
              aria-label={es.transactions.remove}
              className="grid size-9 place-items-center rounded-md text-red-700 hover:bg-red-50"
              onClick={onDelete}
              title={es.transactions.remove}
              type="button"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ) : null}
      </td>
    </tr>
  );
}

function SummaryGroup({
  currency,
  values,
}: {
  currency: 'PEN' | 'USD';
  values: { openingBalance: number; income: number; expense: number };
}) {
  return (
    <article className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
      <p className="text-xs font-semibold uppercase text-slate-500">
        {es.accounts.currencies[currency].plural}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <SummaryValue
          currency={currency}
          label={es.transactions.totalIncome}
          value={values.income}
        />
        <SummaryValue
          currency={currency}
          label={es.transactions.totalExpense}
          value={values.expense}
        />
        <SummaryValue
          currency={currency}
          label={es.transactions.balance}
          value={values.openingBalance + values.income - values.expense}
        />
      </div>
    </article>
  );
}

function SummaryValue({
  currency,
  label,
  value,
}: {
  currency: 'PEN' | 'USD';
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold sm:text-base">
        {formatMoney(value, currency)}
      </p>
    </div>
  );
}

function getSummary(
  rows: Array<{
    currency: 'PEN' | 'USD';
    type: 'OPENING_BALANCE' | 'INCOME' | 'EXPENSE';
    amount: string;
  }>,
) {
  const result = {
    PEN: { openingBalance: 0, income: 0, expense: 0 },
    USD: { openingBalance: 0, income: 0, expense: 0 },
  };
  for (const row of rows) {
    if (row.type === 'OPENING_BALANCE') {
      result[row.currency].openingBalance = Number(row.amount);
    } else {
      result[row.currency][row.type === 'INCOME' ? 'income' : 'expense'] =
        Number(row.amount);
    }
  }
  return result;
}
function getHighExpenseWarning({
  accounts,
  selected,
  values,
  warningRatio,
  warningPercent,
}: {
  accounts: Account[];
  selected: Transaction | null;
  values: TransactionFormValues;
  warningRatio: number;
  warningPercent: number;
}): HighExpenseWarning | null {
  if (values.type !== 'EXPENSE') {
    return null;
  }

  const account = accounts.find(
    (currentAccount) => currentAccount.id === values.accountId,
  );

  if (!account) {
    return null;
  }

  const amount = Number(values.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const availableBalance = Number(account.availableBalance);

  const previousExpenseAmount =
    selected?.type === 'EXPENSE' && selected.account.id === values.accountId
      ? Number(selected.amount)
      : 0;

  const comparisonBalance = availableBalance + previousExpenseAmount;
  const threshold = comparisonBalance * warningRatio;

  if (comparisonBalance <= 0 || amount > threshold) {
    return {
      values,
      account,
      availableBalance,
      comparisonBalance,
      threshold,
      percent: warningPercent,
    };
  }

  return null;
}

function buildHighExpenseWarningDescription(warning: HighExpenseWarning) {
  const currency = warning.account.currency;
  const amount = Number(warning.values.amount);

  if (warning.comparisonBalance <= 0) {
    return `Este gasto supera el ${warning.percent}% del saldo disponible de la cuenta seleccionada. Qori recomienda revisarlo antes de registrarlo.

Cuenta: ${warning.account.name}
Saldo disponible: ${formatMoney(warning.availableBalance, currency)}
Gasto ingresado: ${formatMoney(amount, currency)}

¿Deseas registrarlo de todas formas?`;
  }

  return `${es.transactions.highExpenseWarning.description}

Cuenta: ${warning.account.name}
Saldo disponible: ${formatMoney(warning.comparisonBalance, currency)}
Umbral de alerta (${warning.percent}%): ${formatMoney(
    warning.threshold,
    currency,
  )}
Gasto ingresado: ${formatMoney(amount, currency)}

¿Deseas registrarlo de todas formas?`;
}
