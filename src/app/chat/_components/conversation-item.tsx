import Link from "next/link";
import { DefaultAvatar } from "@/components/profile/default-avatar";
import type { Conversation } from "../_lib/queries";
import { cn } from "@/lib/utils";

type Props = {
  conversation: Conversation;
};

export function ConversationItem({ conversation: c }: Props) {
  const preview =
    (c.lastMessageFromMe ? "自分: " : "") +
    (c.lastMessage.length > 56
      ? c.lastMessage.slice(0, 56) + "…"
      : c.lastMessage);

  return (
    <Link
      href={`/chat/${c.partnerId}`}
      className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--al-surface)] sm:px-5"
    >
      <DefaultAvatar className="h-11 w-11" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-[var(--al-ink)] group-hover:text-[var(--al-accent)]">
            {c.partnerName}
          </p>
          <time
            dateTime={c.lastMessageAt}
            className="shrink-0 text-[11px] text-[var(--al-muted)]"
          >
            {formatRelative(c.lastMessageAt)}
          </time>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-xs",
              c.unreadCount > 0
                ? "font-medium text-[var(--al-ink)]"
                : "text-[var(--al-muted)]",
            )}
          >
            {preview}
          </p>
          {c.unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--al-accent)] px-1.5 text-[10px] font-semibold text-white">
              {c.unreadCount > 9 ? "9+" : c.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = Date.now();
  const diffMin = Math.round((now - d.getTime()) / 60_000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}時間前`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD}日前`;
  return d.toLocaleDateString("ja-JP");
}
