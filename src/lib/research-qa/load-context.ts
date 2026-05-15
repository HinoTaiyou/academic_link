import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResearchQaContext } from "./answer";

async function authorNameFor(
  supabase: SupabaseClient,
  authorId: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("real_name")
    .eq("id", authorId)
    .maybeSingle();
  return (data?.real_name as string | null)?.trim() || "研究者";
}

export async function loadResearchQaContextFromPost(
  supabase: SupabaseClient,
  researchPostId: string,
): Promise<
  | { ok: true; context: ResearchQaContext; authorId: string; title: string }
  | { ok: false; status: number; error: string }
> {
  const { data: post, error: postErr } = await supabase
    .from("research_posts")
    .select("id, author_id, title, summary, tags, raw_text")
    .eq("id", researchPostId)
    .maybeSingle();

  if (postErr) {
    return { ok: false, status: 500, error: "研究情報の取得に失敗しました。" };
  }
  if (!post) {
    return { ok: false, status: 404, error: "研究が見つかりません。" };
  }

  const summary = (post.summary as string) ?? "";
  const rawText = (post.raw_text as string) ?? "";
  if (!summary.trim() && !rawText.trim()) {
    return {
      ok: false,
      status: 422,
      error: "この研究には回答に使える公開テキストがありません。",
    };
  }

  const authorId = post.author_id as string;
  return {
    ok: true,
    authorId,
    title: (post.title as string) ?? "",
    context: {
      authorName: await authorNameFor(supabase, authorId),
      title: (post.title as string) ?? "",
      summary,
      tags: ((post.tags as string[]) ?? []).filter(Boolean),
      rawText,
    },
  };
}

export async function loadResearchQaContextFromProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<
  | { ok: true; context: ResearchQaContext; authorId: string; title: string }
  | { ok: false; status: number; error: string }
> {
  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .select("id, owner_id, name, description, archived")
    .eq("id", projectId)
    .maybeSingle();

  if (projectErr) {
    return { ok: false, status: 500, error: "プロジェクトの取得に失敗しました。" };
  }
  if (!project || project.archived) {
    return { ok: false, status: 404, error: "プロジェクトが見つかりません。" };
  }

  const authorId = project.owner_id as string;

  const { data: files } = await supabase
    .from("project_files")
    .select("title, summary, tags, raw_text")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(3);

  const parts: string[] = [];
  for (const doc of files ?? []) {
    const t = (doc.title as string)?.trim();
    const s = (doc.summary as string)?.trim();
    const r = (doc.raw_text as string)?.trim().slice(0, 2500);
    if (t) parts.push(`【${t}】`);
    if (s) parts.push(s);
    if (r) parts.push(r);
  }

  const projectDesc = (project.description as string)?.trim() ?? "";
  const rawText = parts.join("\n\n") || projectDesc;
  const summary =
    (files?.[0]?.summary as string)?.trim() ||
    projectDesc ||
    (project.name as string)?.trim() ||
    "";

  if (!summary.trim() && !rawText.trim()) {
    return {
      ok: false,
      status: 422,
      error: "このプロジェクトには回答に使えるテキストがありません。",
    };
  }

  const title = (project.name as string) || "研究プロジェクト";
  const tags = ((files?.[0]?.tags as string[]) ?? []).filter(Boolean);

  return {
    ok: true,
    authorId,
    title,
    context: {
      authorName: await authorNameFor(supabase, authorId),
      title,
      summary,
      tags,
      rawText,
    },
  };
}
