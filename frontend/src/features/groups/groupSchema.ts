import { z } from 'zod';
import { es } from '../../i18n/es';

export const groupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, es.groups.validation.shortName)
    .max(120, es.groups.validation.longName)
    .regex(/^[\p{L}\d\s'-]+$/u, es.groups.validation.invalidName),
  description: z.string().trim().max(500, es.groups.validation.longDescription).optional(),
});

export const groupInvitationSchema = z.object({
  email: z.string().trim().email(es.groups.validation.email),
});

export const groupExpenseSchema = z.object({
  description: z
    .string()
    .trim()
    .min(2, es.groups.validation.shortExpenseDescription)
    .max(250, es.groups.validation.longExpenseDescription)
    .regex(/^[\p{L}\d\s.,'()-]+$/u, es.groups.validation.invalidExpenseDescription),
  amount: z
    .number({ message: es.groups.validation.expenseAmount })
    .min(0.01, es.groups.validation.expenseAmount)
    .max(999_999_999_999, es.groups.validation.highExpenseAmount),
  currency: z.enum(['PEN', 'USD']),
  paidByMemberId: z.string().min(1, es.groups.validation.payer),
  participantMemberIds: z.array(z.string()).min(1, es.groups.validation.participants),
  occurredAt: z.string().optional(),
});

export type GroupFormValues = z.infer<typeof groupSchema>;
export type GroupInvitationFormValues = z.infer<typeof groupInvitationSchema>;
export type GroupExpenseFormValues = z.infer<typeof groupExpenseSchema>;
