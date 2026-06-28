import { Mail } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export function EmailSentPage() {
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email');
  const mode = searchParams.get('mode') ?? 'reset';
  const message = searchParams.get('message');

  const isVerification = mode === 'verify';
  const protectedEmail = email ? maskEmail(email) : null;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f9fb] px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-[#e0e3e5] bg-white p-8 text-center shadow-[0_18px_45px_rgba(13,148,136,0.10)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-[#dcfbf5] text-[#006b5f]">
          <Mail size={28} />
        </div>

        <h1 className="mt-6 text-3xl font-black text-[#191c1e]">
          {isVerification ? 'Verifica tu correo' : 'Revisa tu correo'}
        </h1>

        <p className="mt-3 leading-7 text-[#3c4a46]">
          {message ??
            (isVerification
              ? 'Si el registro fue válido, enviaremos un enlace para activar la cuenta.'
              : 'Si el correo está registrado y habilitado, enviaremos las instrucciones correspondientes.')}
        </p>

        {protectedEmail ? (
          <p className="mt-4 rounded-lg bg-[#dcfbf5] px-4 py-3 text-sm font-semibold text-[#006b5f]">
            {protectedEmail}
          </p>
        ) : null}

        <p className="mt-5 text-sm leading-6 text-[#6b7a76]">
          {isVerification
            ? 'Por seguridad, revisa tu bandeja de entrada y abre el enlace recibido para activar la cuenta.'
            : 'Por seguridad, no confirmamos si el correo existe o si está habilitado.'}
        </p>

        <div className="mt-8 grid gap-3">
          <Link
            className="rounded-lg bg-[#006b5f] px-5 py-3 font-bold text-white transition hover:bg-[#005047]"
            to="/login"
          >
            Ir a iniciar sesión
          </Link>

          <Link
            className="rounded-lg border border-[#bacac5] px-5 py-3 font-bold text-[#006b5f] transition hover:bg-[#f2f4f6]"
            to="/"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split('@');

  if (!localPart || !domain) {
    return 'Correo protegido';
  }

  const visibleStart = localPart.slice(0, 2);
  const visibleEnd = localPart.length > 4 ? localPart.slice(-1) : '';

  return `${visibleStart}***${visibleEnd}@${domain}`;
}
