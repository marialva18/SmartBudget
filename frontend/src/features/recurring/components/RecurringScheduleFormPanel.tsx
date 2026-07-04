import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Account } from '../../accounts/services/accountsApi';
import type { Category } from '../../categories/categoriesApi';
import { preventNumberWheelChange } from '../../../lib/number-input';
import {
  recurringScheduleSchema,
  type RecurringScheduleFormValues,
} from '../schemas/recurringSchemas';

type RecurringScheduleFormPanelProps = {
  accounts: Account[];
  categories: Category[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: RecurringScheduleFormValues) => void;
};

export function RecurringScheduleFormPanel({
  accounts,
  categories,
  isSaving,
  onClose,
  onSubmit,
}: RecurringScheduleFormPanelProps) {
 const {
  control,
  formState: { errors },
  handleSubmit,
  register,
  setValue,
} = useForm<RecurringScheduleFormValues>({
    resolver: zodResolver(recurringScheduleSchema),
    defaultValues: {
      operationType: 'EXPENSE',
      accountId: '',
      categoryId: '',
      amount: 0,
      description: '',
      frequency: 'MONTHLY',
      intervalCount: 1,
      startsOn: new Date().toISOString().slice(0, 10),
      endsOn: '',
    },
  });

const operationType = useWatch({
  control,
  name: 'operationType',
});

const accountId = useWatch({
  control,
  name: 'accountId',
});

  const activeAccounts = accounts.filter((account) => account.status === 'ACTIVE');
  const selectedAccount = activeAccounts.find((account) => account.id === accountId);

  const filteredCategories = categories.filter(
    (category) => category.status === 'ACTIVE' && category.type === operationType,
  );

  useEffect(() => {
    setValue('categoryId', '');
  }, [operationType, setValue]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[2px]">
      <button
        aria-label="Cerrar recurrencia"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />

      <aside className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">
              Recurrencias
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              Nueva recurrencia
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Se guardará como regla pendiente. No afectará tu saldo automáticamente.
            </p>
          </div>

          <button
            aria-label="Cerrar"
            className="grid size-10 place-items-center rounded-md text-slate-600 hover:bg-slate-100"
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
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipo">
                <select
                  className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                  {...register('operationType')}
                >
                  <option value="EXPENSE">Gasto</option>
                  <option value="INCOME">Ingreso</option>
                </select>
              </Field>

              <Field label="Frecuencia">
                <select
                  className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                  {...register('frequency')}
                >
                  <option value="DAILY">Diaria</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="MONTHLY">Mensual</option>
                </select>
              </Field>
            </div>

            <Field error={errors.accountId?.message} label="Cuenta">
              <select
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                {...register('accountId')}
              >
                <option value="">Selecciona una cuenta</option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
            </Field>

            <Field error={errors.categoryId?.message} label="Categoría">
              <select
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                {...register('categoryId')}
              >
                <option value="">Selecciona una categoría</option>
                {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                    {category.name}
                </option>
                ))}
              </select>
            </Field>

            <Field error={errors.amount?.message} label={`Monto ${selectedAccount ? `(${selectedAccount.currency})` : ''}`}>
              <input
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                inputMode="decimal"
                min="0"
                onWheel={preventNumberWheelChange}
                step="0.01"
                type="number"
                {...register('amount', { valueAsNumber: true })}
              />
            </Field>

            <Field error={errors.description?.message} label="Descripción">
              <input
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                maxLength={250}
                placeholder="Ej. Netflix, sueldo, pasaje semanal"
                {...register('description')}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field error={errors.intervalCount?.message} label="Cada">
                <input
                  className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                  min="1"
                  onWheel={preventNumberWheelChange}
                  step="1"
                  type="number"
                  {...register('intervalCount', { valueAsNumber: true })}
                />
              </Field>

              <Field error={errors.startsOn?.message} label="Empieza">
                <input
                  className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                  type="date"
                  {...register('startsOn')}
                />
              </Field>

              <Field error={errors.endsOn?.message} label="Termina">
                <input
                  className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                  type="date"
                  {...register('endsOn')}
                />
              </Field>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Esta recurrencia no afectará tu saldo hasta que confirmes una ocurrencia pendiente.
            </div>
          </div>

          <footer className="grid gap-3 border-t border-slate-200 px-5 py-5 sm:px-7">
            <button
              className="rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Guardando...' : 'Crear recurrencia'}
            </button>

            <button
              className="rounded-full border border-emerald-800 px-5 py-3 font-semibold text-emerald-900 hover:bg-emerald-50"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
          </footer>
        </form>
      </aside>
    </div>
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
