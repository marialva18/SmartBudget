import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../../features/auth/services/authApi';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const mutation = useMutation({
    mutationFn: verifyEmail,
  });

  useEffect(() => {
    if (token && mutation.status === 'idle') {
      mutation.mutate(token);
    }
  }, [token, mutation]);

  if (!token) {
    return (
      <VerifyEmailLayout
        description="El enlace no contiene un token válido. Solicita un nuevo correo de verificación."
        status="error"
        title="Enlace inválido"
      />
    );
  }

  if (mutation.isPending) {
    return (
      <VerifyEmailLayout
        description="Estamos validando tu correo. Espera un momento."
        status="loading"
        title="Verificando correo"
      />
    );
  }

  if (mutation.isError) {
    return (
      <VerifyEmailLayout
        description="El enlace no es válido, ya fue usado o expiró."
        status="error"
        title="No pudimos verificar tu correo"
      />
    );
  }

  return (
    <VerifyEmailLayout
      description={
        mutation.data?.message ??
        'Tu correo fue verificado correctamente. Ya puedes iniciar sesión.'
      }
      status="success"
      title="Correo verificado"
    />
  );
}

function VerifyEmailLayout({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: 'loading' | 'success' | 'error';
}) {
  const icon =
    status === 'success' ? '\u2705' : status === 'error' ? '\u26A0\uFE0F' : '\u23F3';

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f8f7] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl shadow-emerald-900/10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl">
          {icon}
        </div>

        <h1 className="mt-6 text-3xl font-black text-slate-950">{title}</h1>

        <p className="mt-3 leading-7 text-slate-600">{description}</p>

        {status !== 'loading' ? (
          <div className="mt-8 grid gap-3">
            <Link
              className="rounded-full bg-emerald-800 px-5 py-3 font-bold text-white transition hover:bg-emerald-900"
              to="/login"
            >
              Iniciar sesión
            </Link>

            <Link
              className="rounded-full border border-emerald-200 px-5 py-3 font-bold text-emerald-800 transition hover:bg-emerald-50"
              to="/"
            >
              Volver al inicio
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}