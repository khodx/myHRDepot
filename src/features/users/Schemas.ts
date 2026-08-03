import { z } from 'zod';

export const mhdUpdatePlatformUserSchema = z.object({
  companyId: z.string().uuid('Select a company.'),
  personId: z.string().uuid().nullable(),
  isAdmin: z.boolean(),
});

export const mhdInvitePlatformUserSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  companyId: z.string().uuid('Select a company.'),
  personId: z.string().uuid().nullable(),
  isAdmin: z.boolean(),
});

export type MhdUpdatePlatformUserFormValues = z.infer<typeof mhdUpdatePlatformUserSchema>;
export type MhdInvitePlatformUserFormValues = z.infer<typeof mhdInvitePlatformUserSchema>;
