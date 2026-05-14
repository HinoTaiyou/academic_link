"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = {
  error?: string;
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

export async function saveOnboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const interestTags = parseTags(String(formData.get("interest_tags_json") ?? "[]"));
  const researchFields = parseTags(String(formData.get("research_fields_json") ?? "[]"));
  const realName = String(formData.get("real_name") ?? "").trim();
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

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      real_name: realName || null,
      department: department || null,
      grade: grade || null,
      interest_tags: interestTags,
      research_fields: researchFields,
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("profiles upsert", error);
    return {
      error:
        "プロフィールの保存に失敗しました。Supabase で schema.sql を実行済みか確認してください。",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export type ProfileUpdateState = {
  error?: string;
  ok?: boolean;
};

/**
 * プロフィール編集ページ用の保存アクション。
 * オンボーディングと違い、保存後はその場（/profile）に留まり ok を返す。
 */
export async function updateProfileAction(
  _prev: ProfileUpdateState,
  formData: FormData,
): Promise<ProfileUpdateState> {
  const interestTags = parseTags(String(formData.get("interest_tags_json") ?? "[]"));
  const researchFields = parseTags(String(formData.get("research_fields_json") ?? "[]"));
  const realName = String(formData.get("real_name") ?? "").trim();
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

  const { error } = await supabase
    .from("profiles")
    .update({
      real_name: realName || null,
      department: department || null,
      grade: grade || null,
      interest_tags: interestTags,
      research_fields: researchFields,
    })
    .eq("id", user.id);

  if (error) {
    console.error("profiles update", error);
    return { error: "プロフィールの保存に失敗しました。時間を置いて再度お試しください。" };
  }

  revalidatePath("/profile");
  revalidatePath(`/u/${user.id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
