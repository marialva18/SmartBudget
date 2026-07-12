import { BellRing, Eye, ShieldCheck } from 'lucide-react';

const trustItems = [
  {
    icon: Eye,
    title: 'Claridad sin complicarte',
    description:
      'Qori transforma tus movimientos en resúmenes fáciles de entender para que sepas qué está pasando con tu dinero sin revisar todo manualmente.',
  },
  {
    icon: BellRing,
    title: 'Alertas antes de decidir',
    description:
      'Cuando un gasto puede afectar demasiado tu saldo disponible, la app te avisa antes de confirmarlo.',
  },
  {
    icon: ShieldCheck,
    title: 'Tú mantienes el control',
    description:
      'El coach te orienta, pero la decisión final siempre es tuya. Qori no registra movimientos ni cambia tus metas sin que tú lo confirmes.',
  },
];

export function HomeSecuritySection() {
  return (
    <section id="confianza" className="bg-[#edf7f3] px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#006b5f]">
            Confianza y control
          </p>

          <h2 className="mt-2 text-3xl font-black text-[#191c1e]">
            Información clara para decidir mejor.
          </h2>

          <p className="mt-3 text-[#3c4a46]">
            Qori está pensado para ayudarte a entender tu dinero, no para
            abrumarte con reportes difíciles o decisiones automáticas.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {trustItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                className={`qori-card-motion qori-card-delay-${index} rounded-2xl border border-white/80 bg-white/72 p-6 shadow-[0_18px_45px_rgba(13,148,136,0.08)] backdrop-blur transition hover:-translate-y-1 hover:border-[#9bd8cf] hover:shadow-[0_22px_55px_rgba(13,148,136,0.16)]`}
                key={item.title}
              >
                <span className="qori-icon-motion grid h-12 w-12 place-items-center rounded-lg bg-[#063c36] text-[#8ef3e4]">
                  <Icon size={24} />
                </span>

                <h3 className="mt-5 text-lg font-black">{item.title}</h3>

                <p className="mt-2 text-sm leading-6 text-[#3c4a46]">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
