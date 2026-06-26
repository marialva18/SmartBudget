import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(72, 'La contraseña es demasiado larga.')
  .regex(/[A-Z]/, 'Incluye al menos una mayúscula.')
  .regex(/\d/, 'Incluye al menos un número.')
  .regex(/[^A-Za-z0-9]/, 'Incluye al menos un carácter especial.');

export const loginSchema = z.object({
  email: z.email('Ingresa un correo válido.'),
  password: z.string().min(8, 'Ingresa tu contraseña.'),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'Ingresa tu nombre.')
      .max(120, 'El nombre es demasiado largo.')
      .regex(
        /^[\p{L}\s'-]+$/u,
        'El nombre solo puede contener letras, espacios, apóstrofos o guiones.',
      ),
    email: z.email('Ingresa un correo válido.'),
    password: passwordSchema,
    confirmPassword: z.string().min(8, 'Confirma tu contraseña.'),
    acceptedTerms: z
      .boolean()
      .refine((value) => value, 'Debes aceptar los términos y condiciones.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.email('Ingresa un correo válido.'),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(8, 'Confirma tu contraseña.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
