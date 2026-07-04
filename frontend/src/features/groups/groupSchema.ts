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
  accountId: z.string().min(1, es.groups.validation.paymentAccount),
  splitMode: z.enum(['EQUAL', 'CUSTOM_AMOUNTS', 'PERCENTAGES']),
  participantMemberIds: z.array(z.string()),
  splits: z.array(
    z.object({
      memberId: z.string(),
      amount: z.number().optional(),
      percentage: z.number().optional(),
    }),
  ),
  occurredAt: z.string().optional(),
}).superRefine((value, context) => {
  if (value.splitMode === 'EQUAL' && value.participantMemberIds.length === 0) {
    context.addIssue({
      code: 'custom',
      message: es.groups.validation.participants,
      path: ['participantMemberIds'],
    });
  }

  if (value.splitMode === 'CUSTOM_AMOUNTS') {
    const total = value.splits.reduce(
      (sum, split) => sum + (split.amount ?? 0),
      0,
    );
    if (Math.abs(total - value.amount) > 0.0001) {
      context.addIssue({
        code: 'custom',
        message: es.groups.validation.customSplits,
        path: ['splits'],
      });
    }
  }

  if (value.splitMode === 'PERCENTAGES') {
    const total = value.splits.reduce(
      (sum, split) => sum + (split.percentage ?? 0),
      0,
    );
    if (Math.abs(total - 100) > 0.0001) {
      context.addIssue({
        code: 'custom',
        message: es.groups.validation.percentageSplits,
        path: ['splits'],
      });
    }
  }
});

export const groupSettlementSchema = z.object({
  fromMemberId: z.string().min(1, es.groups.validation.settlementFrom),
  toMemberId: z.string().min(1, es.groups.validation.settlementTo),
  accountId: z.string().min(1, es.groups.validation.settlementAccount),
  amount: z
    .number({ message: es.groups.validation.settlementAmount })
    .min(0.01, es.groups.validation.settlementAmount)
    .max(999_999_999_999, es.groups.validation.highSettlementAmount),
  currency: z.enum(['PEN', 'USD']),
  note: z.string().trim().max(250).optional(),
  settledAt: z.string().optional(),
});

export type GroupFormValues = z.infer<typeof groupSchema>;
export type GroupInvitationFormValues = z.infer<typeof groupInvitationSchema>;
export type GroupExpenseFormValues = z.infer<typeof groupExpenseSchema>;
export type GroupSettlementFormValues = z.infer<typeof groupSettlementSchema>;
