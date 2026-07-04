import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Check,
  HandCoins,
  MailPlus,
  Plus,
  ReceiptText,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  getAccounts,
  type Account,
} from '../../features/accounts/services/accountsApi';
import {
  acceptGroupInvitation,
  archiveGroup,
  createGroupExpense,
  createGroupSettlement,
  createGroup,
  declineGroupInvitation,
  getGroups,
  inviteGroupMember,
  type FinancialGroup,
} from '../../features/groups/groupsApi';
import {
  groupExpenseSchema,
  groupInvitationSchema,
  groupSettlementSchema,
  groupSchema,
  type GroupExpenseFormValues,
  type GroupFormValues,
  type GroupInvitationFormValues,
  type GroupSettlementFormValues,
} from '../../features/groups/groupSchema';
import { es } from '../../i18n/es';
import { ApiError } from '../../lib/api';
import { preventNumberWheelChange } from '../../lib/number-input';

export function GroupsPage() {
  const queryClient = useQueryClient();
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);
  const [inviteGroup, setInviteGroup] = useState<FinancialGroup | null>(null);
  const [expenseGroup, setExpenseGroup] = useState<FinancialGroup | null>(null);
  const [settlementGroup, setSettlementGroup] =
    useState<FinancialGroup | null>(null);
  const [archiveCandidate, setArchiveCandidate] =
    useState<FinancialGroup | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
    refetchInterval: 30_000,
  });
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const refreshGroups = async () => {
    await queryClient.invalidateQueries({ queryKey: ['groups'] });
  };

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: async () => {
      setGroupPanelOpen(false);
      setError('');
      setMessage(es.groups.groupCreated);
      await refreshGroups();
    },
    onError: (reason) =>
      setError(reason instanceof ApiError ? reason.message : es.groups.saveError),
  });
  const inviteMutation = useMutation({
    mutationFn: ({
      groupId,
      values,
    }: {
      groupId: string;
      values: GroupInvitationFormValues;
    }) => inviteGroupMember(groupId, values),
    onSuccess: async (group) => {
      setInviteGroup(null);
      setError('');
      setMessage(
        group.notificationEmailSent
          ? es.groups.inviteSentWithEmail
          : es.groups.inviteSentInApp,
      );
      await refreshGroups();
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? reason.message : es.groups.inviteError,
      ),
  });
  const expenseMutation = useMutation({
    mutationFn: ({
      groupId,
      values,
    }: {
      groupId: string;
      values: GroupExpenseFormValues;
    }) => createGroupExpense(groupId, values),
    onSuccess: async () => {
      setExpenseGroup(null);
      setError('');
      setMessage(es.groups.expenseCreated);
      await refreshGroups();
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? reason.message : es.groups.saveError,
      ),
  });
  const settlementMutation = useMutation({
    mutationFn: ({
      groupId,
      values,
    }: {
      groupId: string;
      values: GroupSettlementFormValues;
    }) => createGroupSettlement(groupId, values),
    onSuccess: async () => {
      setSettlementGroup(null);
      setError('');
      setMessage(es.groups.settlementCreated);
      await refreshGroups();
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? reason.message : es.groups.settlementError,
      ),
  });
  const acceptMutation = useMutation({
    mutationFn: acceptGroupInvitation,
    onSuccess: async () => {
      setError('');
      setMessage(es.groups.invitationAccepted);
      await refreshGroups();
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? reason.message : es.groups.acceptError,
      ),
  });
  const declineMutation = useMutation({
    mutationFn: declineGroupInvitation,
    onSuccess: async () => {
      setError('');
      setMessage(es.groups.invitationDeclined);
      await refreshGroups();
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? reason.message : es.groups.declineError,
      ),
  });
  const archiveMutation = useMutation({
    mutationFn: archiveGroup,
    onSuccess: async () => {
      setArchiveCandidate(null);
      setError('');
      setMessage(es.groups.groupArchived);
      await refreshGroups();
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? reason.message : es.groups.archiveError,
      ),
  });

  const groups = groupsQuery.data ?? [];

  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {es.groups.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{es.groups.title}</h1>
          <p className="mt-2 text-slate-600">{es.groups.subtitle}</p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white"
          onClick={() => setGroupPanelOpen(true)}
          type="button"
        >
          <Plus size={19} />
          {es.groups.newGroup}
        </button>
      </header>

      {groupsQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              className="h-48 animate-pulse rounded-lg bg-slate-200"
              key={item}
            />
          ))}
        </div>
      ) : null}

      {groupsQuery.isError ? (
        <div className="border-y border-red-100 py-8 text-center font-semibold text-red-700">
          {es.groups.loadError}
        </div>
      ) : null}

      {groups.length === 0 && !groupsQuery.isLoading ? (
        <div className="border-y border-slate-200 py-12 text-center">
          <Users className="mx-auto text-emerald-800" size={36} />
          <h2 className="mt-3 text-xl font-bold">{es.groups.emptyTitle}</h2>
          <p className="mt-2 text-slate-600">{es.groups.emptyDescription}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <GroupCard
            group={group}
            key={group.id}
            onAccept={() => acceptMutation.mutate(group.id)}
            onArchive={() => setArchiveCandidate(group)}
            onDecline={() => declineMutation.mutate(group.id)}
            onExpense={() => setExpenseGroup(group)}
            onInvite={() => setInviteGroup(group)}
            onSettlement={() => setSettlementGroup(group)}
          />
        ))}
      </div>

      {error ? (
        <p className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-red-800 px-4 py-3 text-white">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-emerald-800 px-4 py-3 text-white">
          {message}
        </p>
      ) : null}

      {groupPanelOpen ? (
        <GroupFormPanel
          isSaving={createMutation.isPending}
          onClose={() => {
            setGroupPanelOpen(false);
            setError('');
            setMessage('');
          }}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      ) : null}

      {inviteGroup ? (
        <InvitePanel
          group={inviteGroup}
          isSaving={inviteMutation.isPending}
          onClose={() => setInviteGroup(null)}
          onSubmit={(values) =>
            inviteMutation.mutate({ groupId: inviteGroup.id, values })
          }
        />
      ) : null}

      {expenseGroup ? (
        <ExpensePanel
          accounts={accountsQuery.data ?? []}
          group={expenseGroup}
          isSaving={expenseMutation.isPending}
          onClose={() => setExpenseGroup(null)}
          onSubmit={(values) =>
            expenseMutation.mutate({ groupId: expenseGroup.id, values })
          }
        />
      ) : null}

      {settlementGroup ? (
        <SettlementPanel
          accounts={accountsQuery.data ?? []}
          group={settlementGroup}
          isSaving={settlementMutation.isPending}
          onClose={() => setSettlementGroup(null)}
          onSubmit={(values) =>
            settlementMutation.mutate({ groupId: settlementGroup.id, values })
          }
        />
      ) : null}

      {archiveCandidate ? (
        <ConfirmDialog
          actionLabel={es.groups.confirmArchiveAction}
          description={es.groups.confirmArchiveDescription(
            archiveCandidate.name,
          )}
          isSaving={archiveMutation.isPending}
          onCancel={() => setArchiveCandidate(null)}
          onConfirm={() => archiveMutation.mutate(archiveCandidate.id)}
          title={es.groups.confirmArchiveTitle}
        />
      ) : null}
    </section>
  );
}

