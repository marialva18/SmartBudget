import {
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  Layers3,
  Landmark,
  PiggyBank,
  ReceiptText,
  ShieldAlert,
  Target,
  Users,
  WalletCards,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

type DemoTab =
  | 'summary'
  | 'accounts'
  | 'movements'
  | 'planning'
  | 'agenda'
  | 'groups'
  | 'analytics'
  | 'coach';

const tabs: Array<{
  id: DemoTab;
  label: string;
  icon: typeof WalletCards;
}> = [
  { id: 'summary', label: 'Resumen', icon: WalletCards },
  { id: 'accounts', label: 'Cuentas', icon: Landmark },
  { id: 'movements', label: 'Movimientos', icon: ReceiptText },
  { id: 'planning', label: 'Planificación', icon: Target },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'groups', label: 'Grupos', icon: Users },
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
    <section className="relative overflow-hidden bg-[#0b2d28]" id="demo">
      <div className="mx-auto grid max-w-7xl gap-9 px-5 py-16 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#8ef3e4] shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur">
            <Layers3 size={16} />
            Vista interactiva
          </p>

          <h2 className="mt-5 text-3xl font-black leading-tight text-white md:text-4xl">
            Recorre las partes clave de Qori en una sola vista.
          </h2>

          <p className="mt-4 max-w-xl leading-7 text-[#cde5df]">
            Una vista con datos de ejemplo para revisar cuentas, movimientos,
            planificación, grupos, análisis y coach financiero.
          </p>

          <div className="mt-7 grid gap-3 text-sm font-semibold text-[#dff5ef]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 text-[#8ef3e4]" size={18} />
              <span>Un recorrido rápido por la experiencia principal.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 text-[#8ef3e4]" size={18} />
              <span>Diseñado para mostrar el flujo, no para capturar datos.</span>
            </div>
          </div>

          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#d6a84f] px-6 font-bold text-[#14201d] shadow-[0_14px_34px_rgba(214,168,79,0.22)] transition hover:-translate-y-0.5 hover:bg-[#e0b85e]"
            to="/register"
          >
            Crear cuenta para probar con mis datos
          </Link>
        </div>

        <div className="relative rounded-2xl border border-white/20 bg-white/12 p-3 shadow-[0_28px_70px_rgba(0,0,0,0.28)] backdrop-blur">
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

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
              {activeTab === 'accounts' ? <AccountsDemo /> : null}
              {activeTab === 'movements' ? <MovementsDemo /> : null}
              {activeTab === 'planning' ? <PlanningDemo /> : null}
              {activeTab === 'agenda' ? <AgendaDemo /> : null}
              {activeTab === 'groups' ? <GroupsDemo /> : null}
              {activeTab === 'analytics' ? <AnalyticsDemo /> : null}
              {activeTab === 'coach' ? <CoachDemo /> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AccountsDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { balance: 'S/ 1,240.50', label: 'Yape', tone: 'bg-[#063c36] text-white' },
        { balance: 'S/ 780.00', label: 'Efectivo', tone: 'bg-[#f0efe7] text-[#16201d]' },
        { balance: '$ 126.40', label: 'Ahorro USD', tone: 'bg-[#dff3ee] text-[#063c36]' },
      ].map((account) => (
        <article
          className={`rounded-xl p-5 shadow-[0_12px_30px_rgba(9,60,54,0.08)] ${account.tone}`}
          key={account.label}
        >
          <p className="text-sm font-semibold opacity-75">{account.label}</p>
          <p className="mt-3 text-2xl font-black">{account.balance}</p>
          <p className="mt-5 rounded-lg bg-white/18 px-3 py-2 text-xs font-bold">
            Disponible para movimientos
          </p>
        </article>
      ))}
    </div>
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
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-black text-[#16201d]">Evolución del mes</p>
            <p className="mt-1 text-sm text-[#52625d]">
              Ingresos, gastos y balance por semana.
            </p>
          </div>
          <span className="rounded-full bg-[#dcfbf5] px-3 py-1 text-xs font-black text-[#006b5f]">
            Julio
          </span>
        </div>

        <div className="mt-5 rounded-xl bg-[#f3f8f5] p-4">
          <svg
            aria-label="Gráfico de línea de balance del mes"
            className="h-56 w-full"
            role="img"
            viewBox="0 0 420 220"
          >
            <g stroke="#d5e6df" strokeWidth="1">
              <line x1="20" x2="400" y1="48" y2="48" />
              <line x1="20" x2="400" y1="96" y2="96" />
              <line x1="20" x2="400" y1="144" y2="144" />
              <line x1="20" x2="400" y1="192" y2="192" />
            </g>
            <path
              d="M28 162 C74 138, 92 118, 136 128 C178 138, 194 82, 232 92 C280 104, 296 56, 340 66 C368 72, 382 58, 398 44"
              fill="none"
              stroke="#00796b"
              strokeLinecap="round"
              strokeWidth="7"
            />
            <path
              d="M28 178 C82 166, 108 154, 146 160 C194 168, 222 132, 264 138 C314 146, 340 122, 398 116"
              fill="none"
              stroke="#d6a84f"
              strokeLinecap="round"
              strokeWidth="5"
            />
            {[28, 136, 232, 340, 398].map((x, index) => (
              <circle
                cx={x}
                cy={[162, 128, 92, 66, 44][index]}
                fill="#ffffff"
                key={x}
                r="6"
                stroke="#00796b"
                strokeWidth="4"
              />
            ))}
            <g fill="#52625d" fontSize="12" fontWeight="700">
              <text x="22" y="214">Sem 1</text>
              <text x="126" y="214">Sem 2</text>
              <text x="230" y="214">Sem 3</text>
              <text x="340" y="214">Sem 4</text>
            </g>
          </svg>

          <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-[#52625d]">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-5 rounded-full bg-[#00796b]" />
              Balance
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-5 rounded-full bg-[#d6a84f]" />
              Gasto
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
        <p className="font-black text-[#16201d]">Distribución</p>
        <div className="mt-5 grid place-items-center rounded-xl bg-[#f7f5ed] p-5">
          <div className="relative grid size-40 place-items-center">
            <svg
              aria-label="Gráfico circular de distribución de gastos"
              className="size-40 -rotate-90"
              role="img"
              viewBox="0 0 120 120"
            >
              <circle
                cx="60"
                cy="60"
                fill="none"
                r="44"
                stroke="#e4dcca"
                strokeWidth="16"
              />
              <circle
                cx="60"
                cy="60"
                fill="none"
                r="44"
                stroke="#00796b"
                strokeDasharray="150 276"
                strokeLinecap="round"
                strokeWidth="16"
              />
              <circle
                cx="60"
                cy="60"
                fill="none"
                r="44"
                stroke="#d6a84f"
                strokeDasharray="72 276"
                strokeDashoffset="-156"
                strokeLinecap="round"
                strokeWidth="16"
              />
              <circle
                cx="60"
                cy="60"
                fill="none"
                r="44"
                stroke="#063c36"
                strokeDasharray="38 276"
                strokeDashoffset="-234"
                strokeLinecap="round"
                strokeWidth="16"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#52625d]">
                Mayor rubro
              </p>
              <p className="mt-1 text-xl font-black text-[#063c36]">42%</p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Insight label="Mayor gasto" value="Comida: S/ 320" />
          <Insight label="Cuenta más usada" value="Yape" />
          <Insight label="Tendencia" value="Gasto variable moderado" />
        </div>
      </div>
    </div>
  );
}

function PlanningDemo() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
        <p className="font-black text-[#16201d]">Presupuesto mensual</p>
        <div className="mt-5 space-y-4">
          <ProgressRow label="Comida" value="S/ 320 de S/ 500" width="64%" />
          <ProgressRow label="Transporte" value="S/ 120 de S/ 180" width="67%" />
          <ProgressRow label="Ocio" value="S/ 90 de S/ 160" width="56%" />
        </div>
      </div>

      <div className="rounded-xl border border-[#dce8e3] bg-[#f7f5ed] p-4">
        <p className="font-black text-[#16201d]">Meta de ahorro</p>
        <p className="mt-2 text-sm leading-6 text-[#52625d]">
          Separa dinero para objetivos importantes sin mezclarlo con tus gastos
          diarios.
        </p>
        <div className="mt-5 rounded-xl bg-white p-4">
          <p className="text-sm font-bold text-[#52625d]">Viaje familiar</p>
          <p className="mt-2 text-2xl font-black text-[#063c36]">S/ 1,150</p>
        </div>
      </div>
    </div>
  );
}

