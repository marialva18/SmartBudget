import { MailCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../../features/auth/components/AuthCard';

export function EmailSentPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? 'tu correo';

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <AuthCard className="w-full max-w-[560px] text-center">
        <div className="mx-auto mb-8 flex h-40 w-40 items-center justify-center rounded-full bg-[#f2f4f6] text-[#006b5f]">
          <MailCheck size={72} strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold">Revisa tu correo</h1>
        <p className="mx-auto mt-3 max-w-[420px] text-lg text-[#3c4a46]">
          Si existe una cuenta asociada a <strong>{email}</strong>, enviaremos
          un enlace para restablecer tu contraseña.
        </p>
        <div className="mt-8 grid gap-3">
          <Link
            className="rounded-lg bg-[#006b5f] px-5 py-3 font-semibold text-white"
            to="/login"
          >
            Volver al inicio de sesión
          </Link>
          <Link
            className="rounded-lg border border-[#006b5f] px-5 py-3 font-semibold text-[#006b5f]"
            to="/forgot-password"
          >
            Enviar a otro correo
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}
