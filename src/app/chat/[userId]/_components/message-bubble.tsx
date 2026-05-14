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
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isMe
            ? "rounded-br-md bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <time
          className={cn(
            "mt-1 block text-right text-[10px]",
            isMe ? "text-white/60" : "text-slate-400",
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
