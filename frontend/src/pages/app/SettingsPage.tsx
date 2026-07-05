import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { getAccounts } from '../../features/accounts/services/accountsApi';
import {
  getProfile,
  deleteAccount,
  updateProfile,
  updateProfileObjectives,
  type Profile,
} from '../../features/profile/profileApi';
import {
  profileSchema,
  type ProfileFormValues,
} from '../../features/profile/profileSchema';
import { logout } from '../../features/auth/services/authApi';
import { es } from '../../i18n/es';
import { markLoggedOut } from '../../lib/auth-session';
import { ApiError } from '../../lib/api';
import { preventNumberWheelChange } from '../../lib/number-input';
import { useTheme } from '../../features/theme/useTheme';

const timezoneOptions = [
  'America/Lima',
  'America/Bogota',
  'America/Mexico_City',
  'America/New_York',
  'Europe/Madrid',
];

const objectiveOptions: Profile['objectives'] = [
  'SAVE',
  'CONTROL_EXPENSES',
  'ORGANIZE_INCOME',
  'CREATE_BUDGET',
];

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const { setPreference: setThemePreference } = useTheme();
  const [objectiveDraft, setObjectiveDraft] = useState<
    Profile['objectives']
  >();
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });
  const activeAccounts =
    accountsQuery.data?.filter((account) => account.status === 'ACTIVE') ?? [];

  const hasPenAccount = activeAccounts.some(
    (account) => account.currency === 'PEN',
  );
  const hasUsdAccount = activeAccounts.some(
    (account) => account.currency === 'USD',
  );
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: getDefaults(),
  });

  useEffect(() => {
    if (query.data) {
      reset(getDefaults(query.data));
      setThemePreference(query.data.theme);
    }
  }, [query.data, reset, setThemePreference]);

  const aiEnabled = useWatch({ control, name: 'aiEnabled' });
  const selectedObjectives = objectiveDraft ?? query.data?.objectives ?? [];

  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (profile) => {
      setError('');
      setMessage(es.settings.saved);
      reset(getDefaults(profile));
      setThemePreference(profile.theme);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
      ]);
    },
    onError: (reason) => {
      setMessage('');
      setError(
        reason instanceof ApiError ? reason.message : es.settings.saveError,
      );
    },
  });

  const objectivesMutation = useMutation({
    mutationFn: updateProfileObjectives,
    onSuccess: async () => {
      setError('');
      setMessage(es.settings.objectivesSaved);
      setObjectiveDraft(undefined);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (reason) => {
      setMessage('');
      setError(
        reason instanceof ApiError
          ? reason.message
          : es.settings.objectivesSaveError,
      );
    },
  });

  const logoutMutation = useMutation({
  mutationFn: async () => {
    await queryClient.cancelQueries();
    return logout();
  },
  onSettled: () => {
    markLoggedOut();
    queryClient.clear();
    navigate('/', { replace: true });
  },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      markLoggedOut();
      queryClient.clear();
      navigate('/', { replace: true });
    },
    onError: (reason) => {
      setMessage('');
      setError(
        reason instanceof ApiError
          ? reason.message
          : es.settings.deleteAccountError,
      );
    },
  });

  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#006b5f]">
            {es.settings.section}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#191c1e]">{es.settings.title}</h1>
          <p className="mt-2 text-[#3c4a46]">{es.settings.subtitle}</p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-3 font-semibold text-red-700 hover:bg-red-50"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
          type="button"
        >
          <LogOut size={19} />
          {es.settings.logout}
        </button>
      </header>

      {query.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-80 animate-pulse rounded-xl bg-[#eceef0]" />
          <div className="h-80 animate-pulse rounded-xl bg-[#eceef0]" />
        </div>
      ) : null}

      {query.isError ? (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <span>{es.settings.loadError}</span>
          <button
            className="inline-flex items-center gap-2 font-semibold"
            onClick={() => query.refetch()}
            type="button"
          >
            <RefreshCw size={17} />
            {es.common.retry}
          </button>
        </div>
      ) : null}

      {query.data ? (
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <form
            className="space-y-6 rounded-xl border border-[#e0e3e5] bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
            onSubmit={handleSubmit((values) =>
              saveMutation.mutate({
                ...values,
                maxExpenseAmountPen: hasPenAccount
                  ? values.maxExpenseAmountPen
                  : null,
                maxExpenseAmountUsd: hasUsdAccount
                  ? values.maxExpenseAmountUsd
                  : null,
              }),
            )}
          >
            <div>
              <h2 className="text-xl font-bold text-[#191c1e]">
                {es.settings.profileTitle}
              </h2>
              <p className="mt-1 text-sm text-[#3c4a46]">
                {es.settings.profileDescription}
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                {es.settings.displayName}
              </span>
              <input
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                onInput={sanitizeNameInput}
                {...register('displayName')}
              />
              {errors.displayName ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.displayName.message}
                </span>
              ) : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#6b7a76]">
                  {es.settings.preferredCurrency}
                </span>
                <select
                  className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                  {...register('preferredCurrency')}
                >
                  <option value="PEN">PEN</option>
                  <option value="USD">USD</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                  {es.settings.theme}
                </span>
                <select
                  className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                  {...register('theme')}
                >
                  <option value="SYSTEM">{es.settings.themes.SYSTEM}</option>
                  <option value="LIGHT">{es.settings.themes.LIGHT}</option>
                  <option value="DARK">{es.settings.themes.DARK}</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                {es.settings.timezone}
              </span>
              <select
                className="w-full rounded-lg bg-[#f2f4f6] px-4 py-3 outline-none focus:ring-2 focus:ring-[#006b5f]"
                {...register('timezone')}
              >
                {timezoneOptions.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
              {errors.timezone ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.timezone.message}
                </span>
              ) : null}
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
              <input
                className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-800"
                type="checkbox"
                {...register('aiEnabled')}
              />
              <span>
                <span className="block font-bold">{es.settings.aiEnabled}</span>
                <span className="mt-1 block text-sm text-slate-500">
                  {es.settings.aiEnabledDescription}
                </span>
              </span>
            </label>
            <label className="block rounded-lg border border-slate-200 p-4">
              <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                {es.settings.highExpenseWarningPercent}
              </span>

              <select
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                {...register('highExpenseWarningPercent', { valueAsNumber: true })}
              >
                <option value={30}>{es.settings.highExpenseWarningOptions[30]}</option>
                <option value={50}>{es.settings.highExpenseWarningOptions[50]}</option>
                <option value={70}>{es.settings.highExpenseWarningOptions[70]}</option>
              </select>

              <span className="mt-2 block text-sm text-slate-500">
                {es.settings.highExpenseWarningDescription}
              </span>

              {errors.highExpenseWarningPercent ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.highExpenseWarningPercent.message}
                </span>
              ) : null}
            </label>
            <label className="block rounded-lg border border-slate-200 p-4">
  <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
    {es.settings.maxExpenseAmountTitle}
  </span>

  <p className="mb-4 text-sm text-slate-500">
    {es.settings.maxExpenseAmountDescription}
  </p>

  {hasPenAccount || hasUsdAccount ? (
    <div className="grid gap-4 sm:grid-cols-2">
      {hasPenAccount ? (
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">
            {es.settings.maxExpenseAmountPen}
          </span>

          <input
            className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
            min={1}
            onWheel={preventNumberWheelChange}
            placeholder="Ej. 50"
            step="0.01"
            type="number"
            {...register('maxExpenseAmountPen', {
              setValueAs: (value) => (value === '' ? null : Number(value)),
            })}
          />

          {errors.maxExpenseAmountPen ? (
            <span className="mt-1 block text-sm text-red-700">
              {errors.maxExpenseAmountPen.message}
            </span>
          ) : null}
        </label>
      ) : null}

      {hasUsdAccount ? (
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">
            {es.settings.maxExpenseAmountUsd}
          </span>

          <input
            className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
            min={1}
            onWheel={preventNumberWheelChange}
            placeholder="Ej. 20"
            step="0.01"
            type="number"
            {...register('maxExpenseAmountUsd', {
              setValueAs: (value) => (value === '' ? null : Number(value)),
            })}
          />

          {errors.maxExpenseAmountUsd ? (
            <span className="mt-1 block text-sm text-red-700">
              {errors.maxExpenseAmountUsd.message}
            </span>
          ) : null}
        </label>
      ) : null}
    </div>
  ) : (
    <p className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-600">
      Crea una cuenta activa para configurar límites máximos por gasto.
    </p>
  )}
