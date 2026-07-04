import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, Landmark, WalletCards, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { es } from '../../../i18n/es';
import { preventNumberWheelChange } from '../../../lib/number-input';
import {
  accountSchema,
  type AccountFormValues,
} from '../schemas/accountSchemas';

type AccountFormPanelProps = {
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: AccountFormValues) => void;
};

const accountTypes = [
  {
    value: 'BANK' as const,
    label: es.accounts.types.BANK,
    icon: Landmark,
  },
  {
    value: 'CASH' as const,
    label: es.accounts.types.CASH,
    icon: Banknote,
  },
  {
    value: 'DIGITAL_WALLET' as const,
    label: es.accounts.types.DIGITAL_WALLET,
    icon: WalletCards,
  },
];

export function AccountFormPanel({
  isSaving,
  onClose,
  onSubmit,
}: AccountFormPanelProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'BANK',
      currency: 'PEN',
      openingBalance: 0,
      balanceStartOption: 'TODAY',
      balanceStartedAt: getTodayDateKey(),
    },
  });
  const selectedCurrency = useWatch({
    control,
    name: 'currency',
  });
  const balanceStartOption = useWatch({
    control,
    name: 'balanceStartOption',
  });

  useEffect(() => {
    if (balanceStartOption === 'TODAY') {
      setValue('balanceStartedAt', getTodayDateKey(), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (balanceStartOption === 'MONTH_START') {
      setValue('balanceStartedAt', getCurrentMonthStartKey(), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [balanceStartOption, setValue]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[2px]">
      <button
        aria-label={es.accounts.form.closeForm}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <aside className="relative flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">
              {es.accounts.form.eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {es.accounts.form.title}
            </h2>
          </div>
          <button
            aria-label={es.accounts.form.close}
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
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase text-slate-600">
                {es.accounts.form.type}
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {accountTypes.map(({ icon: Icon, label, value }) => (
                  <label
                    className="has-checked:border-emerald-700 has-checked:bg-emerald-50 flex min-h-24 cursor-pointer flex-col justify-between rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-700"
                    key={value}
                  >
                    <Icon className="text-emerald-700" size={22} />
                    <span>{label}</span>
                    <input
                      className="sr-only"
                      type="radio"
                      value={value}
                      {...register('type')}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                {es.accounts.form.name}
              </span>
              <input
                className="w-full rounded-md border border-transparent bg-slate-100 px-4 py-3 text-slate-950 outline-none focus:border-emerald-700 focus:bg-white"
                onInput={sanitizeNameInput}
                placeholder={es.accounts.form.namePlaceholder}
                {...register('name')}
              />
              {errors.name ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.name.message}
                </span>
              ) : null}
            </label>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase text-slate-600">
                {es.accounts.form.currency}
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: 'PEN',
                    label: es.accounts.currencies.PEN.name,
                    symbol: es.accounts.currencies.PEN.symbol,
                  },
                  {
                    value: 'USD',
                    label: es.accounts.currencies.USD.name,
                    symbol: es.accounts.currencies.USD.symbol,
                  },
                ].map((currency) => (
                  <label
                    className="has-checked:border-emerald-700 has-checked:bg-emerald-50 cursor-pointer rounded-md border border-slate-200 p-4"
                    key={currency.value}
                  >
                    <span className="block font-semibold text-slate-950">
                      {currency.label}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {currency.value} {currency.symbol}
                    </span>
                    <input
                      className="sr-only"
                      type="radio"
                      value={currency.value}
                      {...register('currency')}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                {es.accounts.form.openingBalance} ({selectedCurrency})
              </span>
              <div className="flex items-center rounded-md bg-slate-100 px-4 focus-within:ring-2 focus-within:ring-emerald-700">
                <span className="text-xl font-bold text-emerald-700">
                  {es.accounts.currencies[selectedCurrency].symbol}
                </span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 py-4 text-2xl font-bold text-slate-950 outline-none"
                  inputMode="decimal"
                  min="0"
                  onInput={preventNegativeNumberInput}
                  onKeyDown={preventInvalidNumberKeys}
                  onWheel={preventNumberWheelChange}
                  step="0.01"
                  type="number"
                  {...register('openingBalance', { valueAsNumber: true })}
                />
              </div>
              <span className="mt-2 block text-sm text-slate-500">
                {es.accounts.form.openingBalanceHelp}
              </span>
              {errors.openingBalance ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.openingBalance.message}
                </span>
              ) : null}
            </label>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase text-slate-600">
                {es.accounts.form.balanceStartedAt}
              </legend>
              <div className="grid gap-2">
                {([
                  ['TODAY', es.accounts.form.balanceStartToday],
                  ['MONTH_START', es.accounts.form.balanceStartMonth],
                  ['CUSTOM', es.accounts.form.balanceStartCustom],
                ] as const).map(([value, label]) => (
                  <label
                    className="has-checked:border-emerald-700 has-checked:bg-emerald-50 cursor-pointer rounded-md border border-slate-200 px-4 py-3 font-semibold text-slate-700"
                    key={value}
                  >
                    {label}
                    <input
                      className="sr-only"
                      type="radio"
                      value={value}
                      {...register('balanceStartOption')}
                    />
                  </label>
                ))}
              </div>

              {balanceStartOption === 'CUSTOM' ? (
                <label className="mt-3 block">
                  <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                    {es.accounts.form.balanceStartDate}
                  </span>
                  <input
                    className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                    type="date"
                    {...register('balanceStartedAt')}
                  />
                </label>
              ) : null}

              <span className="mt-2 block text-sm text-slate-500">
                {es.accounts.form.balanceStartedAtHelp}
              </span>
              {errors.balanceStartedAt ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.balanceStartedAt.message}
                </span>
              ) : null}
            </fieldset>
          </div>

          <footer className="grid gap-3 border-t border-slate-200 px-5 py-5 sm:px-7">
            <button
              className="rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? es.common.saving : es.accounts.form.submit}
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

function sanitizeNameInput(event: React.FormEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.replace(
    /[^\p{L}\s'-]/gu,
    '',
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

function getTodayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}`;
}

function getCurrentMonthStartKey() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
