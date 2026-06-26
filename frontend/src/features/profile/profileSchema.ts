import { z } from 'zod';
import { es } from '../../i18n/es';

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
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
