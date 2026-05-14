"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  analyzeResearchPdf,
  analyzeResearchText,
  type ResearchDraft,
} from "./gemini";
import { extractPdfText } from "./pdf";

const BUCKET = "research-pdfs";
const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB

export type AnalyzeState =
  | {
      ok: true;
      draft: ResearchDraft;
      rawText: string;
      fileName: string | null;
      pdfPath: string | null;
      projectId: string;
      projectName: string;
    }
  | { ok: false; error: string }
  | Record<string, never>;

function isProjectsTableMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string; hint?: string };
  if (maybe.code === "PGRST205") return true;
  const haystack = `${maybe.message ?? ""} ${maybe.hint ?? ""}`.toLowerCase();
  return haystack.includes("public.projects") || haystack.includes("table 'public.projects'");
}

function toAnalyzeErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : "解析に失敗しました。";
  if (/detached\s+arraybuffer/i.test(msg)) {
    return "PDF の読み取り処理でエラーが発生しました。別の PDF を試すか、テキスト入力をご利用ください。";
  }
  return msg;
}

async function resolveProjectForUser(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  projectIdRaw: string;
  newProjectNameRaw: string;
}): Promise<{ ok: true; id: string; name: string } | { ok: false; error: string }> {
  const { supabase, userId, projectIdRaw, newProjectNameRaw } = params;
  const projectId = projectIdRaw.trim();
  const newProjectName = newProjectNameRaw.trim();

  if (newProjectName) {
    if (newProjectName.length < 2) {
      return { ok: false, error: "新規プロジェクト名は2文字以上で入力してください。" };
    }
    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: userId,
        name: newProjectName.slice(0, 80),
      })
      .select("id, name")
      .single();

    if (error || !data) {
      if (isProjectsTableMissing(error)) {
        // Schema fallback: allow analyze/save path without project features.
        return { ok: true, id: "", name: newProjectName.slice(0, 80) };
      }
      console.error("projects insert", error);
      return { ok: false, error: "新規プロジェクトの作成に失敗しました。" };
    }
    return { ok: true, id: data.id, name: data.name };
  }

  if (projectId) {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (error || !data) {
      if (isProjectsTableMissing(error)) {
        return { ok: true, id: "", name: "プロジェクト未設定" };
      }
      return {
        ok: false,
        error: "選択したプロジェクトが見つかりません。再読み込みして選び直してください。",
      };
    }
    return { ok: true, id: data.id, name: data.name };
  }

  const { data: existing } = await supabase
    .from("projects")
    .select("id, name")
    .eq("owner_id", userId)
    .eq("archived", false)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { ok: true, id: existing.id, name: existing.name };
  }

  const { data: created, error: createErr } = await supabase
    .from("projects")
    .insert({ owner_id: userId, name: "Untitled Project" })
    .select("id, name")
    .single();

  if (createErr || !created) {
    if (isProjectsTableMissing(createErr)) {
      return { ok: true, id: "", name: "プロジェクト未設定" };
    }
    console.error("projects auto-create", createErr);
    return { ok: false, error: "プロジェクト情報の準備に失敗しました。" };
  }

  return { ok: true, id: created.id, name: created.name };
}

