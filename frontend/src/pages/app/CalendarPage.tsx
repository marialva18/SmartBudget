import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { BalanceImpactBadge } from '../../components/finance/BalanceImpactBadge';
import { getAccounts } from '../../features/accounts/services/accountsApi';
import {
  getCalendarMonth,
  type CalendarDay,
  type CalendarTransaction,
} from '../../features/calendar/calendarApi';
import { useFinanceScope } from '../../features/finance-scope/financeScope';
import { es } from '../../i18n/es';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export function CalendarPage() {
  const { scope } = useFinanceScope();
  const [monthStart, setMonthStart] = useState(getCurrentMonthStart());
  const [selectedDate, setSelectedDate] = useState(getCurrentDateKey());
  const [currencyFilter, setCurrencyFilter] = useState<'PEN' | 'USD'>('PEN');
  const [accountId, setAccountId] = useState('');

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const activeAccounts = useMemo(
    () =>
      (accountsQuery.data ?? []).filter(
        (account) => account.status === 'ACTIVE',
      ),
    [accountsQuery.data],
  );

  const activeCurrencies = useMemo(() => {
    const currencies = new Set<'PEN' | 'USD'>();
    for (const account of activeAccounts) {
      currencies.add(account.currency);
    }
    return Array.from(currencies).sort();
  }, [activeAccounts]);

  const effectiveCurrency =
    scope === 'ALL'
      ? activeCurrencies.includes(currencyFilter)
        ? currencyFilter
        : activeCurrencies[0] ?? currencyFilter
      : scope;

  const visibleAccounts = useMemo(
    () =>
      activeAccounts.filter((account) => account.currency === effectiveCurrency),
    [activeAccounts, effectiveCurrency],
  );

  const effectiveAccountId = visibleAccounts.some(
    (account) => account.id === accountId,
  )
    ? accountId
    : '';

  const calendarQuery = useQuery({
    queryKey: [
      'calendar-month',
      monthStart,
      effectiveCurrency,
      effectiveAccountId,
    ],
    queryFn: () =>
      getCalendarMonth({
        monthStart,
        currency: effectiveCurrency,
        accountId: effectiveAccountId || undefined,
      }),
  });

  const selectedDay = calendarQuery.data?.days.find(
    (day) => day.date === selectedDate,
  );
  const leadingBlankDays = getLeadingBlankDays(monthStart);
  const monthLabel = getMonthLabel(monthStart);

  const goToPreviousMonth = () => {
    const nextMonth = addMonths(monthStart, -1);
    setMonthStart(nextMonth);
    setSelectedDate(nextMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = addMonths(monthStart, 1);
    setMonthStart(nextMonth);
    setSelectedDate(nextMonth);
  };

  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {es.calendar.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {es.calendar.title}
          </h1>
          <p className="mt-2 text-slate-600">{es.calendar.subtitle}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {scope === 'ALL' ? (
            <select
              className="rounded-md border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
              onChange={(event) =>
                setCurrencyFilter(event.target.value as 'PEN' | 'USD')
              }
              value={currencyFilter}
            >
              {(activeCurrencies.length > 0
                ? activeCurrencies
                : (['PEN', 'USD'] as const)
              ).map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          ) : null}

          <select
            className="rounded-md border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
            onChange={(event) => setAccountId(event.target.value)}
                       value={effectiveAccountId}
          >
            <option value="">{es.calendar.allAccounts}</option>
            {visibleAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="rounded-lg bg-white p-4 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              {effectiveCurrency}
            </p>
            <h2 className="text-xl font-bold capitalize">{monthLabel}</h2>
          </div>

          <div className="flex gap-2">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              onClick={goToPreviousMonth}
              type="button"
            >
              <ChevronLeft size={18} />
              {es.calendar.previousMonth}
            </button>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              onClick={goToNextMonth}
              type="button"
            >
              {es.calendar.nextMonth}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {calendarQuery.isLoading ? (
          <div className="mt-5 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => (
              <div
                className="h-28 animate-pulse rounded-lg bg-slate-100"
                key={index}
              />
            ))}
          </div>
        ) : null}

        {calendarQuery.isError ? (
          <div className="mt-6 border-y border-red-100 py-10 text-center">
            <p className="font-semibold text-red-700">
              {es.calendar.loadError}
            </p>
          </div>
        ) : null}

        {calendarQuery.data ? (
          <div className="mt-5">
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((weekday) => (
                <div
                  className="px-2 py-2 text-center text-xs font-bold uppercase text-slate-500"
                  key={weekday}
                >
                  {weekday}
                </div>
              ))}

              {Array.from({ length: leadingBlankDays }).map((_, index) => (
                <div
                  className="min-h-28 rounded-lg bg-slate-50"
                  key={`blank-${index}`}
                />
              ))}

              {calendarQuery.data.days.map((day) => (
                <CalendarDayCard
                  currency={effectiveCurrency}
                  day={day}
                  isSelected={day.date === selectedDate}
                  key={day.date}
                  onSelect={() => setSelectedDate(day.date)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <section className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              {es.calendar.selectedDay}
            </p>
            <h2 className="mt-1 text-xl font-bold">
              {formatLongDate(selectedDate)}
            </h2>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-900">
            {effectiveCurrency}
          </span>
        </div>

        {selectedDay ? (
          <DayDetails currency={effectiveCurrency} day={selectedDay} />
        ) : (
          <EmptyDay />
        )}
      </section>
    </section>
  );
}

function CalendarDayCard({
  currency,
  day,
  isSelected,
  onSelect,
}: {
  currency: 'PEN' | 'USD';
  day: CalendarDay;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const income = Number(day.incomeTotal);
  const expense = Number(day.expenseTotal);
  const net = Number(day.netTotal);
  const hasActivity = day.transactions.length > 0;

  return (
    <button
      className={[
        'min-h-28 rounded-lg border p-2 text-left transition-colors',
        isSelected
          ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-700/20'
          : 'border-slate-200 bg-white hover:bg-slate-50',
      ].join(' ')}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-900">
          {Number(day.date.slice(8, 10))}
        </span>
        {hasActivity ? (
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-emerald-900">
            {day.transactions.length}
          </span>
        ) : null}
      </div>

      {hasActivity ? (
        <div className="mt-3 space-y-1 text-xs">
          {income > 0 ? (
            <p className="font-semibold text-emerald-700">
              + {formatMoney(income, currency)}
            </p>
          ) : null}
          {expense > 0 ? (
            <p className="font-semibold text-red-700">
              - {formatMoney(expense, currency)}
            </p>
          ) : null}
          <p
            className={
              net < 0
                ? 'font-semibold text-red-700'
                : 'font-semibold text-slate-600'
            }
          >
            {formatMoney(net, currency)}
          </p>
        </div>
      ) : (
        <p className="mt-5 text-xs text-slate-400">{es.calendar.noActivity}</p>
      )}
    </button>
  );
}

function DayDetails({
  currency,
  day,
}: {
  currency: 'PEN' | 'USD';
  day: CalendarDay;
}) {
  if (day.transactions.length === 0) {
    return <EmptyDay />;
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label={es.calendar.income}
          value={Number(day.incomeTotal)}
          currency={currency}
        />
        <SummaryCard
          label={es.calendar.expense}
          value={Number(day.expenseTotal)}
          currency={currency}
          tone="danger"
        />
        <SummaryCard
          label={es.calendar.net}
          value={Number(day.netTotal)}
          currency={currency}
          tone={Number(day.netTotal) < 0 ? 'danger' : 'normal'}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        {day.transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
          />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  currency,
  label,
  tone = 'normal',
  value,
}: {
  currency: 'PEN' | 'USD';
  label: string;
  tone?: 'normal' | 'danger';
  value: number;
}) {
  return (
    <article className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p
        className={[
          'mt-2 text-lg font-bold',
          tone === 'danger' ? 'text-red-700' : 'text-emerald-800',
        ].join(' ')}
      >
        {formatMoney(value, currency)}
      </p>
    </article>
  );
}

function TransactionItem({
  transaction,
}: {
  transaction: CalendarTransaction;
}) {
  const amount = Number(transaction.amount);
  const isExpense = transaction.type === 'EXPENSE';

  return (
    <article className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <span
          className={[
            'grid size-10 place-items-center rounded-md',
            isExpense
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700',
          ].join(' ')}
        >
          <ReceiptText size={18} />
        </span>
        <div>
          <h3 className="font-bold text-slate-950">
            {transaction.description || es.calendar.unnamedMovement}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {transaction.category?.name ?? es.budgets.uncategorized} -{' '}
            {transaction.account.name}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {formatTime(transaction.occurredAt)}
          </p>
          <p className="mt-2">
            <BalanceImpactBadge status={transaction.balanceImpactStatus} />
          </p>
        </div>
      </div>

      <div className="text-left sm:text-right">
        <p
          className={
            isExpense
              ? 'font-bold text-red-700'
              : 'font-bold text-emerald-700'
          }
        >
          {isExpense ? '-' : '+'} {formatMoney(amount, transaction.currency)}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase text-slate-400">
          {isExpense ? es.transactions.expense : es.transactions.income}
        </p>
      </div>
    </article>
  );
}

function EmptyDay() {
  return (
    <div className="mt-8 border-y border-slate-200 py-10 text-center">
      <CalendarDays className="mx-auto text-emerald-700" size={36} />
      <h3 className="mt-3 text-lg font-bold">{es.calendar.emptyDayTitle}</h3>
      <p className="mt-2 text-slate-600">{es.calendar.emptyDayDescription}</p>
    </div>
  );
}

function getCurrentMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
}

function getCurrentDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}`;
}

function addMonths(monthStart: string, amount: number) {
  const [year, month] = monthStart.split('-').map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`;
}

function getLeadingBlankDays(monthStart: string) {
  const [year, month] = monthStart.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return (date.getDay() + 6) % 7;
}

function getMonthLabel(monthStart: string) {
  const [year, month] = monthStart.split('-').map(Number);
  return new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

function formatLongDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatMoney(value: number, currency: 'PEN' | 'USD') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
  }).format(value);
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
