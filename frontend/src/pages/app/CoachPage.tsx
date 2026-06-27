import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  getCoachUsage,
  sendCoachMessage,
  type CoachMessageResponse,
} from '../../features/coach/coachApi';
import { ApiError } from '../../lib/api';

type ChatMessage = {
  id: string;
  role: 'USER' | 'COACH';
  content: string;
  provider?: CoachMessageResponse['provider'];
  generatedAt?: string;
};

const suggestedQuestions = [
  'Analiza mi mes y dime qué debería cuidar.',
  '¿Cómo puedo ahorrar un poco más esta semana?',
  '¿Qué categoría debería revisar primero?',
  'Dame una recomendación simple para hoy.',
];

export function CoachPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'COACH',
      content:
        'Hola, soy tu coach financiero de Qori. Puedo ayudarte a entender tus gastos, revisar tu mes y darte ideas simples para ordenar mejor tu dinero.',
      provider: 'LOCAL',
    },
  ]);

  const usageQuery = useQuery({
    queryKey: ['coach-usage'],
    queryFn: getCoachUsage,
  });

  const sendMutation = useMutation({
    mutationFn: sendCoachMessage,
    onSuccess: async (response) => {
      setError('');

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'COACH',
          content: response.answer,
          provider: response.provider,
          generatedAt: response.generatedAt,
        },
      ]);

      await queryClient.invalidateQueries({ queryKey: ['coach-usage'] });
    },
    onError: (reason) => {
      setError(
        reason instanceof ApiError
          ? reason.message
          : 'No pudimos responder con el coach financiero.',
      );
    },
  });

  const limit = usageQuery.data?.limit ?? 20;
  const used = usageQuery.data?.used ?? 0;
  const remaining = usageQuery.data?.remaining ?? limit;

  const isUsageLoading = usageQuery.isLoading || usageQuery.isFetching;
  const isUsageUnavailable = usageQuery.isError;
  const isDailyLimitReached = usageQuery.isSuccess && remaining <= 0;
  const isMessageDisabled =
    sendMutation.isPending ||
    isUsageLoading ||
    isUsageUnavailable ||
    isDailyLimitReached;

  const helperText = useMemo(() => {
    if (isUsageLoading) {
      return 'Consultando disponibilidad del coach...';
    }

    if (isUsageUnavailable) {
      return 'No pudimos consultar tu uso diario. Revisa si el backend está levantado.';
    }

    if (isDailyLimitReached) {
      return 'Llegaste al límite diario del coach. Podrás volver a usarlo mañana.';
    }

    return `Te quedan ${remaining} de ${limit} mensajes diarios.`;
  }, [
    isDailyLimitReached,
    isUsageLoading,
    isUsageUnavailable,
    limit,
    remaining,
  ]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = message.trim();

    if (trimmed.length < 3 || isMessageDisabled) {
      return;
    }

    setError('');

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: 'USER',
        content: trimmed,
      },
    ]);

    setMessage('');
    sendMutation.mutate(trimmed);
  }

  function handleSuggestedQuestion(question: string) {
    if (isMessageDisabled) {
      return;
    }

    setMessage(question);
  }

  return (
    <section className="space-y-6">
      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 p-6 text-white shadow-[0_18px_45px_rgba(13,148,136,0.25)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-sm font-semibold text-emerald-50">
              <Sparkles size={16} />
              Coach financiero con IA
            </p>

            <h1 className="mt-4 text-3xl font-bold">
              Hablemos de tu dinero sin estrés
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90">
              Pregunta sobre tus gastos, metas o hábitos del mes. Qori
              revisa un resumen de tus datos y te responde con recomendaciones
              claras, cercanas y accionables.
            </p>
          </div>

          <div className="rounded-2xl bg-white/12 p-4 text-sm backdrop-blur">
            <p className="font-semibold">Uso diario</p>
            <p className="mt-2 text-2xl font-bold">
              {used}/{limit}
            </p>
            <p className="mt-1 text-emerald-50/85">{helperText}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="flex min-h-[560px] flex-col rounded-2xl bg-white shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                <Bot size={20} />
              </span>

              <div>
                <h2 className="font-bold">Chat con Qori</h2>
                <p className="text-sm text-slate-500">
                  Orientación educativa, no asesoría financiera profesional.
                </p>
              </div>
            </div>

            <button
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
              onClick={() => usageQuery.refetch()}
              type="button"
            >
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((item) => (
              <article
                className={
                  item.role === 'USER'
                    ? 'ml-auto max-w-[85%] rounded-2xl bg-emerald-800 px-4 py-3 text-white'
                    : 'mr-auto max-w-[85%] rounded-2xl bg-slate-100 px-4 py-3 text-slate-800'
                }
                key={item.id}
              >
                <p className="whitespace-pre-line text-sm leading-6">
                  {item.content}
                </p>

                {item.role === 'COACH' && item.provider ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.provider === 'GEMINI'
                      ? 'Respuesta con Gemini'
                      : 'Respuesta local'}
                  </p>
                ) : null}
              </article>
            ))}

            {sendMutation.isPending ? (
              <div className="mr-auto inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                <Loader2 className="animate-spin" size={17} />
                Pensando una recomendación...
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="mx-5 mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <form
            className="border-t border-slate-100 p-4"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="min-h-12 flex-1 rounded-full bg-slate-100 px-5 outline-none focus:ring-2 focus:ring-emerald-700 disabled:opacity-60"
                disabled={isMessageDisabled}
                maxLength={500}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ejemplo: ¿cómo voy este mes?"
                value={message}
              />

              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 font-semibold text-white disabled:opacity-60"
                disabled={message.trim().length < 3 || isMessageDisabled}
                type="submit"
              >
                <Send size={18} />
                Enviar
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {helperText} Máximo 500 caracteres por mensaje.
            </p>
          </form>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(13,148,136,0.08)]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-teal-100 text-teal-800">
                <MessageCircle size={20} />
              </span>

              <div>
                <h2 className="font-bold">Ideas para preguntar</h2>
                <p className="text-sm text-slate-500">
                  Puedes empezar con una de estas preguntas.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {suggestedQuestions.map((question) => (
                <button
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-60"
                  disabled={isMessageDisabled}
                  key={question}
                  onClick={() => handleSuggestedQuestion(question)}
                  type="button"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <h2 className="font-bold">Importante</h2>
            <p className="mt-2 leading-6">
              El coach usa un resumen financiero de Qori para orientarte,
              pero no reemplaza asesoría financiera profesional. Sus respuestas
              son educativas y deben ayudarte a tomar mejores decisiones.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
