import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const benefits = [
  'Saldos, cuentas y movimientos conectados.',
  'Alertas cuando un gasto merece revisión.',
  'Metas, presupuestos y pagos próximos en contexto.',
  'Recomendaciones útiles a partir de tus hábitos.',
];

const activity = [
  { label: 'Ingreso', value: '+ S/ 1,850', tone: 'text-[#00796b]' },
  { label: 'Mercado', value: '- S/ 86.40', tone: 'text-[#fca5a5]' },
  { label: 'Meta laptop', value: '68%', tone: 'text-[#8a651f]' },
];

export function HomeHero() {
  return (
    <section className="qori-home-surface border-b border-[#dce8e3]">
      <div className="mx-auto grid max-w-7xl gap-9 px-5 py-12 lg:grid-cols-[1fr_0.86fr] lg:items-center lg:py-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-lg border border-[#c8d8d2] bg-white/88 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#00796b] shadow-[0_10px_30px_rgba(9,60,54,0.06)] backdrop-blur">
            <Sparkles size={16} />
            Finanzas personales con ayuda inteligente
          </p>

          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-[#16201d] md:text-5xl lg:text-[56px]">
            Tu dinero más claro. Tus decisiones más inteligentes.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52625d]">
            Qori reúne cuentas, movimientos, metas y pagos frecuentes en una
            experiencia pensada para leer tu dinero con menos ruido y más
            contexto.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#00796b] px-6 font-bold text-white shadow-[0_14px_34px_rgba(0,107,95,0.18)] transition hover:-translate-y-0.5 hover:bg-[#006b5f]"
              to="/register"
            >
              Crear mi cuenta
              <ArrowRight size={18} />
            </Link>

            <a
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#c8d8d2] bg-white/88 px-6 font-bold text-[#00796b] transition hover:-translate-y-0.5 hover:bg-white"
              href="#demo"
            >
              Explorar demo
            </a>
          </div>

          <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div className="qori-card-motion flex items-start gap-3" key={benefit}>
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-[#00796b]"
                  size={18}
                />
                <p className="text-sm font-semibold text-[#52625d]">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="qori-card-motion relative mx-auto w-full max-w-[560px] rounded-3xl border border-[#dce8e3] bg-[#063c36] p-4 text-white shadow-[0_28px_70px_rgba(9,60,54,0.22)]">
          <div className="rounded-2xl border border-white/12 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8ef3e4]">
                  Pulso financiero
                </p>
                <p className="mt-2 max-w-sm text-2xl font-black">
                  Lo importante de tu mes, sin perderte en filas.
                </p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#d6a84f] text-[#063c36]">
                <TrendingUp size={24} />
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ['Disponible', 'S/ 2,438'],
                ['Gasto variable', 'S/ 761'],
                ['Meta activa', '68%'],
              ].map(([label, value]) => (
                <div className="rounded-xl bg-white/12 p-4" key={label}>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a9ded4]">
                    {label}
                  </p>
                  <p className="mt-2 text-xl font-black">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-[#f8fbfa] p-4 text-[#16201d]">
              {activity.map((item) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm"
                  key={item.label}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#dcfbf5] text-[#006b5f]">
                      <CircleDollarSign size={18} />
                    </span>
                    <p className="font-bold">{item.label}</p>
                  </div>
                  <p className={`font-black ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#d6a84f]/40 bg-[#d6a84f]/14 p-4">
              <ShieldAlert className="mt-0.5 shrink-0 text-[#f8d991]" size={20} />
              <p className="text-sm font-semibold leading-6 text-[#fff4d6]">
                Qori destaca señales relevantes: pagos próximos, metas y gastos
                que conviene revisar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
