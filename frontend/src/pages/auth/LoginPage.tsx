import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
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
    <div className="qori-auth-entry-surface flex min-h-screen items-center justify-center px-4 py-6 sm:px-5 lg:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[#eadfc9] bg-white shadow-[0_26px_80px_rgba(72,53,24,0.14)] lg:grid-cols-[0.96fr_1.04fr]">
        <aside className="hidden min-h-[min(640px,calc(100vh-3rem))] bg-[#063c36] p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#a9ded4]">
              Panel financiero
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight">
              Vuelve a tu resumen sin perder contexto.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#dff5ef]">
              Accede a tus cuentas, movimientos, metas y análisis desde una
              experiencia consistente.
            </p>
          </div>

          <div className="my-8 rounded-2xl border border-white/12 bg-white/10 p-5">
            <p className="text-sm font-semibold text-[#a9ded4]">
              Saldo disponible
            </p>
            <p className="mt-2 text-4xl font-black">S/ 2,438.50</p>
            <div className="mt-5 grid gap-3">
              <AuthMetric icon={WalletCards} label="Cuentas activas" value="3" />
              <AuthMetric icon={CalendarDays} label="Próximo pago" value="15 jul." />
              <AuthMetric icon={BarChart3} label="Balance mensual" value="+12%" />
            </div>
          </div>

          <div className="rounded-xl border border-[#d6a84f]/45 bg-[#d6a84f]/12 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-[#f8d991]" size={20} />
              <p className="text-sm font-semibold leading-6 text-[#fff4d6]">
                Tus datos se mantienen separados por cuenta y protegidos por
                sesión autenticada.
              </p>
            </div>
          </div>
        </aside>

        <main className="qori-auth-entry-panel flex min-h-[min(640px,calc(100vh-3rem))] items-center justify-center px-5 py-7 sm:px-8 lg:px-10">
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
                  Accede a tu panel financiero
                </h1>
                <p className="mx-auto mt-2 max-w-sm text-[#52625d]">
                  Continúa revisando tus movimientos, metas y análisis.
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
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
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
                  <p
                    className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                    role="alert"
                  >
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
                    text: 'Sesión protegida para acceder a tus datos',
                  },
                  {
                    icon: WalletCards,
                    text: 'Cuentas y movimientos en un solo panel',
                  },
                  {
                    icon: LockKeyhole,
                    text: 'Alertas cuando un gasto requiere revisión',
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

function AuthMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-white/12 text-[#8ef3e4]">
          <Icon size={18} />
        </span>
        <span className="text-sm font-semibold text-[#dff5ef]">{label}</span>
      </div>
      <span className="font-black text-white">{value}</span>
    </div>
  );
}
