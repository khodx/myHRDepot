import { runCronProxy } from './_cronProxy';

// Schedule: vercel.json crons -> 0 6 * * * (daily at 06:00 UTC).
export default async function handler(req: any, res: any) {
  await runCronProxy(req, res, 'certificate-expiry-sweep');
}
