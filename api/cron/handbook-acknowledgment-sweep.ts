/// <reference types="node" />
// Vercel Cron -> Supabase Edge Function proxy for mhd_handbook_acknowledgment_sweep.
// Inlined rather than importing a shared helper — see automation-drain.ts's
// header comment for why (Vercel silently failed to bundle a sibling module
// import in production).
//
// Schedule: vercel.json crons -> 30 6 * * * (daily at 06:30 UTC).

// Minimal structural types for the Vercel Node request/response. Declared
// locally (not imported from @vercel/node) to keep this file dependency-free —
// see the bundling note above.
interface CronRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}
interface CronResponse {
  status(code: number): { json(body: unknown): void };
}
export default async function handler(req: CronRequest, res: CronResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  const token = (authHeader ?? '').replace(/^Bearer\s+/i, '');

  if (!cronSecret || token !== cronSecret) {
    res.status(401).json({ success: false, error: 'Cron dispatch authorization is required.' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    res.status(500).json({ success: false, error: 'VITE_SUPABASE_URL is not configured.' });
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/handbook-acknowledgment-sweep`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });
    const body = await response.json();
    res.status(response.status).json(body);
  } catch (err) {
    res.status(502).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
