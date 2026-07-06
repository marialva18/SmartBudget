import { z } from 'zod';
import { es } from '../../../i18n/es';

export const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive(es.transactions.validation.amount),
  accountId: z.string().min(1, es.transactions.validation.account),
  categoryId: z.string().min(1, es.transactions.validation.category),
  occurredAt: z.string().min(1, es.transactions.validation.date),
  description: z.string().trim().max(250).optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const transferSchema = z
  .object({
    fromAccountId: z.string().min(1, es.transactions.validation.fromAccount),
    toAccountId: z.string().min(1, es.transactions.validation.toAccount),
    amount: z.number().positive(es.transactions.validation.amount),
    occurredAt: z.string().min(1, es.transactions.validation.date),
    description: z.string().trim().max(250).optional(),
  })
  .refine((values) => values.fromAccountId !== values.toAccountId, {
    message: es.transactions.validation.transferAccounts,
    path: ['toAccountId'],
  });

export type TransferFormValues = z.infer<typeof transferSchema>;
