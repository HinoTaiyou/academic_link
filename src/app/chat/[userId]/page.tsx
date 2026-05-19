import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, User } from "lucide-react";
import { DefaultAvatar } from "@/components/profile/default-avatar";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";
import { ChatMessages } from "./_components/chat-messages";
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
      <div className="flex min-h-0 flex-1 flex-col bg-[var(--al-surface)]">
        <header className="sticky top-0 z-10 border-b border-[var(--al-border)] bg-white/90 px-3 py-3 backdrop-blur sm:px-5">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <Link
              href="/chat"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--al-muted)] transition hover:bg-[var(--al-surface)] hover:text-[var(--al-ink)]"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              <span className="hidden sm:inline">一覧</span>
            </Link>

            <div className="flex min-w-0 flex-1 items-center gap-3">
              <DefaultAvatar className="h-10 w-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--al-ink)]">
                  {partnerName}
                </p>
                {partnerProfile.department ? (
                  <p className="truncate text-xs text-[var(--al-muted)]">
                    {partnerProfile.department as string}
                  </p>
                ) : null}
              </div>
            </div>

            <Link
              href={`/u/${partnerId}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--al-accent)] transition hover:bg-[var(--al-accent-soft)]"
            >
              <User className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              プロフィール
            </Link>
          </div>
        </header>

        <ChatMessages
          myId={user.id}
          partnerId={partnerId}
          initialMessages={messages}
        />
      </div>
    </AppShell>
  );
}
