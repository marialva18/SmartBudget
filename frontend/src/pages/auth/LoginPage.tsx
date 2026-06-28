import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  PiggyBank,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthBrand } from '../../features/auth/components/AuthBrand';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { AuthImage } from '../../features/auth/components/AuthImage';
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
    <div className="qori-login-surface flex min-h-screen items-center justify-center px-4 py-6 sm:px-5 lg:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-white/15 bg-white/88 shadow-[0_26px_80px_rgba(3,32,29,0.28)] backdrop-blur lg:grid-cols-[0.96fr_1.04fr]">
        <aside className="relative hidden lg:block lg:min-h-[min(640px,calc(100vh-3rem))] overflow-hidden">
          <AuthImage
            className="qori-auth-bg absolute inset-0 h-full w-full object-cover object-left"
            fallbackSrc="/images/qori_login_background.svg"
            src="/images/qori_login_background.png"
          />
          <div className="absolute inset-0 bg-[#063c36]/10" />
          <div className="qori-soft-float absolute bottom-8 left-8 max-w-[300px] rounded-xl border border-white/65 bg-white/84 p-5 shadow-[0_22px_58px_rgba(9,60,54,0.15)] backdrop-blur">
            <p className="text-sm font-black text-[#063c36]">
              Tu dinero en calma
            </p>
            <p className="mt-2 text-sm leading-6 text-[#52625d]">
              Revisa tus gastos, metas y próximos pagos desde un espacio claro.
            </p>
          </div>
        </aside>

        <main className="flex min-h-[min(640px,calc(100vh-3rem))] items-center justify-center bg-[#fbfdfb]/94 px-5 py-7 sm:px-8 lg:px-10">
          <div className="w-full max-w-[420px]">
            <div className="mb-6">
              <AuthBrand />
            </div>

            <AuthCard>
              <div className="mb-6 text-center">
                <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#00796b]">
                  Acceso seguro
                </p>
                <h1 className="text-3xl font-extrabold text-[#16201d]">
                  Bienvenida de nuevo
                </h1>
                <p className="mx-auto mt-2 max-w-sm text-[#52625d]">
                  Ingresa para seguir organizando tu dinero con calma.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <FormField
                  error={errors.email?.message}
                  label="Email"
                  placeholder="nombre@ejemplo.com"
                  registration={register('email')}
                  type="email"
                />

                <div>
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#52625d]">
                      Contraseña
                    </span>
                    <Link
                      className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#00796b] hover:text-[#00574d]"
                      to="/forgot-password"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      className="h-12 w-full rounded-lg border border-[#dfe8e4] bg-[#f7faf8] px-4 pr-12 text-[#191c1e] outline-none transition placeholder:text-[#6b7a76]/70 hover:border-[#bacac5] focus:border-[#006b5f] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,107,95,0.12)]"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7a76] transition hover:text-[#191c1e]"
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
                  <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {serverError}
                  </p>
                ) : null}

                <button
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-[#00796b] font-semibold text-white shadow-[0_14px_34px_rgba(0,107,95,0.18)] transition hover:-translate-y-0.5 hover:bg-[#006b5f] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
                  <ArrowRight size={20} />
                </button>
              </form>

              <div className="mt-6 grid gap-3 border-t border-[#e2ebe7] pt-5 text-sm text-[#52625d]">
                {[
                  {
                    icon: ShieldCheck,
                    text: 'Tu cuenta se mantiene protegida mientras usas Qori',
                  },
                  {
                    icon: PiggyBank,
                    text: 'Tus gastos y metas se organizan en un solo lugar',
                  },
                  {
                    icon: LockKeyhole,
                    text: 'Te avisamos cuando algo necesita tu atención',
                  },
                ].map(({ icon: Icon, text }) => (
                  <div className="flex items-center gap-3" key={text}>
                    <span className="grid size-8 place-items-center rounded-lg bg-[#e5f5ef] text-[#00796b]">
                      <Icon size={16} />
                    </span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </AuthCard>

            <p className="mt-5 text-center text-[#52625d]">
              ¿Aún no tienes una cuenta?{' '}
              <Link className="font-bold text-[#00796b]" to="/register">
                Registrarse
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
