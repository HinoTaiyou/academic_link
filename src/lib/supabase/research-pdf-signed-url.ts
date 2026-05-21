import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "research-pdfs";

/** 研究 PDF の署名付き URL（本人・他人の公開資料どちらも） */
export async function createResearchPdfSignedUrl(
  path: string,
  expiresIn = 60 * 10,
): Promise<string | null> {
  const trimmed = path.trim();
  if (!trimmed) return null;

  const admin = createAdminClient();
  if (admin) {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(trimmed, expiresIn);
    if (!error && data?.signedUrl) return data.signedUrl;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(trimmed, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