export async function analyzeResearchAction(
  _prev: AnalyzeState,
  formData: FormData,
): Promise<AnalyzeState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログイン情報が確認できません。" };

  const inputType = String(formData.get("input_type") ?? "pdf");
  let rawText = "";
  let fileName: string | null = null;
  let pdfPath: string | null = null;
  const projectIdRaw = String(formData.get("project_id") ?? "");
  const newProjectNameRaw = String(formData.get("new_project_name") ?? "");

  try {
    const projectResolved = await resolveProjectForUser({
      supabase,
      userId: user.id,
      projectIdRaw,
      newProjectNameRaw,
    });
    if (!projectResolved.ok) {
      return { ok: false, error: projectResolved.error };
    }

    if (inputType === "pdf") {
      const file = formData.get("pdf");
      if (!(file instanceof File) || file.size === 0) {
        return { ok: false, error: "PDF ファイルを選択してください。" };
      }
      if (file.size > MAX_PDF_BYTES) {
        return {
          ok: false,
          error: `ファイルサイズが大きすぎます（最大 ${Math.floor(MAX_PDF_BYTES / 1024 / 1024)}MB）。`,
        };
      }
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      rawText = await extractPdfText(fileBytes.slice());

      fileName = file.name;
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const projectPath = projectResolved.id || "no-project";
      const key = `${user.id}/${projectPath}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(key, fileBytes.slice(), {
          contentType: file.type || "application/pdf",
          upsert: false,
        });
      if (upErr) {
        console.error("storage upload", upErr);
        pdfPath = null;
      } else {
        pdfPath = key;
      }

      let draft: ResearchDraft;
      try {
        draft = await analyzeResearchPdf({
          pdfBytes: fileBytes.slice(),
          fileName,
          fallbackText: rawText,
        });
      } catch (pdfAnalyzeError) {
        if (!rawText) {
          console.error("pdf analyze fallback failed (no text)", pdfAnalyzeError);
          return {
            ok: false,
            error:
              "PDF 解析に失敗しました。図表中心の PDF は画質やレイアウトにより解析できない場合があります。別ファイルまたはテキスト入力でお試しください。",
          };
        }
        draft = await analyzeResearchText(rawText);
      }

      return {
        ok: true,
        draft,
        rawText,
        fileName,
        pdfPath,
        projectId: projectResolved.id,
        projectName: projectResolved.name,
      };
    } else {
      rawText = String(formData.get("raw_text") ?? "").trim();
      if (rawText.length < 30) {
        return {
          ok: false,
          error: "テキストが短すぎます。本文を30文字以上入力してください。",
        };
      }
    }

    const draft = await analyzeResearchText(rawText);
    return {
      ok: true,
      draft,
      rawText,
      fileName,
      pdfPath,
      projectId: projectResolved.id,
      projectName: projectResolved.name,
    };
  } catch (err) {
    console.error("analyzeResearchAction", err);
    return { ok: false, error: toAnalyzeErrorMessage(err) };
  }
}

export type SaveState = { error?: string };

function parseTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,、，]+/)
        .map((s) => s.replace(/^#/, "").trim())
        .filter(Boolean),
    ),
  ].slice(0, 12);
}

export async function saveResearchAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログイン情報が確認できません。" };

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const rawText = String(formData.get("raw_text") ?? "");
  const projectId = String(formData.get("project_id") ?? "").trim();
  const fileName = String(formData.get("file_name") ?? "").trim() || null;
  const pdfPath = String(formData.get("pdf_path") ?? "").trim() || null;

  if (!title) return { error: "タイトルを入力してください。" };
  if (!summary) return { error: "要約を入力してください。" };

  let canUseProject = Boolean(projectId);
  if (projectId) {
    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (projectErr) {
      if (isProjectsTableMissing(projectErr)) {
        canUseProject = false;
      } else {
        return { error: "保存先プロジェクトの確認に失敗しました。" };
      }
    } else if (!project) {
      return { error: "保存先プロジェクトが見つかりません。" };
    }
  }

  let { error } = await supabase.from("research_posts").insert({
    author_id: user.id,
    ...(canUseProject ? { project_id: projectId } : {}),
    title,
    summary,
    tags,
    raw_text: rawText,
    file_name: fileName,
    pdf_path: pdfPath,
  });

  if (error && /project_id/i.test(error.message)) {
    ({ error } = await supabase.from("research_posts").insert({
      author_id: user.id,
      title,
      summary,
      tags,
      raw_text: rawText,
      file_name: fileName,
      pdf_path: pdfPath,
    }));
  }

  if (error) {
    console.error("research insert", error);
    return { error: "保存に失敗しました。時間を置いて再度お試しください。" };
  }

  if (canUseProject) {
    const { error: fileErr } = await supabase.from("project_files").insert({
      project_id: projectId,
      owner_id: user.id,
      source_type: pdfPath ? "pdf" : "text",
      title,
      summary,
      tags,
      raw_text: rawText,
      file_name: fileName,
      storage_path: pdfPath,
      mime_type: pdfPath ? "application/pdf" : "text/plain",
    });
    if (fileErr) {
      console.error("project_files insert", fileErr);
    }
  }

  revalidatePath(`/u/${user.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/research/new");
  redirect(`/u/${user.id}`);
}
