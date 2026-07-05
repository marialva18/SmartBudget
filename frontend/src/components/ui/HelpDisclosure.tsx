import { Info, X } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';

type HelpDisclosureProps = {
  children: ReactNode;
  label: string;
  title?: string;
};

export function HelpDisclosure({ children, label, title }: HelpDisclosureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="relative inline-flex">
      <button
        aria-controls={contentId}
        aria-expanded={isOpen}
        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 shadow-[0_8px_24px_rgba(13,148,136,0.08)] hover:bg-emerald-50"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Info size={16} />
        {label}
      </button>

      {isOpen ? (
        <section
          className="absolute left-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 text-left shadow-2xl"
          id={contentId}
        >
          <div className="flex items-start justify-between gap-3">
            {title ? (
              <h2 className="text-sm font-bold text-slate-950">{title}</h2>
            ) : null}
            <button
              aria-label="Cerrar ayuda"
              className="grid size-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X size={16} />
            </button>
          </div>
          <div className={title ? 'mt-2' : ''}>{children}</div>
        </section>
      ) : null}
    </div>
  );
}
