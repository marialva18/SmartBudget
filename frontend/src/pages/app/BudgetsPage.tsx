import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Pencil, Plus, RefreshCw, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { getCategories } from '../../features/categories/categoriesApi';
import { BudgetFormPanel } from '../../features/budgets/BudgetFormPanel';
import type { BudgetFormValues } from '../../features/budgets/budgetSchema';
import {
  createBudget,
  getBudgets,
  updateBudget,
  type Budget,
} from '../../features/budgets/budgetsApi';
import { useFinanceScope } from '../../features/finance-scope/financeScope';
import { es } from '../../i18n/es';
import { ApiError } from '../../lib/api';

export function BudgetsPage() {
  const queryClient = useQueryClient();
  const { scope } = useFinanceScope();
  const [month, setMonth] = useState(currentMonthValue());
  const [selectedCurrency, setSelectedCurrency] = useState<'PEN' | 'USD'>(
    scope === 'USD' ? 'USD' : 'PEN',
  );
  const [selected, setSelected] = useState<Budget | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [error, setError] = useState('');
  const monthStart = `${month}-01`;
  const currency = scope === 'ALL' ? selectedCurrency : scope;
  const budgetsQuery = useQuery({
    queryKey: ['budgets', currency, monthStart],
    queryFn: () => getBudgets({ currency, monthStart }),
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories', 'EXPENSE', 'ACTIVE'],
    queryFn: () => getCategories('EXPENSE', 'ACTIVE'),
  });

  const refreshBudgets = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['budgets'] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    ]);
  };
  const saveMutation = useMutation({
    mutationFn: (values: BudgetFormValues) =>
      selected
        ? updateBudget(selected.id, { amount: values.amount })
        : createBudget(values),
    onSuccess: async () => {
      setPanelOpen(false);
      setSelected(null);
      setError('');
      await refreshBudgets();
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? reason.message : es.budgets.saveError,
      ),
  });

  const items = budgetsQuery.data?.items ?? [];
  const generalBudget = items.find((budget) => budget.categoryId === null);
  const categoryBudgets = items.filter((budget) => budget.categoryId !== null);
  const totals = getTotals(generalBudget, categoryBudgets);

  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {es.budgets.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{es.budgets.title}</h1>
          <p className="mt-2 text-slate-600">{es.budgets.subtitle}</p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white"
          onClick={() => {
            setSelected(null);
            setPanelOpen(true);
          }}
          type="button"
        >
          <Plus size={19} />
          {es.budgets.newBudget}
        </button>
      </header>

      <div className="flex flex-col gap-3 rounded-lg bg-slate-200/60 p-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-3 rounded-md bg-white px-4 py-3">
          <Calendar className="text-slate-500" size={19} />
          <span className="sr-only">{es.budgets.monthFilter}</span>
          <input
            className="w-full outline-none"
            onChange={(event) => setMonth(event.target.value)}
            type="month"
            value={month}
          />
        </label>
        {scope === 'ALL' ? (
          <select
            className="rounded-md bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
            onChange={(event) =>
              setSelectedCurrency(event.target.value as 'PEN' | 'USD')
            }
            value={selectedCurrency}
          >
            <option value="PEN">PEN</option>
            <option value="USD">USD</option>
          </select>
        ) : null}
      </div>

      <article className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
        <p className="text-xs font-semibold uppercase text-slate-500">
          {es.accounts.currencies[currency].plural}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {es.budgets.calculationNote}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <SummaryValue
            currency={currency}
            label={es.budgets.planned}
            value={totals.planned}
          />
          <SummaryValue
            currency={currency}
            label={es.budgets.spent}
            value={totals.spent}
          />
          <SummaryValue
            currency={currency}
            isWarning={totals.remaining < 0}
            label={es.budgets.remaining}
            value={totals.remaining}
          />
        </div>
      </article>

      {budgetsQuery.isError ? (
        <div className="flex items-center justify-between border-y border-red-200 bg-red-50 p-4 text-red-800">
          <span>{es.budgets.loadError}</span>
          <button
            className="inline-flex items-center gap-2 font-semibold"
            onClick={() => budgetsQuery.refetch()}
            type="button"
          >
            <RefreshCw size={17} />
            {es.common.retry}
          </button>
        </div>
      ) : null}

      {budgetsQuery.isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              className="h-32 animate-pulse rounded-lg bg-slate-200"
              key={item}
            />
          ))}
        </div>
      ) : null}

      {!budgetsQuery.isLoading && items.length === 0 ? (
        <div className="border-y border-slate-200 py-12 text-center">
          <WalletCards className="mx-auto text-emerald-800" size={34} />
          <h2 className="mt-3 text-xl font-bold">{es.budgets.emptyTitle}</h2>
          <p className="mt-2 text-slate-600">{es.budgets.emptyDescription}</p>
        </div>
      ) : null}

      {generalBudget ? (
        <BudgetCard
          budget={generalBudget}
          onEdit={() => {
            setSelected(generalBudget);
            setPanelOpen(true);
          }}
          title={es.budgets.generalTitle}
        />
      ) : null}

      {categoryBudgets.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-bold">{es.budgets.categoryTitle}</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {categoryBudgets.map((budget) => (
              <BudgetCard
                budget={budget}
                key={budget.id}
                onEdit={() => {
                  setSelected(budget);
                  setPanelOpen(true);
                }}
                title={budget.category?.name ?? es.budgets.uncategorized}
              />
            ))}
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-red-800 px-4 py-3 text-white">
          {error}
        </p>
      ) : null}

      {panelOpen ? (
        <BudgetFormPanel
          budget={selected}
          categories={categoriesQuery.data ?? []}
          currency={currency}
          isSaving={saveMutation.isPending}
          monthStart={monthStart}
          onClose={() => {
            setPanelOpen(false);
            setSelected(null);
            setError('');
          }}
          onSubmit={(values) => saveMutation.mutate(values)}
        />
      ) : null}
    </section>
  );
}

