import { z } from 'zod';

export const mhdCreateMessageThreadSchema = z
  .object({
    companyId: z.string().trim().min(1, 'Company is required.'),
    threadType: z.enum(['DIRECT', 'MODULE']),
    subject: z.string().trim().max(200, 'Subject must be 200 characters or fewer.').optional().nullable(),
    entityType: z.string().trim().optional().nullable(),
    entityId: z.string().trim().optional().nullable(),
    participantUserIds: z
      .array(z.string().trim().min(1, 'Participant is required.'))
      .min(1, 'At least one participant is required.'),
    initialBody: z
      .string()
      .trim()
      .min(1, 'Message is required.')
      .max(10000, 'Message must be 10,000 characters or fewer.'),
  })
  .refine(
    (input) =>
      input.threadType !== 'MODULE' ||
      (Boolean(input.entityType?.trim()) && Boolean(input.entityId?.trim())),
    {
      message: 'Module threads require an entity type and entity id.',
      path: ['entityId'],
    },
  );

export const mhdSendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Message is required.')
    .max(10000, 'Message must be 10,000 characters or fewer.'),
});

export type MhdCreateMessageThreadSchemaInput = z.infer<typeof mhdCreateMessageThreadSchema>;
export type MhdSendMessageSchemaInput = z.infer<typeof mhdSendMessageSchema>;
