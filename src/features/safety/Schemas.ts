import { z } from 'zod';

const classificationEnum = z.enum([
  'DEATH',
  'DAYS_AWAY_FROM_WORK',
  'JOB_TRANSFER_OR_RESTRICTION',
  'OTHER_RECORDABLE',
]);

const illnessTypeEnum = z.enum([
  'INJURY',
  'SKIN_DISORDER',
  'RESPIRATORY_CONDITION',
  'POISONING',
  'HEARING_LOSS',
  'ALL_OTHER_ILLNESSES',
]);

export const mhdOshaEstablishmentSchema = z.object({
  establishmentName: z.string().trim().min(1, 'Enter the establishment name.'),
  naicsCode: z.string().trim().min(1, 'Enter a NAICS code.'),
  addressStreet: z.string().trim().optional(),
  addressCity: z.string().trim().optional(),
  addressState: z
    .string()
    .trim()
    .length(2, 'Use the 2-letter state code.')
    .transform((value) => value.toUpperCase()),
  addressZip: z.string().trim().optional(),
  averageEmployeeCount: z.number().int().min(0),
  totalHoursWorkedYtd: z.number().min(0),
});

/**
 * Mirrors the `safety_incidents_subject_required` CHECK constraint: either a
 * linked person or a non-employee name is required, never neither.
 */
export const mhdSafetyIncidentSchema = z
  .object({
    establishmentId: z.string().uuid('Choose an establishment.'),
    dateOfIncident: z.string().min(1, 'Enter the date of the incident.'),
    whatHappened: z.string().trim().min(1, 'Describe what happened.'),
    injuryIllnessDescription: z.string().trim().min(1, 'Describe the injury or illness.'),
    classification: classificationEnum,
    personId: z.string().uuid().optional().nullable(),
    nonEmployeeName: z.string().trim().optional().nullable(),
    jobTitle: z.string().trim().optional(),
    timeOfIncident: z.string().optional(),
    locationDescription: z.string().trim().optional(),
    illnessType: illnessTypeEnum.optional().nullable(),
    daysAwayCount: z.number().int().min(0).default(0),
    daysRestrictedOrTransferredCount: z.number().int().min(0).default(0),
    isPrivacyCase: z.boolean().default(false),
  })
  .refine((value) => Boolean(value.personId) || Boolean(value.nonEmployeeName?.trim()), {
    message: 'Choose a person or enter a non-employee name.',
    path: ['nonEmployeeName'],
  });

export const mhdSafetyIncidentUpdateSchema = z.object({
  jobTitle: z.string().trim().optional(),
  locationDescription: z.string().trim().optional(),
  whatHappened: z.string().trim().min(1).optional(),
  injuryIllnessDescription: z.string().trim().min(1).optional(),
  classification: classificationEnum.optional(),
  illnessType: illnessTypeEnum.optional().nullable(),
  daysAwayCount: z.number().int().min(0).optional(),
  daysRestrictedOrTransferredCount: z.number().int().min(0).optional(),
  isPrivacyCase: z.boolean().optional(),
});

export const mhdOshaAnnualSummaryCertifySchema = z.object({
  certifyingOfficialName: z.string().trim().min(1, 'Enter the certifying official’s name.'),
  certifyingOfficialTitle: z.string().trim().min(1, 'Enter the certifying official’s title.'),
});
