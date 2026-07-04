import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { es } from '../../i18n/es';
import { preventNumberWheelChange } from '../../lib/number-input';
import type { Category } from '../categories/categoriesApi';
import type { Budget } from './budgetsApi';
import { budgetSchema, type BudgetFormValues } from './budgetSchema';

type BudgetFormPanelProps = {
  budget: Budget | null;
  categories: Category[];
  currency: 'PEN' | 'USD';
  monthStart: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: BudgetFormValues) => void;
};

export function BudgetFormPanel({
  budget,
  categories,
  currency,
  isSaving,
  monthStart,
  onClose,
  onSubmit,
}: BudgetFormPanelProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: getDefaults(budget, currency, monthStart),
  });

  useEffect(() => {
    reset(getDefaults(budget, currency, monthStart));
  }, [budget, currency, monthStart, reset]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[2px]">
      <button
        aria-label={es.budgets.form.close}
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">
              {es.budgets.section}
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              {budget ? es.budgets.form.editTitle : es.budgets.form.createTitle}
            </h2>
          </div>
          <button
            aria-label={es.budgets.form.close}
            className="grid size-10 place-items-center rounded-md hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                {es.budgets.form.scope}
              </span>
              <select
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700 disabled:text-slate-500"
                disabled={budget !== null}
                {...register('categoryId')}
              >
                <option value="">{es.budgets.form.generalBudget}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {budget ? (
                <p className="mt-2 text-sm text-slate-500">
                  {es.budgets.form.scopeImmutable}
                </p>
              ) : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                  {es.budgets.form.currency}
                </span>
                <select
                  className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700 disabled:text-slate-500"
                  disabled={budget !== null}
                  {...register('currency')}
                >
                  <option value="PEN">PEN</option>
                  <option value="USD">USD</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                  {es.budgets.form.month}
                </span>
                <input
                  className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700 disabled:text-slate-500"
                  disabled={budget !== null}
                  type="month"
                  value={monthStart.slice(0, 7)}
                  readOnly
                />
                <input type="hidden" {...register('monthStart')} />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                {es.budgets.form.amount}
              </span>
              <input
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                min="0.01"
                onWheel={preventNumberWheelChange}
                step="0.01"
                type="number"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.amount.message}
                </span>
              ) : null}
            </label>
          </div>

          <footer className="grid gap-3 border-t border-slate-200 px-6 py-5">
            <button
              className="rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving
                ? es.common.saving
                : budget
                  ? es.budgets.form.submitEdit
                  : es.budgets.form.submitCreate}
            </button>
            <button
              className="rounded-full border border-emerald-800 px-5 py-3 font-semibold text-emerald-900"
              onClick={onClose}
              type="button"
            >
              {es.common.cancel}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function getDefaults(
  budget: Budget | null,
  currency: 'PEN' | 'USD',
  monthStart: string,
): BudgetFormValues {
  if (budget) {
    return {
      categoryId: budget.categoryId ?? '',
      amount: Number(budget.amount),
      currency: budget.currency,
      monthStart: budget.monthStart,
    };
  }
  return {
    categoryId: '',
    amount: 0,
    currency,
    monthStart,
  };
}
