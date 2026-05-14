import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isOnboardingIncomplete } from "@/lib/profile/onboarding";

/**
 * Next.js proxy で毎リクエスト Supabase セッションをリフレッシュし、
 * 未ログイン・オンボーディング未完了のルーティングを制御する。
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isAuthRoute = pathname.startsWith("/auth");
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isPublicAsset =
    pathname.startsWith("/_next") || pathname === "/favicon.ico";

  let onboardingIncomplete = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("interest_tags, research_fields")
      .eq("id", user.id)
      .maybeSingle();
    onboardingIncomplete = isOnboardingIncomplete(profile);
  }

  if (
    !user &&
    !isAuthPage &&
    !isPublicAsset &&
    pathname !== "/" &&
    !isAuthRoute
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = onboardingIncomplete ? "/onboarding" : "/dashboard";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    onboardingIncomplete &&
    !isOnboardingPage &&
    !isAuthRoute
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (user && !onboardingIncomplete && isOnboardingPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
