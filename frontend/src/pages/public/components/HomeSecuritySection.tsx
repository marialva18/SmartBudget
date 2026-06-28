import { BellRing, Eye, ShieldCheck } from 'lucide-react';

const trustItems = [
  {
    icon: Eye,
    title: 'Claridad sin complicarte',
    description:
      'Qori transforma tus movimientos en resumenes faciles de entender para que sepas que esta pasando con tu dinero sin revisar todo manualmente.',
  },
  {
    icon: BellRing,
    title: 'Alertas antes de decidir',
    description:
      'Cuando un gasto puede afectar demasiado tu saldo disponible, la app te avisa antes de confirmarlo.',
  },
  {
    icon: ShieldCheck,
    title: 'Tu mantienes el control',
    description:
      'El coach te orienta, pero la decision final siempre es tuya. Qori no registra movimientos ni cambia tus metas sin que tu lo confirmes.',
  },
];

export function HomeSecuritySection() {
  return (
    <section id="confianza" className="mx-auto max-w-7xl px-5 py-16">
      <div className="max-w-2xl">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#006b5f]">
          Confianza y control
        </p>

        <h2 className="mt-2 text-3xl font-black text-[#191c1e]">
          Informacion clara para decidir mejor.
        </h2>

        <p className="mt-3 text-[#3c4a46]">
          Qori esta pensado para ayudarte a entender tu dinero, no para abrumarte
          con reportes dificiles o decisiones automaticas.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {trustItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <article
              className={`qori-card-motion qori-card-delay-${index} rounded-xl border border-[#e0e3e5] bg-white p-6 shadow-[0_12px_35px_rgba(13,148,136,0.08)] transition hover:-translate-y-1 hover:border-[#9bd8cf] hover:shadow-[0_22px_55px_rgba(13,148,136,0.16)]`}
              key={item.title}
            >
              <span className="qori-icon-motion grid h-12 w-12 place-items-center rounded-lg bg-[#dcfbf5] text-[#006b5f]">
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
    </section>
  );
}
