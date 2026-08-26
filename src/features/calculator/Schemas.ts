import { z } from 'zod';
import { mhdEvaluateFormula, mhdParseFormula } from './formulaEngine';
import { MHD_CALCULATOR_CATEGORIES, type MhdCalculatorInputField } from './Types';

// Re-exported so other features (e.g. the admin registry UI's live formula
// test panel) can reach the formula engine through this feature's public
// contract surface, per the project's cross-feature import boundary rule --
// `formulaEngine.ts` itself is an internal module, not one of
// Hook/Schemas/Service/Types.
export { mhdEvaluateFormula, mhdParseFormula };

const fieldSchema: z.ZodType<MhdCalculatorInputField> = z.object({
  key: z.string().trim().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Use a letter followed by letters, numbers, or underscores.'),
  label: z.string().trim().min(1, 'A field label is required.'),
  type: z.enum(['number', 'currency', 'percent', 'integer', 'select']),
  required: z.boolean(),
  min: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number().optional()),
  max: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number().optional()),
  step: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number().optional()),
  unit: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  defaultValue: z.union([z.number(), z.string()]).optional(),
});

export const mhdCalculatorTemplateFormSchema = z.object({
  templateKey: z.string().trim().min(1, 'A template key is required.').regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only.'),
  category: z.enum(MHD_CALCULATOR_CATEGORIES),
  title: z.string().trim().min(1, 'A title is required.'),
  description: z.string().trim().min(1, 'A description is required.'),
  icon: z.string().trim().min(1, 'An icon is required.'),
  inputFields: z.array(fieldSchema).min(1, 'At least one input field is required.'),
  formula: z.string().trim().min(1, 'A formula is required.'),
  resultLabel: z.string().trim().min(1, 'A result label is required.'),
  resultUnit: z.string().trim().optional().nullable(),
  resultDecimals: z.preprocess((v) => (v === '' || v == null ? v : Number(v)), z.number().int('Decimals must be a whole number.').min(0).max(6)),
}).superRefine((value, context) => {
  const parsed = mhdParseFormula(value.formula);
  if (!parsed.ok) {
    context.addIssue({ code: 'custom', path: ['formula'], message: parsed.error ?? 'Invalid formula.' });
    return;
  }
  const keys = new Set(value.inputFields.map((field) => field.key));
  for (const reference of parsed.fieldReferences) {
    if (!keys.has(reference)) {
      context.addIssue({ code: 'custom', path: ['formula'], message: `Formula references "${reference}", but no matching input field exists.` });
    }
  }
});

export type MhdCalculatorTemplateFormValues = z.infer<typeof mhdCalculatorTemplateFormSchema>;
