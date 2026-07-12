import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const benefits = [
  'Visualiza tu dinero disponible de forma clara.',
  'Detecta gastos importantes antes de confirmarlos.',
  'Organiza metas, cuentas y pagos frecuentes en un solo lugar.',
  'Recibe recomendaciones inteligentes para tomar mejores decisiones.',
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
            Qori reúne tus cuentas, gastos, metas y pagos frecuentes en una
            sola app. Entiende mejor tu dinero, recibe alertas útiles y toma
            decisiones con más confianza.
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
              Ver demo
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

        <div className="qori-card-motion relative mx-auto w-full max-w-[560px] rounded-2xl border border-white/70 bg-white/68 p-3 shadow-[0_28px_70px_rgba(9,60,54,0.14)] backdrop-blur">
          <div className="overflow-hidden rounded-xl border border-[#dce8e3] bg-[#f8fbfa]">
            <div className="flex items-center justify-between border-b border-[#dce8e3] bg-white/90 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#00796b]">
                  Panel Qori
                </p>
                <p className="mt-1 font-black text-[#16201d]">
                  Vista de tu dinero
                </p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#dcfbf5] text-[#006b5f]">
                <WalletCards size={22} />
              </span>
            </div>

            <div className="grid gap-4 p-4">
              <div className="rounded-xl bg-[#063c36] p-5 text-white">
                <p className="text-sm font-semibold text-[#a9ded4]">
                  Saldo disponible
                </p>
                <p className="mt-2 text-4xl font-black">S/ 2,438.50</p>
                <p className="mt-2 text-sm text-[#d4eee8]">
                  Calculado con cuentas, metas y pagos próximos.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#dcfbf5] text-[#006b5f]">
                      <CalendarDays size={20} />
                    </span>
                    <div>
                      <p className="font-black text-[#16201d]">Próximo pago</p>
                      <p className="text-sm text-[#52625d]">Internet · 15 jul.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-3">
                    <ShieldAlert
                      className="shrink-0 text-amber-800"
                      size={20}
                    />
                    <p className="text-sm font-bold leading-5 text-amber-950">
                      Revisa gastos altos antes de confirmarlos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
                <div className="mb-3 flex items-center justify-between text-sm font-bold">
                  <span>Meta Laptop</span>
                  <span className="text-[#00796b]">68%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#e8f2ee]">
                  <div className="h-full w-[68%] rounded-full bg-[#d6a84f]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
