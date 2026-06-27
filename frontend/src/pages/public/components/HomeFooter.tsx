import { Mail } from 'lucide-react';

const currentYear = new Date().getFullYear();

const contactEmail = 'malva0418@gmail.com';
const contactSubject = 'Consulta sobre Qori';
const contactBody =
  'Hola, quiero conocer más sobre Qori.';

const contactHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
  contactSubject,
)}&body=${encodeURIComponent(contactBody)}`;

export function HomeFooter() {
  return (
    <footer id="contacto" className="border-t border-emerald-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            Contacto
          </p>

          <h2 className="mt-2 max-w-2xl text-3xl font-black text-slate-950">
            ¿Quieres saber más sobre Qori?
          </h2>

          <p className="mt-3 max-w-xl leading-7 text-slate-600">
            Si tienes comentarios, dudas o quieres conocer más sobre la
            propuesta, puedes ponerte en contacto directamente.
          </p>
        </div>

        <div className="rounded-3xl bg-[#f6fbf8] p-5">
          <a
            className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:text-emerald-800"
            href={contactHref}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-800">
              <Mail size={20} />
            </span>

            <span>
              Contactar
              <span className="block text-slate-500">
                Enviar una consulta sobre Qori
              </span>
            </span>
          </a>
        </div>
      </div>

      <div className="border-t border-emerald-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-black text-slate-800">Qori</p>
            <p className="mt-1 text-xs text-slate-400">
              Desarrollado por María Alva.
            </p>
          </div>

          <p>© {currentYear} Qori. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

