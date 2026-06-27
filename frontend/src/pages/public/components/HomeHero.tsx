import { ArrowRight, Bot, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const benefits = [
  'Visualiza tu dinero disponible de forma clara.',
  'Detecta gastos importantes antes de confirmarlos.',
  'Organiza metas, cuentas y pagos frecuentes en un solo lugar.',
  'Recibe recomendaciones inteligentes para tomar mejores decisiones.',
];

export function HomeHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute left-1/2 top-10 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm">
            <Sparkles size={16} />
            Finanzas personales con ayuda inteligente
          </p>

          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
            Tu dinero más claro. Tus decisiones más inteligentes.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            SmartBudget reúne tus cuentas, gastos, metas y pagos frecuentes en
            una sola app. Entiende mejor tu dinero, recibe alertas útiles y toma
            decisiones con más confianza, sin estrés ni hojas de cálculo
            complicadas.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-800 px-6 font-bold text-white shadow-xl shadow-emerald-900/20 transition hover:bg-emerald-900"
              to="/register"
            >
              Crear mi cuenta
              <ArrowRight size={18} />
            </Link>

            <a
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200 bg-white px-6 font-bold text-emerald-800 transition hover:bg-emerald-50"
              href="#funciones"
            >
              Ver funciones
            </a>
          </div>

          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div className="flex items-start gap-3" key={benefit}>
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-emerald-700"
                  size={18}
                />
                <p className="text-sm font-semibold text-slate-700">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-[0_30px_80px_rgba(13,148,136,0.18)]">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-50/80">
                  Disponible estimado
                </p>
                <p className="mt-1 text-3xl font-black">S/ 1,240.00</p>
              </div>

              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                En control
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/12 p-4">
                <p className="text-sm text-emerald-50/80">Gastos del mes</p>
                <p className="mt-1 text-xl font-bold">S/ 620.00</p>
              </div>

              <div className="rounded-2xl bg-white/12 p-4">
                <p className="text-sm text-emerald-50/80">Reservado</p>
                <p className="mt-1 text-xl font-bold">S/ 300.00</p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-3xl bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                <Bot size={22} />
              </span>

              <div>
                <p className="font-black">Coach SmartBudget</p>
                <p className="text-sm text-slate-500">
                  Orientación inteligente
                </p>
              </div>
            </div>

            <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
              Viendo tu mes, lo más importante sería cuidar tus gastos variables
              y revisar tus pagos próximos. No tienes que cambiar todo: empieza
              con una decisión pequeña esta semana.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}