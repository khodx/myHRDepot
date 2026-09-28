// Shared proxy for Vercel Cron Jobs -> Supabase Edge Functions.
//
// Vercel Cron Jobs can only invoke a path within this same deployment
// (vercel.json's `crons[].path`), never an external URL directly — so each
// cron target needs a thin serverless function here that Vercel calls, which
// then forwards to the real Supabase edge function (mhd_automation_drain,
// mhd_certificate_expiry_sweep, dispatch-notification-emails all require a
// service-role-backed caller and are not safe to expose to the browser).
//
// Two hops, one shared secret: Vercel automatically attaches
// `Authorization: Bearer <CRON_SECRET>` to requests it makes to a cron path
// when the CRON_SECRET env var is set (see Vercel's Cron Jobs docs) — this
// function verifies that inbound header, then forwards the SAME value as the
// bearer token the Supabase edge function already expects
// (MHD_CRON_DISPATCH_TOKEN), so one secret value covers both hops. Set
// CRON_SECRET in Vercel to the same value as the MHD_CRON_DISPATCH_TOKEN
// Supabase secret.

interface MinimalRequest {
  method?: string;
  headers: { authorization?: string | string[] };
}

interface MinimalResponse {
  status(code: number): MinimalResponse;
  json(body: unknown): void;
}

export async function runCronProxy(
  req: MinimalRequest,
  res: MinimalResponse,
  edgeFunctionName: string,
): Promise<void> {
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
    const response = await fetch(`${supabaseUrl}/functions/v1/${edgeFunctionName}`, {
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
