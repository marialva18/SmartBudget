import { z } from 'zod';

export const preferencesSchema = z.object({
  preferredCurrency: z.enum(['PEN', 'USD']),
  timezone: z.string().trim().min(1).max(80),
  theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']),
});

export const onboardingAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Ingresa un nombre de al menos 2 caracteres.')
    .max(120, 'El nombre es demasiado largo.')
    .regex(
      /^[\p{L}\s'-]+$/u,
      'El nombre solo puede contener letras, espacios, apóstrofos o guiones.',
    ),
  type: z.enum(['CASH', 'BANK', 'DIGITAL_WALLET']),
  currency: z.enum(['PEN', 'USD']),
  openingBalance: z
    .number({ error: 'Ingresa un saldo inicial válido.' })
    .min(0, 'El saldo inicial no puede ser negativo.')
    .max(999_999_999_999, 'El saldo inicial es demasiado alto.'),
});

export type PreferencesFormValues = z.infer<typeof preferencesSchema>;
export type OnboardingAccountFormValues = z.infer<
  typeof onboardingAccountSchema
>;

export type OnboardingObjective =
  | 'SAVE'
  | 'CONTROL_EXPENSES'
  | 'ORGANIZE_INCOME'
  | 'CREATE_BUDGET';