function GroupCard({
  group,
  onAccept,
  onArchive,
  onDecline,
  onExpense,
  onInvite,
  onSettlement,
}: {
  group: FinancialGroup;
  onAccept: () => void;
  onArchive: () => void;
  onDecline: () => void;
  onExpense: () => void;
  onInvite: () => void;
  onSettlement: () => void;
}) {
  const isInvitation = group.currentMemberStatus === 'INVITED';
  return (
    <article className="rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-emerald-700">
            {isInvitation ? es.groups.invitationBadge : es.groups.activeBadge}
          </p>
          <h2 className="mt-1 break-words text-xl font-bold">{group.name}</h2>
          {group.description ? (
            <p className="mt-2 text-sm text-slate-600">{group.description}</p>
          ) : null}
        </div>
        <span className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {group.currentMemberRole
            ? es.groups.roles[group.currentMemberRole]
            : '-'}
        </span>
      </div>

      {isInvitation ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"
            onClick={onAccept}
            type="button"
          >
            <Check size={16} />
            {es.groups.accept}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
            onClick={onDecline}
            type="button"
          >
            <X size={16} />
            {es.groups.decline}
          </button>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"
            onClick={onExpense}
            type="button"
          >
            <ReceiptText size={16} />
            {es.groups.newExpense}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900"
            onClick={onSettlement}
            type="button"
          >
            <HandCoins size={16} />
            {es.groups.newSettlement}
          </button>
          {group.canInvite ? (
            <button
              className="inline-flex items-center gap-2 rounded-full border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900"
              onClick={onInvite}
              type="button"
            >
              <MailPlus size={16} />
              {es.groups.invite}
            </button>
          ) : null}
          {group.canArchive ? (
            <button
              className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
              onClick={onArchive}
              type="button"
            >
              <Archive size={16} />
              {es.groups.archive}
            </button>
          ) : null}
        </div>
      )}

      <div className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="font-bold">{es.groups.balances}</h3>
        <div className="mt-3 grid gap-2">
          {group.balances.map((balance) => {
            const netAmount = Number(balance.netAmount);
            return (
              <div
                className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
               key={`${balance.member.id}-${balance.currency}`}
              >
                <span className="truncate font-semibold">
                  {balance.member.displayName}
                </span>
                <span
                  className={`shrink-0 font-bold ${
                    netAmount > 0
                      ? 'text-emerald-800'
                      : netAmount < 0
                        ? 'text-red-700'
                        : 'text-slate-500'
                  }`}
                >
                  {netAmount > 0
                    ? es.groups.netPositive
                    : netAmount < 0
                      ? es.groups.netNegative
                      : es.groups.netZero}
                  : {formatMoney(Math.abs(netAmount), balance.currency)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="font-bold">{es.groups.recentExpenses}</h3>
        {group.recentExpenses.length > 0 ? (
          <div className="mt-3 space-y-2">
            {group.recentExpenses.map((expense) => (
              <div
                className="rounded-md bg-slate-50 px-3 py-2 text-sm"
                key={expense.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{expense.description}</span>
                  <span className="font-bold">
                    {formatMoney(Number(expense.amount), expense.currency)}
                  </span>
                </div>
                <p className="mt-1 text-slate-500">
                  {es.groups.paidBy}: {expense.paidByMember.displayName}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{es.groups.noExpenses}</p>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="font-bold">{es.groups.recentSettlements}</h3>
        {group.recentSettlements.length > 0 ? (
          <div className="mt-3 space-y-2">
            {group.recentSettlements.map((settlement) => (
              <div
                className="rounded-md bg-slate-50 px-3 py-2 text-sm"
                key={settlement.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">
                    {settlement.fromMember.displayName}
                    {' -> '}
                    {settlement.toMember.displayName}
                  </span>
                  <span className="font-bold">
                    {formatMoney(Number(settlement.amount), settlement.currency)}
                  </span>
                </div>
                {settlement.note ? (
                  <p className="mt-1 text-slate-500">{settlement.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            {es.groups.noSettlements}
          </p>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="font-bold">{es.groups.members}</h3>
        <div className="mt-3 space-y-2">
          {group.members.map((member) => (
            <div
              className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
              key={member.id}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{member.displayName}</p>
                <p className="truncate text-slate-500">{member.email}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-500">
                {es.groups.statuses[member.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function GroupFormPanel({
  isSaving,
  onClose,
  onSubmit,
}: {
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: GroupFormValues) => void;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    reset({ name: '', description: '' });
  }, [reset]);

  return (
    <Panel title={es.groups.form.createTitle} onClose={onClose}>
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <Field label={es.groups.form.name} error={errors.name?.message}>
            <input className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" {...register('name')} />
          </Field>
          <Field
            label={es.groups.form.description}
            error={errors.description?.message}
          >
            <textarea className="min-h-28 w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" {...register('description')} />
          </Field>
        </div>
        <PanelFooter
          isSaving={isSaving}
          onClose={onClose}
          submitLabel={es.groups.form.submitCreate}
        />
      </form>
    </Panel>
  );
}

function InvitePanel({
  group,
  isSaving,
  onClose,
  onSubmit,
}: {
  group: FinancialGroup;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: GroupInvitationFormValues) => void;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<GroupInvitationFormValues>({
    resolver: zodResolver(groupInvitationSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    reset({ email: '' });
  }, [group.id, reset]);

  return (
    <Panel title={es.groups.form.inviteTitle(group.name)} onClose={onClose}>
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <Field label={es.groups.form.email} error={errors.email?.message}>
            <input className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" type="email" {...register('email')} />
          </Field>
        </div>
        <PanelFooter
          isSaving={isSaving}
          onClose={onClose}
          submitLabel={es.groups.form.submitInvite}
        />
      </form>
    </Panel>
  );
}

function ExpensePanel({
  accounts,
  group,
  isSaving,
  onClose,
  onSubmit,
}: {
  accounts: Account[];
  group: FinancialGroup;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: GroupExpenseFormValues) => void;
}) {
  const activeMembers = useMemo(
    () => group.members.filter((member) => member.status === 'ACTIVE'),
    [group.members],
  );
  const defaultValues = useMemo(
    () => getExpenseDefaults(activeMembers),
    [activeMembers],
  );
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<GroupExpenseFormValues>({
    resolver: zodResolver(groupExpenseSchema),
    defaultValues,
  });
  const splitMode = useWatch({ control, name: 'splitMode' });
  const currency = useWatch({ control, name: 'currency' });
  const paymentAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.status === 'ACTIVE' && account.currency === currency,
      ),
    [accounts, currency],
  );

  useEffect(() => {
    reset({
      ...defaultValues,
      accountId:
        accounts.find(
          (account) =>
            account.status === 'ACTIVE' && account.currency === defaultValues.currency,
      )?.id ?? '',
    });
  }, [accounts, defaultValues, group.id, reset]);

  useEffect(() => {
    setValue('accountId', paymentAccounts[0]?.id ?? '');
  }, [paymentAccounts, setValue]);

  return (
    <Panel title={es.groups.form.expenseTitle(group.name)} onClose={onClose}>
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <Field
            label={es.groups.form.expenseDescription}
            error={errors.description?.message}
          >
            <input className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" {...register('description')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={es.groups.form.amount} error={errors.amount?.message}>
              <input className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" min="0.01" onWheel={preventNumberWheelChange} step="0.01" type="number" {...register('amount', { valueAsNumber: true })} />
            </Field>
            <Field label={es.groups.form.currency}>
              <select className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" {...register('currency')}>
                <option value="PEN">PEN</option>
                <option value="USD">USD</option>
              </select>
            </Field>
          </div>
          <Field label={es.groups.form.paidBy} error={errors.paidByMemberId?.message}>
            <select className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" {...register('paidByMemberId')}>
              {activeMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName}
                </option>
              ))}
            </select>
          </Field>
          <Field label={es.groups.form.paymentAccount} error={errors.accountId?.message}>
            <select className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" {...register('accountId')}>
              <option value="">{es.groups.form.selectPaymentAccount}</option>
              {paymentAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={es.groups.form.splitMode}>
            <select className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" {...register('splitMode')}>
              <option value="EQUAL">{es.groups.splitModes.EQUAL}</option>
              <option value="CUSTOM_AMOUNTS">
                {es.groups.splitModes.CUSTOM_AMOUNTS}
              </option>
              <option value="PERCENTAGES">
                {es.groups.splitModes.PERCENTAGES}
              </option>
            </select>
          </Field>
          {splitMode === 'EQUAL' ? (
            <Field label={es.groups.form.participants} error={errors.participantMemberIds?.message}>
              <div className="space-y-2">
                {activeMembers.map((member) => (
                  <label
                    className="flex items-center gap-3 rounded-md bg-slate-100 px-4 py-3"
                    key={member.id}
                  >
                    <input
                      className="size-4 accent-emerald-800"
                      type="checkbox"
                      value={member.id}
                      {...register('participantMemberIds')}
                    />
                    <span className="font-semibold">{member.displayName}</span>
                  </label>
                ))}
              </div>
            </Field>
          ) : (
            <Field
              label={
                splitMode === 'CUSTOM_AMOUNTS'
                  ? es.groups.form.customAmounts
                  : es.groups.form.percentages
              }
              error={errors.splits?.message}
            >
              <div className="space-y-2">
                {activeMembers.map((member, index) => (
                  <div
                    className="grid grid-cols-[1fr_120px] items-center gap-3 rounded-md bg-slate-100 px-4 py-3"
                    key={member.id}
                  >
                    <span className="min-w-0 truncate font-semibold">
                      {member.displayName}
                    </span>
                    <input
                      className="w-full rounded-md bg-white px-3 py-2 text-right outline-none focus:ring-2 focus:ring-emerald-700"
                      min="0"
                      onWheel={preventNumberWheelChange}
                      step="0.01"
                      type="number"
                      {...register(
                        splitMode === 'CUSTOM_AMOUNTS'
                          ? `splits.${index}.amount`
                          : `splits.${index}.percentage`,
                        { valueAsNumber: true },
                      )}
                    />
                    <input
                      type="hidden"
                      value={member.id}
                      {...register(`splits.${index}.memberId`)}
                    />
                  </div>
                ))}
              </div>
            </Field>
          )}
          <Field label={es.groups.form.occurredAt} error={errors.occurredAt?.message}>
            <input className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700" type="datetime-local" {...register('occurredAt')} />
          </Field>
        </div>
        <PanelFooter
          isSaving={isSaving}
          onClose={onClose}
          submitLabel={es.groups.form.submitExpense}
        />
      </form>
    </Panel>
  );
}

function SettlementPanel({
  accounts,
  group,
  isSaving,
  onClose,
  onSubmit,
}: {
  accounts: Account[];
  group: FinancialGroup;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: GroupSettlementFormValues) => void;
}) {
  const activeMembers = useMemo(
    () => group.members.filter((member) => member.status === 'ACTIVE'),
    [group.members],
  );
  const defaultValues = useMemo(
    () => getSettlementDefaults(group, activeMembers),
    [activeMembers, group],
  );
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<GroupSettlementFormValues>({
    resolver: zodResolver(groupSettlementSchema),
    defaultValues,
  });
  const currency = useWatch({ control, name: 'currency' });
  const settlementAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.status === 'ACTIVE' && account.currency === currency,
      ),
    [accounts, currency],
  );

  useEffect(() => {
    reset({
      ...defaultValues,
      accountId:
        accounts.find(
          (account) =>
            account.status === 'ACTIVE' && account.currency === defaultValues.currency,
        )?.id ?? '',
    });
  }, [accounts, defaultValues, group.id, reset]);

  useEffect(() => {
    setValue('accountId', settlementAccounts[0]?.id ?? '');
  }, [settlementAccounts, setValue]);

  return (
    <Panel title={es.groups.form.settlementTitle(group.name)} onClose={onClose}>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <Field
            label={es.groups.form.settlementFrom}
            error={errors.fromMemberId?.message}
          >
            <select
              className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
              {...register('fromMemberId')}
            >
              {activeMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={es.groups.form.settlementTo}
            error={errors.toMemberId?.message}
          >
            <select
              className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
              {...register('toMemberId')}
            >
              {activeMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={es.groups.form.amount} error={errors.amount?.message}>
              <input
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                min="0.01"
                onWheel={preventNumberWheelChange}
                step="0.01"
                type="number"
                {...register('amount', { valueAsNumber: true })}
              />
            </Field>
            <Field label={es.groups.form.currency}>
              <select
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                {...register('currency')}
              >
                <option value="PEN">PEN</option>
                <option value="USD">USD</option>
              </select>
            </Field>
          </div>
          <Field
            label={es.groups.form.settlementAccount}
            error={errors.accountId?.message}
          >
            <select
              className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
              {...register('accountId')}
            >
              <option value="">{es.groups.form.selectSettlementAccount}</option>
              {settlementAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={es.groups.form.note} error={errors.note?.message}>
            <input
              className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
              {...register('note')}
            />
          </Field>
          <Field
            label={es.groups.form.settledAt}
            error={errors.settledAt?.message}
          >
            <input
              className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
              type="datetime-local"
              {...register('settledAt')}
            />
          </Field>
        </div>
        <PanelFooter
          isSaving={isSaving}
          onClose={onClose}
          submitLabel={es.groups.form.submitSettlement}
        />
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
      <button aria-label={es.groups.form.close} className="absolute inset-0" onClick={onClose} type="button" />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">{es.groups.section}</p>
            <h2 className="mt-1 text-2xl font-bold">{title}</h2>
          </div>
          <button aria-label={es.groups.form.close} className="grid size-10 place-items-center rounded-md hover:bg-slate-100" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </header>
        {children}
      </aside>
    </div>
  );
}

function getExpenseDefaults(
  members: Array<{ id: string }>,
): GroupExpenseFormValues {
  return {
    description: '',
    amount: 0,
    currency: 'PEN',
    paidByMemberId: members[0]?.id ?? '',
    accountId: '',
    splitMode: 'EQUAL',
    participantMemberIds: members.map((member) => member.id),
    splits: members.map((member) => ({
      memberId: member.id,
      amount: 0,
      percentage: 0,
    })),
    occurredAt: getCurrentDateTimeInputValue(),
  };
}

function getSettlementDefaults(
  group: FinancialGroup,
  members: Array<{ id: string }>,
): GroupSettlementFormValues {
  const debtor = group.balances.find((balance) => Number(balance.netAmount) < 0);
  const creditor = group.balances.find(
    (balance) =>
      Number(balance.netAmount) > 0 && balance.currency === debtor?.currency,
  );

  return {
    fromMemberId: debtor?.member.id ?? members[0]?.id ?? '',
    toMemberId: creditor?.member.id ?? members[1]?.id ?? members[0]?.id ?? '',
    accountId: '',
    amount: debtor ? Math.abs(Number(debtor.netAmount)) : 0,
    currency: debtor?.currency ?? 'PEN',
    note: '',
    settledAt: getCurrentDateTimeInputValue(),
  };
}

function getCurrentDateTimeInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(now.getDate()).padStart(2, '0')}T${String(
    now.getHours(),
  ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function formatMoney(value: number, currency: 'PEN' | 'USD') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
  }).format(value);
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
