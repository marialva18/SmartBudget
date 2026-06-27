import { z } from 'zod';

export const recurringOperationTypes = ['INCOME', 'EXPENSE'] as const;
export const recurringFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;

export const recurringScheduleSchema = z
  .object({
    operationType: z.enum(recurringOperationTypes),
    accountId: z.string().min(1, 'Selecciona una cuenta.'),
    categoryId: z.string().min(1, 'Selecciona una categoría.'),
    amount: z
      .number({ error: 'Ingresa un monto válido.' })
      .min(0.0001, 'El monto debe ser mayor que cero.')
      .max(999_999_999_999, 'El monto supera el máximo permitido.'),
    description: z.string().max(250).optional(),
    frequency: z.enum(recurringFrequencies),
    intervalCount: z
      .number({ error: 'Ingresa un intervalo válido.' })
      .int('El intervalo debe ser entero.')
      .min(1, 'El intervalo mínimo es 1.')
      .max(12, 'El intervalo máximo es 12.'),
    startsOn: z.string().min(1, 'Selecciona una fecha de inicio.'),
    endsOn: z.string().optional(),
  })
  .refine(
    (values) => {
      if (!values.endsOn) {
        return true;
      }

      return values.endsOn >= values.startsOn;
    },
    {
      message: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
      path: ['endsOn'],
    },
  );

export type RecurringScheduleFormValues = z.infer<
  typeof recurringScheduleSchema
>;