import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SendCoachMessageDto } from './dto/send-coach-message.dto';

type Channel = 'WEB' | 'MOBILE';

type CoachProvider = 'GEMINI' | 'LOCAL';

type FinancialSummary = {
  preferredCurrency: string;
  activeAccountCount: number;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNetFlow: number;
  topExpenseCategories: Array<{
    name: string;
    amount: number;
  }>;
  activeGoals: Array<{
    name: string;
    targetAmount: number;
    savedAmount: number;
    currency: string;
  }>;
  pendingRecurringCount: number;
  monthlyTransactionCount: number;
};

@Injectable()
export class CoachService {
  private readonly logger = new Logger(CoachService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getUsage(userId: string) {
    const limit = this.getDailyLimit();
    const used = await this.countTodayMessages(userId);

    return {
      enabled: this.isCoachEnabled(),
      limit,
      used,
      remaining: Math.max(limit - used, 0),
    };
  }

  async sendMessage(userId: string, channel: Channel, dto: SendCoachMessageDto) {
    const usage = await this.getUsage(userId);

    if (usage.used >= usage.limit) {
      throw new BadRequestException(
        'Has alcanzado el límite diario del coach financiero. Podrás volver a usarlo mañana.',
      );
    }

    const message = dto.message.trim();
    const aiEnabled = await this.isUserAiEnabled(userId);
    const summary = await this.buildFinancialSummary(userId);
    const provider = this.isCoachEnabled() && aiEnabled ? 'GEMINI' : 'LOCAL';

    let answer: string;
    let resolvedProvider: CoachProvider = provider;

    if (provider === 'GEMINI') {
      try {
        answer = await this.askGemini(message, summary);
      } catch (error) {
        resolvedProvider = 'LOCAL';

        this.logger.warn(
          `Gemini failed. Falling back to local advice: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );

        answer = this.buildLocalAdvice(message, summary);
      }
    } else {
      answer = this.buildLocalAdvice(message, summary);
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'AI_COACH_MESSAGE_SENT',
        entity: 'AI_COACH',
        entityId: userId,
        channel,
        newValuesJson: JSON.stringify({
          provider: resolvedProvider,
          model:
            resolvedProvider === 'GEMINI'
              ? this.getGeminiModel()
              : 'local-fallback',
          messageLength: message.length,
        }),
      },
    });

    const used = usage.used + 1;

    return {
      answer,
      provider: resolvedProvider,
      usage: {
        enabled: usage.enabled,
        limit: usage.limit,
        used,
        remaining: Math.max(usage.limit - used, 0),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private async buildFinancialSummary(
    userId: string,
  ): Promise<FinancialSummary> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: {
        preferredCurrency: true,
      },
    });

    const preferredCurrency = profile?.preferredCurrency ?? 'PEN';

    const [
      accounts,
      balanceTransactions,
      monthlyTransactions,
      activeGoals,
      pendingRecurringCount,
    ] = await Promise.all([
      this.prisma.account.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          currency: preferredCurrency,
        },
        select: {
          id: true,
        },
      }),

      this.prisma.transaction.findMany({
        where: {
          userId,
          currency: preferredCurrency,
          deletedAt: null,
        },
        select: {
          type: true,
          amount: true,
        },
      }),

      this.prisma.transaction.findMany({
        where: {
          userId,
          currency: preferredCurrency,
          deletedAt: null,
          occurredAt: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 120,
                select: {
            type: true,
            amount: true,
            category: {
                select: {
                name: true,
                },
            },
            },
      }),

      this.prisma.goal.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          currency: preferredCurrency,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          name: true,
          targetAmount: true,
          currency: true,
          reservations: {
            where: {
              status: 'ACTIVE',
            },
            select: {
              amount: true,
            },
          },
        },
      }),

      this.prisma.recurringSchedule.count({
        where: {
          userId,
          status: 'ACTIVE',
          nextDueOn: {
            lte: today,
          },
        },
      }),
    ]);

    const totalBalance = balanceTransactions.reduce((total, transaction) => {
      const amount = toNumber(transaction.amount);

      if (transaction.type === 'EXPENSE') {
        return total - amount;
      }

      return total + amount;
    }, 0);

    const monthlyIncome = monthlyTransactions.reduce((total, transaction) => {
      if (transaction.type !== 'INCOME') {
        return total;
      }

      return total + toNumber(transaction.amount);
    }, 0);

    const monthlyExpense = monthlyTransactions.reduce((total, transaction) => {
      if (transaction.type !== 'EXPENSE') {
        return total;
      }

      return total + toNumber(transaction.amount);
    }, 0);

    const categoryTotals = new Map<string, number>();

    for (const transaction of monthlyTransactions) {
      if (transaction.type !== 'EXPENSE') {
        continue;
      }

      const categoryName = transaction.category?.name ?? 'Sin categoría';
      const currentAmount = categoryTotals.get(categoryName) ?? 0;

      categoryTotals.set(
        categoryName,
        currentAmount + toNumber(transaction.amount),
      );
    }

    const topExpenseCategories = [...categoryTotals.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 5);

    const goals = activeGoals.map((goal) => ({
      name: goal.name,
      targetAmount: toNumber(goal.targetAmount),
      savedAmount: goal.reservations.reduce(
        (total, reservation) => total + toNumber(reservation.amount),
        0,
      ),
      currency: goal.currency,
    }));

    return {
      preferredCurrency,
      activeAccountCount: accounts.length,
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlyNetFlow: monthlyIncome - monthlyExpense,
      topExpenseCategories,
      activeGoals: goals,
      pendingRecurringCount,
      monthlyTransactionCount: monthlyTransactions.length,
    };
  }

  private async askGemini(message: string, summary: FinancialSummary) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new ServiceUnavailableException('Gemini API key is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: this.getGeminiModel(),
      contents: this.buildPrompt(message, summary),
    });

    const answer = response.text?.trim();

    if (!answer) {
      throw new ServiceUnavailableException('Gemini did not return a response.');
    }

    return answer;
  }

  private buildPrompt(message: string, summary: FinancialSummary) {
    return `
Eres el coach financiero de SmartBudget, una app de finanzas personales para personas que quieren entender mejor su dinero sin sentirse juzgadas.

Personalidad:
- Habla en español latino, con tono cercano, tranquilo y amable.
- Inspira confianza, como un acompañante financiero, no como un banco ni como un profesor estricto.
- Usa frases naturales cuando encajen, como: "tranqui", "viendo tu mes", "podrías empezar por", "una buena idea sería".
- Sé claro y práctico, pero no alarmista.
- No regañes al usuario.
- No uses tono duro, autoritario ni culpabilizante.
- Evita sonar demasiado formal.
- No exageres con emojis. Si usas uno, máximo uno.

Reglas de seguridad:
- Responde solo con base en el resumen entregado.
- Si falta información, dilo con naturalidad.
- No inventes montos, cuentas, ingresos ni gastos.
- No digas que revisaste cuentas bancarias reales.
- No des asesoría financiera profesional; solo orientación educativa.
- No recomiendes préstamos, créditos ni inversiones riesgosas.
- No prometas resultados financieros.

Formato de respuesta:
- Máximo 180 palabras.
- Usa párrafos cortos.
- Puedes usar 2 o 3 viñetas si ayuda.
- Termina con una acción concreta y fácil de hacer hoy.

Resumen financiero del usuario:
${JSON.stringify(summary, null, 2)}

Pregunta del usuario:
${message}

Respuesta:
`.trim();
  }

  private buildLocalAdvice(message: string, summary: FinancialSummary) {
    const normalizedMessage = message.toLowerCase();
    const topCategory = summary.topExpenseCategories[0];

    const balanceText = formatMoney(
      summary.totalBalance,
      summary.preferredCurrency,
    );

    const expenseText = formatMoney(
      summary.monthlyExpense,
      summary.preferredCurrency,
    );

    if (summary.monthlyTransactionCount === 0) {
      return `Aún no tengo suficientes movimientos de este mes para darte un análisis completo, pero tranqui: con unos cuantos registros más ya podré detectar patrones útiles. Por ahora, tu saldo estimado en ${summary.preferredCurrency} es ${balanceText}. Una buena idea sería registrar tus gastos principales de comida, transporte y suscripciones.`;
    }

    if (
      normalizedMessage.includes('ahorro') ||
      normalizedMessage.includes('ahorrar') ||
      normalizedMessage.includes('meta')
    ) {
      return `Viendo tu mes, podrías empezar revisando tus gastos variables. Hasta ahora tienes ${expenseText} en gastos registrados. ${
        topCategory
          ? `Lo que más pesa es ${topCategory.name}, con ${formatMoney(
              topCategory.amount,
              summary.preferredCurrency,
            )}.`
          : ''
      } Una acción simple para hoy sería separar un monto pequeño apenas recibas ingresos y ponerle un límite semanal a esa categoría.`;
    }

    if (summary.monthlyNetFlow < 0) {
      return `Tranqui, esto se puede ordenar. Este mes tus gastos superan tus ingresos por ${formatMoney(
        Math.abs(summary.monthlyNetFlow),
        summary.preferredCurrency,
      )}. Lo primero sería revisar gastos no esenciales y pausar compras pequeñas que se repiten. No necesitas cambiar todo de golpe: empieza por una categoría esta semana.`;
    }

    return `Viendo tu mes, tu saldo estimado es ${balanceText} y registraste ${expenseText} en gastos. ${
      topCategory
        ? `La categoría que más destaca es ${topCategory.name}.`
        : ''
    } Una buena acción para hoy sería revisar si ese gasto se puede reducir un poco la próxima semana sin afectar lo necesario.`;
  }

  private async countTodayMessages(userId: string) {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const tomorrowStart = new Date(todayStart);

    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    return this.prisma.auditLog.count({
      where: {
        userId,
        action: 'AI_COACH_MESSAGE_SENT',
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    });
  }
    private async isUserAiEnabled(userId: string) {
    const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { aiEnabled: true },
    });

    return profile?.aiEnabled ?? true;
    }
  private isCoachEnabled() {
    return this.configService.get<boolean>('AI_COACH_ENABLED', false);
  }

  private getGeminiModel() {
    return this.configService.get<string>(
      'GEMINI_MODEL',
      'gemini-3-flash-preview',
    );
  }

  private getDailyLimit() {
    return this.configService.get<number>('AI_COACH_DAILY_LIMIT', 20) ?? 20;
  }
}

function toNumber(value: { toNumber: () => number } | number) {
  if (typeof value === 'number') {
    return value;
  }

  return value.toNumber();
}

function formatMoney(amount: number, currency: string) {
  const symbol = currency === 'USD' ? '$' : 'S/';

  return `${symbol} ${amount.toFixed(2)}`;
}