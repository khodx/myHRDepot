import { z } from 'zod';

export const mhdLoginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const mhdForgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});

export const mhdMagicLinkSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});

export const mhdResetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(8, 'Confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type MhdLoginFormValues = z.infer<typeof mhdLoginSchema>;
export type MhdForgotPasswordFormValues = z.infer<typeof mhdForgotPasswordSchema>;
export type MhdMagicLinkFormValues = z.infer<typeof mhdMagicLinkSchema>;
export type MhdResetPasswordFormValues = z.infer<typeof mhdResetPasswordSchema>;
