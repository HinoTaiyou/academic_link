import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ unread_total: 0 });

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: false })
    .eq("to_id", user.id)
    .is("read_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ unread_total: count ?? 0 });
}
