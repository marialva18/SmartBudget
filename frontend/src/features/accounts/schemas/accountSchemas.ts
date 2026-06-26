import { z } from 'zod';
import { es } from '../../../i18n/es';

export const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, es.accounts.validation.shortName)
    .max(120, es.accounts.validation.longName)
    .regex(/^[\p{L}\s'-]+$/u, es.accounts.validation.invalidName),
  type: z.enum(['CASH', 'BANK', 'DIGITAL_WALLET']),
  currency: z.enum(['PEN', 'USD']),
  openingBalance: z
    .number({ error: 'Ingresa un saldo inicial válido.' })
    .min(0, es.accounts.validation.negativeOpeningBalance)
    .max(999_999_999_999, es.accounts.validation.highOpeningBalance),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
