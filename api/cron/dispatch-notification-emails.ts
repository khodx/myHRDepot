import { runCronProxy } from './_cronProxy';

// Schedule: vercel.json crons -> */5 * * * * (every 5 minutes).
export default async function handler(req: any, res: any) {
  await runCronProxy(req, res, 'dispatch-notification-emails');
}
