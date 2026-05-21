import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "research-pdfs";

function isRlsError(error: { message?: string }): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("row-level security") || msg.includes("policy");
}

/** ログインユーザー配下の PDF を Storage から削除（RLS 失敗時は service role で再試行） */
export async function deleteResearchPdf(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<void> {
  const path = storagePath.trim();
  if (!path) return;

  const { error: userErr } = await supabase.storage.from(BUCKET).remove([path]);
  if (!userErr) return;

  console.error("storage remove (user client)", userErr);

  if (isRlsError(userErr)) {
    const admin = createAdminClient();
    if (admin) {
      const { error: adminErr } = await admin.storage.from(BUCKET).remove([path]);
      if (!adminErr) return;
      console.error("storage remove (admin fallback)", adminErr);
    }
  }
}
