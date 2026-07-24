import { z } from 'zod';

export const mhdApprovalRequestFormSchema = z.object({
  companyId: z.string().min(1, 'Company is required.'),
  entityType: z.enum(['TASK', 'SUBTASK', 'REASSIGNMENT', 'CUSTOM']),
  entityId: z.string().min(1, 'Entity is required.'),
  approvalType: z.enum(['APPROVAL_REQUIRED', 'APPROVAL_FOR_INFO', 'APPROVAL_TO_ASSIGN']),
  chainMode: z.enum(['SEQUENTIAL', 'PARALLEL']),
  approverIds: z.array(z.string().min(1)).min(1, 'Select at least one approver.'),
  reason: z.string().trim().max(2000, 'Reason cannot exceed 2,000 characters.'),
});

export type MhdApprovalRequestFormValues = z.infer<typeof mhdApprovalRequestFormSchema>;

export const mhdApprovalDecisionFormSchema = z.object({
  approvalId: z.string().min(1),
  comment: z.string().trim().max(2000, 'Comment cannot exceed 2,000 characters.'),
});

export type MhdApprovalDecisionFormValues = z.infer<typeof mhdApprovalDecisionFormSchema>;

export const mhdApprovalRejectionFormSchema = z.object({
  approvalId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(1, 'A rejection reason is required.')
    .max(2000, 'Reason cannot exceed 2,000 characters.'),
});

export type MhdApprovalRejectionFormValues = z.infer<typeof mhdApprovalRejectionFormSchema>;
