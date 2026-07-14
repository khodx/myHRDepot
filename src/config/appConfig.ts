import { runtimeEnv } from '@/config/env';

export const appConfig = {
  appName: runtimeEnv.VITE_APP_NAME,
  appEnvironment: runtimeEnv.VITE_APP_ENV,
  supabaseUrl: runtimeEnv.VITE_SUPABASE_URL,
  supabaseAnonKey: runtimeEnv.VITE_SUPABASE_ANON_KEY,
  attachmentUploadFunctionName: runtimeEnv.VITE_ATTACHMENT_UPLOAD_FUNCTION,
  appVersion: runtimeEnv.VITE_APP_VERSION,
  appUrl: runtimeEnv.VITE_APP_URL,
} as const;
