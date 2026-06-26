import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Briefcase,
  Bus,
  CircleHelp,
  Gift,
  Heart,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CategoryFormPanel } from '../../features/categories/CategoryFormPanel';
import {
  archiveCategory,
  createCategory,
  getCategories,
  updateCategory,
  type Category,
} from '../../features/categories/categoriesApi';
import type { CategoryFormValues } from '../../features/categories/categorySchema';
import { es } from '../../i18n/es';
import { ApiError } from '../../lib/api';

const categoryIcons = {
  tag: Tag,
  heart: Heart,
  'shopping-bag': ShoppingBag,
  utensils: Utensils,
  bus: Bus,
  briefcase: Briefcase,
  gift: Gift,
  'trending-up': TrendingUp,
  'circle-help': CircleHelp,
};

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [selected, setSelected] = useState<Category | null>(null);
  const [archiveCandidate, setArchiveCandidate] = useState<Category | null>(
    null,
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['categories', type, 'ALL'],
    queryFn: () => getCategories(type, 'ALL'),
  });
  const saveMutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      selected
        ? updateCategory(selected.id, values)
        : createCategory(values),
    onSuccess: async () => {
      setPanelOpen(false);
      setSelected(null);
      setError('');
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError
          ? reason.message
          : es.categories.saveError,
      ),
  });
  const archiveMutation = useMutation({
    mutationFn: archiveCategory,
    onSuccess: async () => {
      setArchiveCandidate(null);
      setError('');
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError
          ? reason.message
          : es.categories.archiveError,
      ),
  });

  const active = query.data?.filter((category) => category.status === 'ACTIVE');
  const systemCategories = active?.filter((category) => category.isSystem) ?? [];
  const personalCategories =
    active?.filter((category) => !category.isSystem) ?? [];
  const archivedCategories =
    query.data?.filter(
      (category) => !category.isSystem && category.status === 'ARCHIVED',
    ) ?? [];

  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {es.categories.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{es.categories.title}</h1>
          <p className="mt-2 text-slate-600">{es.categories.subtitle}</p>
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
          {es.categories.newCategory}
        </button>
      </header>

      <div className="inline-flex rounded-md bg-slate-200 p-1">
        {(['EXPENSE', 'INCOME'] as const).map((value) => (
          <button
            className={`rounded-md px-5 py-2.5 font-semibold ${
              type === value
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600'
            }`}
            key={value}
            onClick={() => setType(value)}
            type="button"
          >
            {value === 'EXPENSE'
              ? es.categories.expense
              : es.categories.income}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              className="h-28 animate-pulse rounded-lg bg-slate-200"
              key={item}
            />
          ))}
        </div>
      ) : null}

      {query.isError ? (
        <div className="flex items-center justify-between border-y border-red-200 bg-red-50 p-4 text-red-800">
          <span>{es.categories.loadError}</span>
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

      {!query.isLoading ? (
        <>
          <CategorySection
            categories={systemCategories}
            emptyMessage={es.categories.emptySystem}
            title={es.categories.systemTitle}
          />
          <CategorySection
            categories={personalCategories}
            emptyMessage={es.categories.emptyPersonal}
            onArchive={setArchiveCandidate}
            onEdit={(category) => {
              setSelected(category);
              setPanelOpen(true);
            }}
            title={es.categories.personalTitle}
          />
        </>
      ) : null}

      {archivedCategories.length > 0 ? (
        <section className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-bold">{es.categories.archivedTitle}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {archivedCategories.map((category) => (
              <span
                className="rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-600"
                key={category.id}
              >
                {category.name}
              </span>
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
        <CategoryFormPanel
          category={selected}
          isSaving={saveMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setSelected(null);
            setError('');
          }}
          onSubmit={(values) => saveMutation.mutate(values)}
        />
      ) : null}

      {archiveCandidate ? (
        <ConfirmDialog
          actionLabel={es.categories.archiveAction}
          description={es.categories.archiveConfirmation(
            archiveCandidate.name,
          )}
          isSaving={archiveMutation.isPending}
          onCancel={() => setArchiveCandidate(null)}
          onConfirm={() => archiveMutation.mutate(archiveCandidate.id)}
          title={es.categories.archiveTitle}
        />
      ) : null}
    </section>
  );
}

function CategorySection({
  categories,
  emptyMessage,
  onArchive,
  onEdit,
  title,
}: {
  categories: Category[];
  emptyMessage: string;
  onArchive?: (category: Category) => void;
  onEdit?: (category: Category) => void;
  title: string;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {categories.length === 0 ? (
        <p className="border-y border-slate-200 py-6 text-slate-600">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon =
              categoryIcons[category.icon as keyof typeof categoryIcons] ?? Tag;
            return (
              <article
                className="flex min-h-24 items-center justify-between rounded-lg border border-white bg-white p-4 shadow-[0_10px_30px_rgba(13,148,136,0.08)]"
                key={category.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-800">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">{category.name}</h3>
                    <p className="text-sm text-slate-500">
                      {category.isSystem
                        ? es.categories.systemBadge
                        : es.categories.personalBadge}
                    </p>
                  </div>
                </div>
                {onArchive && onEdit ? (
                  <div className="flex shrink-0 gap-1">
                    <button
                      aria-label={es.categories.edit(category.name)}
                      className="grid size-9 place-items-center rounded-md hover:bg-slate-100"
                      onClick={() => onEdit(category)}
                      title={es.categories.edit(category.name)}
                      type="button"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      aria-label={es.categories.archive(category.name)}
                      className="grid size-9 place-items-center rounded-md text-red-700 hover:bg-red-50"
                      onClick={() => onArchive(category)}
                      title={es.categories.archive(category.name)}
                      type="button"
                    >
                      <Archive size={17} />
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
