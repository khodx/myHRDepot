import { z } from 'zod';

// ---------------------------------------------------------------------------
// Create offer
// ---------------------------------------------------------------------------

/**
 * Creating an offer against an application. `jobTitle` is required; every other
 * term is optional (an offer may be drafted before the salary / manager / dates
 * are settled and filled in before it is extended). `baseSalary` mirrors the
 * column CHECK (`>= 0`); the number input hands back a string, so preprocess maps
 * a blank field to `null` (unset — NOT zero) before the non-negative check.
 * `startDate` / `offerExpirationDate` are `<input type="date">` strings. This
 * schema validates the payload only; the RPC remains the authority on who may
 * create an offer (the three admin roles).
 */
export const mhdOfferFormSchema = z.object({
  applicationId: z.string().trim().min(1),
  jobTitle: z
    .string()
    .trim()
    .min(1, 'A job title is required.')
    .max(300, 'That title is longer than the record supports.'),
  startDate: z.string().trim().optional().nullable().or(z.literal('')),
  baseSalary: z.preprocess(
    (value) => (value === '' || value == null ? null : value),
    z
      .coerce.number({ error: 'Enter a salary as a number.' })
      .min(0, 'Salary cannot be negative.')
      .nullable(),
  ),
  payFrequency: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  employmentType: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  reportingManagerPersonId: z.string().trim().optional().nullable().or(z.literal('')),
  offerExpirationDate: z.string().trim().optional().nullable().or(z.literal('')),
  requiresApproval: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Decline / rescind (inline dialogs — a reason field, never window.prompt)
// ---------------------------------------------------------------------------

/**
 * Declining an offer (the candidate said no). A free-text reason is optional at
 * the RPC; the inline dialog captures it for an auditable trail. Never a
 * `window.prompt` / `window.confirm`.
 */
export const mhdDeclineOfferSchema = z.object({
  offerId: z.string().trim().min(1),
  reason: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
});

/**
 * Rescinding an offer (the company pulled it). Optional reason; the same inline
 * dialog shape as decline. The server refuses rescinding an ACCEPTED offer — that
 * is a termination, handled elsewhere — and that guard surfaces as an RPC error.
 */
export const mhdRescindOfferSchema = z.object({
  offerId: z.string().trim().min(1),
  reason: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Inferred form types
// ---------------------------------------------------------------------------

export type MhdOfferFormValues = z.infer<typeof mhdOfferFormSchema>;
export type MhdDeclineOfferFormValues = z.infer<typeof mhdDeclineOfferSchema>;
export type MhdRescindOfferFormValues = z.infer<typeof mhdRescindOfferSchema>;
