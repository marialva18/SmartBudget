import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ChevronLeft, LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthBrand } from '../../features/auth/components/AuthBrand';
import { AuthCard } from '../../features/auth/components/AuthCard';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../../features/auth/schemas/authSchemas';
import { forgotPassword } from '../../features/auth/services/authApi';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null);
    try {
      await forgotPassword(values);
      navigate('/email-sent?mode=reset');
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'No se pudo enviar la recuperación.',
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f7f9fb] to-[#effefb] px-5 py-10">
      <AuthCard className="w-full max-w-[480px]">
        <AuthBrand />
        <div className="my-8 flex justify-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-full border border-[#bacac5]/40 bg-[#f2f4f6] text-[#006b5f]">
            <LockKeyhole size={48} strokeWidth={1.5} />
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Recupera tu contraseña</h1>
          <p className="mx-auto mt-2 max-w-[320px] text-[#3c4a46]">
            Ingresa el correo asociado a tu cuenta y te enviaremos un enlace
            para restablecerla.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7a76]">
              Email
            </span>
            <div className="relative mt-2">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#006b5f]"
                size={20}
              />
              <input
                className="h-12 w-full rounded-lg border-0 bg-[#f2f4f6] pl-12 pr-4 outline-none ring-0 transition focus:bg-white focus:ring-2 focus:ring-[#006b5f]"
                placeholder="tu@email.com"
                type="email"
                {...register('email')}
              />
            </div>
            {errors.email?.message ? (
              <span className="mt-1 block text-sm text-red-700">
                {errors.email.message}
              </span>
            ) : null}
          </label>

          {serverError ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </p>
          ) : null}

          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#006b5f] font-semibold text-white transition hover:bg-[#005047] active:scale-[0.98] disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            className="inline-flex items-center gap-1 font-semibold text-[#006b5f]"
            to="/login"
          >
            <ChevronLeft size={18} />
            Volver a iniciar sesión
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}
