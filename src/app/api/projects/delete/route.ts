import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteResearchPdf } from "@/lib/supabase/delete-research-pdf";
import { deleteRowsAsOwner } from "@/lib/supabase/owner-verified-delete";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const projectId = String(body.projectId ?? "").trim();

    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: "projectId が必要です" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "ログインが必要です" }, { status: 401 });
    }

    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id, owner_id, name")
      .eq("id", projectId)
      .eq("archived", false)
      .maybeSingle();

    if (projErr) {
      console.error("project select", projErr);
      return NextResponse.json({ ok: false, error: "プロジェクトの確認に失敗しました" }, { status: 500 });
    }
    if (!project || project.owner_id !== user.id) {
      return NextResponse.json({ ok: false, error: "削除する権限がありません" }, { status: 403 });
    }

    const db = createAdminClient() ?? supabase;

    const { data: files, error: filesErr } = await db
      .from("project_files")
      .select("id, storage_path")
      .eq("project_id", projectId)
      .eq("owner_id", user.id);

    if (filesErr) {
      console.error("project_files select", filesErr);
      return NextResponse.json({ ok: false, error: "資料の取得に失敗しました" }, { status: 500 });
    }

    const { data: posts, error: postsErr } = await db
      .from("research_posts")
      .select("id, pdf_path")
      .eq("project_id", projectId)
      .eq("author_id", user.id);

    if (postsErr) {
      console.error("research_posts select", postsErr);
      return NextResponse.json({ ok: false, error: "研究投稿の取得に失敗しました" }, { status: 500 });
    }

    const storagePaths = new Set<string>();
    for (const file of files ?? []) {
      const path = typeof file.storage_path === "string" ? file.storage_path.trim() : "";
      if (path) storagePaths.add(path);
    }
    for (const post of posts ?? []) {
      const path = typeof post.pdf_path === "string" ? post.pdf_path.trim() : "";
      if (path) storagePaths.add(path);
    }

    for (const path of storagePaths) {
      await deleteResearchPdf(supabase, path);
    }

    const fileIds = (files ?? []).map((f) => String(f.id));
    const postIds = (posts ?? []).map((p) => String(p.id));

    const cleanupTargets: Array<{ target_type: string; target_id: string }> = [
      { target_type: "project", target_id: projectId },
      ...fileIds.map((id) => ({ target_type: "project_file", target_id: id })),
      ...postIds.map((id) => ({ target_type: "research_post", target_id: id })),
    ];

    for (const { target_type, target_id } of cleanupTargets) {
      const { error: bmErr } = await db
        .from("bookmarks")
        .delete()
        .eq("target_type", target_type)
        .eq("target_id", target_id);
      if (bmErr) console.error("bookmarks cleanup", target_type, target_id, bmErr);

      const { error: likeErr } = await db
        .from("likes")
        .delete()
        .eq("target_type", target_type)
        .eq("target_id", target_id);
      if (likeErr) console.error("likes cleanup", target_type, target_id, likeErr);
    }

    if (postIds.length > 0) {
      const postDelete = await deleteRowsAsOwner(supabase, {
        table: "research_posts",
        ownerId: user.id,
        ownerColumn: "author_id",
        filters: { project_id: projectId },
      });
      if (!postDelete.ok) {
        console.error("research_posts delete", postDelete.error);
      }
    }

    const projectDelete = await deleteRowsAsOwner(supabase, {
      table: "projects",
      ownerId: user.id,
      filters: { id: projectId },
    });

    if (!projectDelete.ok) {
      return NextResponse.json(
        { ok: false, error: projectDelete.error ?? "プロジェクトの削除に失敗しました" },
        { status: 500 },
      );
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    revalidatePath(`/u/${user.id}`);
    revalidatePath("/profile");
    revalidatePath("/bookmarks");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete project route", err);
    return NextResponse.json({ ok: false, error: "予期しないエラーが発生しました" }, { status: 500 });
  }
}