function BudgetCard({
  budget,
  onEdit,
  title,
}: {
  budget: Budget;
  onEdit: () => void;
  title: string;
}) {
  const usage = Math.min(Number(budget.usagePercent), 100);
  return (
    <article className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {budget.categoryId ? es.budgets.categoryBudget : es.budgets.generalBudget}
          </p>
        </div>
        <button
          aria-label={es.budgets.edit(title)}
          className="grid size-9 place-items-center rounded-md hover:bg-slate-100"
          onClick={onEdit}
          title={es.budgets.edit(title)}
          type="button"
        >
          <Pencil size={17} />
        </button>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${
            budget.exceeded ? 'bg-red-600' : 'bg-emerald-700'
          }`}
          style={{ width: `${usage}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <SummaryValue
          currency={budget.currency}
          label={es.budgets.planned}
          value={Number(budget.amount)}
        />
        <SummaryValue
          currency={budget.currency}
          label={es.budgets.spent}
          value={Number(budget.spentAmount)}
        />
        <SummaryValue
          currency={budget.currency}
          isWarning={budget.exceeded}
          label={es.budgets.remaining}
          value={Number(budget.remainingAmount)}
        />
      </div>
    </article>
  );
}

function SummaryValue({
  currency,
  isWarning = false,
  label,
  value,
}: {
  currency: 'PEN' | 'USD';
  isWarning?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 break-words text-sm font-bold sm:text-base ${
          isWarning ? 'text-red-700' : 'text-slate-950'
        }`}
      >
        {formatMoney(value, currency)}
      </p>
    </div>
  );
}

function getTotals(generalBudget: Budget | undefined, categoryBudgets: Budget[]) {
  if (generalBudget) {
    return {
      planned: Number(generalBudget.amount),
      spent: Number(generalBudget.spentAmount),
      remaining: Number(generalBudget.remainingAmount),
    };
  }
  return categoryBudgets.reduce(
    (totals, item) => ({
      planned: totals.planned + Number(item.amount),
      spent: totals.spent + Number(item.spentAmount),
      remaining: totals.remaining + Number(item.remainingAmount),
    }),
    { planned: 0, spent: 0, remaining: 0 },
  );
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMoney(value: number, currency: 'PEN' | 'USD') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
  }).format(value);
}
