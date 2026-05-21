import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteResearchPdf } from "@/lib/supabase/delete-research-pdf";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const projectId = String(body.projectId ?? "").trim();
    const fileId = String(body.fileId ?? "").trim();

    if (!projectId || !fileId) {
      return NextResponse.json(
        { ok: false, error: "projectId と fileId が必要です" },
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
      .select("id, owner_id")
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

    const { data: file, error: fileErr } = await supabase
      .from("project_files")
      .select("id, project_id, owner_id, title, storage_path")
      .eq("id", fileId)
      .eq("project_id", projectId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (fileErr) {
      console.error("project_files select", fileErr);
      return NextResponse.json({ ok: false, error: "資料の取得に失敗しました" }, { status: 500 });
    }
    if (!file) {
      return NextResponse.json({ ok: false, error: "資料が見つかりません" }, { status: 404 });
    }

    const storagePath =
      typeof file.storage_path === "string" ? file.storage_path.trim() : "";
    if (storagePath) {
      await deleteResearchPdf(supabase, storagePath);
    }

    const { error: delErr } = await supabase
      .from("project_files")
      .delete()
      .eq("id", fileId)
      .eq("project_id", projectId)
      .eq("owner_id", user.id);

    if (delErr) {
      console.error("project_files delete", delErr);
      return NextResponse.json({ ok: false, error: "資料の削除に失敗しました" }, { status: 500 });
    }

    if (storagePath) {
      const { error: postErr } = await supabase
        .from("research_posts")
        .delete()
        .eq("author_id", user.id)
        .eq("project_id", projectId)
        .eq("pdf_path", storagePath);
      if (postErr) console.error("research_posts delete (pdf_path)", postErr);
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    revalidatePath(`/u/${user.id}`);
    revalidatePath("/profile");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete-file route", err);
    return NextResponse.json({ ok: false, error: "予期しないエラーが発生しました" }, { status: 500 });
  }
}
