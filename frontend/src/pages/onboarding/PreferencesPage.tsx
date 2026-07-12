import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { OnboardingStep } from '../../features/onboarding/components/OnboardingStep';
import {
  preferencesSchema,
  type PreferencesFormValues,
} from '../../features/onboarding/schemas/onboardingSchemas';
import { updatePreferences } from '../../features/onboarding/services/profileApi';

export function PreferencesPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const {
    formState: { isSubmitting },
    handleSubmit,
    register,
    control,
  } = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      preferredCurrency: 'PEN',
      timezone: 'America/Lima',
      theme: 'SYSTEM',
    },
  });
  const currency = useWatch({ control, name: 'preferredCurrency' });

  async function onSubmit(values: PreferencesFormValues) {
    setServerError('');
    try {
      await updatePreferences(values);
      navigate('/onboarding/goals');
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'No pudimos guardar tus preferencias.',
      );
    }
  }

  return (
    <OnboardingStep
      current={2}
      description="Esta será tu moneda principal para la experiencia. Podrás crear cuentas en PEN y USD."
      title="¿Qué moneda utilizas principalmente?"
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { value: 'PEN' as const, name: 'Sol peruano', symbol: 'S/' },
            { value: 'USD' as const, name: 'Dólar estadounidense', symbol: '$' },
          ].map((item) => (
            <label
              className={`relative cursor-pointer rounded-lg border-2 bg-white p-6 text-center ${
                currency === item.value
                  ? 'border-emerald-700'
                  : 'border-slate-200'
              }`}
              key={item.value}
            >
              {currency === item.value ? (
                <span className="absolute right-4 top-4 grid size-6 place-items-center rounded-full bg-emerald-700 text-white">
                  <Check size={15} />
                </span>
              ) : null}
              <p className="text-2xl font-bold text-emerald-800">{item.symbol}</p>
              <p className="mt-3 font-bold">{item.name}</p>
              <p className="text-sm text-slate-500">{item.value}</p>
              <input
                className="sr-only"
                type="radio"
                value={item.value}
                {...register('preferredCurrency')}
              />
            </label>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
              Zona horaria
            </span>
            <select
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3"
              {...register('timezone')}
            >
              <option value="America/Lima">Lima (UTC-5)</option>
            </select>
          </label>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase text-slate-600">
              Tema
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'LIGHT', label: 'Claro', icon: Sun },
                { value: 'DARK', label: 'Oscuro', icon: Moon },
                { value: 'SYSTEM', label: 'Sistema', icon: Sun },
              ].map(({ icon: Icon, label, value }) => (
                <label
                  className="qori-choice-option cursor-pointer rounded-md border border-slate-200 bg-white p-3 text-center text-sm"
                  key={value}
                >
                  <Icon className="mx-auto mb-1" size={17} />
                  {label}
                  <input
                    className="sr-only"
                    type="radio"
                    value={value}
                    {...register('theme')}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {serverError ? <p className="text-center text-red-700">{serverError}</p> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            className="rounded-full border border-emerald-800 px-7 py-3 font-semibold text-emerald-900"
            onClick={() => navigate('/onboarding/welcome')}
            type="button"
          >
            Volver
          </button>
          <button
            className="rounded-full bg-emerald-800 px-7 py-3 font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Guardando...' : 'Continuar'}
          </button>
        </div>
      </form>
    </OnboardingStep>
  );
}
