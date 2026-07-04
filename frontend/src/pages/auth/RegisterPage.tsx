import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { AuthImage } from '../../features/auth/components/AuthImage';
import { FormField } from '../../features/auth/components/FormField';
import {
  registerSchema,
  type RegisterFormValues,
} from '../../features/auth/schemas/authSchemas';
import { register as registerUser } from '../../features/auth/services/authApi';

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [legalView, setLegalView] = useState<LegalView | null>(null);
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
      const result = await registerUser(values);
      navigate(
        `/email-sent?mode=verify&message=${encodeURIComponent(result.message)}`,
      );
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'No se pudo crear la cuenta.',
      );
    }
  }

  return (
    <div className="qori-auth-surface flex min-h-screen items-center justify-center px-4 py-6 sm:px-5 lg:px-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-[#dde8e4] bg-white shadow-[0_18px_45px_rgba(9,60,54,0.08)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden overflow-hidden bg-[#063c36] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <AuthImage
            className="qori-auth-bg absolute inset-0 h-full w-full object-cover opacity-55"
            fallbackSrc="/images/qori_register_background.svg"
            src="/images/qori_register_background.png"
          />
          <div className="absolute inset-0 bg-[#063c36]/55" />
          <div className="relative z-10">
            <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[#89f5e7]">
              Empieza con calma
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight">
              Empieza a ordenar tu dinero.
            </h1>
            <p className="mt-5 text-lg text-white/90">
              Qori te acompaña paso a paso para entender tus gastos, cuidar tus
              metas y decidir con más tranquilidad.
            </p>
          </div>
          <div className="relative z-10 space-y-4">
            {['Entiende tus gastos', 'Cuida tu dinero', 'Avanza hacia tus metas'].map(
              (item) => (
                <div
                  className="qori-card-motion flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur"
                  key={item}
                >
                  <span className="rounded-lg bg-white/20 p-2">
                    <CheckCircle size={20} />
                  </span>
                  <span className="font-semibold">{item}</span>
                </div>
              ),
            )}
          </div>
          <div className="relative z-10 rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <ShieldCheck size={18} />
              Registro claro y seguro
            </div>
            <p className="text-sm leading-6 text-white/85">
              Te pedimos solo lo necesario para crear tu cuenta y ayudarte a
              ordenar tus finanzas desde el primer paso.
            </p>
          </div>
        </aside>

        <AuthCard className="rounded-none border-0 shadow-none">
          <div className="mb-6">
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#00796b]">
              Alta protegida
            </p>
            <h1 className="text-3xl font-extrabold">Crea tu cuenta</h1>
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
                  className="h-12 w-full rounded-lg border-2 border-transparent bg-[#f2f4f6] px-4 pr-12 outline-none transition focus:border-[#006b5f] focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,212,191,0.16)]"
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
                      'flex items-center gap-1 font-mono text-xs font-semibold uppercase tracking-[0.08em]',
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

            <label className="flex items-start gap-3 rounded-lg border border-[#e0e3e5] bg-[#f7f9fb] p-3 text-sm text-[#3c4a46]">
              <input
                className="mt-1 h-5 w-5 rounded border-[#6b7a76] text-[#006b5f]"
                type="checkbox"
                {...register('acceptedTerms')}
              />
              <span>
                Acepto los{' '}
                <button
                  className="font-bold text-[#006b5f] underline-offset-4 hover:underline"
                  onClick={(event) => {
                    event.preventDefault();
                    setLegalView('terms');
                  }}
                  type="button"
                >
                  términos y condiciones
                </button>{' '}
                y la{' '}
                <button
                  className="font-bold text-[#006b5f] underline-offset-4 hover:underline"
                  onClick={(event) => {
                    event.preventDefault();
                    setLegalView('privacy');
                  }}
                  type="button"
                >
                  política de privacidad
                </button>
                .
              </span>
            </label>
            {errors.acceptedTerms?.message ? (
              <span className="block text-sm text-red-700">
                {errors.acceptedTerms.message}
              </span>
            ) : null}

            {serverError ? (
              <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </p>
            ) : null}

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#006b5f] font-semibold text-white shadow-[0_10px_30px_rgba(13,148,136,0.18)] transition hover:bg-[#005047] active:scale-[0.98] disabled:opacity-70"
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
      {legalView ? (
        <LegalInfoModal
          onClose={() => setLegalView(null)}
          view={legalView}
        />
      ) : null}
    </div>
  );
}

type LegalView = 'terms' | 'privacy';

const legalContent: Record<
  LegalView,
  { title: string; description: string; items: string[] }
> = {
  terms: {
    title: 'Términos y condiciones',
    description:
      'Qori es una herramienta de organización financiera personal. Estos puntos resumen el uso esperado de la aplicación.',
    items: [
      'Debes registrar información real y mantener segura tu cuenta.',
      'La información que ingreses se usa para calcular saldos, movimientos, presupuestos, metas y análisis.',
      'Qori no reemplaza asesoría financiera profesional ni ejecuta operaciones bancarias reales.',
      'Puedes editar o eliminar información desde las opciones disponibles en la aplicación.',
      'El uso de la plataforma implica aceptar un manejo responsable de tus datos financieros.',
    ],
  },
  privacy: {
    title: 'Política de privacidad',
    description:
      'Qori protege tus datos personales y financieros para que solo se usen dentro de la experiencia de la aplicación.',
    items: [
      'Tus datos se usan para crear tu cuenta, autenticarte y mostrar tu información financiera.',
      'Tus contraseñas se almacenan protegidas y no se muestran en la interfaz.',
      'Los secretos del sistema no viven en el frontend ni se exponen al navegador.',
      'Tus cuentas, movimientos, metas, presupuestos y grupos se separan por usuario.',
      'Si activas funciones de IA, Qori puede usar información contextual para generar recomendaciones.',
    ],
  },
};

function LegalInfoModal({
  onClose,
  view,
}: {
  onClose: () => void;
  view: LegalView;
}) {
  const content = legalContent[view];

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
      <section className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#00796b]">
              Información legal
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#16201d]">
              {content.title}
            </h2>
          </div>
          <button
            className="grid size-9 place-items-center rounded-full bg-[#eef6f3] text-[#006b5f] transition hover:bg-[#d9eee8]"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#3c4a46]">
          {content.description}
        </p>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-[#3c4a46]">
          {content.items.map((item) => (
            <li className="flex gap-3" key={item}>
              <CheckCircle className="mt-1 shrink-0 text-[#006b5f]" size={16} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <button
          className="mt-6 h-11 w-full rounded-lg bg-[#006b5f] font-semibold text-white transition hover:bg-[#005047]"
          onClick={onClose}
          type="button"
        >
          Entendido
        </button>
      </section>
    </div>
  );
}

function sanitizeNameInput(event: React.FormEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.replace(
    /[^\p{L}\s'-]/gu,
    '',
  );
}
