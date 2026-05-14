import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";
import { ChatMessages } from "./_components/chat-messages";
import { MessageInput } from "./_components/message-input";
import type { MessageData } from "./_components/message-bubble";

export const metadata = {
  title: "チャット | Academic Link",
};

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function ChatRoomPage({ params }: Props) {
  const { userId: partnerId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Don't allow chatting with yourself
  if (partnerId === user.id) redirect("/chat");

  const [{ data: partnerProfile }, { data: myProfile }, { data: rawMessages }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, real_name, department, grade")
        .eq("id", partnerId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("real_name, department, grade, interest_tags")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("messages")
        .select("id, from_id, to_id, content, created_at, read_at")
        .or(
          `and(from_id.eq.${user.id},to_id.eq.${partnerId}),and(from_id.eq.${partnerId},to_id.eq.${user.id})`,
        )
        .order("created_at", { ascending: true }),
    ]);

  if (!partnerProfile) notFound();

  const partnerName =
    (partnerProfile.real_name as string)?.trim() || "（名前未設定）";

  const messages: MessageData[] = (rawMessages ?? []).map((m) => ({
    id: m.id as string,
    fromId: m.from_id as string,
    content: m.content as string,
    createdAt: m.created_at as string,
    readAt: m.read_at as string | null,
  }));

  return (
    <AppShell
      active="chat"
      profile={{
        id: user.id,
        realName: myProfile?.real_name ?? null,
        department: myProfile?.department ?? null,
        grade: myProfile?.grade ?? null,
        interestTags: myProfile?.interest_tags ?? [],
        email: user.email ?? null,
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Chat header */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <Link
            href="/chat"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="会話一覧に戻る"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-sm font-bold text-white">
            {partnerName.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {partnerName}
            </p>
            {partnerProfile.department ? (
              <p className="truncate text-[11px] text-slate-500">
                {partnerProfile.department}
              </p>
            ) : null}
          </div>
          <Link
            href={`/u/${partnerId}`}
            className="ml-auto text-[11px] font-medium text-[#667eea] hover:underline"
          >
            プロフィール
          </Link>
        </header>

        <ChatMessages
          myId={user.id}
          partnerId={partnerId}
          initialMessages={messages}
        />

        <MessageInput myId={user.id} partnerId={partnerId} />
      </div>
    </AppShell>
  );
}
