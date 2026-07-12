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
      'Recibe orientación cercana y práctica para entender tus hábitos y decidir mejor sin sentirte juzgada.',
  },
];

export function HomeFeatures() {
  return (
    <section
      id="funciones"
      className="qori-public-light-section bg-[#f2f7f4] px-5 py-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="qori-public-accent font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#006b5f]">
              Funciones principales
            </p>

            <h2 className="qori-public-title mt-2 text-3xl font-black text-[#191c1e]">
              Una forma más simple de manejar tus finanzas.
            </h2>

            <p className="qori-public-copy mt-3 text-[#3c4a46]">
              Qori combina organización, alertas y recomendaciones inteligentes
              para ayudarte a pasar de solo registrar gastos a entender
              realmente tu dinero.
            </p>
          </div>

          <div className="qori-public-card rounded-2xl border border-[#dce8e3] bg-white/82 p-5 shadow-[0_18px_45px_rgba(13,148,136,0.08)]">
            <p className="qori-public-accent text-sm font-bold uppercase tracking-[0.14em] text-[#00796b]">
              Flujo típico
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {['Registra', 'Analiza', 'Decide'].map((step, index) => (
                <div
                  className="rounded-xl border border-[#0a5d53]/30 bg-[#063c36] p-4 text-white shadow-[0_10px_24px_rgba(6,60,54,0.14)]"
                  key={step}
                >
                  <span className="text-xs font-bold text-[#a9ded4]">
                    0{index + 1}
                  </span>
                  <p className="mt-2 text-lg font-black">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article
                className={`qori-card-motion qori-card-delay-${index} qori-public-card rounded-xl border border-[#dce8e3] bg-white/90 p-5 shadow-[0_12px_35px_rgba(13,148,136,0.08)] transition hover:-translate-y-1 hover:border-[#9bd8cf] hover:shadow-[0_22px_55px_rgba(13,148,136,0.16)]`}
                key={feature.title}
              >
                <span className="qori-icon-motion grid h-12 w-12 place-items-center rounded-lg bg-[#dcfbf5] text-[#006b5f]">
                  <Icon size={24} />
                </span>

                <h3 className="qori-public-title mt-5 text-lg font-black">
                  {feature.title}
                </h3>

                <p className="qori-public-copy mt-2 text-sm leading-6 text-[#3c4a46]">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
