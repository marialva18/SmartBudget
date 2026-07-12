import { Mail, MessageCircle } from 'lucide-react';

const currentYear = new Date().getFullYear();

const contactEmail = 'malva0418@gmail.com';
const contactSubject = 'Consulta sobre Qori';
const contactBody = [
  'Hola Maria,',
  '',
  'Quiero conocer mas sobre Qori y su propuesta para organizar finanzas personales.',
  '',
  'Mi consulta es:',
].join('\n');

const contactHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
  contactEmail,
)}&su=${encodeURIComponent(contactSubject)}&body=${encodeURIComponent(
  contactBody,
)}`;

export function HomeFooter() {
  return (
    <footer id="contacto" className="border-t border-[#e0e3e5] bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#006b5f]">
            Contacto
          </p>

          <h2 className="mt-2 max-w-2xl text-3xl font-black text-[#191c1e]">
            ¿Quieres saber más sobre Qori?
          </h2>

          <p className="mt-3 max-w-xl leading-7 text-[#3c4a46]">
            Si tienes comentarios, dudas o quieres conocer más sobre la
            propuesta, puedes enviar una consulta con un mensaje ya preparado.
          </p>
        </div>

        <div className="rounded-xl border border-[#e0e3e5] bg-[#f7f9fb] p-5">
          <a
            className="flex items-center gap-3 rounded-lg bg-white p-4 text-sm font-semibold text-[#3c4a46] shadow-sm transition hover:-translate-y-0.5 hover:text-[#006b5f]"
            href={contactHref}
            rel="noreferrer"
            target="_blank"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#dcfbf5] text-[#006b5f]">
              <Mail size={20} />
            </span>

            <span>
              Enviar consulta
              <span className="block text-slate-500">
                Abrir correo con mensaje predeterminado
              </span>
            </span>
          </a>

          <div className="mt-3 flex items-start gap-3 rounded-lg border border-[#dce8e3] bg-white/70 p-4 text-sm leading-6 text-[#52625d]">
            <MessageCircle
              className="mt-0.5 shrink-0 text-[#006b5f]"
              size={18}
            />
            <p>
              Se abrirá una ventana de correo con destinatario, asunto y mensaje
              listos para completar y enviar.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#e0e3e5]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-black text-slate-800">Qori</p>
            <p className="mt-1 text-xs text-slate-400">
              Desarrollado por María Alva Ruiz
            </p>
          </div>

          <p>© {currentYear} Qori. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
