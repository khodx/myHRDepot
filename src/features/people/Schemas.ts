import { z } from 'zod';

// email/phone/mobile here are form-level convenience fields, not `people`
// columns — Service.ts writes them through to `contact_methods` as the
// PRIMARY row of that contact_type. None are required at the schema level
// since `people` has no NOT NULL email column; a person may be
// created/updated with zero contact methods.
const optionalTrimmedText = z.string().trim().max(200).default('');

export const mhdPersonFormSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required.')
    .max(100, 'First name is too long.'),
  middleName: optionalTrimmedText,
  lastName: z.string().trim().min(1, 'Last name is required.').max(100, 'Last name is too long.'),
  preferredName: optionalTrimmedText,
  email: z
    .union([z.literal(''), z.string().trim().email('Enter a valid email address.')])
    .default(''),
  phone: optionalTrimmedText,
  mobile: optionalTrimmedText,
  managerId: z.string().trim().default(''),
});

export type MhdPersonFormValues = z.infer<typeof mhdPersonFormSchema>;

export function mhdPersonDisplayName(
  values: Pick<MhdPersonFormValues, 'firstName' | 'lastName' | 'preferredName'>,
): string {
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  const preferredName = values.preferredName.trim();
  return preferredName.length > 0
    ? `${preferredName} ${lastName}`.trim()
    : `${firstName} ${lastName}`.trim();
}
