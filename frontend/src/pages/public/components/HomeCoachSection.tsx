import { Bot, Sparkles } from 'lucide-react';

export function HomeCoachSection() {
  return (
    <section id="coach" className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-lg bg-[#dcfbf5] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#006b5f]">
            <Bot size={16} />
            Coach financiero con IA
          </p>

          <h2 className="mt-5 text-3xl font-black text-[#191c1e]">
            Un coach financiero que te habla claro.
          </h2>

          <p className="mt-4 leading-7 text-[#3c4a46]">
            Pregunta cómo vas este mes, qué gasto deberías revisar o cómo puedes
            ahorrar un poco más. El coach convierte tus movimientos en
            recomendaciones simples, cercanas y fáciles de aplicar.
          </p>

          <div className="mt-6 rounded-lg border border-[#bacac5] bg-[#f7f9fb] p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 text-[#006b5f]" size={20} />
              <p className="text-sm leading-6 text-[#3c4a46]">
                No se trata de restringirte todo. Se trata de entender mejor tus
                decisiones y elegir con más confianza.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e0e3e5] bg-[#f7f9fb] p-6 shadow-[0_18px_45px_rgba(13,148,136,0.08)]">
          <p className="rounded-lg bg-white p-4 text-sm leading-6 text-[#3c4a46] shadow-sm">
            “¿Qué debería cuidar esta semana?”
          </p>

          <p className="mt-3 rounded-lg bg-[#006b5f] p-4 text-sm leading-6 text-white shadow-sm">
            “Viendo tu mes, podrías empezar por revisar tus gastos variables y
            tus pagos próximos. No necesitas ajustar todo de golpe: elige una
            categoría y define un límite simple para esta semana.”
          </p>
        </div>
      </div>
    </section>
  );
}
