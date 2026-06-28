import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
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
              href="#funciones"
            >
              Ver funciones
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

        <div className="qori-card-motion qori-image-card relative mx-auto w-full max-w-[560px] overflow-hidden rounded-xl border border-[#dce8e3] bg-white p-3 shadow-[0_22px_60px_rgba(9,60,54,0.12)]">
          <img
            alt="Vista previa de Qori con cuentas, metas y recordatorios"
            className="qori-auth-bg aspect-[4/3] w-full rounded-lg object-cover"
            src="/images/qori_home_hero.png"
          />
          <div className="qori-soft-float absolute bottom-5 left-5 max-w-[240px] rounded-xl border border-white/70 bg-white/86 p-4 shadow-[0_18px_45px_rgba(9,60,54,0.16)] backdrop-blur">
            <p className="text-sm font-black text-[#063c36]">Todo en un lugar</p>
            <p className="mt-1 text-xs leading-5 text-[#52625d]">
              Cuentas, metas y pagos próximos en una vista fácil de entender.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