</label>

            {message ? (
              <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            ) : null}

            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white disabled:opacity-60"
              disabled={!isDirty || saveMutation.isPending}
              type="submit"
            >
              <Save size={18} />
              {saveMutation.isPending ? es.common.saving : es.settings.save}
            </button>
          </form>

          <aside className="space-y-5 rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
            <div>
              <h2 className="text-xl font-bold">
                {es.settings.financialProfileTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {es.settings.financialProfileDescription}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-sm font-bold text-emerald-950">
                {aiEnabled
                  ? es.settings.coachActiveTitle
                  : es.settings.coachInactiveTitle}
              </p>
              <p className="mt-1 text-sm text-emerald-900">
                {aiEnabled
                  ? es.settings.coachActiveDescription
                  : es.settings.coachInactiveDescription}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase text-slate-500">
                {es.settings.objectives}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {es.settings.objectivesDescription}
              </p>
              <div className="mt-3 space-y-2">
                {objectiveOptions.map((objective) => (
                  <label
                    className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800"
                    key={objective}
                  >
                    <input
                      checked={selectedObjectives.includes(objective)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-800"
                      onChange={() =>
                        setObjectiveDraft((current) => {
                          const base = current ?? query.data.objectives;

                          return base.includes(objective)
                            ? base.filter((item) => item !== objective)
                            : [...base, objective];
                        })
                      }
                      type="checkbox"
                    />
                    {es.settings.objectiveLabels[objective]}
                  </label>
                ))}
              </div>
              <button
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[#006b5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={
                  objectivesMutation.isPending ||
                  selectedObjectives.length === 0
                }
                onClick={() => objectivesMutation.mutate(selectedObjectives)}
                type="button"
              >
                {objectivesMutation.isPending
                  ? es.common.saving
                  : es.settings.saveObjectives}
              </button>
            </div>

            <div className="border-t border-red-100 pt-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-red-900">
                  <Trash2 size={18} />
                  {es.settings.deleteAccountTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-red-800">
                  {es.settings.deleteAccountDescription}
                </p>
                <button
                  className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                  onClick={() => {
                    setError('');
                    setDeletePassword('');
                    setDeleteAccountOpen(true);
                  }}
                  type="button"
                >
                  <Trash2 size={16} />
                  {es.settings.deleteAccountButton}
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {deleteAccountOpen ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {es.settings.deleteAccountConfirmTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {es.settings.deleteAccountConfirmDescription}
                </p>
              </div>
              <button
                className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => setDeleteAccountOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                {es.settings.deleteAccountPassword}
              </span>
              <input
                autoComplete="current-password"
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-red-700"
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder={es.settings.deleteAccountPasswordPlaceholder}
                type="password"
                value={deletePassword}
              />
            </label>

            {error ? (
              <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-full border border-emerald-800 px-5 py-3 font-semibold text-emerald-900"
                onClick={() => setDeleteAccountOpen(false)}
                type="button"
              >
                {es.common.cancel}
              </button>
              <button
                className="rounded-full bg-red-700 px-5 py-3 font-semibold text-white disabled:opacity-60"
                disabled={
                  deletePassword.length < 8 || deleteAccountMutation.isPending
                }
                onClick={() => {
                  setError('');
                  deleteAccountMutation.mutate(deletePassword);
                }}
                type="button"
              >
                {deleteAccountMutation.isPending
                  ? es.common.saving
                  : es.settings.deleteAccountConfirmAction}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function getDefaults(profile?: Partial<Profile>): ProfileFormValues {
  return {
    displayName: profile?.displayName ?? '',
    preferredCurrency: profile?.preferredCurrency ?? 'PEN',
    timezone: profile?.timezone ?? 'America/Lima',
    theme: profile?.theme ?? 'SYSTEM',
    aiEnabled: profile?.aiEnabled ?? true,
    highExpenseWarningPercent: profile?.highExpenseWarningPercent ?? 50,
    maxExpenseAmountPen: profile?.maxExpenseAmountPen ?? null,
    maxExpenseAmountUsd: profile?.maxExpenseAmountUsd ?? null,
  };
}

function sanitizeNameInput(event: React.FormEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.replace(
    /[^\p{L}\s'-]/gu,
    '',
  );
}
