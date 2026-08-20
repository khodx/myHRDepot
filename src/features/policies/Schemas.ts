import { z } from 'zod';
import { MHD_POLICY_CATEGORIES } from './Types';

export const mhdCreatePolicySchema = z.object({
  companyId: z.string().trim().min(1).nullable(),
  title: z.string().trim().min(1, 'A title is required.'),
  category: z.enum(MHD_POLICY_CATEGORIES),
  jurisdiction: z.string().trim().optional().nullable(),
});

export const mhdPublishPolicyVersionSchema = z.object({
  policyId: z.string().trim().min(1),
  content: z.string().trim().min(1, 'Policy content is required.'),
  requiresSignature: z.boolean(),
});

export const mhdAssignPolicyAcknowledgmentSchema = z.object({
  policyVersionId: z.string().trim().min(1, 'A published version is required.'),
  personIds: z.array(z.string().trim().min(1)).min(1, 'Choose at least one person.'),
});

export type MhdCreatePolicyFormValues = z.infer<typeof mhdCreatePolicySchema>;
export type MhdPublishPolicyVersionFormValues = z.infer<
  typeof mhdPublishPolicyVersionSchema
>;
