import { Bot, CalendarDays, PiggyBank, WalletCards } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: WalletCards,
    title: 'Todo tu dinero en un solo lugar',
    description:
      'Organiza cuentas, saldos y monedas para saber cuánto tienes disponible y cómo se mueve tu dinero.',
  },
  {
    icon: CalendarDays,
    title: 'Anticípate a tus pagos',
    description:
      'Consulta tus movimientos por día, revisa pagos frecuentes y evita sorpresas cuando llega fin de mes.',
  },
  {
    icon: PiggyBank,
    title: 'Ahorra con intención',
    description:
      'Crea metas, separa reservas y protege el dinero que ya destinaste a objetivos importantes.',
  },
  {
    icon: Bot,
    title: 'Coach financiero con IA',
    description:
      'Recibe orientación cercana y práctica para entender tus hábitos y decidir mejor sin sentirte juzgado.',
  },
];

export function HomeFeatures() {
  return (
    <section id="funciones" className="mx-auto max-w-7xl px-5 py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          Funciones principales
        </p>

        <h2 className="mt-2 text-3xl font-black">
          Una forma más simple de manejar tus finanzas.
        </h2>

        <p className="mt-3 text-slate-600">
          Qori combina organización, alertas y recomendaciones
          inteligentes para ayudarte a pasar de solo registrar gastos a entender
          realmente tu dinero.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article
              className="rounded-3xl bg-white p-5 shadow-[0_12px_35px_rgba(13,148,136,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(13,148,136,0.14)]"
              key={feature.title}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
                <Icon size={24} />
              </span>

              <h3 className="mt-5 text-lg font-black">{feature.title}</h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {feature.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
