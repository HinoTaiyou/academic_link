import { createClient } from "@supabase/supabase-js";

/** 他ユーザーの公開 projects / project_files 読み取り用（service role）。未設定時は null。 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
