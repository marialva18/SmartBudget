import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Target,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthBrand } from '../../features/auth/components/AuthBrand';
import { AuthCard } from '../../features/auth/components/AuthCard';
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
      acceptedTerms: false,
      confirmPassword: '',
      displayName: '',
      email: '',
      password: '',
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
    <div className="flex min-h-screen items-center justify-center bg-[#f7f1e4] px-4 py-6 sm:px-5 lg:px-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[#eadfc9] bg-white shadow-[0_26px_80px_rgba(72,53,24,0.14)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="hidden bg-[#063c36] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#a9ded4]">
              Primeros pasos
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight">
              Crea tu espacio financiero en Qori.
            </h1>
            <p className="mt-5 text-sm leading-6 text-[#dff5ef]">
              Organiza cuentas, movimientos y objetivos desde una estructura
              pensada para revisar tu dinero con claridad.
            </p>
          </div>

          <div className="my-8 grid gap-4">
            <RegisterStep
              icon={WalletCards}
              label="Cuentas"
              text="Define dónde se mueve tu dinero."
            />
            <RegisterStep
              icon={Target}
              label="Metas"
              text="Separa objetivos y reservas."
            />
            <RegisterStep
              icon={BarChart3}
              label="Análisis"
              text="Revisa patrones y decisiones."
            />
          </div>

          <div className="rounded-xl border border-[#d6a84f]/45 bg-[#d6a84f]/12 p-5">
            <div className="mb-3 flex items-center gap-2 font-semibold text-[#fff4d6]">
              <ShieldCheck size={18} />
              Acceso protegido
            </div>
            <p className="text-sm leading-6 text-[#fff4d6]">
              La verificación por correo confirma que la cuenta pertenece a la
              persona que la registra.
            </p>
          </div>
        </aside>

        <AuthCard className="rounded-none border-0 shadow-none">
          <div className="mb-6 lg:hidden">
            <AuthBrand />
          </div>

          <div className="mb-6">
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#00796b]">
              Registro
            </p>
            <h1 className="text-3xl font-extrabold text-[#16201d]">
              Crea tu cuenta
            </h1>
            <p className="mt-2 text-[#3c4a46]">
              Configura tu acceso y confirma tu correo para empezar.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormField
              error={errors.displayName?.message}
              label="Nombre completo"
              onInput={sanitizeNameInput}
              placeholder="Ej. María Pérez"
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

            <div className="rounded-xl border border-[#e0e3e5] bg-[#f8fbfa] p-4">
              <span className="px-1 text-xs font-semibold uppercase tracking-wide text-[#3c4a46]">
                Contraseña
              </span>
              <div className="relative mt-1">
                <input
                  className="h-12 w-full rounded-lg border border-[#dfe8e4] bg-white px-4 pr-12 outline-none transition focus:border-[#006b5f] focus:shadow-[0_0_0_4px_rgba(0,107,95,0.12)]"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                />
                <button
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
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
              <div className="mt-3 grid grid-cols-2 gap-2">
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
              <p
                className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
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
            aria-label="Cerrar información legal"
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

function RegisterStep({
  icon: Icon,
  label,
  text,
}: {
  icon: LucideIcon;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-white/12 bg-white/10 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/12 text-[#8ef3e4]">
          <Icon size={19} />
        </span>
        <div>
          <p className="font-black">{label}</p>
          <p className="mt-1 text-sm leading-6 text-[#dff5ef]">{text}</p>
        </div>
      </div>
    </div>
  );
}

function sanitizeNameInput(event: FormEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.replace(
    /[^\p{L}\s'-]/gu,
    '',
  );
}
