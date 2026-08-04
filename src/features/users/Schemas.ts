import { z } from 'zod';

const mhdAuthRoleNameSchema = z.enum([
  'Platform Admin',
  'HR Partner',
  'Client Admin',
  'Client User',
  'Viewer',
]);

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
  roleName: mhdAuthRoleNameSchema.nullable(),
});

export type MhdUpdatePlatformUserFormValues = z.infer<typeof mhdUpdatePlatformUserSchema>;
export type MhdInvitePlatformUserFormValues = z.infer<typeof mhdInvitePlatformUserSchema>;
