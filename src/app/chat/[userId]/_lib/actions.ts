"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SendMessageState = {
  error?: string;
};

export async function sendMessageAction(
  _prev: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const toId = String(formData.get("to_id") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!toId) return { error: "送信先が指定されていません。" };
  if (!content) return { error: "メッセージを入力してください。" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "ログイン情報が確認できません。" };

  const { error } = await supabase.from("messages").insert({
    from_id: user.id,
    to_id: toId,
    content,
  });

  if (error) {
    console.error("message insert", error);
    return { error: "送信に失敗しました。" };
  }

  revalidatePath("/chat");
  revalidatePath(`/chat/${toId}`);
  return {};
}

export async function markAsReadAction(partnerId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("from_id", partnerId)
    .eq("to_id", user.id)
    .is("read_at", null);

  revalidatePath("/chat");
}
