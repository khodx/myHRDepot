import { z } from 'zod';
import {
  MHD_ACTIVITY_PARTICIPANT_ROLES,
  MHD_ACTIVITY_STATUSES,
  MHD_ACTIVITY_TYPES,
  MHD_SUB_ACTIVITY_STATUSES,
} from './Types';

export const mhdActivityParticipantRowSchema = z
  .object({
    userId: z.string().optional().nullable(),
    personId: z.string().optional().nullable(),
    role: z.enum(MHD_ACTIVITY_PARTICIPANT_ROLES),
  })
  .refine(
    (row) => {
      const hasUser = Boolean(row.userId && row.userId.trim().length > 0);
      const hasPerson = Boolean(row.personId && row.personId.trim().length > 0);
      return hasUser !== hasPerson;
    },
    { message: 'Each participant must target exactly one internal user or person.' },
  );

export const mhdActivityFormSchema = z
  .object({
    companyId: z.string().trim().min(1, 'Company is required.'),
    activityType: z.enum(MHD_ACTIVITY_TYPES),
    title: z
      .string()
      .min(1, 'Title is required.')
      .max(200, 'Title must be 200 characters or fewer.')
      .refine((value) => value.trim().length > 0, {
        message: 'Title cannot be blank.',
      }),
    personId: z.string().optional().nullable(),
    parentTaskId: z.string().optional().nullable(),
    descriptionPlainText: z.string().max(10000).optional().nullable(),
    descriptionRichText: z.unknown().optional().nullable(),
    status: z.enum(MHD_ACTIVITY_STATUSES).default('PLANNED'),
    scheduledAt: z.string().optional().nullable(),
    occurredAt: z.string().optional().nullable(),
    durationMinutes: z
      .number()
      .int('Duration must be a whole number of minutes.')
      .positive('Duration must be greater than 0.')
      .optional()
      .nullable(),
    location: z.string().max(300).optional().nullable(),
    outcomeSummary: z.string().max(10000).optional().nullable(),
    followUpTaskId: z.string().optional().nullable(),
    isConfidential: z.boolean().default(false),
    participants: z.array(mhdActivityParticipantRowSchema).default([]),
    actorUserId: z.string().optional().nullable(),
  })
  .refine(
    (form) =>
      form.status !== 'COMPLETED' || Boolean(form.occurredAt && form.occurredAt.trim().length > 0),
    {
      message: 'Occurred date/time is required when the activity is completed.',
      path: ['occurredAt'],
    },
  );

export const mhdSubActivitySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required.')
    .max(200, 'Title must be 200 characters or fewer.')
    .refine((value) => value.trim().length > 0, {
      message: 'Title cannot be blank.',
    }),
  descriptionPlainText: z.string().max(10000).optional().nullable(),
  status: z.enum(MHD_SUB_ACTIVITY_STATUSES).default('PLANNED'),
  scheduledAt: z.string().optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const mhdActivityBoardFilterSchema = z.object({
  companyId: z.string().default('ALL'),
  personId: z.string().default('ALL'),
  taskId: z.string().default('ALL'),
  activityType: z.union([z.enum(MHD_ACTIVITY_TYPES), z.literal('ALL')]).default('ALL'),
  status: z.union([z.enum(MHD_ACTIVITY_STATUSES), z.literal('ALL')]).default('ALL'),
  searchTerm: z.string().default(''),
  from: z.string().default(''),
  to: z.string().default(''),
});

export const mhdCompleteActivitySchema = z.object({
  occurredAt: z.string().trim().min(1, 'Occurred date/time is required.'),
  durationMinutes: z
    .number()
    .int('Duration must be a whole number of minutes.')
    .positive('Duration must be greater than 0.')
    .optional()
    .nullable(),
  outcomeSummary: z.string().max(10000).optional().nullable(),
});

export const mhdCreateFollowUpTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title is required.')
    .max(200, 'Task title must be 200 characters or fewer.'),
  descriptionPlainText: z.string().max(10000).optional().nullable(),
});

export type MhdActivityParticipantRowSchemaInput = z.infer<typeof mhdActivityParticipantRowSchema>;
export type MhdActivityFormSchemaInput = z.infer<typeof mhdActivityFormSchema>;
export type MhdSubActivitySchemaInput = z.infer<typeof mhdSubActivitySchema>;
export type MhdActivityBoardFilterSchemaInput = z.infer<typeof mhdActivityBoardFilterSchema>;
export type MhdCompleteActivitySchemaInput = z.infer<typeof mhdCompleteActivitySchema>;
export type MhdCreateFollowUpTaskSchemaInput = z.infer<typeof mhdCreateFollowUpTaskSchema>;
