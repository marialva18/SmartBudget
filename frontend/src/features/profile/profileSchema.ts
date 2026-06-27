import { z } from 'zod';
import { es } from '../../i18n/es';

const optionalExpenseLimitSchema = z
  .number({
    error: es.settings.validation.maxExpenseAmount,
  })
  .min(1, es.settings.validation.maxExpenseAmount)
  .max(999_999_999, es.settings.validation.maxExpenseAmount)
  .nullable();

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, es.settings.validation.shortName)
    .max(120, es.settings.validation.longName)
    .regex(/^[\p{L}\s'-]+$/u, es.settings.validation.invalidName),

  preferredCurrency: z.enum(['PEN', 'USD']),

  timezone: z.string().trim().min(1, es.settings.validation.timezone).max(80),

  theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']),

  aiEnabled: z.boolean(),

  highExpenseWarningPercent: z.union(
    [z.literal(30), z.literal(50), z.literal(70)],
    {
      error: es.settings.validation.highExpenseWarningPercent,
    },
  ),

  maxExpenseAmountPen: optionalExpenseLimitSchema,

  maxExpenseAmountUsd: optionalExpenseLimitSchema,
});

export type ProfileFormValues = z.infer<typeof profileSchema>;