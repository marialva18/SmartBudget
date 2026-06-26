import { z } from 'zod';
import { es } from '../../i18n/es';

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, es.categories.validation.shortName)
    .max(100, es.categories.validation.longName)
    .regex(/^[\p{L}\s'-]+$/u, es.categories.validation.invalidName),
  type: z.enum(['INCOME', 'EXPENSE']),
  icon: z.enum([
    'tag',
    'heart',
    'shopping-bag',
    'utensils',
    'bus',
    'briefcase',
    'gift',
    'trending-up',
  ]),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
