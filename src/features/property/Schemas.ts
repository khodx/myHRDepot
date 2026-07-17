import { z } from 'zod';
import {
  MHD_PROPERTY_CATEGORIES,
  MHD_PROPERTY_ITEM_STATUSES,
} from './Types';

export const mhdCreatePropertyItemSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  category: z.enum(MHD_PROPERTY_CATEGORIES),
  name: z.string().min(1, 'Item name is required').max(160, 'Name must be 160 characters or fewer'),
  description: z.string().max(2000).optional().nullable(),
  serialNumber: z.string().max(120).optional().nullable(),
  quantityTotal: z.number().int().positive('Quantity must be greater than 0').default(1),
  unitCost: z.number().nonnegative('Unit cost cannot be negative').optional().nullable(),
  acquisitionDate: z.string().optional().nullable(),
});

export type MhdCreatePropertyItemSchemaInput = z.infer<typeof mhdCreatePropertyItemSchema>;

export const mhdUpdatePropertyItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(160, 'Name must be 160 characters or fewer'),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(MHD_PROPERTY_ITEM_STATUSES),
  conditionNotes: z.string().max(2000).optional().nullable(),
});

export type MhdUpdatePropertyItemSchemaInput = z.infer<typeof mhdUpdatePropertyItemSchema>;

export const mhdIssuePropertySchema = z.object({
  propertyItemId: z.string().min(1, 'Property item is required'),
  personId: z.string().min(1, 'Employee is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  issuerTitle: z.string().max(120).optional().nullable(),
  issuanceConditionNotes: z.string().max(2000).optional().nullable(),
  employeeAckReceipt: z.boolean().refine((value) => value, {
    message: 'Employee must acknowledge receipt of the property',
  }),
  employeeAckMaintain: z.boolean().refine((value) => value, {
    message: 'Employee must agree to maintain and return the property',
  }),
  employeeAckReportLoss: z.boolean().refine((value) => value, {
    message: 'Employee must agree to report loss/damage and work-use-only terms',
  }),
  employeeAckPolicy: z.boolean().refine((value) => value, {
    message: 'Employee must acknowledge the discipline policy',
  }),
  employeeSignatureName: z.string().min(1, 'Employee signature (typed full name) is required'),
});

export type MhdIssuePropertySchemaInput = z.infer<typeof mhdIssuePropertySchema>;

export const mhdReturnPropertySchema = z.object({
  receiverTitle: z.string().max(120).optional().nullable(),
  returnConditionNotes: z.string().max(2000).optional().nullable(),
  returnAckReturned: z.boolean().refine((value) => value, {
    message: 'Employee must acknowledge the property has been returned',
  }),
  returnAckMaintained: z.boolean().refine((value) => value, {
    message: 'Employee must confirm the property was maintained per company standards',
  }),
  returnAckLiability: z.boolean().refine((value) => value, {
    message: 'Employee must acknowledge the liability terms',
  }),
  employeeReturnSignatureName: z.string().min(1, 'Employee signature (typed full name) is required'),
});

export type MhdReturnPropertySchemaInput = z.infer<typeof mhdReturnPropertySchema>;

export const mhdPropertyDispositionSchema = z.object({
  status: z.enum(['LOST', 'DAMAGED']),
  notes: z.string().max(2000).optional().nullable(),
});

export type MhdPropertyDispositionSchemaInput = z.infer<typeof mhdPropertyDispositionSchema>;
