import { z } from 'zod';
import {
  MHD_EMPLOYEE_FILE_REQUIREMENT_KINDS,
  MHD_EMPLOYEE_FILE_REQUIREMENT_STATES,
  MHD_EMPLOYEE_FILE_TYPE_KEYS,
} from './Types';

const kindValues = MHD_EMPLOYEE_FILE_REQUIREMENT_KINDS.map((kind) => kind.value) as [
  (typeof MHD_EMPLOYEE_FILE_REQUIREMENT_KINDS)[number]['value'],
  ...(typeof MHD_EMPLOYEE_FILE_REQUIREMENT_KINDS)[number]['value'][],
];

/**
 * Employee file requirement form. Mirrors the table CHECKs in migration 0379:
 * a form requirement needs a form, a document-template requirement needs a
 * template key, and at least one employment state must be selected.
 */
export const mhdEmployeeFileRequirementSchema = z
  .object({
    label: z.string().trim().min(1, 'Enter a label.'),
    category: z.enum(MHD_EMPLOYEE_FILE_TYPE_KEYS as [string, ...string[]], {
      message: 'Choose an employee file category.',
    }),
    satisfiedByKind: z.enum(kindValues, { message: 'Choose how this requirement is satisfied.' }),
    formId: z.string(),
    templateKey: z.string().trim(),
    appliesToStates: z
      .array(z.enum(MHD_EMPLOYEE_FILE_REQUIREMENT_STATES))
      .min(1, 'Choose at least one employment state.'),
    dueDaysAfterHire: z
      .string()
      .trim()
      .refine((value) => value === '' || /^\d+$/.test(value), {
        message: 'Due days must be a whole number of 0 or more.',
      }),
    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.satisfiedByKind === 'FORM_SUBMISSION' && value.formId === '') {
      context.addIssue({ code: 'custom', path: ['formId'], message: 'Choose a form.' });
    }
    if (value.satisfiedByKind === 'DOCUMENT_TEMPLATE' && value.templateKey === '') {
      context.addIssue({
        code: 'custom',
        path: ['templateKey'],
        message: 'Enter the document template key.',
      });
    }
  });

export type MhdEmployeeFileRequirementFormValues = z.infer<typeof mhdEmployeeFileRequirementSchema>;
