import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellRing,
  CalendarClock,
  CirclePause,
  CirclePlay,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { HelpDisclosure } from '../../components/ui/HelpDisclosure';
import { getAccounts } from '../../features/accounts/services/accountsApi';
import { getCategories } from '../../features/categories/categoriesApi';
import { RecurringScheduleFormPanel } from '../../features/recurring/components/RecurringScheduleFormPanel';
import type { RecurringScheduleFormValues } from '../../features/recurring/schemas/recurringSchemas';
import {
  cancelRecurringSchedule,
  confirmRecurringDue,
  createRecurringSchedule,
  getRecurringDueOccurrences,
  getRecurringSchedules,
  pauseRecurringSchedule,
  resumeRecurringSchedule,
  skipRecurringDue,
  type RecurringSchedule,
} from '../../features/recurring/services/recurringApi';
import { es } from '../../i18n/es';
import { ApiError } from '../../lib/api';

type StatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export function RecurringPage() {
  const queryClient = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const [status, setStatus] = useState<StatusFilter>('ACTIVE');
  const [error, setError] = useState('');
  const [cancelCandidate, setCancelCandidate] =
    useState<RecurringSchedule | null>(null);

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'ALL', 'ACTIVE'],
    queryFn: () => getCategories(undefined, 'ACTIVE'),
  });

  const recurringQuery = useQuery({
    queryKey: ['recurring-schedules', status],
    queryFn: () =>
      getRecurringSchedules({
        status: status === 'ALL' ? undefined : status,
      }),
  });
    
  const dueQuery = useQuery({
    queryKey: ['recurring-due'],
    queryFn: getRecurringDueOccurrences,
  });
  
  const refreshRecurring = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] }),
      queryClient.invalidateQueries({ queryKey: ['recurring-due'] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] }),
    ]);
  };
  const createMutation = useMutation({
    mutationFn: createRecurringSchedule,
    onSuccess: async () => {
      setPanelOpen(false);
      setError('');
      await refreshRecurring();
    },
    onError: (reason) => {
      setError(
        reason instanceof ApiError
          ? reason.message
          : es.recurring.saveError,
      );
    },
  });

  const pauseMutation = useMutation({
    mutationFn: pauseRecurringSchedule,
    onSuccess: refreshRecurring,
    onError: () => setError(es.recurring.statusError),
  });

  const resumeMutation = useMutation({
    mutationFn: resumeRecurringSchedule,
    onSuccess: refreshRecurring,
    onError: () => setError(es.recurring.statusError),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRecurringSchedule,
    onSuccess: async () => {
      setCancelCandidate(null);
      await refreshRecurring();
    },
    onError: () => setError(es.recurring.statusError),
  });

    const confirmDueMutation = useMutation({
    mutationFn: confirmRecurringDue,
    onSuccess: refreshRecurring,
    onError: () => setError(es.recurring.statusError),
  });

  const skipDueMutation = useMutation({
    mutationFn: skipRecurringDue,
    onSuccess: refreshRecurring,
    onError: () => setError(es.recurring.statusError),
  });

  const schedules = recurringQuery.data ?? [];
  const activeCount = schedules.filter(
    (schedule) => schedule.status === 'ACTIVE',
  ).length;
  const pausedCount = schedules.filter(
    (schedule) => schedule.status === 'PAUSED',
  ).length;

  const isChangingStatus =
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    cancelMutation.isPending;

  const handleCreate = (values: RecurringScheduleFormValues) => {
    setError('');
    createMutation.mutate(values);
  };

  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {es.recurring.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{es.recurring.title}</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            {es.recurring.subtitle}
          </p>
          <div className="mt-3">
            <HelpDisclosure label="Cómo funcionan" title={es.recurring.title}>
              <p className="text-sm leading-6 text-slate-600">
                {es.recurring.helpNote}
              </p>
            </HelpDisclosure>
          </div>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white"
          onClick={() => setPanelOpen(true)}
          type="button"
        >
          <Plus size={19} />
          {es.recurring.newSchedule}
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <RecurringStatCard
          icon={<CalendarClock size={22} />}
          label={es.recurring.totalRules}
          value={recurringQuery.data?.length ?? 0}
        />
        <RecurringStatCard
          icon={<BellRing size={22} />}
          label={es.recurring.activeRules}
          value={activeCount}
        />
        <RecurringStatCard
          icon={<CirclePause size={22} />}
          label={es.recurring.pausedRules}
          value={pausedCount}
        />
      </div>

            {dueQuery.data && dueQuery.data.length > 0 ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold text-amber-900">
                Pendientes por confirmar
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Estas recurrencias vencen hoy o están atrasadas. Solo afectarán
                tu saldo si las confirmas.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
              {dueQuery.data.length}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {dueQuery.data.map((occurrence) => (
              <article
                className="flex flex-col justify-between gap-4 rounded-lg bg-white p-4 shadow-sm lg:flex-row lg:items-center"
                key={occurrence.id}
              >
                <div>
                  <p className="text-sm font-bold text-slate-950">
                    {occurrence.schedule.description ||
                      occurrence.schedule.category?.name ||
                      es.recurring.unnamed}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {occurrence.schedule.account.name} ·{' '}
                    {formatDate(occurrence.scheduledFor)}
                  </p>
                  <p
                    className={`mt-2 text-lg font-black ${
                      occurrence.schedule.operationType === 'EXPENSE'
                        ? 'text-red-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {occurrence.schedule.operationType === 'EXPENSE'
                      ? '− '
                      : '+ '}
                    {formatMoney(
                      Number(occurrence.schedule.amount),
                      occurrence.schedule.currency,
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                    disabled={
                      confirmDueMutation.isPending || skipDueMutation.isPending
                    }
                    onClick={() =>
                      confirmDueMutation.mutate(occurrence.scheduleId)
                    }
                    type="button"
                  >
                    Confirmar
                  </button>

                  <button
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    disabled={
                      confirmDueMutation.isPending || skipDueMutation.isPending
                    }
                    onClick={() => skipDueMutation.mutate(occurrence.scheduleId)}
                    type="button"
                  >
                    Omitir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg bg-slate-200/60 p-3 sm:flex-row sm:items-center">
        <select
          className="rounded-md bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          value={status}
        >
          <option value="ACTIVE">{es.recurring.status.active}</option>
          <option value="PAUSED">{es.recurring.status.paused}</option>
          <option value="CANCELLED">{es.recurring.status.cancelled}</option>
          <option value="ALL">{es.recurring.status.all}</option>
        </select>

        <p className="text-sm text-slate-600">
          {es.recurring.pendingNote}
        </p>
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-red-800">
          {error}
        </p>
      ) : null}

      {recurringQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
          {es.common.loading}
        </div>
      ) : null}

      {recurringQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-800">
          {es.recurring.loadError}
        </div>
      ) : null}

      {!recurringQuery.isLoading && schedules.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
          <CalendarClock className="mx-auto text-emerald-800" size={34} />
          <h2 className="text-xl font-bold text-slate-950">
            {es.recurring.emptyTitle}
          </h2>
          <p className="mt-2 text-slate-600">
            {es.recurring.emptyDescription}
          </p>
          <button
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white"
            onClick={() => setPanelOpen(true)}
            type="button"
          >
            <Plus size={18} />
            {es.recurring.newSchedule}
          </button>
        </div>
      ) : null}

      {schedules.length > 0 ? (
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <RecurringCard
              isChangingStatus={isChangingStatus}
              key={schedule.id}
              onCancel={() => setCancelCandidate(schedule)}
              onPause={() => pauseMutation.mutate(schedule.id)}
              onResume={() => resumeMutation.mutate(schedule.id)}
              schedule={schedule}
            />
          ))}
        </div>
      ) : null}

      {panelOpen ? (
        <RecurringScheduleFormPanel
          accounts={accountsQuery.data ?? []}
          categories={categoriesQuery.data ?? []}
          isSaving={createMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setError('');
          }}
          onSubmit={handleCreate}
        />
      ) : null}

      {cancelCandidate ? (
        <ConfirmDialog
          actionLabel={es.recurring.cancelAction}
          description={es.recurring.cancelConfirmation}
          isSaving={cancelMutation.isPending}
          onCancel={() => setCancelCandidate(null)}
          onConfirm={() => cancelMutation.mutate(cancelCandidate.id)}
          title={es.recurring.cancelConfirmationTitle}
        />
      ) : null}
    </section>
  );
}

function RecurringStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
      <div className="flex items-center justify-between">
        <div className="grid size-11 place-items-center rounded-lg bg-emerald-50 text-emerald-800">
          {icon}
        </div>
        <span className="text-2xl font-black text-slate-950">{value}</span>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
    </article>
  );
}

function RecurringCard({
  isChangingStatus,
  onCancel,
  onPause,
  onResume,
  schedule,
}: {
  isChangingStatus: boolean;
  onCancel: () => void;
  onPause: () => void;
  onResume: () => void;
  schedule: RecurringSchedule;
}) {
  const isExpense = schedule.operationType === 'EXPENSE';

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isExpense
                  ? 'bg-red-50 text-red-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {isExpense ? es.transactions.expense : es.transactions.income}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {es.recurring.statusLabel[schedule.status]}
            </span>
          </div>

          <h2 className="mt-3 text-xl font-bold text-slate-950">
            {schedule.description ||
              schedule.category?.name ||
              es.recurring.unnamed}
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            {schedule.account.name} · {schedule.category?.name ?? 'Sin categoría'}
          </p>

          <p className="mt-3 text-sm text-slate-600">
            {formatFrequency(schedule)} · {es.recurring.nextDue}:{' '}
            <strong>{formatDate(schedule.nextDueOn)}</strong>
          </p>

          {schedule.endsOn ? (
            <p className="mt-1 text-sm text-slate-500">
              {es.recurring.endsOn}: {formatDate(schedule.endsOn)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <p
            className={`text-2xl font-black ${
              isExpense ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {isExpense ? '− ' : '+ '}
            {formatMoney(Number(schedule.amount), schedule.currency)}
          </p>

          <div className="flex flex-wrap gap-2">
            {schedule.status === 'ACTIVE' ? (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                disabled={isChangingStatus}
                onClick={onPause}
                type="button"
              >
                <CirclePause size={17} />
                {es.recurring.pause}
              </button>
            ) : null}

            {schedule.status === 'PAUSED' ? (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                disabled={isChangingStatus}
                onClick={onResume}
                type="button"
              >
                <CirclePlay size={17} />
                {es.recurring.resume}
              </button>
            ) : null}

            {schedule.status !== 'CANCELLED' ? (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                disabled={isChangingStatus}
                onClick={onCancel}
                type="button"
              >
                <Trash2 size={17} />
                {es.recurring.cancel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function formatFrequency(schedule: RecurringSchedule) {
  const unit = es.recurring.frequency[schedule.frequency];

  if (schedule.intervalCount === 1) {
    return unit.single;
  }

  return `Cada ${schedule.intervalCount} ${unit.plural}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
  }).format(new Date(`${value}T00:00:00`));
}

function formatMoney(value: number, currency: 'PEN' | 'USD') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
  }).format(value);
}
