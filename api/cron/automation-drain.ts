// Vercel Cron -> Supabase Edge Function proxy for mhd_automation_drain.
//
// Inlined rather than importing a shared helper: a prior version imported
// ./cronProxy from these three files, and Vercel's Node function builder
// silently failed to bundle the sibling module in production
// (ERR_MODULE_NOT_FOUND at runtime, confirmed via runtime logs across two
// separate deployments/commits) despite building successfully. Each
// zero-dependency file is bulletproof against that bundling ambiguity.
//
// Vercel Cron Jobs can only invoke a path within this same deployment, never
// an external URL directly — this function forwards to the real Supabase
// edge function, which requires a service-role-backed caller and is not
// safe to expose to the browser.
//
// Two hops, one shared secret: Vercel automatically attaches
// `Authorization: Bearer <CRON_SECRET>` to requests it makes to a cron path
// when the CRON_SECRET env var is set (see Vercel's Cron Jobs docs) — this
// function verifies that inbound header, then forwards the SAME value as
// the bearer token the Supabase edge function already expects
// (MHD_CRON_DISPATCH_TOKEN), so one secret value covers both hops. Set
// CRON_SECRET in Vercel to the same value as the MHD_CRON_DISPATCH_TOKEN
// Supabase secret.
//
// Schedule: vercel.json crons -> */5 * * * * (every 5 minutes).

export default async function handler(req: any, res: any) {
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
    const response = await fetch(`${supabaseUrl}/functions/v1/automation-drain`, {
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
