import { z } from 'zod';

export const mhdMemorandumFormSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.'),
  body: z.string().trim().min(1, 'Enter the memorandum body.'),
  category: z.enum([
    'GENERAL',
    'POLICY_UPDATE',
    'FACILITIES',
    'SAFETY',
    'BENEFITS',
    'ORGANIZATIONAL',
    'COMPLIANCE',
    'OTHER',
  ]),
  requiresAcknowledgment: z.boolean(),
});

export type MhdMemorandumFormValues = z.infer<typeof mhdMemorandumFormSchema>;

export const mhdPublishMemorandumSchema = z.object({
  recipientPersonIds: z.array(z.string().uuid()).min(1, 'Select at least one recipient.'),
  audienceLabel: z.string().trim().optional().nullable(),
  sendEmail: z.boolean(),
});

export type MhdPublishMemorandumFormValues = z.infer<typeof mhdPublishMemorandumSchema>;
