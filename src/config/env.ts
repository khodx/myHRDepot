import { z } from 'zod';

const runtimeEnvSchema = z.object({
  VITE_APP_NAME: z.string().min(1),
  VITE_APP_ENV: z.enum(['development', 'test', 'staging', 'production']),
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_ATTACHMENT_UPLOAD_FUNCTION: z.string().min(1),
  VITE_SIGNATURE_EMAIL_FUNCTION: z.string().min(1),
  VITE_APP_VERSION: z.string().min(1),
  VITE_APP_URL: z.string().url(),
});

export const runtimeEnv = runtimeEnvSchema.parse({
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME ?? 'My HR Depot',
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV ?? 'development',
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_ATTACHMENT_UPLOAD_FUNCTION:
    import.meta.env.VITE_ATTACHMENT_UPLOAD_FUNCTION ?? 'mhd-drive-upload',
  VITE_SIGNATURE_EMAIL_FUNCTION:
    import.meta.env.VITE_SIGNATURE_EMAIL_FUNCTION ?? 'send-signature-email',
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION ?? '0.1.0',
  VITE_APP_URL: import.meta.env.VITE_APP_URL ?? 'http://localhost:5173',
});

export type RuntimeEnv = typeof runtimeEnv;
