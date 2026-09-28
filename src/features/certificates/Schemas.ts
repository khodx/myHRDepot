import { z } from 'zod';
import { MHD_CERTIFICATE_CATEGORIES } from './Types';

export const mhdCertificateIssueFormSchema = z
  .object({
    category: z.enum(MHD_CERTIFICATE_CATEGORIES as [string, ...string[]]),
    personId: z.string().uuid('Select a person'),
    awardTitle: z.string().optional(),
    awardReason: z.string().optional(),
    newTitle: z.string().optional(),
    previousTitle: z.string().optional(),
    certificateTitle: z.string().optional(),
    certificateBody: z.string().optional(),
    expiresAt: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.category === 'AWARD' && !value.awardTitle?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['awardTitle'], message: 'Award title is required.' });
    }
    if (value.category === 'PROMOTION' && !value.newTitle?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['newTitle'], message: 'New title is required.' });
    }
    if (value.category === 'GENERAL_CERTIFICATE' && !value.certificateTitle?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['certificateTitle'],
        message: 'Certificate title is required.',
      });
    }
  });

export type MhdCertificateIssueFormValues = z.infer<typeof mhdCertificateIssueFormSchema>;
