import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { pdfStorageErrorMessage } from "@/lib/supabase/storage-errors";

const BUCKET = "research-pdfs";

function buildPdfStorageKey(userId: string, projectId: string, fileName: string): string {
  const safeName = fileName.replace(/[^\w.\-]+/g, "_");
  const pid = projectId.trim();
  const isProjectUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      pid,
    );
  return isProjectUuid
    ? `${userId}/${pid}/${Date.now()}_${safeName}`
    : `${userId}/${Date.now()}_${safeName}`;
}

function isRlsError(error: { message?: string }): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("row-level security") || msg.includes("policy");
}

/** ログインユーザー配下のパスに PDF を保存（RLS 失敗時は service role で再試行） */
export async function uploadResearchPdf(params: {
  supabase: SupabaseClient;
  userId: string;
  projectId: string;
  fileBytes: Uint8Array;
  fileName: string;
}): Promise<{ pdfPath: string; fileName: string }> {
  const key = buildPdfStorageKey(params.userId, params.projectId, params.fileName);
  const body = params.fileBytes.slice();

  const { error: userErr } = await params.supabase.storage.from(BUCKET).upload(key, body, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (!userErr) {
    return { pdfPath: key, fileName: params.fileName };
  }

  console.error("storage upload (user client)", userErr);

  if (isRlsError(userErr)) {
    const admin = createAdminClient();
    if (admin) {
      const { error: adminErr } = await admin.storage.from(BUCKET).upload(key, body, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (!adminErr) {
        return { pdfPath: key, fileName: params.fileName };
      }
      console.error("storage upload (admin fallback)", adminErr);
      throw new Error(
        [
          pdfStorageErrorMessage(adminErr),
          "Storage の SQL（supabase/storage-research-pdfs.sql）を Supabase SQL Editor で実行したか確認してください。",
        ].join(" "),
      );
    }

    throw new Error(
      [
        pdfStorageErrorMessage(userErr),
        "回避策: .env.local に SUPABASE_SERVICE_ROLE_KEY（Supabase → Settings → API → service_role）を追加するか、",
        "supabase/storage-research-pdfs.sql を SQL Editor で実行してください。",
      ].join(" "),
    );
  }

  throw new Error(pdfStorageErrorMessage(userErr));
}
