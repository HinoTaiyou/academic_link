"use server";

import { createResearchPdfSignedUrl } from "@/lib/supabase/research-pdf-signed-url";

export async function getResearchPdfSignedUrl(
  path: string,
  expiresIn = 60 * 10,
): Promise<string | null> {
  return createResearchPdfSignedUrl(path, expiresIn);
}
