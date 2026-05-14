"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { analyzeResearchText, type ResearchDraft } from "./gemini";
import { extractPdfText } from "./pdf";

const BUCKET = "research-pdfs";
const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB

export type AnalyzeState =
  | { ok: true; draft: ResearchDraft; rawText: string; fileName: string | null; pdfPath: string | null }
  | { ok: false; error: string }
  | {};

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

  try {
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
      const arrayBuffer = await file.arrayBuffer();
      rawText = await extractPdfText(arrayBuffer);
      if (!rawText) {
        return {
          ok: false,
          error:
            "PDF からテキストを取り出せませんでした。スキャン画像のみの PDF などは未対応です。",
        };
      }

      fileName = file.name;
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const key = `${user.id}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(key, new Uint8Array(arrayBuffer), {
          contentType: file.type || "application/pdf",
          upsert: false,
        });
      if (upErr) {
        console.error("storage upload", upErr);
        return {
          ok: false,
          error:
            "PDF のアップロードに失敗しました。Storage バケット `research-pdfs` の作成とポリシーを確認してください。",
        };
      }
      pdfPath = key;
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
    return { ok: true, draft, rawText, fileName, pdfPath };
  } catch (err) {
    console.error("analyzeResearchAction", err);
    const msg = err instanceof Error ? err.message : "解析に失敗しました。";
    return { ok: false, error: msg };
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
  const fileName = String(formData.get("file_name") ?? "").trim() || null;
  const pdfPath = String(formData.get("pdf_path") ?? "").trim() || null;

  if (!title) return { error: "タイトルを入力してください。" };
  if (!summary) return { error: "要約を入力してください。" };

  const { error } = await supabase.from("research_posts").insert({
    author_id: user.id,
    title,
    summary,
    tags,
    raw_text: rawText,
    file_name: fileName,
    pdf_path: pdfPath,
  });

  if (error) {
    console.error("research insert", error);
    return { error: "保存に失敗しました。時間を置いて再度お試しください。" };
  }

  revalidatePath(`/u/${user.id}`);
  revalidatePath("/research/new");
  redirect(`/u/${user.id}`);
}
