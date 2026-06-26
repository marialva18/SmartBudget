import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  Flag,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { getAccounts } from '../../features/accounts/services/accountsApi';
import { useFinanceScope } from '../../features/finance-scope/financeScope';
import {
  cancelGoal,
  completeGoal,
  createGoal,
  deleteGoal,
  getGoals,
  reserveGoal,
  reverseGoalReservation,
  updateGoal,
  type Goal,
} from '../../features/goals/goalsApi';
import {
  goalReservationSchema,
  goalSchema,
  type GoalFormValues,
  type GoalReservationFormValues,
} from '../../features/goals/goalSchema';
import { es } from '../../i18n/es';
import { ApiError } from '../../lib/api';

export function GoalsPage() {
  const queryClient = useQueryClient();
  const { scope } = useFinanceScope();
  const [selected, setSelected] = useState<Goal | null>(null);
  const [reservationGoal, setReservationGoal] = useState<Goal | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Goal | null>(null);
  const [goalPanelOpen, setGoalPanelOpen] = useState(false);
  const [error, setError] = useState('');
  const goalsQuery = useQuery({
    queryKey: ['goals', scope],
    queryFn: () => getGoals({ currency: scope === 'ALL' ? undefined : scope }),
  });
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['goals'] }),
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    ]);
  };

  const saveGoalMutation = useMutation({
    mutationFn: (values: GoalFormValues) =>
      selected ? updateGoal(selected.id, values) : createGoal(values),
    onSuccess: async () => {
      setGoalPanelOpen(false);
      setSelected(null);
      setError('');
      await refreshData();
    },
    onError: (reason) =>
      setError(reason instanceof ApiError ? reason.message : es.goals.saveError),
  });
  const reserveMutation = useMutation({
    mutationFn: ({
      goalId,
      values,
    }: {
      goalId: string;
      values: GoalReservationFormValues;
    }) => reserveGoal(goalId, values),
    onSuccess: async () => {
      setReservationGoal(null);
      setError('');
      await refreshData();
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? reason.message : es.goals.reserveError,
      ),
  });
  const completeMutation = useMutation({
    mutationFn: completeGoal,
    onSuccess: refreshData,
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? reason.message : es.goals.completeError,
      ),
  });
  const cancelMutation = useMutation({
    mutationFn: cancelGoal,
    onSuccess: refreshData,
    onError: (reason) =>
      setError(reason instanceof ApiError ? reason.message : es.goals.cancelError),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: async () => {
      setDeleteCandidate(null);
      await refreshData();
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? reason.message : es.goals.deleteError,
      ),
  });
  const reverseMutation = useMutation({
    mutationFn: ({
      goalId,
      reservationId,
    }: {
      goalId: string;
      reservationId: string;
    }) => reverseGoalReservation(goalId, reservationId),
    onSuccess: refreshData,
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? reason.message : es.goals.reverseError,
      ),
  });

  const goals = goalsQuery.data ?? [];

  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {es.goals.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{es.goals.title}</h1>
          <p className="mt-2 text-slate-600">{es.goals.subtitle}</p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white"
          onClick={() => {
            setSelected(null);
            setGoalPanelOpen(true);
          }}
          type="button"
        >
          <Plus size={19} />
          {es.goals.newGoal}
        </button>
      </header>

      {goalsQuery.isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              className="h-48 animate-pulse rounded-lg bg-slate-200"
              key={item}
            />
          ))}
        </div>
      ) : null}

      {goals.length === 0 && !goalsQuery.isLoading ? (
        <div className="border-y border-slate-200 py-12 text-center">
          <Flag className="mx-auto text-emerald-800" size={34} />
          <h2 className="mt-3 text-xl font-bold">{es.goals.emptyTitle}</h2>
          <p className="mt-2 text-slate-600">{es.goals.emptyDescription}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard
            goal={goal}
            key={goal.id}
            onCancel={() => cancelMutation.mutate(goal.id)}
            onComplete={() => completeMutation.mutate(goal.id)}
            onDelete={() => setDeleteCandidate(goal)}
            onEdit={() => {
              setSelected(goal);
              setGoalPanelOpen(true);
            }}
            onReserve={() => setReservationGoal(goal)}
            onReverse={(reservationId) =>
              reverseMutation.mutate({ goalId: goal.id, reservationId })
            }
          />
        ))}
      </div>

      {error ? (
        <p className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-red-800 px-4 py-3 text-white">
          {error}
        </p>
      ) : null}

      {goalPanelOpen ? (
        <GoalFormPanel
          goal={selected}
          isSaving={saveGoalMutation.isPending}
          onClose={() => {
            setGoalPanelOpen(false);
            setSelected(null);
            setError('');
          }}
          onSubmit={(values) => saveGoalMutation.mutate(values)}
        />
      ) : null}

      {reservationGoal ? (
        <ReservationPanel
          accounts={(accountsQuery.data ?? []).filter(
            (account) =>
              account.status === 'ACTIVE' &&
              account.currency === reservationGoal.currency,
          )}
          goal={reservationGoal}
          isSaving={reserveMutation.isPending}
          onClose={() => setReservationGoal(null)}
          onSubmit={(values) =>
            reserveMutation.mutate({ goalId: reservationGoal.id, values })
          }
        />
      ) : null}

      {deleteCandidate ? (
        <ConfirmDialog
          actionLabel={es.goals.deleteConfirmationAction}
          description={es.goals.deleteConfirmation(deleteCandidate.name)}
          isSaving={deleteMutation.isPending}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => deleteMutation.mutate(deleteCandidate.id)}
          title={es.goals.deleteConfirmationTitle}
        />
      ) : null}
    </section>
  );
}

