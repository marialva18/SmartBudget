import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { HelpDisclosure } from '../../../components/ui/HelpDisclosure';
import { getAccounts } from '../../accounts/services/accountsApi';
import { getCategories } from '../../categories/categoriesApi';
import { useFinanceScope } from '../../finance-scope/financeScope';
import { es } from '../../../i18n/es';
import { preventNumberWheelChange } from '../../../lib/number-input';
import {
  transactionSchema,
  type TransactionFormValues,
} from '../schemas/transactionSchemas';
import { type Transaction } from '../services/transactionsApi';

type Props = {
  transaction: Transaction | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: TransactionFormValues) => void;
};

export function TransactionFormPanel({
  transaction,
  isSaving,
  onClose,
  onSubmit,
}: Props) {
  const { scope } = useFinanceScope();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: getDefaults(transaction),
  });
  const type = useWatch({ control, name: 'type' });
  const accountId = useWatch({ control, name: 'accountId' });
  const occurredAt = useWatch({ control, name: 'occurredAt' });
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories', type],
    queryFn: () => getCategories(type),
  });
  const selectedAccount = accountsQuery.data?.find(
    (account) => account.id === accountId,
  );
  const impactPreview = getImpactPreview(selectedAccount, occurredAt);

  useEffect(() => {
    reset(getDefaults(transaction));
  }, [reset, transaction]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[2px]">
      <button
        aria-label={es.accounts.form.closeForm}
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-2xl font-bold">
            {transaction
              ? es.transactions.form.editTitle
              : es.transactions.form.createTitle}
          </h2>
          <button
            aria-label={es.accounts.form.close}
            className="grid size-10 place-items-center rounded-md hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <HelpDisclosure
              label={es.transactions.form.helpLabel}
              title={es.transactions.form.helpTitle}
            >
              <div className="space-y-2 text-sm leading-6 text-slate-600">
                {Object.values(es.transactions.form.helpItems).map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </HelpDisclosure>

            <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
              {(['EXPENSE', 'INCOME'] as const).map((value) => (
                <label
                  className="qori-segment-option cursor-pointer rounded-md px-4 py-3 text-center font-semibold"
                  key={value}
                >
                  {value === 'EXPENSE'
                    ? es.transactions.expense
                    : es.transactions.income}
                  <input
                    className="sr-only"
                    type="radio"
                    value={value}
                    {...register('type')}
                  />
                </label>
              ))}
            </div>

            <Field label={es.transactions.form.amount} error={errors.amount?.message}>
              <div className="flex items-center rounded-md bg-slate-100 px-4">
                <span className="font-bold text-emerald-800">
                  {selectedAccount
                    ? es.accounts.currencies[selectedAccount.currency].symbol
                    : '-'}
                </span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 py-4 text-2xl font-bold outline-none"
                  min="0.01"
                  onWheel={preventNumberWheelChange}
                  step="0.01"
                  type="number"
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
            </Field>

            <Field label={es.transactions.form.account} error={errors.accountId?.message}>
              <select
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                {...register('accountId')}
              >
                <option value="">{es.transactions.form.selectAccount}</option>
                {accountsQuery.data
                  ?.filter(
                    (account) =>
                      account.status === 'ACTIVE' &&
                      (scope === 'ALL' || account.currency === scope),
                  )
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.currency}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label={es.transactions.form.category} error={errors.categoryId?.message}>
              <select
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                {...register('categoryId')}
              >
                <option value="">{es.transactions.form.selectCategory}</option>
                {categoriesQuery.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={es.transactions.form.date} error={errors.occurredAt?.message}>
              <input
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                type="datetime-local"
                {...register('occurredAt')}
              />
              {impactPreview ? (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {impactPreview === 'ANALYSIS_ONLY'
                    ? es.transactions.form.analysisOnlyNotice
                    : es.transactions.form.pendingFutureNotice}
                </p>
              ) : null}
            </Field>

            <Field label={es.transactions.form.description}>
              <input
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder={es.transactions.form.descriptionPlaceholder}
                {...register('description')}
              />
            </Field>
          </div>
          <footer className="grid gap-3 border-t border-slate-200 px-6 py-5">
            <button
              className="rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving
                ? es.common.saving
                : transaction
                  ? es.transactions.form.submitEdit
                  : es.transactions.form.submitCreate}
            </button>
            <button
              className="rounded-full border border-emerald-800 px-5 py-3 font-semibold text-emerald-900"
              onClick={onClose}
              type="button"
            >
              {es.common.cancel}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
        {label}
      </span>
      {children}
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function getDefaults(transaction: Transaction | null): TransactionFormValues {
  if (
    transaction &&
    (transaction.type === 'INCOME' || transaction.type === 'EXPENSE')
  ) {
    return {
      type: transaction.type,
      amount: Number(transaction.amount),
      accountId: transaction.account.id,
      categoryId: transaction.category?.id ?? '',
      occurredAt: toLocalInput(transaction.occurredAt),
      description: transaction.description ?? '',
    };
  }
  return {
    type: 'EXPENSE',
    amount: 0,
    accountId: '',
    categoryId: '',
    occurredAt: toLocalInput(new Date().toISOString()),
    description: '',
  };
}

function toLocalInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getImpactPreview(
  account: { balanceStartedAt: string } | undefined,
  occurredAt: string,
) {
  if (!account || !occurredAt) {
    return null;
  }

  const occurredDateKey = occurredAt.slice(0, 10);
  const balanceStartedDateKey = account.balanceStartedAt.slice(0, 10);
  const todayDateKey = toDateKey(new Date());

  if (occurredDateKey > todayDateKey) {
    return 'PENDING_FUTURE';
  }

  if (occurredDateKey < balanceStartedDateKey) {
    return 'ANALYSIS_ONLY';
  }

  return null;
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}
