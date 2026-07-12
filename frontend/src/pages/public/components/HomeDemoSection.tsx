import {
  BarChart3,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  PiggyBank,
  ReceiptText,
  ShieldAlert,
  WalletCards,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

type DemoTab = 'summary' | 'movements' | 'analytics' | 'coach';

const tabs: Array<{
  id: DemoTab;
  label: string;
  icon: typeof WalletCards;
}> = [
  { id: 'summary', label: 'Resumen', icon: WalletCards },
  { id: 'movements', label: 'Movimientos', icon: ReceiptText },
  { id: 'analytics', label: 'Análisis', icon: BarChart3 },
  { id: 'coach', label: 'Coach', icon: Bot },
];

const movements = [
  { amount: '- S/ 86.40', category: 'Mercado', tone: 'expense' },
  { amount: '- S/ 24.90', category: 'Transporte', tone: 'expense' },
  { amount: '+ S/ 1,850.00', category: 'Ingreso', tone: 'income' },
];

export function HomeDemoSection() {
  const [activeTab, setActiveTab] = useState<DemoTab>('summary');

  return (
    <section
      className="relative overflow-hidden border-y border-[#dce8e3] bg-[#edf7f3]"
      id="demo"
    >
      <div className="mx-auto grid max-w-7xl gap-9 px-5 py-16 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-lg border border-[#b6dcd4] bg-white/75 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#006b5f] shadow-[0_10px_30px_rgba(9,60,54,0.06)] backdrop-blur">
            <CircleDollarSign size={16} />
            Demo sin registro
          </p>

          <h2 className="mt-5 text-3xl font-black leading-tight text-[#16201d] md:text-4xl">
            Mira cómo Qori ordena tu dinero antes de crear una cuenta.
          </h2>

          <p className="mt-4 max-w-xl leading-7 text-[#52625d]">
            Explora una simulación con saldos, movimientos, análisis y
            recomendaciones. Son datos ficticios, pero muestran la experiencia
            principal de la app.
          </p>

          <div className="mt-7 grid gap-3 text-sm font-semibold text-[#3c4a46]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 text-[#00796b]" size={18} />
              <span>Sin login, sin credenciales y sin modificar datos reales.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 text-[#00796b]" size={18} />
              <span>Ideal para entender el flujo antes de probar la app.</span>
            </div>
          </div>

          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#00796b] px-6 font-bold text-white shadow-[0_14px_34px_rgba(0,107,95,0.18)] transition hover:-translate-y-0.5 hover:bg-[#006b5f]"
            to="/register"
          >
            Crear cuenta para probar con mis datos
          </Link>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/62 p-3 shadow-[0_28px_70px_rgba(9,60,54,0.16)] backdrop-blur">
          <div className="overflow-hidden rounded-xl border border-[#dce8e3] bg-[#f8fbfa]">
            <div className="flex flex-col gap-3 border-b border-[#dce8e3] bg-white/86 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#00796b]">
                  Qori demo
                </p>
                <p className="mt-1 text-lg font-black text-[#16201d]">
                  Finanzas de ejemplo
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      className={[
                        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition',
                        isActive
                          ? 'bg-[#006b5f] text-white shadow-[0_10px_24px_rgba(0,107,95,0.18)]'
                          : 'bg-[#eef5f2] text-[#3c4a46] hover:bg-[#dff3ee] hover:text-[#006b5f]',
                      ].join(' ')}
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      type="button"
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {activeTab === 'summary' ? <SummaryDemo /> : null}
              {activeTab === 'movements' ? <MovementsDemo /> : null}
              {activeTab === 'analytics' ? <AnalyticsDemo /> : null}
              {activeTab === 'coach' ? <CoachDemo /> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryDemo() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
      <div className="rounded-xl bg-[#063c36] p-5 text-white shadow-[0_18px_45px_rgba(6,60,54,0.18)]">
        <p className="text-sm font-semibold text-[#a9ded4]">Saldo disponible</p>
        <p className="mt-3 text-4xl font-black">S/ 2,438.50</p>
        <p className="mt-2 text-sm text-[#d4eee8]">
          Después de gastos confirmados, metas y próximos pagos.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <MiniMetric label="Ingresos" value="S/ 3,200" />
          <MiniMetric label="Gastos" value="S/ 761.50" />
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#dcfbf5] text-[#006b5f]">
              <PiggyBank size={22} />
            </span>
            <div>
              <p className="font-black text-[#16201d]">Meta: Laptop</p>
              <p className="text-sm text-[#52625d]">68% completado</p>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e8f2ee]">
            <div className="h-full w-[68%] rounded-full bg-[#d6a84f]" />
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 shrink-0" size={20} />
            <p className="text-sm font-semibold leading-6">
              Qori te pediría revisar un gasto grande antes de confirmarlo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MovementsDemo() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
        <p className="font-black text-[#16201d]">Movimientos recientes</p>
        <div className="mt-4 divide-y divide-[#e4eeea]">
          {movements.map((movement) => (
            <div
              className="flex items-center justify-between gap-4 py-3"
              key={movement.category}
            >
              <div>
                <p className="font-bold text-[#16201d]">{movement.category}</p>
                <p className="text-sm text-[#52625d]">Cuenta Yape</p>
              </div>
              <p
                className={
                  movement.tone === 'income'
                    ? 'font-black text-[#00796b]'
                    : 'font-black text-red-700'
                }
              >
                {movement.amount}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
        <p className="font-black text-[#16201d]">Registrar gasto</p>
        <div className="mt-4 grid gap-3">
          <DemoField label="Cuenta" value="Yape" />
          <DemoField label="Categoría" value="Comida" />
          <DemoField label="Monto" value="S/ 42.90" />
          <button
            className="mt-2 min-h-11 rounded-lg bg-[#00796b] px-4 font-bold text-white"
            type="button"
          >
            Vista de ejemplo
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalyticsDemo() {
  const bars = [88, 64, 42, 35, 28];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
        <p className="font-black text-[#16201d]">Gastos por categoría</p>
        <div className="mt-5 flex h-52 items-end gap-3 rounded-lg bg-[#f3f8f5] p-4">
          {bars.map((height, index) => (
            <div className="flex flex-1 flex-col items-center gap-2" key={height}>
              <div
                className="w-full rounded-t-lg bg-[#00796b]"
                style={{ height: `${height}%` }}
              />
              <span className="text-xs font-bold text-[#52625d]">
                {['Com', 'Mov', 'Casa', 'Ocio', 'Sal'][index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
        <p className="font-black text-[#16201d]">Lectura rápida</p>
        <div className="mt-4 space-y-3">
          <Insight label="Mayor gasto" value="Comida: S/ 320" />
          <Insight label="Cuenta más usada" value="Yape" />
          <Insight label="Tendencia" value="Gasto variable moderado" />
        </div>
      </div>
    </div>
  );
}

function CoachDemo() {
  return (
    <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
      <div className="grid gap-3">
        <p className="max-w-[82%] rounded-xl bg-[#eef5f2] p-4 text-sm font-semibold text-[#3c4a46]">
          ¿Qué debería cuidar esta semana?
        </p>
        <p className="ml-auto max-w-[88%] rounded-xl bg-[#006b5f] p-4 text-sm font-semibold leading-6 text-white">
          Tu gasto en comida va más alto que otros rubros. Podrías revisar los
          consumos pequeños y fijar un límite semanal simple.
        </p>
        <p className="max-w-[82%] rounded-xl bg-[#eef5f2] p-4 text-sm font-semibold text-[#3c4a46]">
          Dame una acción concreta.
        </p>
        <p className="ml-auto max-w-[88%] rounded-xl bg-[#063c36] p-4 text-sm font-semibold leading-6 text-white">
          Registra tus próximos 3 gastos de comida y compara contra tu promedio
          diario antes de cerrar la semana.
        </p>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/12 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a9ded4]">
        {label}
      </p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function DemoField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#52625d]">
        {label}
      </span>
      <span className="mt-1 block rounded-lg bg-[#f3f8f5] px-4 py-3 font-bold text-[#16201d]">
        {value}
      </span>
    </label>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#dce8e3] bg-[#f8fbfa] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#00796b]">
        {label}
      </p>
      <p className="mt-1 font-black text-[#16201d]">{value}</p>
    </div>
  );
}
