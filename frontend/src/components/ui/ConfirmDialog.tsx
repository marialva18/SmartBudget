import { es } from '../../i18n/es';

export function ConfirmDialog({
  actionLabel,
  description,
  isSaving = false,
  onCancel,
  onConfirm,
  title,
  tone = 'danger',
}: {
  actionLabel: string;
  description: string;
  isSaving?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  tone?: 'danger' | 'normal';
}) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/30 px-4 backdrop-blur-[2px]">
      <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
          {description}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-full border border-emerald-800 px-5 py-3 font-semibold text-emerald-900"
            onClick={onCancel}
            type="button"
          >
            {es.common.cancel}
          </button>
          <button
            className={`rounded-full px-5 py-3 font-semibold text-white disabled:opacity-60 ${
              tone === 'danger' ? 'bg-red-700' : 'bg-emerald-800'
            }`}
            disabled={isSaving}
            onClick={onConfirm}
            type="button"
          >
            {isSaving ? es.common.saving : actionLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
