import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { es } from '../../../i18n/es';
import {
  openingBalanceSchema,
  type OpeningBalanceFormValues,
} from '../schemas/accountSchemas';
import type { Account } from '../services/accountsApi';

type OpeningBalancePanelProps = {
  account: Account;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: OpeningBalanceFormValues) => void;
};

export function OpeningBalancePanel({
  account,
  isSaving,
  onClose,
  onSubmit,
}: OpeningBalancePanelProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<OpeningBalanceFormValues>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: {
      openingBalance: Math.max(Number(account.realBalance), 0),
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[2px]">
      <button
        aria-label="Cerrar edición de saldo inicial"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />

      <aside className="relative flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">
              {es.accounts.openingBalanceEdit.eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {es.accounts.openingBalanceEdit.title}
            </h2>
          </div>

          <button
            aria-label="Cerrar"
            className="grid size-10 place-items-center rounded-md text-slate-600 hover:bg-slate-100"
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
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-7">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="font-bold">
                    {es.accounts.openingBalanceEdit.warningTitle}
                  </p>
                  <p className="mt-1 text-sm">
                    {es.accounts.openingBalanceEdit.warningDescription}
                  </p>
                </div>
              </div>
            </div>

            <section className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Cuenta
              </p>
              <h3 className="mt-1 font-bold text-slate-950">
                {account.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {account.currency} · {es.accounts.realBalance}:{' '}
                {formatMoney(Number(account.realBalance), account.currency)}
              </p>
            </section>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                {es.accounts.openingBalanceEdit.newOpeningBalance} (
                {account.currency})
              </span>

              <div className="flex items-center rounded-md bg-slate-100 px-4 focus-within:ring-2 focus-within:ring-emerald-700">
                <span className="text-xl font-bold text-emerald-700">
                  {es.accounts.currencies[account.currency].symbol}
                </span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 py-4 text-2xl font-bold text-slate-950 outline-none"
                  inputMode="decimal"
                  min="0"
                  onInput={preventNegativeNumberInput}
                  onKeyDown={preventInvalidNumberKeys}
                  step="0.01"
                  type="number"
                  {...register('openingBalance', { valueAsNumber: true })}
                />
              </div>

              {errors.openingBalance ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.openingBalance.message}
                </span>
              ) : null}
            </label>
          </div>

          <footer className="grid gap-3 border-t border-slate-200 px-5 py-5 sm:px-7">
            <button
              className="rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving
                ? es.common.saving
                : es.accounts.openingBalanceEdit.submit}
            </button>

            <button
              className="rounded-full border border-emerald-800 px-5 py-3 font-semibold text-emerald-900 hover:bg-emerald-50"
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

function preventInvalidNumberKeys(
  event: React.KeyboardEvent<HTMLInputElement>,
) {
  if (['-', '+', 'e', 'E'].includes(event.key)) {
    event.preventDefault();
  }
}

function preventNegativeNumberInput(event: React.FormEvent<HTMLInputElement>) {
  if (event.currentTarget.value.startsWith('-')) {
    event.currentTarget.value = '';
  }
}

function formatMoney(value: number, currency: 'PEN' | 'USD') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
  }).format(value);
}