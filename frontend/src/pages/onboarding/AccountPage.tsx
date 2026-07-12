import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Banknote, Landmark, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { HelpDisclosure } from '../../components/ui/HelpDisclosure';
import { createAccount } from '../../features/accounts/services/accountsApi';
import { OnboardingStep } from '../../features/onboarding/components/OnboardingStep';
import {
  onboardingAccountSchema,
  type OnboardingAccountFormValues,
} from '../../features/onboarding/schemas/onboardingSchemas';
import { completeOnboarding } from '../../features/onboarding/services/profileApi';
import { getAuthSession, setAuthSession } from '../../lib/auth-session';
import { preventNumberWheelChange } from '../../lib/number-input';

const accountTypes = [
  { value: 'BANK' as const, label: 'Cuenta bancaria', icon: Landmark },
  { value: 'CASH' as const, label: 'Efectivo', icon: Banknote },
  {
    value: 'DIGITAL_WALLET' as const,
    label: 'Billetera digital',
    icon: WalletCards,
  },
];

export function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState('');
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<OnboardingAccountFormValues>({
    resolver: zodResolver(onboardingAccountSchema),
    defaultValues: {
      name: '',
      type: 'BANK',
      currency: 'PEN',
      openingBalance: 0,
      balanceStartOption: 'TODAY',
      balanceStartedAt: getTodayDateKey(),
    },
  });
  const currency = useWatch({ control, name: 'currency' });
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

  async function onSubmit(values: OnboardingAccountFormValues) {
    setServerError('');
    try {
      await createAccount(values);
      await completeOnboarding();
      const session = getAuthSession();
      if (session) {
        setAuthSession({
          ...session,
          user: { ...session.user, onboardingCompleted: true },
        });
      }
      queryClient.setQueryData(['auth', 'me'], (currentUser: unknown) => {
        if (!currentUser || typeof currentUser !== 'object') {
          return currentUser;
        }

        return { ...currentUser, onboardingCompleted: true };
      });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      navigate('/app/dashboard');
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'No pudimos crear tu cuenta inicial.',
      );
    }
  }

  return (
    <OnboardingStep
      current={4}
      description="Cada cuenta usa una sola moneda. Después podrás agregar otras cuentas en PEN o USD."
      title="Crea tu primera cuenta"
    >
      <form
        className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 sm:p-7"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {accountTypes.map(({ icon: Icon, label, value }) => (
            <label
              className="qori-choice-option cursor-pointer rounded-md border border-slate-200 p-4"
              key={value}
            >
              <Icon className="mb-3 text-emerald-700" size={22} />
              <span className="text-sm font-semibold">{label}</span>
              <input
                className="sr-only"
                type="radio"
                value={value}
                {...register('type')}
              />
            </label>
          ))}
        </div>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
            Nombre
          </span>
          <input
            className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
            onInput={sanitizeNameInput}
            placeholder="Ej. Cuenta sueldo"
            {...register('name')}
          />
          {errors.name ? (
            <span className="mt-1 block text-sm text-red-700">{errors.name.message}</span>
          ) : null}
        </label>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase text-slate-600">
            Moneda de esta cuenta
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {(['PEN', 'USD'] as const).map((value) => (
              <label
                className="qori-choice-option cursor-pointer rounded-md border border-slate-200 p-4 font-semibold"
                key={value}
              >
                {value === 'PEN' ? 'Sol peruano (PEN)' : 'Dólar estadounidense (USD)'}
                <input
                  className="sr-only"
                  type="radio"
                  value={value}
                  {...register('currency')}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
            Saldo inicial ({currency})
          </span>
          <input
            className="w-full rounded-md bg-slate-100 px-4 py-3 text-xl font-bold outline-none focus:ring-2 focus:ring-emerald-700"
            inputMode="decimal"
            min="0"
            onInput={preventNegativeNumberInput}
            onKeyDown={preventInvalidNumberKeys}
            onWheel={preventNumberWheelChange}
            step="0.01"
            type="number"
            {...register('openingBalance', { valueAsNumber: true })}
          />
          <div className="mt-2">
            <HelpDisclosure label="Ayuda sobre saldo inicial">
              <p className="text-sm leading-6 text-slate-600">
                Indica cuánto dinero tienes actualmente en esta cuenta.
              </p>
            </HelpDisclosure>
          </div>
          {errors.openingBalance ? (
            <span className="mt-1 block text-sm text-red-700">
              {errors.openingBalance.message}
            </span>
          ) : null}
        </label>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase text-slate-600">
            Fecha de inicio de control
          </legend>
          <div className="grid gap-2">
            {([
              ['TODAY', 'Desde hoy'],
              ['MONTH_START', 'Desde el inicio de este mes'],
              ['CUSTOM', 'Elegir otra fecha'],
            ] as const).map(([value, label]) => (
              <label
                className="qori-choice-option cursor-pointer rounded-md border border-slate-200 px-4 py-3 font-semibold"
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
                Elige la fecha
              </span>
              <input
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                type="date"
                {...register('balanceStartedAt')}
              />
            </label>
          ) : null}
          <div className="mt-2">
            <HelpDisclosure label="Ayuda sobre fecha de inicio">
              <p className="text-sm leading-6 text-slate-600">
                Elige desde cuándo quieres que Qori empiece a controlar el saldo de esta cuenta. Los movimientos anteriores a esta fecha se guardarán para análisis, pero no modificarán tu saldo actual.
              </p>
            </HelpDisclosure>
          </div>
          {errors.balanceStartedAt ? (
            <span className="mt-1 block text-sm text-red-700">
              {errors.balanceStartedAt.message}
            </span>
          ) : null}
        </fieldset>
        <p className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Registra tu primer ingreso o gasto después de crear la cuenta para empezar a ver tu resumen financiero.
        </p>
        {serverError ? <p className="text-center text-red-700">{serverError}</p> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            className="rounded-full border border-emerald-800 px-7 py-3 font-semibold text-emerald-900"
            onClick={() => navigate('/onboarding/goals')}
            type="button"
          >
            Volver
          </button>
          <button
            className="rounded-full bg-emerald-800 px-7 py-3 font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Creando cuenta...' : 'Finalizar'}
          </button>
        </div>
      </form>
    </OnboardingStep>
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

