import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { FormField } from '../../features/auth/components/FormField';
import {
  registerSchema,
  type RegisterFormValues,
} from '../../features/auth/schemas/authSchemas';
import { register as registerUser } from '../../features/auth/services/authApi';
import { setAuthSession } from '../../lib/auth-session';

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
    },
  });
  const password = useWatch({ control, name: 'password' }) ?? '';
  const passwordChecks = useMemo(
    () => [
      { label: '8 caracteres', met: password.length >= 8 },
      { label: '1 mayúscula', met: /[A-Z]/.test(password) },
      { label: '1 número', met: /\d/.test(password) },
      { label: '1 especial', met: /[^A-Za-z0-9]/.test(password) },
    ],
    [password],
  );

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      const session = await registerUser(values);
      setAuthSession(session);
      navigate('/onboarding/welcome');
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'No se pudo crear la cuenta.',
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10 md:px-16">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-[0_10px_30px_rgba(13,148,136,0.08)] md:grid-cols-2">
        <aside className="hidden bg-gradient-to-br from-[#6dfe9c] to-[#2dd4bf] p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">
              Smart Budget
            </p>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight">
              Domina tu futuro financiero.
            </h1>
            <p className="mt-5 text-lg text-white/90">
              Registra movimientos, entiende tus hábitos y construye metas con
              una experiencia clara y segura.
            </p>
          </div>
          <div className="space-y-4">
            {['Análisis de gastos', 'Seguridad desde backend', 'Metas de ahorro'].map(
              (item) => (
                <div className="flex items-center gap-3" key={item}>
                  <span className="rounded-lg bg-white/20 p-2">
                    <CheckCircle size={20} />
                  </span>
                  <span className="font-semibold">{item}</span>
                </div>
              ),
            )}
          </div>
        </aside>

        <AuthCard className="rounded-none border-0 shadow-none">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Crea tu cuenta</h1>
            <p className="mt-2 text-[#3c4a46]">
              Empieza a tomar el control de tus finanzas.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormField
              error={errors.displayName?.message}
              label="Nombre completo"
              onInput={sanitizeNameInput}
              placeholder="Ej. Maria Perez"
              registration={register('displayName')}
              type="text"
            />
            <FormField
              error={errors.email?.message}
              label="Correo electrónico"
              placeholder="nombre@ejemplo.com"
              registration={register('email')}
              type="email"
            />

            <div>
              <span className="px-1 text-xs font-semibold uppercase tracking-wide text-[#3c4a46]">
                Contraseña
              </span>
              <div className="relative mt-1">
                <input
                  className="h-12 w-full rounded-lg border-2 border-transparent bg-[#f2f4f6] px-4 pr-12 outline-none transition focus:border-[#006b5f] focus:bg-white"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7a76]"
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
              <div className="mt-2 grid grid-cols-2 gap-2">
                {passwordChecks.map((check) => (
                  <span
                    className={[
                      'flex items-center gap-1 text-xs font-semibold uppercase',
                      check.met ? 'text-[#006d36]' : 'text-[#6b7a76]',
                    ].join(' ')}
                    key={check.label}
                  >
                    <CheckCircle size={14} />
                    {check.label}
                  </span>
                ))}
              </div>
            </div>

            <FormField
              error={errors.confirmPassword?.message}
              label="Confirmar contraseña"
              placeholder="••••••••"
              registration={register('confirmPassword')}
              type="password"
            />

            <label className="flex items-start gap-3 text-sm text-[#3c4a46]">
              <input
                className="mt-1 h-5 w-5 rounded border-[#6b7a76] text-[#006b5f]"
                type="checkbox"
                {...register('acceptedTerms')}
              />
              <span>Acepto los términos y condiciones y la política de privacidad.</span>
            </label>
            {errors.acceptedTerms?.message ? (
              <span className="block text-sm text-red-700">
                {errors.acceptedTerms.message}
              </span>
            ) : null}

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
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-6 border-t border-[#e0e3e5] pt-6 text-center text-[#3c4a46]">
            ¿Ya tienes una cuenta?{' '}
            <Link className="font-bold text-[#006b5f]" to="/login">
              Iniciar sesión
            </Link>
          </p>
        </AuthCard>
      </div>
    </div>
  );
}

function sanitizeNameInput(event: React.FormEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.replace(
    /[^\p{L}\s'-]/gu,
    '',
  );
}
