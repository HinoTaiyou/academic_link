import Link from "next/link";
import type { Conversation } from "../_lib/queries";

type Props = {
  conversation: Conversation;
};

export function ConversationItem({ conversation: c }: Props) {
  const initial = (c.partnerName.slice(0, 1) || "?").toUpperCase();
  const preview =
    (c.lastMessageFromMe ? "自分: " : "") +
    (c.lastMessage.length > 50
      ? c.lastMessage.slice(0, 50) + "…"
      : c.lastMessage);

  return (
    <Link
      href={`/chat/${c.partnerId}`}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#667eea]/40 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-base font-bold text-white shadow-sm">
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-[#667eea]">
            {c.partnerName}
          </p>
          <time className="shrink-0 text-[11px] text-slate-400">
            {formatRelative(c.lastMessageAt)}
          </time>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-slate-500">{preview}</p>
          {c.unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#667eea] px-1.5 text-[10px] font-bold text-white">
              {c.unreadCount}
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
