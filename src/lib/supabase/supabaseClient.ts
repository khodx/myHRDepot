import { createClient } from '@supabase/supabase-js';
import { appConfig } from '@/config/appConfig';
import type { Database } from '@/types/database.types';

export const supabaseClient = createClient<Database>(
  appConfig.supabaseUrl,
  appConfig.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
