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

export type MhdCreateCompanyFormValues = z.infer<typeof mhdCreateCompanySchema>;
export type MhdUpdateCompanyFormValues = z.infer<typeof mhdUpdateCompanySchema>;
export type MhdCompanyListFilterValues = z.infer<typeof mhdCompanyListFilterSchema>;
