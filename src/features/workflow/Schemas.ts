import { z } from 'zod';
import type { MhdTransitionTaskInput } from './Types';

export const mhdTransitionTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID required'),
  toStatusId: z.string().min(1, 'Target status required'),
  reason: z.string().max(500, 'Reason max 500 chars').optional(),
}) satisfies z.ZodType<MhdTransitionTaskInput>;

export type MhdTransitionTaskSchemaInput = z.infer<typeof mhdTransitionTaskSchema>;
