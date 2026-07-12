import { Bot, Sparkles } from 'lucide-react';

export function HomeCoachSection() {
  return (
    <section id="coach" className="bg-[#071714]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#8ef3e4]">
            <Bot size={16} />
            Coach financiero con IA
          </p>

          <h2 className="mt-5 text-3xl font-black text-white">
            Un coach financiero que te habla claro.
          </h2>

          <p className="mt-4 leading-7 text-[#cde5df]">
            Pregunta cómo vas este mes, qué gasto deberías revisar o cómo puedes
            ahorrar un poco más. El coach convierte tus movimientos en
            recomendaciones simples, cercanas y fáciles de aplicar.
          </p>

          <div className="mt-6 rounded-lg border border-white/15 bg-white/8 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 text-[#8ef3e4]" size={20} />
              <p className="text-sm leading-6 text-[#dff5ef]">
                No se trata de restringirte todo. Se trata de entender mejor tus
                decisiones y elegir con más confianza.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-[0_28px_70px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="rounded-xl bg-[#f8fbfa] p-5">
          <p className="rounded-lg bg-[#eef5f2] p-4 text-sm leading-6 text-[#3c4a46] shadow-sm">
            “¿Qué debería cuidar esta semana?”
          </p>

          <p className="mt-3 rounded-lg bg-[#006b5f] p-4 text-sm leading-6 text-white shadow-sm">
            “Viendo tu mes, podrías empezar por revisar tus gastos variables y
            tus pagos próximos. No necesitas ajustar todo de golpe: elige una
            categoría y define un límite simple para esta semana.”
          </p>
          </div>
        </div>
      </div>
    </section>
  );
}
