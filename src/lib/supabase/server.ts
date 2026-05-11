import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Components / Server Actions / Route Handlers から使う Supabase クライアント。
 *
 * `setAll` 内の try/catch は、Server Component から呼ばれたときに
 * cookie を変更できないため `set()` が例外になるケースを握りつぶすためのもの
 * （middleware 側でセッションリフレッシュをするのでここでは無視してよい）。
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Component からの呼び出しは無視 */
          }
        },
      },
    },
  );
}
