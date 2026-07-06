import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { HelpDisclosure } from '../../../components/ui/HelpDisclosure';
import { getAccounts } from '../../accounts/services/accountsApi';
import { useFinanceScope } from '../../finance-scope/financeScope';
import { es } from '../../../i18n/es';
import { preventNumberWheelChange } from '../../../lib/number-input';
import {
  transferSchema,
  type TransferFormValues,
} from '../schemas/transactionSchemas';

type Props = {
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: TransferFormValues) => void;
};

export function TransferFormPanel({ isSaving, onClose, onSubmit }: Props) {
  const { scope } = useFinanceScope();
  const {
    formState: { errors },
    handleSubmit,
    register,
    control,
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      description: '',
      fromAccountId: '',
      occurredAt: toLocalInput(new Date().toISOString()),
      toAccountId: '',
    },
  });
  const fromAccountId = useWatch({ control, name: 'fromAccountId' });
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });
  const activeAccounts =
    accountsQuery.data?.filter(
      (account) =>
        account.status === 'ACTIVE' && (scope === 'ALL' || account.currency === scope),
    ) ?? [];
  const fromAccount = activeAccounts.find(
    (account) => account.id === fromAccountId,
  );
  const destinationAccounts = fromAccount
    ? activeAccounts.filter(
        (account) =>
          account.id !== fromAccount.id && account.currency === fromAccount.currency,
      )
    : activeAccounts;

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
            {es.transactions.transferForm.title}
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
              label={es.transactions.transferForm.helpLabel}
              title={es.transactions.transferForm.helpTitle}
            >
              <p className="text-sm leading-6 text-slate-600">
                {es.transactions.transferForm.help}
              </p>
            </HelpDisclosure>

            <Field
              error={errors.fromAccountId?.message}
              label={es.transactions.transferForm.fromAccount}
            >
              <select
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                {...register('fromAccountId')}
              >
                <option value="">
                  {es.transactions.transferForm.selectAccount}
                </option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.currency}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              error={errors.toAccountId?.message}
              label={es.transactions.transferForm.toAccount}
            >
              <select
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                {...register('toAccountId')}
              >
                <option value="">
                  {es.transactions.transferForm.selectAccount}
                </option>
                {destinationAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.currency}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              error={errors.amount?.message}
              label={es.transactions.transferForm.amount}
            >
              <div className="flex items-center rounded-md bg-slate-100 px-4">
                <span className="font-bold text-emerald-800">
                  {fromAccount ? es.accounts.currencies[fromAccount.currency].symbol : '-'}
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

            <Field
              error={errors.occurredAt?.message}
              label={es.transactions.transferForm.date}
            >
              <input
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                type="datetime-local"
                {...register('occurredAt')}
              />
            </Field>

            <Field label={es.transactions.transferForm.description}>
              <input
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder={es.transactions.transferForm.descriptionPlaceholder}
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
              {isSaving ? es.common.saving : es.transactions.transferForm.submit}
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
      {error ? (
        <span className="mt-1 block text-sm text-red-700">{error}</span>
      ) : null}
    </label>
  );
}

function toLocalInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
