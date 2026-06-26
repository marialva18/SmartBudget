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

export type GroupFormValues = z.infer<typeof groupSchema>;
export type GroupInvitationFormValues = z.infer<typeof groupInvitationSchema>;
