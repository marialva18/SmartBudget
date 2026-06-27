import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, RefreshCw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  getProfile,
  updateProfile,
  type Profile,
} from '../../features/profile/profileApi';
import {
  profileSchema,
  type ProfileFormValues,
} from '../../features/profile/profileSchema';
import { logout } from '../../features/auth/services/authApi';
import { es } from '../../i18n/es';
import { clearAuthSession } from '../../lib/auth-session';
import { ApiError } from '../../lib/api';

const timezoneOptions = [
  'America/Lima',
  'America/Bogota',
  'America/Mexico_City',
  'America/New_York',
  'Europe/Madrid',
];

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
  const {
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
    }
  }, [query.data, reset]);

  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (profile) => {
      setError('');
      setMessage(es.settings.saved);
      reset(getDefaults(profile));
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

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAuthSession();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });

  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {es.settings.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{es.settings.title}</h1>
          <p className="mt-2 text-slate-600">{es.settings.subtitle}</p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-5 py-3 font-semibold text-red-700"
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
          <div className="h-80 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-80 animate-pulse rounded-lg bg-slate-200" />
        </div>
      ) : null}

      {query.isError ? (
        <div className="flex items-center justify-between border-y border-red-200 bg-red-50 p-4 text-red-800">
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
            className="space-y-6 rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
            onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
          >
            <div>
              <h2 className="text-xl font-bold">
                {es.settings.profileTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
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
                <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
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
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
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

          <aside className="space-y-4 rounded-lg bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
            <div>
              <h2 className="text-xl font-bold">
                {es.settings.accountTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {es.settings.accountDescription}
              </p>
            </div>
            <InfoRow label={es.settings.objectives} value={formatObjectives(query.data.objectives)} />
            <InfoRow
              label={es.settings.onboarding}
              value={
                query.data.onboardingCompleted
                  ? es.settings.completed
                  : es.settings.pending
              }
            />
            <InfoRow
              label={es.settings.aiStatus}
              value={
                query.data.aiEnabled
                  ? es.settings.enabled
                  : es.settings.disabled
              }
            />
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-slate-100 pt-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
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
  };
}

function formatObjectives(objectives: Profile['objectives']) {
  if (objectives.length === 0) {
    return es.settings.noObjectives;
  }
  return objectives
    .map((objective) => es.settings.objectiveLabels[objective])
    .join(', ');
}

function sanitizeNameInput(event: React.FormEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.replace(
    /[^\p{L}\s'-]/gu,
    '',
  );
}
