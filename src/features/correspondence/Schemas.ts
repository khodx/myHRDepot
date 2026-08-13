import { z } from 'zod';
import { MHD_CORRESPONDENCE_ENTITY_TYPES } from './Types';

const emailListSchema = z
  .string()
  .trim()
  .min(1, 'At least one recipient is required.')
  .transform((value) =>
    value
      .split(/[,\n;]/)
      .map((email) => email.trim())
      .filter(Boolean),
  )
  .refine((emails) => emails.length > 0, 'At least one recipient is required.')
  .refine((emails) => emails.every((email) => email.includes('@')), 'Enter valid email addresses.');

export const mhdNewCorrespondenceSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  subject: z.string().trim().min(1, 'Subject is required.').max(250, 'Subject is too long.'),
  recipientEmails: emailListSchema,
  ccEmails: z
    .string()
    .trim()
    .optional()
    .transform((value) =>
      (value ?? '')
        .split(/[,\n;]/)
        .map((email) => email.trim())
        .filter(Boolean),
    )
    .refine((emails) => emails.every((email) => email.includes('@')), 'Enter valid CC emails.'),
  body: z.string().trim().min(1, 'Message is required.').max(20000, 'Message is too long.'),
  entityType: z.string().trim().optional().nullable(),
  entityId: z.string().trim().optional().nullable(),
});

export const mhdReplyCorrespondenceSchema = z.object({
  recipientEmails: emailListSchema,
  ccEmails: z
    .string()
    .trim()
    .optional()
    .transform((value) =>
      (value ?? '')
        .split(/[,\n;]/)
        .map((email) => email.trim())
        .filter(Boolean),
    )
    .refine((emails) => emails.every((email) => email.includes('@')), 'Enter valid CC emails.'),
  body: z.string().trim().min(1, 'Message is required.').max(20000, 'Message is too long.'),
  inReplyToMessageId: z.string().trim().optional().nullable(),
});

export const mhdLinkCorrespondenceThreadSchema = z.object({
  entityType: z.enum(MHD_CORRESPONDENCE_ENTITY_TYPES),
  entityId: z.string().trim().min(1, 'Entity ID is required.'),
});

export const mhdCorrespondenceMailboxAliasSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  mailboxId: z.string().trim().min(1, 'Mailbox is required.'),
  aliasAddress: z
    .string()
    .trim()
    .min(1, 'Alias address is required.')
    .email('Enter a valid email address.')
    .max(320, 'Alias address is too long.'),
  isPrimary: z.boolean().default(true),
});

export type MhdNewCorrespondenceSchemaInput = z.infer<typeof mhdNewCorrespondenceSchema>;
export type MhdReplyCorrespondenceSchemaInput = z.infer<typeof mhdReplyCorrespondenceSchema>;
export type MhdLinkCorrespondenceThreadSchemaInput = z.infer<
  typeof mhdLinkCorrespondenceThreadSchema
>;
export type MhdCorrespondenceMailboxAliasSchemaInput = z.infer<
  typeof mhdCorrespondenceMailboxAliasSchema
>;
