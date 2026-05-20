import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { target_type, target_id } = body;
  console.debug("[status] body:", body);
  if (!target_type || !target_id) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const supabase = await createClient();
  const admin = createAdminClient() ?? supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.debug("[status] user:", user?.id ?? null);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // user-specific bookmark state only
  const [bookmarkRes, bookmarkCountRes] = await Promise.all([
    admin
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_type", target_type)
      .eq("target_id", target_id)
      .maybeSingle(),
    admin
      .from("bookmarks")
      .select("id", { count: "exact" })
      .eq("target_type", target_type)
      .eq("target_id", target_id),
  ]);

  return NextResponse.json({
    bookmarked: Boolean(bookmarkRes.data?.id),
    bookmark_count: bookmarkCountRes.count ?? 0,
  });
}
