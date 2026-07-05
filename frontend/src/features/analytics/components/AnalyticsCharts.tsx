import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { es } from '../../../i18n/es';
import { formatMoney } from '../../../lib/money';

export type ComparisonChartRow = {
  current: number;
  metric: string;
  previous: number;
};

export type AmountChartRow = {
  amount: number;
  name: string;
};

type Currency = 'PEN' | 'USD';

export function ComparisonChart({
  currency,
  rows,
}: {
  currency: Currency;
  rows: ComparisonChartRow[];
}) {
  return (
    <div
      aria-label={es.analytics.comparisonChart}
      className="mt-4 h-72 min-w-0 rounded-lg border border-slate-100 bg-slate-50 p-3"
      role="img"
    >
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={rows} margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => compactMoney(Number(value), currency)}
            width={72}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value), currency)}
            labelClassName="font-semibold"
          />
          <Legend />
          <Bar
            dataKey="previous"
            fill="#94a3b8"
            name={es.analytics.previousPeriod}
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="current"
            fill="#006b5f"
            name={es.analytics.currentPeriod}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimelineChart({
  currency,
  rows,
}: {
  currency: Currency;
  rows: Array<{ date: string; balance: string; expense: string; income: string }>;
}) {
  const chartRows = rows.map((row) => ({
    date: row.date.slice(5),
    balance: Number(row.balance),
    expense: Number(row.expense),
    income: Number(row.income),
  }));
  const last = rows[rows.length - 1];

  return (
    <div
      aria-label={es.analytics.timelineChart}
      className="mt-4 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-4"
      role="img"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">
          {es.analytics.timelineChart}
        </p>
        <p className="text-sm font-bold text-slate-950">
          {last ? formatMoney(Number(last.balance), currency) : '-'}
        </p>
      </div>
      <div className="h-72 min-w-0">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={chartRows} margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => compactMoney(Number(value), currency)}
              width={72}
            />
            <Tooltip
              formatter={(value) => formatMoney(Number(value), currency)}
              labelClassName="font-semibold"
            />
            <Legend />
            <Line
              dataKey="income"
              dot={false}
              name={es.transactions.income}
              stroke="#006b5f"
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="expense"
              dot={false}
              name={es.transactions.expense}
              stroke="#dc2626"
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="balance"
              dot={{ fill: '#d6a23a', r: 4 }}
              name={es.transactions.balance}
              stroke="#0f766e"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BarChartPanel({
  ariaLabel,
  color,
  currency,
  rows,
}: {
  ariaLabel: string;
  color: string;
  currency: Currency;
  rows: AmountChartRow[];
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="mt-4 h-56 min-w-0 rounded-lg border border-slate-100 bg-slate-50 p-3"
      role="img"
    >
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={rows} layout="vertical" margin={{ bottom: 0, left: 8, right: 8, top: 0 }}>
          <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis
            hide
            tickFormatter={(value) => compactMoney(Number(value), currency)}
            type="number"
          />
          <YAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 12 }}
            type="category"
            width={96}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value), currency)}
            labelClassName="font-semibold"
          />
          <Bar dataKey="amount" fill={color} name={es.transactions.amount} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function compactMoney(value: number, currency: Currency) {
  return new Intl.NumberFormat('es-PE', {
    currency,
    maximumFractionDigits: 0,
    notation: 'compact',
    style: 'currency',
  }).format(value);
}
