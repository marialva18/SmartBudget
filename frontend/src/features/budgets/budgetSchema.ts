import { z } from 'zod';
import { es } from '../../i18n/es';

export const budgetSchema = z.object({
  categoryId: z.string().optional(),
  amount: z
    .number({ message: es.budgets.validation.amount })
    .min(0.01, es.budgets.validation.amount)
    .max(999_999_999_999, es.budgets.validation.highAmount),
  currency: z.enum(['PEN', 'USD']),
  monthStart: z.string().regex(/^\d{4}-\d{2}-01$/, es.budgets.validation.month),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;
