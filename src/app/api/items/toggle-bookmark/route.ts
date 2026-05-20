import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { target_type, target_id } = body;
  const allowedTargetTypes = ["research_post", "project_file", "project", "profile"];
  console.debug("[toggle-bookmark] body:", body);
  if (!target_type || !target_id) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }
  if (!allowedTargetTypes.includes(target_type)) {
    return NextResponse.json(
      { error: `unsupported target_type: ${target_type}` },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const admin = createAdminClient() ?? supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.debug("[toggle-bookmark] user:", user?.id ?? null);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { data: existing } = await admin
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", target_type)
    .eq("target_id", target_id)
    .maybeSingle();

  if (existing?.id) {
    const { error: delError } = await admin.from("bookmarks").delete().eq("id", existing.id);
    console.debug("[toggle-bookmark] delete result error:", delError);
    if (delError) {
      console.error("[toggle-bookmark] delete failed:", delError.message);
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }
  } else {
    const { data: insData, error: insError } = await admin
      .from("bookmarks")
      .insert({ user_id: user.id, target_type, target_id });
    console.debug("[toggle-bookmark] insert result:", { insError, insData });
    if (insError) {
      console.error("[toggle-bookmark] insert failed:", insError.message);
      if (insError.code === "23514" && target_type === "profile") {
        return NextResponse.json(
          {
            error:
              "DB schema is outdated. bookmarks.target_type must allow 'profile'. Please run the latest supabase-schema.sql migration.",
            code: insError.code,
          },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: insError.message }, { status: 500 });
    }
  }

  const [{ data: bookmark }, bookmarkCountRes] = await Promise.all([
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
    bookmarked: Boolean(bookmark?.id),
    bookmark_count: bookmarkCountRes.count ?? 0,
  });
}
