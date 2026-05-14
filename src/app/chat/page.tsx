import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";
import { ConversationItem } from "./_components/conversation-item";
import { getConversations } from "./_lib/queries";

export const metadata = {
  title: "チャット | Academic Link",
};

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("real_name, department, grade, interest_tags")
    .eq("id", user.id)
    .maybeSingle();

  const conversations = await getConversations(user.id);

  return (
    <AppShell
      active="chat"
      profile={{
        id: user.id,
        realName: profile?.real_name ?? null,
        department: profile?.department ?? null,
        grade: profile?.grade ?? null,
        interestTags: profile?.interest_tags ?? [],
        email: user.email ?? null,
      }}
    >
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">チャット</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              メンバーとのダイレクトメッセージ
            </p>
          </div>
          <Link
            href="/members"
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#667eea]/40 hover:text-[#667eea]"
          >
            メンバーを探す
          </Link>
        </div>

        {conversations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              まだ会話がありません。
            </p>
            <p className="mt-2 text-xs text-slate-400">
              メンバー検索やプロフィールから「メッセージを送る」で会話を始められます。
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => (
              <ConversationItem key={c.partnerId} conversation={c} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
