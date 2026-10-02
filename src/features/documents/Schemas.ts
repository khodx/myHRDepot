import { z } from 'zod';
import {
  MHD_DOCUMENT_BRANDING_FONTS,
  MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORIES,
  MHD_DOCUMENT_SOURCE_WIZARDS,
} from './Types';

const mhdMergeFieldSchema = z.object({
  path: z.string().trim().min(1, 'Merge field path is required.'),
  label: z.string().trim().min(1, 'Merge field label is required.'),
  source: z.enum([
    'person',
    'company',
    'user',
    'task',
    'system',
    'custom',
    'record',
    'handbook',
    'narrative',
  ]),
});

export const mhdDocumentTemplateFormSchema = z.object({
  companyId: z.string().nullable(),
  name: z.string().trim().min(2, 'Template name must be at least 2 characters.'),
  templateType: z.enum([
    'OFFER_LETTER',
    'CONTRACT',
    'FORM',
    'CERTIFICATE',
    'CORRESPONDENCE',
    'REPORT',
  ]),
  contentFormat: z.enum(['HTML', 'DOCX', 'MARKDOWN']),
  content: z.string().trim().min(1, 'Template content is required.'),
  mergeFields: z.array(mhdMergeFieldSchema).default([]),
  description: z.string().trim().max(500).optional(),
  requiresSignature: z.boolean().default(false),
  isActive: z.boolean().default(true),
  applicableEntityType: z.string().trim().optional().nullable(),
});

export type MhdDocumentTemplateFormValues = z.infer<typeof mhdDocumentTemplateFormSchema>;

/** The server screen (`mhd_document_assert_no_prohibited_content`) uses the same language; this lets forms fail fast. */
export const mhdDocumentProhibitedMedicalDetailPattern =
  /\b(diagnos(?:is|ed|es)|medical records?|caused by|genetic information)\b/i;

const mhdSafeString = (max: number) =>
  z
    .string()
    .max(max)
    .refine((value) => !mhdDocumentProhibitedMedicalDetailPattern.test(value), {
      message: 'This content includes prohibited medical detail.',
    });

export const mhdDocumentMergeOverridesSchema = z.record(
  z.string().regex(/^(person|company|record|custom)\.[a-z0-9_.]+$/i),
  z.union([mhdSafeString(2000), z.number(), z.boolean(), z.null()]),
);

export const mhdDocumentNarrativeSectionsSchema = z.record(
  z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),
  mhdSafeString(8000),
);

export const mhdDocumentNarrativeSlotSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),
  label: z.string().trim().min(1),
  help: z.string().optional(),
});

export const mhdDocumentNarrativeSlotsSchema = z
  .array(mhdDocumentNarrativeSlotSchema)
  .refine((slots) => new Set(slots.map((slot) => slot.key)).size === slots.length, {
    message: 'Narrative slot keys must be unique.',
  });

export const mhdDocumentBrandingFormSchema = z.object({
  headerText: z.string().max(200).nullable().optional(),
  footerText: z.string().max(400).nullable().optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'The accent color must be a six-digit hex value such as #0003AA'),
  fontFamily: z.enum(MHD_DOCUMENT_BRANDING_FONTS, {
    message:
      'Choose one of the supported fonts: Arial, Calibri, Georgia, Helvetica or Times New Roman',
  }),
  logoDataUri: z
    .string()
    .max(400000, 'The logo must be a PNG, JPEG or GIF image of about 300 KB or less')
    .regex(
      /^data:image\/(png|jpeg|gif);base64,[A-Za-z0-9+/=]+$/,
      'The logo must be a PNG, JPEG or GIF image of about 300 KB or less',
    )
    .nullable(),
  showReferenceId: z.boolean(),
});

export const mhdEnqueueDocumentSchema = z.object({
  companyId: z.string().min(1),
  templateKey: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  entityType: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  entityId: z.string().min(1),
  sourceWizard: z.enum(MHD_DOCUMENT_SOURCE_WIZARDS),
  wizardInputs: z.record(z.string(), z.unknown()).optional(),
  mergeOverrides: mhdDocumentMergeOverridesSchema.optional(),
  narrativeSections: mhdDocumentNarrativeSectionsSchema.optional(),
  outputFormat: z.enum(['HTML', 'PDF', 'DOCX']).optional(),
  requiresSignature: z.boolean().optional(),
  employeeFileCategory: z.enum([...MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORIES, 'NONE']).optional(),
});
