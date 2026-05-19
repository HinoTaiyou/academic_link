import { cn } from "@/lib/utils";

export type MessageData = {
  id: string;
  fromId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
};

type Props = {
  message: MessageData;
  isMe: boolean;
};

export function MessageBubble({ message, isMe }: Props) {
  return (
    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[min(75%,28rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isMe
            ? "rounded-br-md bg-[var(--al-accent)] text-white"
            : "rounded-bl-md border border-[var(--al-border)] bg-white text-[var(--al-ink)]",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <time
          dateTime={message.createdAt}
          className={cn(
            "mt-1 block text-right text-[10px]",
            isMe ? "text-white/70" : "text-[var(--al-muted)]",
          )}
        >
          {formatTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
