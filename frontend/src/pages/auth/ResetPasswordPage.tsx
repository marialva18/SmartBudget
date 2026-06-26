import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { FormField } from '../../features/auth/components/FormField';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '../../features/auth/schemas/authSchemas';
import { resetPassword } from '../../features/auth/services/authApi';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null);
    try {
      await resetPassword(token, values);
      navigate('/login');
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la contraseña.',
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <AuthCard className="w-full max-w-[480px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f2f4f6] text-[#006b5f]">
            <LockKeyhole size={40} />
          </div>
          <h1 className="text-3xl font-bold">Crea una nueva contraseña</h1>
          <p className="mt-2 text-[#3c4a46]">
            Elige una contraseña segura que no hayas utilizado anteriormente.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <FormField
            error={errors.password?.message}
            label="Nueva contraseña"
            placeholder="••••••••"
            registration={register('password')}
            type="password"
          />
          <FormField
            error={errors.confirmPassword?.message}
            label="Confirmar contraseña"
            placeholder="••••••••"
            registration={register('confirmPassword')}
            type="password"
          />

          {!token ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Falta el token de recuperación en el enlace.
            </p>
          ) : null}

          {serverError ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </p>
          ) : null}

          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#006b5f] font-semibold text-white transition hover:bg-[#005047] disabled:opacity-70"
            disabled={isSubmitting || !token}
            type="submit"
          >
            {isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
            <ArrowRight size={18} />
          </button>
        </form>

        <Link
          className="mt-6 block text-center text-sm font-semibold text-[#006b5f]"
          to="/login"
        >
          Cancelar y volver al inicio de sesión
        </Link>
      </AuthCard>
    </div>
  );
}
