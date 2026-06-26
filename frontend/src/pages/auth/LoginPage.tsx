import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthBrand } from '../../features/auth/components/AuthBrand';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { FormField } from '../../features/auth/components/FormField';
import {
  loginSchema,
  type LoginFormValues,
} from '../../features/auth/schemas/authSchemas';
import { login } from '../../features/auth/services/authApi';
import { setAuthSession } from '../../lib/auth-session';

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const session = await login(values);
      setAuthSession(session);
      navigate(
        session.user.onboardingCompleted
          ? '/app/dashboard'
          : '/onboarding/welcome',
      );
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'No se pudo iniciar sesión.',
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-10">
          <AuthBrand />
        </div>

        <AuthCard>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#191c1e]">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-[#3c4a46]">
              Ingresa a tu cuenta para continuar organizando tus finanzas.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <FormField
              error={errors.email?.message}
              label="Email"
              placeholder="nombre@ejemplo.com"
              registration={register('email')}
              type="email"
            />

            <div>
              <div className="mb-1 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#3c4a46]">
                  Contraseña
                </span>
                <Link
                  className="text-xs font-semibold uppercase tracking-wide text-[#006b5f] hover:text-[#006d36]"
                  to="/forgot-password"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  className="h-12 w-full rounded-lg border-2 border-transparent bg-[#f2f4f6] px-4 pr-12 text-[#191c1e] outline-none transition focus:border-[#006b5f] focus:bg-white"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7a76] hover:text-[#191c1e]"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password?.message ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.password.message}
                </span>
              ) : null}
            </div>

            {serverError ? (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </p>
            ) : null}

            <button
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#006b5f] font-semibold text-white transition hover:bg-[#005047] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
              <ArrowRight size={20} />
            </button>
          </form>
        </AuthCard>

        <p className="mt-6 text-center text-[#3c4a46]">
          ¿Aún no tienes una cuenta?{' '}
          <Link className="font-bold text-[#006b5f]" to="/register">
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  );
}
