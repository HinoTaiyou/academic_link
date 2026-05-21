import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get("limit") ?? "10", 10)));
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  try {
    // If no query, return recent posts
    if (!q) {
      const { data, error, count } = await supabase
        .from("research_posts")
        .select("id,title,summary,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return NextResponse.json({ data, count });
    }

    // Try RPC search function that leverages pg_trgm similarity ranking.
    // If RPC fails for any reason, fall back to a safe ilike search.
    try {
      const { data } = await supabase.rpc("search_research_posts", {
        _q: q,
        _limit: limit,
        _offset: offset,
      });

      const rows = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        created_at: r.created_at,
        score: r.score,
      }));

      return NextResponse.json({ data: rows, count: rows.length });
    } catch {
      // Attempt safe ilike fallback
      try {
        const likeQ = `%${q}%`;
        const filter = `title.ilike.${likeQ},summary.ilike.${likeQ}`;
        const { data: d2, error: e2, count } = await supabase
          .from("research_posts")
          .select("id,title,summary,created_at", { count: "exact" })
          .or(filter)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        if (e2) throw e2;
        return NextResponse.json({ data: d2, count });
      } catch (fallbackErr) {
        const message = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    if (error) throw error;
    return NextResponse.json({ data, count });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
