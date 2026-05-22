import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, Users } from "lucide-react";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { AppMain } from "@/components/layout/app-main";
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

  const conversations = await getConversations(user.id);

  return (
    <AuthenticatedAppShell active="chat">
      <AppMain className="space-y-6">
        <header className="al-glass-card overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--al-accent)] shadow-sm ring-1 ring-[var(--al-border)]">
                <MessageSquare
                  className="h-5 w-5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <div className="min-w-0">
                <p className="al-section-eyebrow">Messages</p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight text-[var(--al-ink)] sm:text-xl">
                  チャット
                </h1>
                <p className="mt-1 text-sm text-[var(--al-muted)]">
                  メンバーとのダイレクトメッセージ
                </p>
              </div>
            </div>
            <Link
              href="/members"
              className="al-btn-outline inline-flex shrink-0 items-center gap-1.5 text-sm"
            >
              <Users className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              メンバーを探す
            </Link>
          </div>

          <div className="p-4 sm:p-5">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--al-border)] bg-[var(--al-surface)] px-6 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--al-muted)] ring-1 ring-[var(--al-border)]">
                  <MessageSquare
                    className="h-6 w-6"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </span>
                <p className="mt-3 text-sm font-medium text-[var(--al-ink)]">
                  まだ会話がありません
                </p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--al-muted)]">
                  メンバー検索やプロフィールから「メッセージを送る」で会話を始められます。
                </p>
                <Link href="/members" className="al-btn-gradient mt-5 text-sm">
                  メンバーを探す
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--al-border)] overflow-hidden rounded-xl border border-[var(--al-border)] bg-white">
                {conversations.map((c) => (
                  <li key={c.partnerId}>
                    <ConversationItem conversation={c} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>
      </AppMain>
    </AuthenticatedAppShell>
  );
}
