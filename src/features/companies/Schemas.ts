import { z } from 'zod';

// Aligned to the `public.companies` schema (see Database.sql / Types.ts).
// There is no `is_active` column, so there is no `isActive` field or
// ACTIVE/INACTIVE list-filter status enum. `companyName` max length matches
// Field-Inventory.md's documented constraint of 200 characters.

const companyNameSchema = z
  .string()
  .trim()
  .min(2, 'Company name must be at least 2 characters.')
  .max(200, 'Company name must be 200 characters or fewer.');

const industrySchema = z.string().trim().max(200).nullish();
const employeeCountSchema = z.number().int().nonnegative().nullish();
const headquartersLocationSchema = z.string().trim().max(200).nullish();

export const mhdCreateCompanySchema = z.object({
  companyName: companyNameSchema,
  industry: industrySchema,
  employeeCount: employeeCountSchema,
  headquartersLocation: headquartersLocationSchema,
});

export const mhdUpdateCompanySchema = z.object({
  companyName: companyNameSchema,
  industry: industrySchema,
  employeeCount: employeeCountSchema,
  headquartersLocation: headquartersLocationSchema,
});

export const mhdCompanyListFilterSchema = z.object({
  searchTerm: z.string().trim().max(100).default(''),
});
export const mhdCompanyWorksiteSchema = z.object({
  companyId: z.string().uuid(),
  worksiteId: z.string().uuid().nullable().optional(),
  worksiteName: z.string().trim().min(1),
  addressStreet: z.string().trim().min(1),
  addressCity: z.string().trim().min(1),
  addressState: z.string().regex(/^[A-Za-z]{2}$/),
  addressZip: z.string().trim().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isActive: z.boolean().default(true),
});
export const mhdPersonWorksiteAssignmentSchema = z.object({
  personId: z.string().uuid(),
  worksiteId: z.string().uuid(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type MhdCreateCompanyFormValues = z.infer<typeof mhdCreateCompanySchema>;
export type MhdUpdateCompanyFormValues = z.infer<typeof mhdUpdateCompanySchema>;
export type MhdCompanyListFilterValues = z.infer<typeof mhdCompanyListFilterSchema>;
