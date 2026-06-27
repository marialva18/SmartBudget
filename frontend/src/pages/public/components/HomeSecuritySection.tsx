import { BellRing, Eye, ShieldCheck } from 'lucide-react';

const trustItems = [
  {
    icon: Eye,
    title: 'Claridad sin complicarte',
    description:
      'Qori transforma tus movimientos en resúmenes fáciles de entender, para que sepas qué está pasando con tu dinero sin revisar todo manualmente.',
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
    <section id="confianza" className="mx-auto max-w-7xl px-5 py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          Confianza y control
        </p>

        <h2 className="mt-2 text-3xl font-black">
          Información clara para decidir mejor.
        </h2>

        <p className="mt-3 text-slate-600">
          Qori está pensado para ayudarte a entender tu dinero, no para
          abrumarte con reportes difíciles o decisiones automáticas.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {trustItems.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="rounded-3xl bg-white p-6 shadow-[0_12px_35px_rgba(13,148,136,0.08)]"
              key={item.title}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
                <Icon size={24} />
              </span>

              <h3 className="mt-5 text-lg font-black">{item.title}</h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
