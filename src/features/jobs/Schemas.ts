import { z } from 'zod';
import {
  MHD_EMPLOYMENT_TYPES,
  MHD_FLSA_CLASSIFICATIONS,
  MHD_INDUSTRIES,
  MHD_PAY_PERIODS,
  MHD_QUALIFICATION_TYPES,
} from './Types';

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date.');

// O*NET-SOC codes look like 53-3032.00. Loose on purpose: the taxonomy is
// revised periodically and a strict pattern would reject a valid future code.
const onetSocCode = z
  .string()
  .trim()
  .regex(/^\d{2}-\d{4}(\.\d{2})?$/, 'Use an O*NET-SOC code, e.g. 53-3032.00');

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export const mhdJobFormSchema = z
  .object({
    companyId: z.string().trim().min(1, 'Company is required.'),
    jobTitle: z.string().trim().min(1, 'Job title is required.').max(200),
    jobCode: z.string().trim().max(60).optional().nullable(),
    jobFamily: z.string().trim().max(120).optional().nullable(),
    jobLevel: z.string().trim().max(60).optional().nullable(),
    department: z.string().trim().max(120).optional().nullable(),
    flsaClassification: z.enum(MHD_FLSA_CLASSIFICATIONS).optional().nullable(),
    employmentType: z.enum(MHD_EMPLOYMENT_TYPES).default('FULL_TIME'),
    isSafetySensitive: z.boolean().default(false),
    industry: z.enum(MHD_INDUSTRIES).default('GENERAL'),
    onetSocCode: onetSocCode.optional().nullable(),
    payMin: z.number().nonnegative().optional().nullable(),
    payMax: z.number().nonnegative().optional().nullable(),
    payPeriod: z.enum(MHD_PAY_PERIODS).optional().nullable(),
  })
  .refine((form) => form.payMin == null || form.payMax == null || form.payMax >= form.payMin, {
    message: 'The upper bound must be at or above the lower bound.',
    path: ['payMax'],
  })
  // A bound with no period is a number with no unit; an hourly 60000 and an
  // annual 60000 are very different claims about the same job.
  .refine((form) => (form.payMin == null && form.payMax == null) || Boolean(form.payPeriod), {
    message: 'Choose hourly or annual for the pay range.',
    path: ['payPeriod'],
  });

/**
 * Pay is a separate form because it is a separate authorisation: only Platform
 * Admin and HR Partner may read or write it, and the RPC refuses anyone else
 * regardless of what this validates.
 */
export const mhdPayRangeSchema = z
  .object({
    jobId: z.string().trim().min(1),
    payMin: z.number().nonnegative(),
    payMax: z.number().nonnegative(),
    payPeriod: z.enum(MHD_PAY_PERIODS),
  })
  .refine((form) => form.payMax >= form.payMin, {
    message: 'The upper bound must be at or above the lower bound.',
    path: ['payMax'],
  });

// ---------------------------------------------------------------------------
// Descriptions
// ---------------------------------------------------------------------------

export const mhdJobDescriptionDraftSchema = z.object({
  descriptionId: z.string().trim().min(1),
  summary: z.string().trim().max(5000).optional().nullable(),
  scopeOfRole: z.string().max(5000).optional().nullable(),
  supervisoryResponsibility: z.string().max(5000).optional().nullable(),
  travelRequirement: z.string().max(2000).optional().nullable(),
  workEnvironment: z.string().max(5000).optional().nullable(),
  physicalRequirements: z.string().max(5000).optional().nullable(),
});

/**
 * Essential and marginal functions.
 *
 * The essential/marginal split is not cosmetic — it is the reference point for
 * a reasonable-accommodation analysis and for defending an adverse action. The
 * publish gate below refuses a description with no essential function for that
 * reason, and the server refuses it independently.
 */
export const mhdJobFunctionsSchema = z.object({
  descriptionId: z.string().trim().min(1),
  functions: z
    .array(
      z.object({
        functionText: z.string().trim().min(1, 'A function needs text.').max(1000),
        isEssential: z.boolean().default(true),
      }),
    )
    .max(100),
});

export const mhdJobQualificationsSchema = z.object({
  descriptionId: z.string().trim().min(1),
  qualifications: z
    .array(
      z.object({
        qualificationText: z.string().trim().min(1, 'A qualification needs text.').max(1000),
        qualificationType: z.enum(MHD_QUALIFICATION_TYPES),
        // Required vs preferred is kept distinct deliberately: conflating them
        // narrows a candidate pool unnecessarily, and in some contexts unlawfully.
        isRequired: z.boolean().default(true),
      }),
    )
    .max(100),
});

export const mhdJobCompetenciesSchema = z.object({
  descriptionId: z.string().trim().min(1),
  competencies: z
    .array(
      z.object({
        competencyId: z.string().trim().min(1),
        weight: z.number().positive('A weight must be above zero.').max(999).optional().nullable(),
      }),
    )
    .refine(
      (list) => new Set(list.map((c) => c.competencyId)).size === list.length,
      'A competency cannot appear twice on one description.',
    ),
});

export const mhdPublishDescriptionSchema = z.object({
  descriptionId: z.string().trim().min(1),
  effectiveFrom: isoDate.optional().nullable(),
});

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export const mhdJobAssignmentSchema = z
  .object({
    personId: z.string().trim().min(1, 'Employee is required.'),
    jobId: z.string().trim().min(1, 'Job is required.'),
    effectiveFrom: isoDate,
    managerPersonId: z.string().optional().nullable(),
    note: z.string().max(2000).optional().nullable(),
  })
  .refine((form) => !form.managerPersonId || form.managerPersonId !== form.personId, {
    message: 'Somebody cannot manage themselves.',
    path: ['managerPersonId'],
  });

// ---------------------------------------------------------------------------
// Competencies
// ---------------------------------------------------------------------------

/**
 * `companyId: null` addresses a GLOBAL competency, which only Platform Admin
 * may create or edit — editing one changes what every other tenant resolves
 * against. The server asserts that independently; this schema cannot know the
 * caller's role, so it does not try.
 */
export const mhdCompetencySchema = z.object({
  companyId: z.string().trim().min(1).nullable(),
  competencyName: z.string().trim().min(1, 'A competency needs a name.').max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().trim().max(120).optional().nullable(),
  industry: z.enum(MHD_INDUSTRIES).default('GENERAL'),
  isRegulated: z.boolean().default(false),
  competencyId: z.string().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Inferred form types
// ---------------------------------------------------------------------------

export type MhdJobFormValues = z.infer<typeof mhdJobFormSchema>;
export type MhdPayRangeFormValues = z.infer<typeof mhdPayRangeSchema>;
export type MhdJobDescriptionDraftValues = z.infer<typeof mhdJobDescriptionDraftSchema>;
export type MhdJobFunctionsValues = z.infer<typeof mhdJobFunctionsSchema>;
export type MhdJobQualificationsValues = z.infer<typeof mhdJobQualificationsSchema>;
export type MhdJobCompetenciesValues = z.infer<typeof mhdJobCompetenciesSchema>;
export type MhdJobAssignmentValues = z.infer<typeof mhdJobAssignmentSchema>;
export type MhdCompetencyFormValues = z.infer<typeof mhdCompetencySchema>;
