import { BarChart3, PiggyBank, ReceiptText, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingStep } from '../../features/onboarding/components/OnboardingStep';
import type { OnboardingObjective } from '../../features/onboarding/schemas/onboardingSchemas';
import { updateObjectives } from '../../features/onboarding/services/profileApi';

const objectives = [
  { value: 'SAVE' as const, label: 'Ahorrar', icon: PiggyBank },
  {
    value: 'CONTROL_EXPENSES' as const,
    label: 'Controlar gastos',
    icon: ReceiptText,
  },
  {
    value: 'ORGANIZE_INCOME' as const,
    label: 'Organizar ingresos',
    icon: WalletCards,
  },
  {
    value: 'CREATE_BUDGET' as const,
    label: 'Crear un presupuesto',
    icon: BarChart3,
  },
];

export function GoalsPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<OnboardingObjective[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  function toggle(value: OnboardingObjective) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function continueToAccount() {
    if (selected.length === 0) {
      setError('Selecciona al menos un objetivo.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await updateObjectives(selected);
      navigate('/onboarding/account');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'No pudimos guardar tus objetivos.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <OnboardingStep
      current={3}
      description="Selecciona uno o varios objetivos para adaptar tu experiencia."
      title="¿Qué quieres mejorar primero?"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {objectives.map(({ icon: Icon, label, value }) => {
          const active = selected.includes(value);
          return (
            <button
              aria-pressed={active}
              className={`flex min-h-24 items-center gap-4 rounded-lg border-2 bg-white p-5 text-left ${
                active ? 'border-emerald-700 bg-emerald-50' : 'border-slate-200'
              }`}
              key={value}
              onClick={() => toggle(value)}
              type="button"
            >
              <Icon className="text-emerald-700" size={26} />
              <span className="font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-4 text-center text-red-700">{error}</p> : null}
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
        <button
          className="rounded-full border border-emerald-800 px-7 py-3 font-semibold text-emerald-900"
          onClick={() => navigate('/onboarding/preferences')}
          type="button"
        >
          Volver
        </button>
        <button
          className="rounded-full bg-emerald-800 px-7 py-3 font-semibold text-white disabled:opacity-60"
          disabled={isSaving}
          onClick={continueToAccount}
          type="button"
        >
          {isSaving ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </OnboardingStep>
  );
}
