import { z } from 'zod';
import type { MhdFormField, MhdFormFileValue } from './Types';
import { mhdIsFormFileValue } from './Types';

const mhdEmployeeFileCategorySchema = z.enum([
  'general',
  'payroll',
  'i9',
  'medical',
  'benefits',
  'confidential',
  'supervisors',
  'hr',
  'private',
]);

export const mhdCreateFormInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Form name is required')
    .max(200, 'Form name must be 200 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be 1000 characters or fewer')
    .optional(),
  employeeFileCategory: mhdEmployeeFileCategorySchema.nullable().optional(),
  requiresEsignature: z.boolean().optional(),
  esignatureDocumentTemplateId: z.string().uuid().nullable().optional(),
  definition: z.record(z.string(), z.unknown()),
});

export function mhdBuildFormValuesSchema(
  fields: MhdFormField[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case 'content':
      case 'display_block':
      case 'page_break':
      case 'section':
        schema = z.unknown().optional().nullable();
        break;
      case 'email':
      case 'email_field':
        schema = z.string().email('Enter a valid email address');
        break;
      case 'number':
      case 'number_field':
      case 'currency':
      case 'price':
      case 'percentage':
      case 'rating':
      case 'rating_scale':
      case 'calculation':
        schema = z.coerce.number();
        break;
      case 'checkbox':
      case 'toggle':
      case 'yes_no':
        schema = z.boolean();
        break;
      case 'file':
      case 'file_upload':
        // The stored value is a Drive file *reference* (MhdFormFileValue), not raw bytes.
        schema = z.custom<MhdFormFileValue>((value) => mhdIsFormFileValue(value), {
          message: 'A file must be uploaded',
        });
        break;
      case 'notice_packet_acknowledgment':
        schema = z.boolean();
        break;
      case 'grid':
      case 'repeating_section':
      case 'repeating_table':
      case 'table':
        schema = z.array(z.record(z.string(), z.unknown()));
        break;
      case 'signature':
        schema = z.object({
          signerName: z.string().min(1, 'Signer name is required'),
          signedAt: z.string().optional(),
          signatureText: z.string().min(1, 'Signature is required'),
        });
        break;
      default:
        schema = z.string();
        break;
    }

    if (schema instanceof z.ZodString) {
      let stringSchema: z.ZodString = schema;
      if (field.validation?.minLength !== undefined) {
        stringSchema = stringSchema.min(
          field.validation.minLength,
          `Must be at least ${field.validation.minLength} characters`,
        );
      }
      if (field.validation?.maxLength !== undefined) {
        stringSchema = stringSchema.max(
          field.validation.maxLength,
          `Must be at most ${field.validation.maxLength} characters`,
        );
      }
      if (field.validation?.pattern) {
        stringSchema = stringSchema.regex(
          new RegExp(field.validation.pattern),
          'Does not match the required format',
        );
      }
      schema = stringSchema;
    }

    shape[field.id] = field.required ? schema : schema.optional().nullable();
  }

  return z.object(shape);
}
