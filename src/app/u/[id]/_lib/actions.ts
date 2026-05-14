"use server";

import { createClient } from "@/lib/supabase/server";

const BUCKET = "research-pdfs";

export async function getResearchPdfSignedUrl(
  path: string,
  expiresIn = 60 * 10,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}
