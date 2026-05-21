"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  analyzeResearchPdf,
  analyzeResearchText,
  type ResearchDraft,
} from "./gemini";
import { isLikelySlideViewUrl } from "@/lib/research/slide-url";
import { uploadResearchPdf } from "@/lib/supabase/upload-research-pdf";
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
      slideViewUrl: string | null;
      projectId: string;
      projectName: string;
      inputMode: "pdf" | "slides";
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
    return "PDF の読み取り処理でエラーが発生しました。別の PDF をお試しください。";
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

async function ingestPdfBytes(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  projectId: string;
  projectName: string;
  fileBytes: Uint8Array;
  fileName: string;
  slideViewUrl: string | null;
  inputMode: "pdf" | "slides";
}): Promise<Extract<AnalyzeState, { ok: true }>> {
  const { supabase, userId, projectId, projectName, fileBytes, fileName, slideViewUrl, inputMode } =
    params;

  const rawText = await extractPdfText(fileBytes.slice());
  const { pdfPath } = await uploadResearchPdf({
    supabase,
    userId,
    projectId,
    fileBytes,
    fileName,
  });

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
      throw new Error(
        "PDF 解析に失敗しました。図表中心の PDF は画質やレイアウトにより解析できない場合があります。別の PDF をお試しください。",
      );
    }
    draft = await analyzeResearchText(rawText);
  }

  return {
    ok: true,
    draft,
    rawText,
    fileName,
    pdfPath,
    slideViewUrl,
    projectId,
    projectName,
    inputMode,
  };
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
  const slideViewUrlRaw = String(formData.get("slide_view_url") ?? "").trim();
  const slideViewUrl =
    slideViewUrlRaw && isLikelySlideViewUrl(slideViewUrlRaw) ? slideViewUrlRaw : null;
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

    if (inputType === "slides" && slideViewUrlRaw && !slideViewUrl) {
      return {
        ok: false,
        error:
          "スライド URL の形式が正しくありません。Google スライドの「リンクを取得」URL を貼ってください。",
      };
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
      return ingestPdfBytes({
        supabase,
        userId: user.id,
        projectId: projectResolved.id,
        projectName: projectResolved.name,
        fileBytes,
        fileName: file.name,
        slideViewUrl: null,
        inputMode: "pdf",
      });
    }

    if (inputType === "slides") {
      const file = formData.get("pdf");
      const hasUpload = file instanceof File && file.size > 0;

      if (!slideViewUrl && !hasUpload) {
        return {
          ok: false,
          error: "スライド URL または PDF のどちらかを入力してください。",
        };
      }

      // PDF あり → AI 解析 + Storage 保存。URL は表示用に併記可。
      if (hasUpload) {
        if (file.size > MAX_PDF_BYTES) {
          return {
            ok: false,
            error: `ファイルサイズが大きすぎます（最大 ${Math.floor(MAX_PDF_BYTES / 1024 / 1024)}MB）。`,
          };
        }
        const fileBytes = new Uint8Array(await file.arrayBuffer());
        return ingestPdfBytes({
          supabase,
          userId: user.id,
          projectId: projectResolved.id,
          projectName: projectResolved.name,
          fileBytes,
          fileName: file.name,
          slideViewUrl,
          inputMode: "slides",
        });
      }

      // URL のみ → スライドリンクを保存（AI には渡さない）。保存名は編集画面で入力。
      return {
        ok: true,
        draft: {
          title: "",
          summary: "",
          tags: [] as string[],
        },
        rawText: "",
        fileName: null,
        pdfPath: null,
        slideViewUrl,
        projectId: projectResolved.id,
        projectName: projectResolved.name,
        inputMode: "slides",
      };
    }

    return { ok: false, error: "入力方法が正しくありません。" };
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
  const slideViewUrlRaw = String(formData.get("slide_view_url") ?? "").trim();
  const slideViewUrl =
    slideViewUrlRaw && isLikelySlideViewUrl(slideViewUrlRaw) ? slideViewUrlRaw : null;

  if (!title) return { error: "保存名を入力してください。" };

  const hadPdfUpload = Boolean(fileName && pdfPath);
  const slideOnly = Boolean(slideViewUrl && !pdfPath && !fileName);

  if (!summary && !slideOnly) {
    return { error: "要約を入力してください。" };
  }

  if (fileName && !pdfPath) {
    return {
      error:
        "PDF ファイルの保存先が見つかりません。解析からやり直すか、PDF を再アップロードしてください。",
    };
  }

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
    const metadata: Record<string, string> = {};
    if (slideViewUrl) metadata.slide_view_url = slideViewUrl;
    if (slideOnly) metadata.content_kind = "slides";
    if (hadPdfUpload && slideViewUrl) metadata.pdf_source = "upload_with_slides";
    else if (hadPdfUpload) metadata.pdf_source = "upload";

    const { error: fileErr } = await supabase.from("project_files").insert({
      project_id: projectId,
      owner_id: user.id,
      source_type: pdfPath ? "pdf" : slideViewUrl ? "other" : "text",
      title,
      summary,
      tags,
      raw_text: rawText,
      file_name: fileName,
      storage_path: pdfPath,
      mime_type: pdfPath ? "application/pdf" : "text/plain",
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
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
