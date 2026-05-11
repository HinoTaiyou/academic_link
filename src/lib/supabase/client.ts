import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Components / hooks 用 Supabase クライアント。
 * ブラウザの localStorage / cookie からセッションを読み書きする。
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
