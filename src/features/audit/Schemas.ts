import { z } from 'zod';
import type { MhdRetentionDecision } from './Types';

/** Matches the minimum enforced by mhd_retention_record_decision (0376). The
 *  server is the authority; this only gives the user the message before the
 *  round trip. */
export const MHD_RETENTION_REASON_MIN_LENGTH = 10;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface MhdRetentionDecisionSchemaContext {
  decision: MhdRetentionDecision;
  /** Current effective retention date (ISO date or timestamp) of the schedule. */
  effectiveExpiresAt: string;
  /** Today as an ISO date (YYYY-MM-DD), supplied by the caller. */
  today: string;
}

/**
 * Form validation for one disposition decision. EXTEND additionally requires
 * a date strictly after today and strictly after the current retention date,
 * mirroring the server's rule.
 */
export function createMhdRetentionDecisionSchema(context: MhdRetentionDecisionSchemaContext) {
  const currentExpiry = context.effectiveExpiresAt.slice(0, 10);
  return z
    .object({
      reason: z
        .string()
        .trim()
        .min(
          MHD_RETENTION_REASON_MIN_LENGTH,
          `Enter at least ${MHD_RETENTION_REASON_MIN_LENGTH} characters.`,
        ),
      extendUntil: z.string(),
    })
    .superRefine((value, ctx) => {
      if (context.decision !== 'EXTEND') return;
      if (!ISO_DATE_PATTERN.test(value.extendUntil)) {
        ctx.addIssue({
          code: 'custom',
          path: ['extendUntil'],
          message: 'Choose a new retention date.',
        });
        return;
      }
      if (value.extendUntil <= context.today) {
        ctx.addIssue({
          code: 'custom',
          path: ['extendUntil'],
          message: 'The new retention date must be after today.',
        });
      } else if (value.extendUntil <= currentExpiry) {
        ctx.addIssue({
          code: 'custom',
          path: ['extendUntil'],
          message: 'The new retention date must be after the current retention date.',
        });
      }
    });
}

export type MhdRetentionDecisionFormValues = z.infer<
  ReturnType<typeof createMhdRetentionDecisionSchema>
>;
