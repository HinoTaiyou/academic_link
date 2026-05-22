import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ResearchSearchItem = {
  id: string;
  title: string;
  summary: string | null;
  created_at: string;
  score?: number;
};

type ProjectSearchItem = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

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
      return NextResponse.json({ researchPosts: data, projects: [], count });
    }

    const likeQ = `%${q}%`;
    const projectFilter = `name.ilike.${likeQ},description.ilike.${likeQ}`;

    const projectSearchPromise = supabase
      .from("projects")
      .select("id,name,description,created_at", { count: "exact" })
      .eq("archived", false)
      .or(projectFilter)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Try RPC search function that leverages pg_trgm similarity ranking.
    // If RPC fails for any reason, fall back to a safe ilike search.
    try {
      const { data } = await supabase.rpc("search_research_posts", {
        _q: q,
        _limit: limit,
        _offset: offset,
      });

      const researchPosts = (data ?? []).map((r: any): ResearchSearchItem => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        created_at: r.created_at,
        score: r.score,
      }));

      const { data: projectsData, count: projectCount } = await projectSearchPromise;
      const projects = (projectsData ?? []) as ProjectSearchItem[];

      return NextResponse.json({ researchPosts, projects, count: researchPosts.length, projectCount });
    } catch {
      // Attempt safe ilike fallback
      try {
        const filter = `title.ilike.${likeQ},summary.ilike.${likeQ}`;
        const { data: d2, error: e2, count } = await supabase
          .from("research_posts")
          .select("id,title,summary,created_at", { count: "exact" })
          .or(filter)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        if (e2) throw e2;
        const { data: projectsData, count: projectCount } = await projectSearchPromise;
        return NextResponse.json({ researchPosts: d2, projects: projectsData ?? [], count, projectCount });
      } catch (fallbackErr) {
        const message = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
