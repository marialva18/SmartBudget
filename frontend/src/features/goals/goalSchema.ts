import { z } from 'zod';
import { es } from '../../i18n/es';

export const goalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, es.goals.validation.shortName)
    .max(120, es.goals.validation.longName)
    .regex(/^[\p{L}\d\s'-]+$/u, es.goals.validation.invalidName),
  targetAmount: z
    .number({ message: es.goals.validation.targetAmount })
    .min(0.01, es.goals.validation.targetAmount)
    .max(999_999_999_999, es.goals.validation.highAmount),
  currency: z.enum(['PEN', 'USD']),
  targetDate: z
    .string()
    .optional()
    .refine(
      (value) => !value || value >= getTodayValue(),
      es.goals.validation.futureDate,
    ),
});

export const goalReservationSchema = z.object({
  accountId: z.string().min(1, es.goals.validation.account),
  amount: z
    .number({ message: es.goals.validation.reserveAmount })
    .min(0.01, es.goals.validation.reserveAmount)
    .max(999_999_999_999, es.goals.validation.highAmount),
  note: z.string().trim().max(250).optional(),
});

export type GoalFormValues = z.infer<typeof goalSchema>;
export type GoalReservationFormValues = z.infer<typeof goalReservationSchema>;

function getTodayValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(today.getDate()).padStart(2, '0')}`;
}