function AgendaDemo() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
        <p className="font-black text-[#16201d]">Próximos eventos</p>
        <div className="mt-4 grid gap-3">
          <EventRow day="15" label="Internet" value="- S/ 89.90" />
          <EventRow day="18" label="Suscripción" value="- S/ 19.90" />
          <EventRow day="30" label="Ingreso mensual" value="+ S/ 2,400" />
        </div>
      </div>

      <div className="rounded-xl border border-[#dce8e3] bg-[#eef5f2] p-4">
        <p className="font-black text-[#16201d]">Recurrentes</p>
        <p className="mt-2 text-sm leading-6 text-[#52625d]">
          Qori deja pagos frecuentes como pendientes para confirmarlos antes de
          afectar tu saldo.
        </p>
        <div className="mt-5 rounded-lg bg-white px-4 py-3 text-sm font-bold text-[#006b5f]">
          2 recurrencias por confirmar esta semana
        </div>
      </div>
    </div>
  );
}

function GroupsDemo() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
        <p className="font-black text-[#16201d]">Gasto grupal</p>
        <div className="mt-4 rounded-xl bg-[#063c36] p-4 text-white">
          <p className="text-sm font-semibold text-[#a9ded4]">Cena con amigos</p>
          <p className="mt-2 text-3xl font-black">S/ 180.00</p>
          <p className="mt-2 text-sm text-[#d4eee8]">Pagó: María</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#dce8e3] bg-white p-4">
        <p className="font-black text-[#16201d]">Reparto sugerido</p>
        <div className="mt-4 space-y-3">
          <Insight label="Andre debe" value="S/ 60.00" />
          <Insight label="Victor debe" value="S/ 60.00" />
          <Insight label="María recibe" value="S/ 120.00" />
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

function ProgressRow({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-3 text-sm font-bold">
        <span>{label}</span>
        <span className="text-[#52625d]">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#e8f2ee]">
        <div className="h-full rounded-full bg-[#00796b]" style={{ width }} />
      </div>
    </div>
  );
}

function EventRow({
  day,
  label,
  value,
}: {
  day: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-[#f3f8f5] p-3">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-white font-black text-[#00796b]">
          {day}
        </span>
        <p className="font-bold text-[#16201d]">{label}</p>
      </div>
      <p className="font-black text-[#3c4a46]">{value}</p>
    </div>
  );
}
