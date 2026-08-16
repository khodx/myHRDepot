import { z } from 'zod';

export const mhdQuoteSchema = z.object({
  quoteText: z
    .string()
    .trim()
    .min(1, 'Quote text is required.')
    .max(500, 'Quote text must be 500 characters or fewer.'),
  author: z
    .string()
    .trim()
    .max(120, 'Author must be 120 characters or fewer.')
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
});

export type MhdQuoteSchema = z.infer<typeof mhdQuoteSchema>;
