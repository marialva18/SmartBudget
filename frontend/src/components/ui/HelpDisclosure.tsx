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
        aria-label={label}
        aria-expanded={isOpen}
        className="grid size-8 place-items-center rounded-full border border-emerald-200 bg-white text-emerald-800 shadow-[0_8px_24px_rgba(13,148,136,0.08)] transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        onClick={() => setIsOpen((current) => !current)}
        title={label}
        type="button"
      >
        <Info size={15} />
      </button>

      {isOpen ? (
        <section
          className="absolute left-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 text-left shadow-2xl"
          id={contentId}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        >
          <div className="flex items-start justify-between gap-3">
            {title ? (
              <h2 className="text-sm font-bold text-slate-950">{title}</h2>
            ) : null}
            <button
              aria-label="Cerrar ayuda"
              className="grid size-8 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
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
