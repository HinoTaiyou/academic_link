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
    const fileId = String(body.fileId ?? "").trim();
    const targetType = String(body.targetType ?? "project_file").trim();

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

    const db = createAdminClient() ?? supabase;
    let storagePath = "";
    let fileTitle = "";

    if (targetType === "research_post") {
      const { data: post, error: postErr } = await db
        .from("research_posts")
        .select("id, title, pdf_path")
        .eq("id", fileId)
        .eq("project_id", projectId)
        .eq("author_id", user.id)
        .maybeSingle();

      if (postErr) {
        console.error("research_posts select", postErr);
        return NextResponse.json({ ok: false, error: "資料の取得に失敗しました" }, { status: 500 });
      }
      if (!post) {
        return NextResponse.json({ ok: false, error: "資料が見つかりません" }, { status: 404 });
      }

      storagePath = typeof post.pdf_path === "string" ? post.pdf_path.trim() : "";
      fileTitle = String(post.title ?? "");

      if (storagePath) {
        await deleteResearchPdf(supabase, storagePath);
      }

      const postDelete = await deleteRowsAsOwner(supabase, {
        table: "research_posts",
        ownerId: user.id,
        ownerColumn: "author_id",
        filters: { id: fileId, project_id: projectId },
      });
      if (!postDelete.ok) {
        return NextResponse.json(
          { ok: false, error: postDelete.error ?? "資料の削除に失敗しました" },
          { status: 500 },
        );
      }

      if (storagePath) {
        await deleteRowsAsOwner(supabase, {
          table: "project_files",
          ownerId: user.id,
          filters: { project_id: projectId, storage_path: storagePath },
        });
      } else if (fileTitle) {
        await db
          .from("project_files")
          .delete()
          .eq("project_id", projectId)
          .eq("owner_id", user.id)
          .eq("title", fileTitle);
      }
    } else {
      const { data: file, error: fileErr } = await db
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

      if (file) {
        storagePath = typeof file.storage_path === "string" ? file.storage_path.trim() : "";
        fileTitle = String(file.title ?? "");

        if (storagePath) {
          await deleteResearchPdf(supabase, storagePath);
        }

        const fileDelete = await deleteRowsAsOwner(supabase, {
          table: "project_files",
          ownerId: user.id,
          filters: { id: fileId, project_id: projectId },
        });
        if (!fileDelete.ok) {
          return NextResponse.json(
            { ok: false, error: fileDelete.error ?? "資料の削除に失敗しました" },
            { status: 500 },
          );
        }
      } else {
        const { data: post, error: postErr } = await db
          .from("research_posts")
          .select("id, title, pdf_path")
          .eq("id", fileId)
          .eq("project_id", projectId)
          .eq("author_id", user.id)
          .maybeSingle();

        if (postErr || !post) {
          return NextResponse.json({ ok: false, error: "資料が見つかりません" }, { status: 404 });
        }

        storagePath = typeof post.pdf_path === "string" ? post.pdf_path.trim() : "";
        fileTitle = String(post.title ?? "");
        if (storagePath) await deleteResearchPdf(supabase, storagePath);

        const postDelete = await deleteRowsAsOwner(supabase, {
          table: "research_posts",
          ownerId: user.id,
          ownerColumn: "author_id",
          filters: { id: fileId, project_id: projectId },
        });
        if (!postDelete.ok) {
          return NextResponse.json(
            { ok: false, error: postDelete.error ?? "資料の削除に失敗しました" },
            { status: 500 },
          );
        }
      }

      let postQuery = db
        .from("research_posts")
        .delete()
        .eq("author_id", user.id)
        .eq("project_id", projectId);

      if (storagePath) {
        postQuery = postQuery.eq("pdf_path", storagePath);
      } else if (fileTitle) {
        postQuery = postQuery.eq("title", fileTitle);
      }

      const { error: postErr } = await postQuery;
      if (postErr) console.error("research_posts delete (paired)", postErr);
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