function GoalCard({
  goal,
  onCancel,
  onComplete,
  onDelete,
  onEdit,
  onReserve,
  onReverse,
}: {
  goal: Goal;
  onCancel: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onReserve: () => void;
  onReverse: (reservationId: string) => void;
}) {
  const progress = Math.min(Number(goal.progressPercent), 100);
  const isActive = goal.status === 'ACTIVE';
  return (
    <article className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">
            {es.goals.statuses[goal.status]}
          </p>
          <h2 className="mt-1 text-xl font-bold">{goal.name}</h2>
          {goal.targetDate ? (
            <p className="mt-1 text-sm text-slate-500">
              {es.goals.targetDate}:{' '}
              {new Intl.DateTimeFormat('es-PE', {
                dateStyle: 'medium',
              }).format(new Date(goal.targetDate))}
            </p>
          ) : null}
        </div>
        <button
          aria-label={es.goals.edit(goal.name)}
          className="grid size-9 place-items-center rounded-md hover:bg-slate-100"
          disabled={!isActive}
          onClick={onEdit}
          title={es.goals.edit(goal.name)}
          type="button"
        >
          <Pencil size={17} />
        </button>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-700" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <AmountValue currency={goal.currency} label={es.goals.target} value={Number(goal.targetAmount)} />
        <AmountValue currency={goal.currency} label={es.goals.reserved} value={Number(goal.reservedAmount)} />
        <AmountValue currency={goal.currency} label={es.goals.remaining} value={Number(goal.remainingAmount)} />
      </div>

      {isActive ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white" onClick={onReserve} type="button">
            {es.goals.reserve}
          </button>
          <button className="rounded-full border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900" onClick={onComplete} type="button">
            <CheckCircle className="mr-1 inline" size={16} />
            {es.goals.complete}
          </button>
          <button className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700" onClick={onCancel} type="button">
            {es.goals.cancel}
          </button>
        </div>
      ) : null}

      {goal.status === 'CANCELLED' ? (
        <div className="mt-5">
          <button
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
            onClick={onDelete}
            type="button"
          >
            {es.goals.delete}
          </button>
        </div>
      ) : null}

      {goal.reservations.length > 0 ? (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="font-bold">{es.goals.reservations}</h3>
          <div className="mt-3 space-y-2">
            {goal.reservations.slice(0, 4).map((reservation) => (
              <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm" key={reservation.id}>
                <span>
                  {reservation.account.name} -{' '}
                  {formatMoney(Number(reservation.amount), goal.currency)}
                </span>
                {reservation.status === 'ACTIVE' ? (
                  <button className="inline-flex items-center gap-1 font-semibold text-red-700" onClick={() => onReverse(reservation.id)} type="button">
                    <RotateCcw size={15} />
                    {es.goals.reverse}
                  </button>
                ) : (
                  <span className="text-slate-500">
                    {es.goals.reservationStatuses[reservation.status]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function GoalFormPanel({
  goal,
  isSaving,
  onClose,
  onSubmit,
}: {
  goal: Goal | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: GoalFormValues) => void;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: getGoalDefaults(goal),
  });

  useEffect(() => {
    reset(getGoalDefaults(goal));
  }, [goal, reset]);

  return (
    <Panel title={goal ? es.goals.form.editTitle : es.goals.form.createTitle} onClose={onClose}>
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <Field label={es.goals.form.name} error={errors.name?.message}>
            <input className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" {...register('name')} />
          </Field>
          <Field label={es.goals.form.targetAmount} error={errors.targetAmount?.message}>
            <input className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" min="0.01" step="0.01" type="number" {...register('targetAmount', { valueAsNumber: true })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={es.goals.form.currency}>
              <select className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" disabled={goal !== null} {...register('currency')}>
                <option value="PEN">PEN</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <Field label={es.goals.form.targetDate} error={errors.targetDate?.message}>
              <input
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                min={getTodayInputValue()}
                type="date"
                {...register('targetDate')}
              />
            </Field>
          </div>
        </div>
        <PanelFooter isSaving={isSaving} onClose={onClose} submitLabel={goal ? es.goals.form.submitEdit : es.goals.form.submitCreate} />
      </form>
    </Panel>
  );
}

function ReservationPanel({
  accounts,
  goal,
  isSaving,
  onClose,
  onSubmit,
}: {
  accounts: Array<{ id: string; name: string; availableBalance: string; currency: 'PEN' | 'USD' }>;
  goal: Goal;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: GoalReservationFormValues) => void;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<GoalReservationFormValues>({
    resolver: zodResolver(goalReservationSchema),
    defaultValues: { accountId: '', amount: 0, note: '' },
  });

  return (
    <Panel title={es.goals.form.reserveTitle(goal.name)} onClose={onClose}>
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <Field label={es.goals.form.account} error={errors.accountId?.message}>
            <select className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" {...register('accountId')}>
              <option value="">{es.goals.form.selectAccount}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {formatMoney(Number(account.availableBalance), account.currency)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={es.goals.form.reserveAmount} error={errors.amount?.message}>
            <input className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" min="0.01" step="0.01" type="number" {...register('amount', { valueAsNumber: true })} />
          </Field>
          <Field label={es.goals.form.note}>
            <textarea className="min-h-24 w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" {...register('note')} />
          </Field>
        </div>
        <PanelFooter isSaving={isSaving} onClose={onClose} submitLabel={es.goals.form.submitReserve} />
      </form>
    </Panel>
  );
}

function Panel({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[2px]">
      <button aria-label={es.goals.form.close} className="absolute inset-0" onClick={onClose} type="button" />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">{es.goals.section}</p>
            <h2 className="mt-1 text-2xl font-bold">{title}</h2>
          </div>
          <button aria-label={es.goals.form.close} className="grid size-10 place-items-center rounded-md hover:bg-slate-100" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </header>
        {children}
      </aside>
    </div>
  );
}

function PanelFooter({
  isSaving,
  onClose,
  submitLabel,
}: {
  isSaving: boolean;
  onClose: () => void;
  submitLabel: string;
}) {
  return (
    <footer className="grid gap-3 border-t border-slate-200 px-6 py-5">
      <button className="rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white disabled:opacity-60" disabled={isSaving} type="submit">
        {isSaving ? es.common.saving : submitLabel}
      </button>
      <button className="rounded-full border border-emerald-800 px-5 py-3 font-semibold text-emerald-900" onClick={onClose} type="button">
        {es.common.cancel}
      </button>
    </footer>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
        {label}
      </span>
      {children}
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function AmountValue({
  currency,
  label,
  value,
}: {
  currency: 'PEN' | 'USD';
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold sm:text-base">
        {formatMoney(value, currency)}
      </p>
    </div>
  );
}

function getGoalDefaults(goal: Goal | null): GoalFormValues {
  return {
    name: goal?.name ?? '',
    targetAmount: goal ? Number(goal.targetAmount) : 0,
    currency: goal?.currency ?? 'PEN',
    targetDate: goal?.targetDate?.slice(0, 10) ?? '',
  };
}

function getTodayInputValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(today.getDate()).padStart(2, '0')}`;
}

function formatMoney(value: number, currency: 'PEN' | 'USD') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
  }).format(value);
}
