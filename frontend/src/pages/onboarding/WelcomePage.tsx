import { ArrowRight, BarChart3, PiggyBank, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OnboardingStep } from '../../features/onboarding/components/OnboardingStep';

export function WelcomePage() {
  const navigate = useNavigate();
  return (
    <OnboardingStep
      current={1}
      description="Configuraremos tus preferencias y tu primera cuenta sin mezclar monedas."
      title="Bienvenida a Qori"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: WalletCards, label: 'Organiza tus cuentas' },
          { icon: BarChart3, label: 'Comprende tus gastos' },
          { icon: PiggyBank, label: 'Avanza hacia tus metas' },
        ].map(({ icon: Icon, label }) => (
          <div
            className="rounded-lg border border-slate-200 bg-white p-5 text-center"
            key={label}
          >
            <Icon className="mx-auto text-emerald-700" size={28} />
            <p className="mt-3 font-semibold">{label}</p>
          </div>
        ))}
      </div>
      <button
        className="mx-auto mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-800 px-7 font-semibold text-white"
        onClick={() => navigate('/onboarding/preferences')}
        type="button"
      >
        Comenzar
        <ArrowRight size={19} />
      </button>
    </OnboardingStep>
  );
}

