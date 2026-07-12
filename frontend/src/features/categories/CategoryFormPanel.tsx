import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  Bus,
  Gift,
  Heart,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { es } from '../../i18n/es';
import type { Category } from './categoriesApi';
import {
  categorySchema,
  type CategoryFormValues,
} from './categorySchema';

type CategoryFormPanelProps = {
  category: Category | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => void;
};

const iconOptions = [
  { value: 'tag' as const, label: 'Etiqueta', icon: Tag },
  { value: 'heart' as const, label: 'Bienestar', icon: Heart },
  { value: 'shopping-bag' as const, label: 'Compras', icon: ShoppingBag },
  { value: 'utensils' as const, label: 'Alimentación', icon: Utensils },
  { value: 'bus' as const, label: 'Transporte', icon: Bus },
  { value: 'briefcase' as const, label: 'Trabajo', icon: Briefcase },
  { value: 'gift' as const, label: 'Regalos', icon: Gift },
  { value: 'trending-up' as const, label: 'Inversión', icon: TrendingUp },
];

export function CategoryFormPanel({
  category,
  isSaving,
  onClose,
  onSubmit,
}: CategoryFormPanelProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: getDefaults(category),
  });

  useEffect(() => {
    reset(getDefaults(category));
  }, [category, reset]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[2px]">
      <button
        aria-label={es.categories.form.close}
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">
              {es.categories.section}
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              {category
                ? es.categories.form.editTitle
                : es.categories.form.createTitle}
            </h2>
          </div>
          <button
            aria-label={es.categories.form.close}
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
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase text-slate-600">
                {es.categories.form.type}
              </legend>
              <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
                {(['EXPENSE', 'INCOME'] as const).map((value) => (
                  <label
                    className="qori-segment-option cursor-pointer rounded-md px-4 py-3 text-center font-semibold"
                    key={value}
                  >
                    {value === 'EXPENSE'
                      ? es.categories.expense
                      : es.categories.income}
                    <input
                      className="sr-only"
                      disabled={category !== null}
                      type="radio"
                      value={value}
                      {...register('type')}
                    />
                  </label>
                ))}
              </div>
              {category ? (
                <p className="mt-2 text-sm text-slate-500">
                  {es.categories.form.typeImmutable}
                </p>
              ) : null}
            </fieldset>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                {es.categories.form.name}
              </span>
              <input
                className="w-full rounded-md bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-700"
                onInput={sanitizeNameInput}
                placeholder={es.categories.form.namePlaceholder}
                {...register('name')}
              />
              {errors.name ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.name.message}
                </span>
              ) : null}
            </label>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase text-slate-600">
                {es.categories.form.icon}
              </legend>
              <div className="grid grid-cols-4 gap-2">
                {iconOptions.map(({ icon: Icon, label, value }) => (
                  <label
                    className="qori-choice-option cursor-pointer rounded-md border border-slate-200 p-3 text-center"
                    key={value}
                    title={label}
                  >
                    <Icon className="mx-auto text-emerald-700" size={21} />
                    <span className="sr-only">{label}</span>
                    <input
                      className="sr-only"
                      type="radio"
                      value={value}
                      {...register('icon')}
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <footer className="grid gap-3 border-t border-slate-200 px-6 py-5">
            <button
              className="rounded-full bg-emerald-800 px-5 py-3 font-semibold text-white disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving
                ? es.common.saving
                : category
                  ? es.categories.form.submitEdit
                  : es.categories.form.submitCreate}
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

function getDefaults(category: Category | null): CategoryFormValues {
  if (category) {
    const supportedIcon = iconOptions.find(
      (option) => option.value === category.icon,
    )?.value;
    return {
      name: category.name,
      type: category.type,
      icon: supportedIcon ?? 'tag',
    };
  }
  return {
    name: '',
    type: 'EXPENSE',
    icon: 'tag',
  };
}

function sanitizeNameInput(event: React.FormEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.replace(
    /[^\p{L}\s'-]/gu,
    '',
  );
}
