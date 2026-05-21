"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileUpdateState = {
  error?: string;
  ok?: boolean;
};

function parseTags(raw: string): string[] {
  const s = raw.trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((x) => String(x).trim()).filter(Boolean))];
  } catch {
    return [];
  }
}

export async function updateProfileAction(
  _prev: ProfileUpdateState,
  formData: FormData,
): Promise<ProfileUpdateState> {
  const interestTags = parseTags(String(formData.get("interest_tags_json") ?? "[]"));
  const researchFields = parseTags(String(formData.get("research_fields_json") ?? "[]"));
  const realName = String(formData.get("real_name") ?? "").trim();
  const studentNumber = String(formData.get("student_number") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();

  if (interestTags.length === 0 && researchFields.length === 0) {
    return {
      error:
        "「興味のある分野」または「研究した分野」のどちらか一方でもタグを1つ以上選んでください。",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログイン情報が見つかりません。もう一度ログインしてください。" };
  }

  // Try updating including student_number. If the column doesn't exist in the DB
  // schema cache, retry without it to avoid crashing while migration hasn't run.
  let error = null;
  const payloadWithStudent = {
    student_number: studentNumber || null,
    real_name: realName || null,
    department: department || null,
    grade: grade || null,
    interest_tags: interestTags,
    research_fields: researchFields,
  };

  const res1 = await supabase.from("profiles").update(payloadWithStudent).eq("id", user.id);
  if (res1.error) {
    const msg = String(res1.error.message ?? "").toLowerCase();
    if (msg.includes("student_number") || msg.includes("could not find") || msg.includes("column \"student_number\"")) {
      // retry without student_number
      const payload = {
        real_name: realName || null,
        department: department || null,
        grade: grade || null,
        interest_tags: interestTags,
        research_fields: researchFields,
      };
      const res2 = await supabase.from("profiles").update(payload).eq("id", user.id);
      error = res2.error ?? null;
    } else {
      error = res1.error;
    }
  } else {
    error = null;
  }

  if (error) {
    console.error("profiles update", error);
    return { error: "プロフィールの保存に失敗しました。時間を置いて再度お試しください。" };
  }

  revalidatePath("/profile");
  revalidatePath(`/u/${user.id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
